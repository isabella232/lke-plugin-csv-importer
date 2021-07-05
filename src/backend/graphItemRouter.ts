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
    respond((req: Request) => {
      if (graphItemService.importResult?.status === 'importing') {
        return Promise.reject({message: 'Another import is ongoing'})
      } else {
        const rc = options.getRestClient(req);
        const params = GraphItemParams.checkImportNodes(req);

        void graphItemService.importGraphItems(params, rc, false);
        return Promise.resolve({message: 'import started'})
      }
    })
  );

  options.router.post(
    '/importStatus',
    respond(() => {
      const result = {...graphItemService.importResult}
      if (result.status === 'done') {
        graphItemService.importResult = undefined
      }
      return Promise.resolve(result);
    })
  );

  options.router.post(
    '/importEdges',
    respond((req: Request) => {
      if (graphItemService.importResult?.status === 'importing') {
        return Promise.reject({message: 'Another import is ongoing'})
      } else {
        const rc = options.getRestClient(req);
        const params = GraphItemParams.checkImportEdges(req);
        void graphItemService.importGraphItems(params, rc, false);
        return Promise.resolve({message: 'import started'})
      }
    })
  );
};
