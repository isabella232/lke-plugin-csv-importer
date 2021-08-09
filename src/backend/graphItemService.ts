import {RestClient, RunQueryResponse} from '@linkurious/rest-client';
import {GroupedErrors, log, RowErrorMessage} from './utils';
import {ImportEdgesParams, ImportItemsResponse, ImportNodesParams} from '../@types/shared';

export class GraphItemService {
  // Cache from category + UID to graph ID
  static nodeIDS = new Map<string, number>();
  public importResult: ImportItemsResponse | undefined;

  /**
   * Returns a query that creates nodes.
   *
   * Example:
   *    WITH [[false,10000000000,"255s 255s"], [true,10000000002,"256s 256s"], ...] AS batch
   *    UNWIND batch AS line
   *    CREATE (n:`SAMPLE` {boolean: line[0], number: line[1], string: line[2]})
   *    WITH reduce(acc = '', id IN collect(idn) | acc + ' ' + id) AS ids
   *    CREATE (b:BOOTSTRAP {result: ids}) RETURN b
   */
  static buildNodesQuery(category: string, keys: string[], values: unknown[]): string {
    const node = `(n:\`${category}\` {` + keys.map((k, i) => `${k}: line[${i}]`).join(', ') + '})';

    return (
      `WITH ${JSON.stringify(values)} AS batch ` +
      'UNWIND batch AS line ' +
      `CREATE ${node} ` +
      // We return the ids collection as a string because LKE does not support array values via bolt
      `WITH reduce(acc = '', id IN collect(id(n)) | acc + ' ' + id) AS ids ` +
      'CREATE (c:CSV_PLUGIN {result: ids}) ' +
      'RETURN c'
    );
  }

  /**
   * Returns a query that creates edges.
   *
   * Example:
   *    WITH [[false,10000000000,"255s 255s"], [true,10000000002,"256s 256s"], ...] AS batch
   *    UNWIND batch AS line
   *    MATCH (from) WHERE id(from) = line[0]
   *    MATCH (to) WHERE id(to) = line[1]
   *    CREATE/MERGE (from)-[:`SAMPLE` {boolean: line[0], number: line[1], string: line[2]}]->(to)
   *    RETURN 0
   */
  static buildEdgesQuery(type: string, keys: string[], values: unknown[][]): string {
    // First 2 properties are reserved from the extremities
    const props = '{' + keys.map((k, i) => `${k}: line[${i + 2}]`).join(', ') + '}';

    return (
      `WITH ${JSON.stringify(values)} AS batch ` +
      'UNWIND batch AS line ' +
      'MATCH (from) WHERE id(from) = line[0] ' +
      'MATCH (to) WHERE id(to) = line[1] ' +
      `CREATE (from)-[:\`${type}\` ${props}]->(to)` +
      // LKE requires a RETURN clause
      'RETURN 0'
    );
  }

  static cacheGraphNodeIDs(
    category: string,
    runQueryResponse: RunQueryResponse,
    batchUIDs: string[]
  ): void {
    // LKE can only return graph items,
    // so for queries to return scalar values they need to put the result inside (n: {result: <here>}) and return n
    const result = runQueryResponse.nodes[0].data.properties.result;
    const graphIDs =
      typeof result === 'object' && 'original' in result
        ? (result.original as string)
        : (result as string);
    // Cache the ids
    graphIDs
      .trim()
      .split(' ')
      .forEach((graphID, i) => {
        GraphItemService.nodeIDS.set(category + batchUIDs[i], Number.parseInt(graphID));
      });
  }

  static async runCypherQuery(
    rc: RestClient,
    cypherQuery: string,
    sourceKey: string
  ): Promise<RunQueryResponse> {
    const queryResponse = await rc.graphQuery.runQuery({
      query: cypherQuery,
      sourceKey: sourceKey
    });
    if (!queryResponse.isSuccess()) {
      throw queryResponse;
    }
    return queryResponse.body;
  }

  public updateProgress(processed: number, total: number, errors: GroupedErrors): void {
    this.importResult = {
      status: 'importing',
      progress: Math.floor(processed / (total + 1)),
      success: total - errors.total,
      failed: errors.total,
      error: errors.toObject()
    };
  }

  public endProgress(total: number, errors: GroupedErrors): void {
    if (errors.total === 0) {
      this.importResult = {
        status: 'done',
        success: total
      };
    } else {
      this.importResult = {
        status: 'done',
        success: total - errors.total,
        failed: errors.total,
        error: errors.toObject()
      };
    }
  }

  public async importItems(
    rc: RestClient,
    params: ImportNodesParams | ImportEdgesParams
  ): Promise<void> {
    const isEdge = 'sourceType' in params;
    let total: number;
    let headers: string[];
    let batchedRows: {indices: number[]; rows: unknown[][]; UIDs: string[]}[];
    let badRows: [RowErrorMessage, number[]][];

    // 1. Batch items
    if (isEdge) {
      ({total, headers, batchedRows, badRows} = GraphItemService.createEdgeBatches(
        params as ImportEdgesParams
      ));
    } else {
      ({total, headers, batchedRows, badRows} = GraphItemService.createNodeBatches(params.csv));
    }

    // 2. Keep track of the errors
    const errors = new GroupedErrors(badRows);

    // 3. Process batch by batch
    let i = 0;
    for (const batch of batchedRows) {
      i += batch.rows.length;
      try {
        if (isEdge) {
          // 3.a. Build and run a query to create edges
          const query = GraphItemService.buildEdgesQuery(params.itemType, headers, batch.rows);
          await GraphItemService.runCypherQuery(rc, query, params.sourceKey);
        } else {
          // 3.a. Build and run a query to create nodes
          const query = GraphItemService.buildNodesQuery(params.itemType, headers, batch.rows);
          const response = await GraphItemService.runCypherQuery(rc, query, params.sourceKey);
          GraphItemService.cacheGraphNodeIDs(params.itemType, response, batch.UIDs);
        }
      } catch (e) {
        log('Batch has failed', e);
        errors.add(e, batch.indices);
      }
      this.updateProgress(i, total, errors);
    }

    this.endProgress(total, errors);
  }

  /**
   * Parse a CSV string value intro a string, number or boolean
   */
  public static parseValue(value: string): string | number | boolean | null {
    // Properties without value
    if (value === '') {
      return null; // Cypher ignores null properties when creating
    }
    // Numerical properties
    if (/^(0|([1-9]\d*))(\.\d+)?$/.test(value)) {
      return Number.parseFloat(value);
    }
    // Boolean properties
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    return value;
  }

  /**
   * TODO take care of escaping commas, line-breaks, etc...
   * EOL is \n on POSIX and \r\n on Windows
   */
  public static createNodeBatches(csv: string): {
    total: number;
    headers: string[];
    batchedRows: {indices: number[]; rows: unknown[][]; UIDs: string[]}[];
    badRows: [RowErrorMessage, number[]][];
  } {
    const MAX_BATCH_SIZE = 10;
    let count = 1;
    let headers: unknown[] | undefined = undefined;
    let batchedRows: {indices: number[]; UIDs: string[]; rows: unknown[][]}[] = [];
    const tooManyOrMissingProperties: number[] = [];
    for (const row of csv.split(/\r?\n/)) {
      const values = row.split(',').map(GraphItemService.parseValue);

      if (headers === undefined) {
        // We skip the first column (uid)
        headers = values.slice(1);
      } else {
        count++;
        const [UID, ...properties] = values;
        if (properties.length !== headers.length) {
          tooManyOrMissingProperties.push(count);
          continue;
        }

        // Assign node to a batch
        if (
          // Initialize the batch
          batchedRows.length === 0 ||
          // First batch is of one element to build and cache the query execution plan in neo4j
          batchedRows.length === 1 ||
          // Create a new batch if last batch has reached `MAX_BATCH_SIZE` elements
          batchedRows[batchedRows.length - 1].rows.length === MAX_BATCH_SIZE
        ) {
          batchedRows.push({indices: [count], rows: [properties], UIDs: [UID + '']});
        } else {
          batchedRows[batchedRows.length - 1].indices.push(count);
          batchedRows[batchedRows.length - 1].rows.push(properties);
          batchedRows[batchedRows.length - 1].UIDs.push(UID + '');
        }
      }
    }
    GraphItemService.checkNonEmptyHeaders(headers);
    return {
      // The header is not an item
      total: count - 1,
      headers: headers,
      batchedRows: batchedRows,
      badRows: [[RowErrorMessage.TOO_MANY_OR_MISSING_PROPERTIES, tooManyOrMissingProperties]]
    };
  }

  /**
   * TODO take care of escaping commas, line-breaks, etc...
   * EOL is \n on POSIX and \r\n on Windows
   *
   * Returns edges split in batches and edges that have no extremities cached
   */
  public static createEdgeBatches(params: ImportEdgesParams): {
    total: number;
    headers: string[];
    batchedRows: {indices: number[]; rows: unknown[][]; UIDs: string[]}[];
    badRows: [RowErrorMessage, number[]][];
  } {
    const MAX_BATCH_SIZE = 10;
    let count = 1;
    let headers: unknown[] | undefined = undefined;
    let batchedRows: {indices: number[]; rows: unknown[][]; UIDs: string[]}[] = [];
    const noExtremitiesRows: number[] = [];
    const tooManyOrMissingProperties: number[] = [];

    // Parse row by row
    for (const row of params.csv.split(/\r?\n/)) {
      const values = row.split(',').map(GraphItemService.parseValue);

      // First row is for headers
      if (headers === undefined) {
        // We skip the first column (source node uid) and the second column (target node uid)
        headers = values.slice(2);
        continue;
      }

      // Rest of the rows are for edges
      count++;
      let [from, to, ...properties] = values;
      if (properties.length !== headers.length) {
        tooManyOrMissingProperties.push(count);
        continue;
      }

      const sourceID = GraphItemService.nodeIDS.get(params.sourceType + from);
      const targetID = GraphItemService.nodeIDS.get(params.destinationType + to);

      // Exclude edge from the batches if its extremities are not found
      if (sourceID === undefined || targetID === undefined) {
        noExtremitiesRows.push(count);
        continue;
      }

      // Assign edge to a batch
      properties = [sourceID, targetID, ...properties];
      if (
        // Initialize the batch
        batchedRows.length === 0 ||
        // First batch is of one element to build and cache the query execution plan in neo4j
        batchedRows.length === 1 ||
        // Create a new batch if last batch has reached `MAX_BATCH_SIZE` elements
        batchedRows[batchedRows.length - 1].rows.length === MAX_BATCH_SIZE
      ) {
        batchedRows.push({indices: [count], rows: [properties], UIDs: []});
      } else {
        batchedRows[batchedRows.length - 1].indices.push(count);
        batchedRows[batchedRows.length - 1].rows.push(properties);
      }
    }
    GraphItemService.checkNonEmptyHeaders(headers);
    return {
      // The header is not an item
      total: count - 1,
      headers: headers,
      batchedRows: batchedRows,
      badRows: [
        [RowErrorMessage.SOURCE_TARGET_NOT_FOUND, noExtremitiesRows],
        [RowErrorMessage.TOO_MANY_OR_MISSING_PROPERTIES, tooManyOrMissingProperties]
      ]
    };
  }

  /**
   * Check that the first line of the csv is not empty
   */
  private static checkNonEmptyHeaders(headers: unknown): asserts headers is string[] {
    if (
      !Array.isArray(headers) ||
      headers.length === 0 ||
      headers.some((h) => typeof h !== 'string' || h.length === 0)
    ) {
      log(headers);
      throw new Error('Headers cannot be empty');
    }
    // TODO check missing required properties (schemas) and unexpected properties (strict-schema)
  }
}
