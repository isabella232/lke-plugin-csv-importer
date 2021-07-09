import bodyParser from 'body-parser';

import {PluginConfig, PluginRouteOptions} from '../@types/plugin';
import {GraphItemParams} from './graphItemParams';
import {respond} from './utils';
import {Request} from 'express';
import {GraphItemService} from './graphItemService';

export = function configureRoutes(options: PluginRouteOptions<PluginConfig>): void {
  options.router.use(bodyParser.json({limit: '6mb', extended: true} as any));
  const graphItemService = new GraphItemService();
  options.router.post(
    '/importNodes',
    respond(async (req: Request) => {
      if (graphItemService.importResult?.status === 'importing') {
        return;
      }
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportNodes(req);

      graphItemService.importItems(rc, params).then(_ => {});
      return;
    })
  );

  options.router.post(
    '/importEdges',
    respond(async (req: Request) => {
      if (graphItemService.importResult?.status === 'importing') {
        return;
      }
      const rc = options.getRestClient(req);
      const params = GraphItemParams.checkImportEdges(req);

      graphItemService.importItems(rc, params).then(_ => {});
      return;
    })
  );

  options.router.post(
    '/importStatus',
    respond(() => {
      const result = {...graphItemService.importResult};
      if (result.status === 'done') {
        graphItemService.importResult = undefined;
      }
      return Promise.resolve(result);
    })
  );
};
