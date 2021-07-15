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
        GraphItemService.nodeIDS.set(category + batchUIDs[i], +graphID);
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
      throw new Error(JSON.stringify(queryResponse, null, 2));
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
    let total: number, headers: string[], batchedRows: {rows: unknown[][]; UIDs: string[]}[];
    let badRows: [string, number[]][] = [];

    // 1. Batch items
    if (isEdge) {
      ({total, headers, batchedRows, badRows} = GraphItemService.batchEdges(
        params as ImportEdgesParams
      ));
    } else {
      ({total, headers, batchedRows} = GraphItemService.batchNodes(params.csv));
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
        log({unhandledError: e});
        errors.add(e.message, i);
      }
      this.updateProgress(i, total, errors);
    }

    this.endProgress(total, errors);
  }

  /**
   * TODO take care of escaping commas, line-breaks, etc...
   * EOL is \n on POSIX and \r\n on Windows
   */
  public static batchNodes(csv: string): {
    total: number;
    headers: string[];
    batchedRows: {rows: unknown[][]; UIDs: string[]}[];
  } {
    const MAX_BATCH_SIZE = 500;
    let total = 0;
    let headers: unknown[] | undefined = undefined;
    let batchedRows: {UIDs: string[]; rows: unknown[][]}[] = [{UIDs: [], rows: []}];
    csv.split(/\r?\n/).forEach((row) => {
      const values = row.split(',').map((value) => {
        if (value === '') {
          return null; // Cypher ignores null properties when creating
        }
        return value;
      });
      if (headers === undefined) {
        headers = values.slice(1);
      } else {
        total++;
        const [UID, ...properties] = values;
        if (batchedRows[0].rows.length === 0) {
          batchedRows[0].rows.push(properties);
          batchedRows[0].UIDs.push(UID + '');
          batchedRows.push({rows: [], UIDs: []});
        } else if (batchedRows[batchedRows.length - 1].rows.length === MAX_BATCH_SIZE) {
          batchedRows.push({rows: [properties], UIDs: [UID + '']});
        } else {
          batchedRows[batchedRows.length - 1].rows.push(properties);
          batchedRows[batchedRows.length - 1].UIDs.push(UID + '');
        }
      }
    });
    GraphItemService.checkNonEmptyHeaders(headers);
    return {
      total: total,
      headers: headers,
      batchedRows: batchedRows
    };
  }

  /**
   * TODO take care of escaping commas, line-breaks, etc...
   * EOL is \n on POSIX and \r\n on Windows
   *
   * Returns edges split in batches and edges that have no extremities cached
   */
  public static batchEdges(params: ImportEdgesParams): {
    total: number;
    headers: string[];
    batchedRows: {rows: unknown[][]; UIDs: string[]}[];
    badRows: [string, number[]][];
  } {
    const MAX_BATCH_SIZE = 500;
    let total = 0;
    let headers: unknown[] | undefined = undefined;
    let batchedRows: {rows: unknown[][]; UIDs: string[]}[] = [{rows: [], UIDs: []}];
    const noExtremitiesRows: number[] = [];

    // Parse row by row
    for (const row of params.csv.split(/\r?\n/)) {
      const values: (string | number | null)[] = row.split(',').map((value) => {
        if (value === '') {
          return null; // Cypher ignores `null` properties when creating
        }
        return value;
      });

      // First row is for headers
      if (headers === undefined) {
        headers = values.slice(2);
        continue;
      }

      // Rest of the rows are for edges
      total++;
      let [from, to, ...properties] = values;
      const sourceID = GraphItemService.nodeIDS.get(params.sourceType + from);
      const targetID = GraphItemService.nodeIDS.get(params.destinationType + to);

      // Exclude edge from the batches if its extremities are not found
      if (sourceID === undefined || targetID === undefined) {
        noExtremitiesRows.push(total);
        continue;
      }

      // Assign edge to a batch
      properties = [sourceID, targetID, ...properties];
      if (batchedRows[0].rows.length === 0) {
        batchedRows[0].rows.push(properties);
        batchedRows.push({rows: [], UIDs: []});
      } else if (batchedRows[batchedRows.length - 1].rows.length === MAX_BATCH_SIZE) {
        batchedRows.push({rows: [properties], UIDs: []});
      } else {
        batchedRows[batchedRows.length - 1].rows.push(properties);
      }
    }
    GraphItemService.checkNonEmptyHeaders(headers);
    return {
      total: total,
      headers: headers,
      batchedRows: batchedRows,
      badRows: [[RowErrorMessage.SOURCE_TARGET_NOT_FOUND, noExtremitiesRows]]
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
