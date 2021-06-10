import {ImportEdgesParams, ImportNodesParams} from '../@types/shared';

export class GraphItemParams {
  public static checkImportNodes(req: {body?: Record<string, unknown>}): ImportNodesParams {
    if (
      !req.body ||
      !req.body.csv ||
      typeof req.body.csv !== 'string' ||
      !req.body.itemType ||
      typeof req.body.itemType !== 'string' ||
      !req.body ||
      !req.body.sourceKey
    ) {
      console.log({body: req.body});
      throw new Error('Invalid parameters');
    }
    return req.body as unknown as ImportNodesParams;
  }

  public static checkImportEdges(req: {body?: Record<string, unknown>}): ImportEdgesParams {
    GraphItemParams.checkImportNodes(req);
    if (
      !req.body ||
      !req.body.sourceType ||
      typeof req.body.sourceType !== 'string' ||
      !req.body.destinationType ||
      typeof req.body.destinationType !== 'string'
    ) {
      console.log({body: req.body});
      throw new Error('Invalid parameters');
    }
    return req.body as unknown as ImportEdgesParams;
  }
}
