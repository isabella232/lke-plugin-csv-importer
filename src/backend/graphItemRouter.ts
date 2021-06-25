import bodyParser from 'body-parser';

import {PluginConfig, PluginRouteOptions} from '../@types/plugin';
import {GraphItemParams} from './graphItemParams';
import {respond} from './utils';
import {Request} from 'express';
import {GraphItemService} from './graphItemService';

export = function configureRoutes(options: PluginRouteOptions<PluginConfig>): void {
  options.router.use(bodyParser.json({limit: '6mb', extended: true} as any));

  options.router.post(
    '/importNodes',
    respond((req: Request) => {
      req.setTimeout(600000)
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportNodes(req);
      return GraphItemService.importGraphItems(params, rc, false);
    })
  );

  options.router.post(
    '/importEdges',
    respond((req: Request) => {
      req.setTimeout(600000)
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportEdges(req);
      return GraphItemService.importGraphItems(params, rc, true);
    })
  );
};
