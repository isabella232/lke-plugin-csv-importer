'use strict';
const bodyParser = require('body-parser');

module.exports = function(options) {
    options.router.use(bodyParser.json({limit: '100mb', extended: true}));

    options.router.get('/getSchema', async (req, res) => {
        try {
            const schemaResult = await options.getRestClient(req).graphSchema.getTypesWithAccess({
                entityType: options.configuration.entityType || 'node',
                sourceKey: req.query.sourceKey
            });
            res.status(200);
            res.contentType('application/json');
            res.send(JSON.stringify(schemaResult));
        } catch (e) {
            res.status(412);
            res.send(JSON.stringify({status: 412, body: e}));
        }
    });

    options.router.post('/addNode', async (req, res) => {
        try {
            if(!res.body || !res.body.nodes || typeof res.body.nodes !== typeof Array) {
                throw new Error('Payload is empty.');
            }
            let nodesPromise = [];
            res.body.nodes.forEach((node) => {
                if(!node || !node.categories || !node.properties) {
                    throw new Error('Node parameters are invalid or missing.');
                }
                nodesPromise.push(options.getRestClient(req).graphNode.createNode({
                    categories: node.categories,
                    properties: node.properties,
                    sourceKey: req.query.sourceKey
                }));
            });
            let totalSuccessful = 0, totalFailed = 0;
            const results = await Promise.allSettled(nodesPromise);
            totalSuccessful = results.filter((promise) => promise.status === 'fulfilled' ).length;
            totalFailed = results.length - totalSuccessful;

            res.status(200);
            res.contentType('application/json');
            res.send(JSON.stringify({total: req.body.nodes.length, success: totalSuccessful, failed: totalFailed,  message: "Nodes are imported."}));

        } catch (e) {
            res.status(412);
            res.send(JSON.stringify({status: 412, body: JSON.stringify(e)}));
        }
    });

    options.router.post('/addEdge', async (req, res) => {
        try {
            if(!res.body || !res.body.queries || typeof res.body.queries !== typeof Array) {
                throw new Error('Payload is empty.');
            }
            let edgesPromise = [];
            res.body.nodes.forEach((node) => {
                if(!node || !node.categories || !node.properties) {
                    throw new Error('Edge parameters are invalid or missing.');
                }
                edgesPromise.push(options.getRestClient(req).graphQuery.runQuery({
                    query: node.categories,
                    sourceKey: req.query.sourceKey
                }));
            });
            let totalSuccessful = 0, totalFailed = 0;
            const results = await Promise.allSettled(edgesPromise);
            totalSuccessful = results.filter((promise) => promise.status === 'fulfilled' ).length;
            totalFailed = results.length - totalSuccessful;
            res.status(200);
            res.contentType('application/json');
            res.send(JSON.stringify({total: req.body.queries.length, success: totalSuccessful, failed: totalFailed,  message: "Edges are imported."}));
        } catch (e) {
            res.status(412);
            res.send(JSON.stringify({status: 412, body: JSON.stringify(e)}));
        }
    });
};
