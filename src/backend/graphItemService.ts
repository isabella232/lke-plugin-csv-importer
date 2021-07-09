import {RestClient, RunQueryResponse} from '@linkurious/rest-client';
import {GroupedErrors, log} from './utils';
import {ImportEdgesParams, ImportItemsResponse, ImportNodesParams} from '../@types/shared';

export class GraphItemService {
  // Cache from category + UID to graph ID
  static nodeIDS: Map<string, string>;
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
        GraphItemService.nodeIDS.set(category + batchUIDs[i], graphID);
      });
  }

  static async runCypherQuery(rc: RestClient, cypherQuery: string): Promise<RunQueryResponse> {
    const queryResponse = await rc.graphQuery.runQuery({
      query: cypherQuery
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
      success: processed - errors.total,
      failed: errors.total,
      error: errors.toObject()
    };
  }

  public endProgress(processed: number, errors: GroupedErrors): void {
    if (errors.total === 0) {
      this.importResult = {
        status: 'done',
        success: processed
      };
    } else {
      this.importResult = {
        status: 'done',
        success: processed - errors.total,
        failed: errors.total,
        error: errors.toObject()
      };
    }
  }

  public async importItems(rc: RestClient, params: ImportNodesParams | ImportEdgesParams): Promise<void> {
    const isEdge = 'sourceType' in params;
    let total: number, headers: string[], batchedRows: {rows: unknown[][]; UIDs: string[]}[];

    // 1. Batch items
    // TODO return errors that can be detected before importing
    if (isEdge) {
      ({total, headers, batchedRows} = GraphItemService.batchEdges(params.csv));
    } else {
      ({total, headers, batchedRows} = GraphItemService.batchNodes(params.csv));
    }

    // 2. Keep track of the errors
    const errors = new GroupedErrors();

    // 3. Process batch by batch
    let i = 0;
    for (const batch of batchedRows) {
      i += batch.rows.length;
      try {
        if (isEdge) {
          // 3.a. Build and run a query to create edges
          const query = GraphItemService.buildEdgesQuery(params.itemType, headers, batch.rows);
          await GraphItemService.runCypherQuery(rc, query);
        } else {
          // 3.a. Build and run a query to create nodes
          const query = GraphItemService.buildNodesQuery(params.itemType, headers, batch.rows);
          const response = await GraphItemService.runCypherQuery(rc, query);
          GraphItemService.cacheGraphNodeIDs(params.itemType, response, batch.UIDs);
        }
      } catch (e) {
        log({unhandledError: e});
        errors.add(e.message, i);
      }
      this.updateProgress(i, total, errors);
    }

    this.endProgress(i, errors);
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
   */
  public static batchEdges(csv: string): {
    total: number;
    headers: string[];
    batchedRows: {rows: unknown[][]; UIDs: string[]}[];
  } {
    const MAX_BATCH_SIZE = 500;
    let total = 0;
    let headers: unknown[] | undefined = undefined;
    let batchedRows: {rows: unknown[][]; UIDs: string[]}[] = [{rows: [], UIDs: []}];
    csv.split(/\r?\n/).forEach((row) => {
      const values = row.split(',').map((value) => {
        if (value === '') {
          return null; // Cypher ignores null properties when creating
        }
        return value;
      });
      if (headers === undefined) {
        headers = values.slice(2);
      } else {
        total++;
        let [from, to, ...properties] = values;
        // TODO exclude from batch if its extremities are not found
        properties = [
          GraphItemService.nodeIDS.get(from + '')!,
          GraphItemService.nodeIDS.get(to + '')!,
          ...properties
        ];
        if (batchedRows[0].rows.length === 0) {
          batchedRows[0].rows.push(properties);
          batchedRows.push({rows: [], UIDs: []});
        } else if (batchedRows[batchedRows.length - 1].rows.length === MAX_BATCH_SIZE) {
          batchedRows.push({rows: [properties], UIDs: []});
        } else {
          batchedRows[batchedRows.length - 1].rows.push(properties);
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
