import bodyParser from 'body-parser';

import {PluginConfig, PluginRouteOptions} from '../@types/plugin';

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
        || !req.body.category || typeof req.body.category !== 'string'
        || !req.query || !req.query.sourceKey) {
        res.status(400).json({ // TODO there are more left to check but we can live without it
          message: 'Invalid parameters'
        });
        return;
      }
      const sourceKey = req.query.sourceKey as string;
      const headers: string[] = req.body.headers;
      const rows: string[] = req.body.rows;
      const category: string = req.body.category;

      const failedRows = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fields = row.split(","); // TODO it should support `;` too
        if (fields.length !== headers.length) {
          failedRows.push([i + 1, 'Provided values do not match provided headers']);
          continue;
        }
        let response;
        const properties: Record<string, string> = {};
        fields.forEach((field, j) => {
          properties[headers[j]] = field;
        });
        try {
          response = await rc.graphNode.createNode({
            categories: [category],
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
      const totalSuccessful = req.body.nodes.length - totalFailed;

      res.status(200);
      res.contentType('application/json');
      res.send(JSON.stringify({
        total: req.body.nodes.length,
        success: totalSuccessful,
        failed: failedRows
      }));

    } catch (e) {
      res.status(500).json(e);
    }
  });

  options.router.post('/addEdges', async (req, res) => {
      try {
          if(!req.body || !req.body.edges || !Array.isArray(req.body.edges)) {
              throw new Error('Payload is empty.');
          }
          let totalSuccessful = 0;
          for (let index = 0; index < req.body.edges.length; index++) {
            const query = req.body.edges[index];
            const res = await options.getRestClient(req).graphQuery.runQuery({
                query,
                sourceKey: req.query.sourceKey as string
            });
            if (res.status < 400) {
                totalSuccessful++;
            }
          }
          // TODO:  add way to check if edge was actually added
          const totalFailed = req.body.edges.length - totalSuccessful;
          res.status(200);
          res.contentType('application/json');
          res.send(JSON.stringify({total: req.body.edges.length, success: totalSuccessful, failed: totalFailed,  message: "Edges are imported."}));
      } catch (e) {
          res.status(412);
          // TODO: re-work error management for the plugin
          res.send(JSON.stringify(e, Object.getOwnPropertyNames(e)));
      }
  });
};
