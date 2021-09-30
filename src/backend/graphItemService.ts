import {RestClient, RunQueryResponse} from '@linkurious/rest-client';
import {GroupedErrors, log, RowErrorMessage} from './utils';
import {ImportEdgesParams, ImportState, ImportNodesParams} from '../@types/shared';
import {CSVUtils, ParsedCSV} from './shared';

/**
 * This type is convenient to separate concerns among `buildEdgesQuery()`,
 * `cacheGraphNodeIDs()` and `errors.add()`
 */
export interface GroupedRecords {
  rows: unknown[][];
  UIDs: string[];
  rowNumbers: number[];
}

export class GraphItemService {
  // Cache from category + UID to graph ID
  static nodeIDS = new Map<string, number>();
  public importState: ImportState = {
    importing: false
  };

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

  public updateImportProgress(total: number, processed: number): void {
    this.importState = {
      importing: true,
      progress: Math.floor(processed / (total + 1))
    };
  }

  public finishImport(errors: string): void;
  public finishImport(errors: GroupedErrors, total: number): void;
  public finishImport(errors: GroupedErrors | string, total?: number): void {
    if (typeof errors === 'string') {
      this.importState = {
        importing: false,
        lastImport: {
          globalError: errors
        }
      };
    } else if (errors.total === 0) {
      this.importState = {
        importing: false,
        lastImport: {
          success: total!
        }
      };
    } else {
      this.importState = {
        importing: false,
        lastImport: {
          success: total! - errors.total,
          failed: errors.total,
          error: errors.toObject()
        }
      };
    }
  }

  public async importItems(
    rc: RestClient,
    params: ImportNodesParams | ImportEdgesParams
  ): Promise<void> {
    // Check for global errors
    const parsedCSV = CSVUtils.parseCSV(params.csv);
    if ('error' in parsedCSV) {
      this.finishImport(parsedCSV.error);
      return;
    }

    const isEdge = 'sourceType' in params;
    const totalRecords = parsedCSV.records.length;
    let propertyKeys: string[];
    let batchedRows: GroupedRecords[];
    let badRows: [RowErrorMessage, number[]][] = [];

    // 1. Batch items
    if (isEdge) {
      ({propertyKeys, batchedRows, badRows} = GraphItemService.createEdgeBatches(
        parsedCSV,
        (params as ImportEdgesParams).sourceType,
        (params as ImportEdgesParams).destinationType
      ));
    } else {
      ({propertyKeys, batchedRows} = GraphItemService.createNodeBatches(parsedCSV));
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
          const query = GraphItemService.buildEdgesQuery(params.itemType, propertyKeys, batch.rows);
          await GraphItemService.runCypherQuery(rc, query, params.sourceKey);
        } else {
          // 3.a. Build and run a query to create nodes
          const query = GraphItemService.buildNodesQuery(params.itemType, propertyKeys, batch.rows);
          const response = await GraphItemService.runCypherQuery(rc, query, params.sourceKey);
          GraphItemService.cacheGraphNodeIDs(params.itemType, response, batch.UIDs);
        }
      } catch (e) {
        log('Batch has failed', e);
        errors.add(e, batch.rowNumbers);
      }
      this.updateImportProgress(totalRecords, i);
    }

    // LKE-4201 Remove the CSV_PLUGIN category
    await GraphItemService.runCypherQuery(
      rc,
      'MATCH(c:CSV_PLUGIN) DETACH DELETE c RETURN 0',
      params.sourceKey
    );

    this.finishImport(errors, totalRecords);
  }

  public static createNodeBatches(parsedCSV: ParsedCSV): {
    propertyKeys: string[];
    batchedRows: GroupedRecords[];
  } {
    const MAX_BATCH_SIZE = 10;
    let batchedRows: GroupedRecords[] = [];
    for (let i = 0; i < parsedCSV.records.length; i++) {
      const properties = parsedCSV.records[i];
      const UID = properties[0];
      // The items to import are in rows 2, 3, etc (the header is row 1)
      const rowNumber = i + 2;

      // Assign node to a batch
      if (
        // Initialize the batch
        batchedRows.length === 0 ||
        // First batch is of one element to build and cache the query execution plan in neo4j
        batchedRows.length === 1 ||
        // Create a new batch if last batch has reached `MAX_BATCH_SIZE` elements
        batchedRows[batchedRows.length - 1].rows.length === MAX_BATCH_SIZE
      ) {
        batchedRows.push({rowNumbers: [rowNumber], rows: [properties], UIDs: [UID + '']});
      } else {
        batchedRows[batchedRows.length - 1].rowNumbers.push(rowNumber);
        batchedRows[batchedRows.length - 1].rows.push(properties);
        batchedRows[batchedRows.length - 1].UIDs.push(UID + '');
      }
    }
    return {
      propertyKeys: parsedCSV.headers.slice(),
      batchedRows: batchedRows
    };
  }

  /**
   * Returns edges split in groups
   */
  public static createEdgeBatches(
    parsedCSV: ParsedCSV,
    sourceType: string,
    destinationType: string
  ): {
    propertyKeys: string[];
    batchedRows: GroupedRecords[];
    badRows: [RowErrorMessage, number[]][];
  } {
    // We skip the first column (source node uid) and the second column (target node uid)
    const propertyKeys = parsedCSV.headers.slice(2);

    const MAX_BATCH_SIZE = 10;
    let batchedRows: GroupedRecords[] = [];
    const noExtremitiesRows: number[] = [];

    // Parse row by row
    for (let i = 0; i < parsedCSV.records.length; i++) {
      let [from, to, ...propertyValues] = parsedCSV.records[i];
      // The items to import are in rows 2, 3, etc (the header is row 1)
      const rowNumber = i + 2;

      const sourceID = GraphItemService.nodeIDS.get(sourceType + from);
      const targetID = GraphItemService.nodeIDS.get(destinationType + to);

      // Exclude edge from the batches if its extremities are not found
      if (sourceID === undefined || targetID === undefined) {
        noExtremitiesRows.push(rowNumber);
        continue;
      }

      // Assign edge to a batch
      propertyValues = [sourceID, targetID, ...propertyValues];
      if (
        // Initialize the batch
        batchedRows.length === 0 ||
        // First batch is of one element to build and cache the query execution plan in neo4j
        batchedRows.length === 1 ||
        // Create a new batch if last batch has reached `MAX_BATCH_SIZE` elements
        batchedRows[batchedRows.length - 1].rows.length === MAX_BATCH_SIZE
      ) {
        batchedRows.push({rowNumbers: [rowNumber], rows: [propertyValues], UIDs: []});
      } else {
        batchedRows[batchedRows.length - 1].rowNumbers.push(rowNumber);
        batchedRows[batchedRows.length - 1].rows.push(propertyValues);
      }
    }
    return {
      propertyKeys: propertyKeys,
      batchedRows: batchedRows,
      badRows: [[RowErrorMessage.SOURCE_TARGET_NOT_FOUND, noExtremitiesRows]]
    };
  }
}
