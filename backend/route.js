'use strict';
const bodyParser = require('body-parser');
const allSettled = require('promise.allsettled');

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

    options.router.post('/addNodes', async (req, res) => {
        try {
            if(!req.body || !req.body.nodes || !Array.isArray(req.body.nodes)) {
                throw new Error('Payload is empty.');
            }
            let nodesPromise = [];
            req.body.nodes.forEach((node) => {
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
            const results = await allSettled(nodesPromise);
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

    options.router.post('/addEdges', async (req, res) => {
        try {
            if(!req.body || !req.body.edges || !Array.isArray(req.body.edges)) {
                throw new Error('Payload is empty.');
            }
            let edgesPromise = [];
            req.body.edges.forEach((edge) => {
                if(!edge || !edge.categories || !edge.properties) {
                    throw new Error('Edge parameters are invalid or missing.');
                }
                edgesPromise.push(options.getRestClient(req).graphQuery.runQuery({
                    query: edge.categories,
                    sourceKey: req.query.sourceKey
                }));
            });
            let totalSuccessful = 0, totalFailed = 0;
            const results = await allSettled(edgesPromise);
            totalSuccessful = results.filter((promise) => promise.status === 'fulfilled' ).length;
            totalFailed = results.length - totalSuccessful;
            res.status(200);
            res.contentType('application/json');
            res.send(JSON.stringify({total: req.body.edges.length, success: totalSuccessful, failed: totalFailed,  message: "Edges are imported."}));
        } catch (e) {
            res.status(412);
            res.send(JSON.stringify({status: 412, body: JSON.stringify(e)}));
        }
    });
};
