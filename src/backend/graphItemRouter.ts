import bodyParser from 'body-parser';

import {PluginConfig, PluginRouteOptions} from '../@types/plugin';
import {GraphItemParams} from './graphItemParams';
import {respond} from './utils';
import {Request} from 'express';
import {GraphItemService} from "./graphItemService";

export = function configureRoutes(options: PluginRouteOptions<PluginConfig>): void {
  options.router.use(bodyParser.json({limit: '6mb', extended: true} as any));

  options.router.get('/getSchema', async (req, res) => {
    try {
      const schemaResult = await options.getRestClient(req).graphSchema.getTypesWithAccess({
        entityType: req.query.entityType || ('node' as any),
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

  options.router.post(
    '/importNodes',
    respond((req: Request) => {
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportNodes(req);
      return GraphItemService.importGraphItems(params, rc, false);
    })
  );

  options.router.post(
    '/importEdges',
    respond((req: Request) => {
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportEdges(req);
      return GraphItemService.importGraphItems(params, rc, true);
    })
  );
};
