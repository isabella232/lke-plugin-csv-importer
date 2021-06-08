import bodyParser from 'body-parser';

import {PluginConfig, PluginRouteOptions} from '../@types/plugin';
import {RestClient} from "@linkurious/rest-client";

class ItemIDResolver {
  private readonly knownUIDs = new Map<string, string>();

  constructor(private readonly rc: RestClient) {}

  public async getNodeID(sourceKey: string, type: string, uid: string): Promise<string | null> {
    const cachedGraphID = this.knownUIDs.get(type + uid);
    if (cachedGraphID !== undefined) {
      return cachedGraphID;
    }
    const query = `MATCH (n:\`${type}\`) WHERE n.UID = "${uid}" return n limit 1`; // TODO escape properly
    try {
      const res = await this.rc.graphQuery.runQuery({
        sourceKey: sourceKey,
        query: query
      })
      if (!res.isSuccess()) {
        console.log(query, res.body);
        return null;
      }
      if (res.body.nodes.length > 0) {
        const graphID = res.body.nodes[0].id;
        this.knownUIDs.set(type + uid, graphID);
        return graphID;
      } else {
        return null
      }
    } catch (e) {
      console.log(query, e);
      return null;
    }
  }
}

export = function configureRoutes(options: PluginRouteOptions<PluginConfig>): void {
  options.router.use(bodyParser.json({limit: '100mb', extended: true} as any));

  options.router.get('/getSchema', async (req, res) => {
      try {
          const schemaResult = await options.getRestClient(req).graphSchema.getTypesWithAccess({
              entityType: req.query.entityType || 'node' as any,
              sourceKey: req.query.sourceKey as string
          });
          res.status(200);
          res.contentType('application/json');
          res.send(JSON.stringify(schemaResult));
      } catch (e) {
          res.status(412);
          res.send(JSON.stringify({status: 412, body: e}));
      }
  });

  options.router.post('/addNodes', async (req, res) => {
    const rc = options.getRestClient(req);
    try {

      if(!req.body || !req.body.headers || !Array.isArray(req.body.headers)
        || !req.body.rows || !Array.isArray(req.body.rows)
        || !req.body.entityType || typeof req.body.entityType !== 'string'
        || !req.query || !req.query.sourceKey
        || (req.body.separator && req.body.separator !== ',' && req.body.separator !== ';')) {
        res.status(400).json({ // TODO there are more left to check but we can live without it
          message: 'Invalid parameters'
        });
        return;
      }
      const sourceKey = req.query.sourceKey as string;
      const headers: string[] = req.body.headers;
      const rows: string[] = req.body.rows;
      const entityType: string = req.body.entityType;
      const separator: string = req.body.separator;

      const failedRows = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fields = row.split(separator); // TODO it should support escaping strings
        if (fields.length !== headers.length) {
          failedRows.push([i + 1, `${headers.length} values expected but got ${fields.length}.`]);
          continue;
        }
        let response;
        const properties: Record<string, string> = {};
        fields.forEach((field, j) => {
          properties[headers[j]] = field;
        });
        try {
          response = await rc.graphNode.createNode({
            categories: [entityType],
            properties: properties,
            sourceKey: sourceKey
          });
          if (!response.isSuccess()) {
            failedRows.push([i + 1, response.body.message]);
          }
        } catch (e) {
          failedRows.push([i + 1, e.message]);
        }
      }
      const totalFailed = failedRows.length;
      const totalSuccessful = rows.length - totalFailed;

      res.status(200);
      res.contentType('application/json');
      res.send(JSON.stringify({
        total: rows.length,
        success: totalSuccessful,
        failed: failedRows
      }));

    } catch (e) {
      res.status(500).json(e);
    }
  });

  options.router.post('/addEdges', async (req, res) => {
    const rc = options.getRestClient(req);
    const idResolver = new ItemIDResolver(rc);
    try {
      if(!req.body || !req.body.headers || !Array.isArray(req.body.headers)
        || !req.body.rows || !Array.isArray(req.body.rows)
        || !req.body.entityType || typeof req.body.entityType !== 'string'
        || !req.query || !req.query.sourceKey
        || !req.body.sourceType || typeof req.body.sourceType !== 'string'
        || !req.body.destinationType || typeof req.body.destinationType !== 'string'
        || (req.body.separator && req.body.separator !== ',' && req.body.separator !== ';')) {
        res.status(400).json({ // TODO there are more left to check but we can live without it
          message: 'Invalid parameters'
        });
        return;
      }

      const sourceKey = req.query.sourceKey as string;
      const headers: string[] = req.body.headers;
      const rows: string[] = req.body.rows;
      const entityType: string = req.body.entityType;
      const sourceType: string = req.body.sourceType;
      const destinationType: string = req.body.destinationType;
      const separator: string = req.body.separator;

      const failedRows: [number, string][] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fields = row.split(separator); // TODO it should support escaping strings
        if (fields.length !== headers.length) {
          failedRows.push([i + 1, `${headers.length} values expected but got ${fields.length}.`]);
          continue;
        }
        let response;
        let sourceNodeID: string | null = null;
        let destinationNodeID: string | null = null;
        let errorMessage: string = '';
        const properties: Record<string, string> = {};
        for (let j = 0; j < fields.length; j++) {
          const field = fields[j];
          if (j >= 2) {
            properties[headers[j]] = field;
          } else if (j == 1) {
            const id = await idResolver.getNodeID(sourceKey, destinationType, field);
            if (id === null) {
              errorMessage += ` Destination node ${field} (${destinationType}) not found.`;
            } else {
              destinationNodeID = id;
            }
          } else {
            const id = await idResolver.getNodeID(sourceKey, sourceType, field);
            if (id === null) {
              errorMessage += `Source node ${field} (${sourceType}) not found.`
            } else {
              sourceNodeID = id;
            }
          }
        }
        if (sourceNodeID === null || destinationNodeID === null) {
          failedRows.push([i + 1, errorMessage.trim()]);
          continue;
        }
        try {
          response = await rc.graphEdge.createEdge({
            type: entityType,
            source: sourceNodeID,
            target: destinationNodeID,
            properties: properties,
            sourceKey: sourceKey
          });
          if (!response.isSuccess()) {
            failedRows.push([i + 1, response.body.message]);
          }

        } catch (e) {
          failedRows.push([i + 1, e.message]);
        }
      }
      const totalFailed = failedRows.length;
      const totalSuccessful = rows.length - totalFailed;

      res.status(200);
      res.contentType('application/json');
      res.send(JSON.stringify({
        total: rows.length,
        success: totalSuccessful,
        failed: failedRows
      }));
    } catch (e) {
      res.status(500).json(e);
    }
  });
};
