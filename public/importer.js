let rows;
let headers;
let withHeaders;
let input;
let nodeCounter;
let edgeCounter;
let spinner = new Spinner();
let properties = [];
let edgeProperties = [];
let propertiesFrom = [];
let propertiesTo = [];

const nodeHTML = "<div class=\"nodeContainer\"><div class=\"labelContainer\"><div><label for=\"label\">Label</label><input type=\"hidden\" class=\"label\" placeholder=\"Type a new label\"><select onchange=\"createNewCategory(this.id)\" class=\"node_select label\"><option value='' disabled selected>Select a category</option><option value='##category##' \">Create new category</option></select></div><button class=\"removenodebutton secondaryButton\" onclick=\"removeNode(this.id)\">Remove node</button></div><div class=\"propertyContainer\"><div>Properties</div><button class=\"propertybutton quietButton\" onclick=\"propertyButton(this.id)\">Add property</button></div></div>";
const fromNodeHTML = "<label for=\"label\">Label </label>\n<select onchange=\"onNodeSelect(this.id)\" class=\"node_select label\"><option value='' disabled selected>Select a category</option></select><button class=\"identifierbutton quietButton\" onclick=\"identifierButton(this.id)\">Add identifier</button>";
const propertyHTML = "<label for=\"headers\"></label><select class=\"headers\"></select><label for=\"property\"> → </label><input type=\"hidden\" class=\"property\" placeholder=\"Property name\"><select onchange=\"createNewProperty(this.id)\" class=\"property_select label\"><option value='' disabled selected>Select a property</option><option value='##property##' \">Create new property</option></select><button class=\"removepropertybutton secondaryButton\" onclick=\"removeProperty(this.id)\">Remove property</button>";
const edgeHTML = "<label for=\"label\">Label </label>\n<input type=\"hidden\" class=\"label\" placeholder=\"label\"><select onchange=\"onEdgeSelected(this.id)\" class=\"edge_select label\"><option value='' disabled selected>Select a type</option><option value='##type##' \">Create new type</option></select><button class=\"edgepropertybutton quietButton\" onclick=\"edgePropertyButton(this.id)\">Add property</button><button class=\"removeedgebutton secondaryButton\" onclick=\"removeEdge(this.id)\">Remove edge</button><br>";
const edgeTableHTML = "<table><thead><th>Source node</th><th>Edge</th><th>Destination node</th></thead><tbody><tr><td class=\"fromname\"></td><td class=\"edgename\"></td><td class=\"toname\"></td></tr></tbody></table><br>"
const edgePropertyHTML = "<label for=\"headers\"></label><select class=\"headers\"></select><label for=\"property\"> → </label><input type=\"hidden\" class=\"edgeproperty\" placeholder=\"property name\"><select onchange=\"createNewPropertyEdge(this.id)\" class=\"property_select label\"><option value='' disabled selected>Select a property</option><option value='##property##' \">Create new property</option></select><button class=\"removeedgepropertybutton secondaryButton\" onclick=\"removeEdgeProperty(this.id)\">Remove Property</button>";
const identifierHTML = "<label for=\"property\"><br>Idenfitier </label><select class=\"headers\"></select><label for=\"property\"> → </label><select class=\"property_select\"><option value='' disabled selected>Select a property</option></select><button class=\"removeidentifierbutton secondaryButton\" onclick=\"removeIdentifier(this.id)\">Remove identifier</button>";
const nextstepHTML = "<p class=\"popupTitle\">The file has been successfully imported</p><a href='' class=\"quietButton\">Go to Linkurious</a><button class=\"newcsvbutton primaryButton\" onclick=\"newCSVButton()\">Upload another file</button>"

const basePathRegex = /(?<basePath>.*)\/plugins\/(?<pluginPath>.*?)(\/|$)/;
const basePath = basePathRegex.exec(window.location.pathname)?.groups.basePath || '';
const pluginPath = basePathRegex.exec(window.location.pathname).groups.pluginPath;
const serverURL = new URL(basePath, window.location.origin).href;

function readFile(){
    const params = new URLSearchParams(window.location.search);
    sessionStorage.setItem("sourceKey", params.get("sourceKey"));

    input = document.getElementById("importFile").files[0];
    if(!input || !input.name.endsWith(".csv")){
        document.getElementById("fileError").innerHTML = "Select a valid file ";
    } else{
        startWaiting();
        let fr = new FileReader();
        fr.onload = function(event){
            stopWaiting();
            rows = event.target.result.split(/\r?\n|\r/);
            withHeaders = document.getElementById("withHeaders").checked;
            if(withHeaders){
                headers = rows.shift();
            } else {
                headers = rows[0].split(",").length;
            }
            rows = JSON.stringify(rows);
            sessionStorage.setItem("rows", rows);
            sessionStorage.setItem("headers", headers);
            sessionStorage.setItem("withHeaders", withHeaders);
            window.location = serverURL + "plugins/" + pluginPath + "/mapping.html";
        };
        fr.readAsText(input);
    }
}

function addNode(){   
    // TODO: to be replaced by API call 
    const nodeCategories = ['Person', 'Car'];
    let nodes = document.getElementById("nodes");
    let nc = parseInt(nodes.getAttribute("nodecounter")) + 1;
    nodes.setAttribute("nodecounter", nc)
    let node = document.createElement("div");
    node.className = "nodeClass"
    node.setAttribute("propertycounter", 0);
    node.id = "node-" + nc;
    node.innerHTML = nodeHTML;

    let button = node.getElementsByClassName("propertybutton")[0];
    button.id = "button-" + nc;

    let select = node.getElementsByClassName("node_select")[0];
    select.id = "select-" + nc;
    fillOptionsNode(select, nodeCategories);

    let deleteButton = node.getElementsByClassName("removenodebutton")[0];
    deleteButton.id = "deletenodebutton-" + nc;

    nodeCounter++;
    
    document.getElementById("nodes").appendChild(node);    

    node.insertAdjacentElement("afterend", document.createElement("br"));
}

/**
 * Provided a select element and a list of string it builds the html options
 */
function fillOptionsNode(select, categories) {
    categories.forEach((category) => {
        var opt = document.createElement('option');
        opt.value = category;
        opt.innerHTML = category;
        select.insertBefore(opt, select.lastChild);
    });
}

/**
 * Make the category select disappear and replace it with a text input
 */
function createNewCategory(id) {
    const node = document.getElementById("node-" + id.split("-")[1]);
    const select = node.getElementsByClassName("node_select")[0];
    if (select.value === '##category##') {
        select.remove();
        const input = node.getElementsByClassName("label")[0];
        input.type = 'text';
        properties = [];
    } else if (select.value) {
        properties = ['uid', 'first_name'];
    }
    fillProperties(node);
}

/**
 * When an edge type is selected
 */
function onEdgeSelected(id) {
    const edge = document.getElementById("edge-" + id.split("-")[1]);
    const select = edge.getElementsByClassName("edge_select")[0];
    if (select.value === '##type##') {
        select.remove();
        const input = edge.getElementsByClassName("label")[0];
        input.type = 'text';
        edgeProperties = [];
    } else {
        edgeProperties = ['uid', 'edge_property1'];
    }
    deleteAllEdgeProperties(id);
}

/**
 * Make the property select disapper and replace it with a text input
 */
function createNewProperty(id) {
    const node = document.getElementById("node-" + id.split("-")[1]);
    const select = node.getElementsByClassName("property_select")[0];
    if (select.value === '##property##') {
        select.remove();
        const input = node.getElementsByClassName("property")[0];
        input.type = 'text';
    }
}

/**
 * Make the property select disapper and replace it with a text input
 */
function createNewPropertyEdge(id) {
    const node = document.getElementById("edge-" + id.split("-")[1]);
    const select = node.getElementsByClassName("property_select")[0];
    if (select.value === '##property##') {
        select.remove();
        const input = node.getElementsByClassName("edgeproperty")[0];
        input.type = 'text';
    }
}

function addEdge(){
    let edges = document.getElementById("edges");
    let ec = parseInt(edges.getAttribute("edgecounter")) + 1;
    edges.setAttribute("edgecounter", ec);

    let table = document.createElement("div");
    table.className = "edgetable";
    table.innerHTML = edgeTableHTML;
    edges.appendChild(table);

    let edge = document.createElement("div");
    edge.className = "edgeClass"
    edge.setAttribute("propertycounter", 0);
    edge.id = "edge-" + ec;
    edge.innerHTML = edgeHTML;

    let select = edge.getElementsByClassName("edge_select")[0];
    select.id = "typeselect-" + ec;
    // TODO: replace by call to api
    const edgeTypeAPI = ['type_1', 'type_2'];
    fillOptionsNode(select, edgeTypeAPI);

    let edgename = table.getElementsByClassName("edgename")[0];
    edgename.appendChild(edge);

    let button = edge.getElementsByClassName("edgepropertybutton")[0];
    button.id = "edgebutton-" + ec;

    let deleteEdgeButton = edge.getElementsByClassName("removeedgebutton")[0];
    deleteEdgeButton.id = "deleteedgebutton-" + ec;

    edgeCounter++;
    
    addFromNode(edge);
    addToNode(edge);
}

function addFromNode(edge){
    // TODO: to be replaced by API call 
    const nodeCategories = ['Person', 'Car'];
    let nc = edge.getAttribute("id").split("-")[1]
    let fromNode = document.createElement("div");
    edge.className = "fromNode"
    fromNode.setAttribute("id", "fromNode-" + nc);
    fromNode.setAttribute("propertycounter", 0);
    fromNode.innerHTML = fromNodeHTML;
    let table = edge.parentElement.parentElement;
    table.getElementsByClassName("fromname")[0].appendChild(fromNode);

    let button = fromNode.getElementsByClassName("identifierbutton")[0];
    button.id = "frombutton-" + nc;
    addIdentifier(fromNode);

    // Merge node category from last step + existing database
    let select = fromNode.getElementsByClassName("node_select")[0];
    select.id = "fromselect-" + nc;
    const nodesData = getNodesData();
    const allCategories = nodeCategories.concat(
        nodesData
            .map(node => node.name)
            .filter((category) => nodeCategories.indexOf(category) < 0)
    )
    fillOptionsNode(select, allCategories);
}

function addToNode(edge){
    // TODO: to be replaced by API call 
    const nodeCategories = ['Person', 'Car'];
    let nc = edge.getAttribute("id").split("-")[1]
    let toNode = document.createElement("div");
    edge.className = "toNode"
    toNode.setAttribute("id", "toNode-" + nc);
    toNode.setAttribute("propertycounter", 0);
    toNode.innerHTML = fromNodeHTML;
    let table = edge.parentElement.parentElement;
    table.getElementsByClassName("toname")[0].appendChild(toNode);

    let button = toNode.getElementsByClassName("identifierbutton")[0];
    button.id = "tobutton-" + nc;
    addIdentifier(toNode);

    // Merge node category from last step + existing database
    let select = toNode.getElementsByClassName("node_select")[0];
    select.id = "toselect-" + nc;
    const nodesData = getNodesData();
    const allCategories = nodeCategories.concat(
        nodesData
            .map(node => node.name)
            .filter((category) => nodeCategories.indexOf(category) < 0)
    )
    fillOptionsNode(select, allCategories);
}

/**
 * When a node catgeory is selected (source or destination node)
 */
function onNodeSelect(id) {
    const select = document.getElementById(id);
    const nodesData = getNodesData();
    selectedCategory = nodesData.filter(node => node.name === select.value);
    const propertiesAPI = ['uid', 'first_name'];
    let newProperties = [];
    if (selectedCategory.length) {
        newProperties = selectedCategory[0].properties.map(property => property.propertyName);
    }
    const allProperties = propertiesAPI.concat(
        newProperties
            .filter((property) => property && propertiesAPI.indexOf(property) < 0)
    )
    let node;
    if (id.startsWith("from")){
        node = document.getElementById("fromNode-" + id.split("-")[1]);
        
        propertiesFrom = allProperties;
    } else {
        node = document.getElementById("toNode-" + id.split("-")[1]);
        propertiesTo = allProperties;
    }
    const existingProperties = node.getElementsByClassName("identifierClass");
    for (var i = existingProperties.length - 1; i >= 0; i--) {
        existingProperties[0].parentNode.removeChild(existingProperties[0]);
    }
    addIdentifier(node);
}



function propertyButton(id){
    let node = document.getElementById("node-" + id.split("-")[1]);
    addProperty(node);
}

function edgePropertyButton(id){
    let edge = document.getElementById("edge-" + id.split("-")[1]);
    addEdgeProperty(edge);
}

/**
 * Delete edge properties when edge type is changed
 */
function deleteAllEdgeProperties(id){
    let edge = document.getElementById("edge-" + id.split("-")[1]);
    const existingProperties = edge.getElementsByClassName("propertyClass");
    for (var i = existingProperties.length - 1; i >= 0; i--) {
        existingProperties[0].parentNode.removeChild(existingProperties[0]);
    }
}

function identifierButton(id){
    let node;
    if (id.startsWith("from")){
        node = document.getElementById("fromNode-" + id.split("-")[1]);
    } else {
        node = document.getElementById("toNode-" + id.split("-")[1]);
    }
    addIdentifier(node);
}

function addProperty(node){
    
    let pc = parseInt(node.getAttribute("propertycounter")) + 1;
    node.setAttribute("propertycounter", pc);

    headers = sessionStorage.getItem("headers");
    withHeaders = sessionStorage.getItem("withHeaders");

    let property = document.createElement("div");
    property.className = "propertyClass";
    property.id = node.id + "." + pc;   
    property.innerHTML = propertyHTML;

    let deletePropertyButton = property.getElementsByClassName("removepropertybutton")[0];
    deletePropertyButton.id = "removepropertybutton-" + property.id.split("-")[1];

    let select = property.getElementsByClassName("headers")[0];
    if(withHeaders == "true"){
        headers = headers.split(",");
        for(let i in headers){
            let opt = headers[i]
            let el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            select.appendChild(el);
        }
    } else {
        for(let i = 0; i < headers; i++){
            let opt = "Column " + (i+1);  
            let el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            select.appendChild(el);
        }
    }
    let selectProperty = property.getElementsByClassName("property_select")[0];
    selectProperty.id = "select-" + property.id.split("-")[1];
    fillOptionsNode(selectProperty, properties);

    node.appendChild(property);
}

function addEdgeProperty(edge){
    
    let pc = parseInt(edge.getAttribute("propertycounter")) + 1;
    edge.setAttribute("propertycounter", pc);

    headers = sessionStorage.getItem("headers");
    withHeaders = sessionStorage.getItem("withHeaders");

    let property = document.createElement("div");
    property.className = "propertyClass";
    property.id = edge.id + "." + pc;   
    property.innerHTML = edgePropertyHTML;

    let deleteEdgePropertyButton = property.getElementsByClassName("removeedgepropertybutton")[0];
    deleteEdgePropertyButton.id = "removeedgepropertybutton-" + property.id.split("-")[1];

    let select = property.getElementsByClassName("headers")[0];
    if(withHeaders == "true"){
        headers = headers.split(",");
        for(let i in headers){
            let opt = headers[i]
            let el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            select.appendChild(el);
        }
    } else {
        for(let i = 0; i < headers; i++){
            let opt = "Column " + (i+1);  
            let el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            select.appendChild(el);
        }
    }
    let selectProperty = property.getElementsByClassName("property_select")[0];
    selectProperty.id = "edgeSelect-" + property.id.split("-")[1];
    fillOptionsNode(selectProperty, edgeProperties);
    edge.appendChild(property);
}

function addIdentifier(node){
    
    let pc = parseInt(node.getAttribute("propertycounter")) + 1;
    node.setAttribute("propertycounter", pc);

    headers = sessionStorage.getItem("headers");
    withHeaders = sessionStorage.getItem("withHeaders");

    let identifier = document.createElement("div");
    identifier.className = "identifierClass";
    identifier.id = node.id + "." + pc;   
    identifier.innerHTML = identifierHTML;
    let deleteIdentifierButton = identifier.getElementsByClassName("removeidentifierbutton")[0];
    let selectProperty = identifier.getElementsByClassName("property_select")[0];
    if (identifier.id.startsWith("from")){
        deleteIdentifierButton.id = "removefromidentifierbutton-" + identifier.id.split("-")[1];
        fillOptionsNode(selectProperty, propertiesFrom);
    } else {
        deleteIdentifierButton.id = "removetoidentifierbutton-" + identifier.id.split("-")[1];
        fillOptionsNode(selectProperty, propertiesTo);
    }

    let select = identifier.getElementsByClassName("headers")[0];
    if(withHeaders == "true"){
        headers = headers.split(",");
        for(let i in headers){
            let opt = headers[i]
            let el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            select.appendChild(el);
        }
    } else {
        for(let i = 0; i < headers; i++){
            let opt = "Column " + (i+1);  
            let el = document.createElement("option");
            el.textContent = opt;
            el.value = i;
            select.appendChild(el);
        }
    }

    node.appendChild(identifier);
}

/**
 * make XMLHttpRequest
 * @param verb : string  default value 'GET'
 * @param url : string   API end point
 * @param body : Object
 * @returns {Promise<any>}
 */
function makeRequest(verb = 'GET', url, body) {
    const xmlHttp = new XMLHttpRequest();
    return new Promise((resolve, reject) => {
        xmlHttp.onreadystatechange = () => {
            // Only run if the request is complete
            if (xmlHttp.readyState !== 4) {
                return;
            }
            // Process the response
            if (xmlHttp.status >= 200 && xmlHttp.status < 300) {
                // If successful
                resolve(xmlHttp);
            } else {
                const message = typeof xmlHttp.response === 'string' ? xmlHttp.response : JSON.parse(xmlHttp.response).body.error;
                // If failed
                reject({
                    status: xmlHttp.status,
                    statusText: xmlHttp.statusText,
                    body: message
                });
            }
        };
        xmlHttp.open(verb, url);
        xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        xmlHttp.send(JSON.stringify(body));
    });
}

/**
 * Handle request errors
 * @param event : Object
 */
function handleError(event) {
    stopWaiting();
    alert(`Error\n${event.body}`);
    throw Error(event.body);
}

async function execute() {
    const check = checkInput();
    if (check === true) {
        const dataQuery = createDataForQuery();
        try {
            startWaiting();
            let visualRes = 'Import successfull!';
            if (dataQuery.nodes.length) {
                const resNodes = await makeRequest(
                    'POST',
                    // `api/addNodes?sourceKey=${sessionStorage.getItem("sourceKey")}`,50ecda20
                    `api/addNodes?sourceKey=50ecda20`,
                    {
                        nodes: dataQuery.nodes
                    }
                );
                const data = JSON.parse(resNodes.result);
                visualRes += `\n\nNodes imported: ${data.success}/${data.total}`;
                if (data.failed) {
                    visualRes += `\nPlease review: ${data.failed} nodes were not imported`;
                }
            }
            if (dataQuery.edges.length) {
                const resEdges = await makeRequest(
                    'POST',
                    `api/addEdges?sourceKey=${sessionStorage.getItem("sourceKey")}`,
                    {
                        edges: dataQuery.edges
                    }
                );
                const data = JSON.parse(resEdges.result);
                visualRes += `\n\nEdges imported: ${data.success}/${data.total}`;
                if (data.failed) {
                    visualRes += `\nPlease review: ${data.failed} edges were not imported`;
                }
            }
            stopWaitingNextStep();
        } catch(e) {
            handleError(e);
        }
    } else {
        alert(check);
    }
}


// async function execute(){
//     let check = checkInput();

//     if(check == true){
//         startWaiting();
//         try{
//             let queryTemplates = createNodeQuery().concat(createEdgeQuery());
//             let csv = JSON.parse(sessionStorage.getItem("rows"));
//             let header = sessionStorage.getItem("headers");
    
//             let queries = createQueries(queryTemplates, csv, header);
//             let len = queries.length;
//             for (i in queries){
//               let info = `Running query n. ${parseInt(i) + 1} of ${len}`
//               await runQuery(queries[i], info);
//             }
//             stopWaitingNextStep();
//         } catch {
//             stopWaiting();
//         }
//     }
//     else {
//         alert(check);
//     }
// }

/**
 * Get all data from the nodes into a javascript object to use them in the edge mapping
 */
function getNodesData() {
    const nodesData = [];
    let nodes = document.getElementsByClassName("nodeClass");
    for(let n = 0; n < nodes.length; n++){
        const nodeData = {
            name: '',
            properties: []
        }
        let node = nodes[n];
        let properties = node.getElementsByClassName("propertyClass");
        const nodeSelect = node.getElementsByClassName("node_select");
        const nodeName = nodeSelect.length ?  nodeSelect[0].value : node.getElementsByClassName("label")[0].value;
        nodeData.name = nodeName;
        for(let p = 0; p < properties.length; p++){
            let property = properties[p];
            const propertySelect = property.getElementsByClassName("property_select");
            const propertyName = propertySelect.length ? propertySelect[0].value : property.getElementsByClassName("property")[0].value;
            let headers = property.getElementsByClassName("headers")[0];
            const indexColumn = headers.options[headers.selectedIndex].value;
            nodeData.properties.push({
                indexColumn,
                propertyName
            });
        }
        nodesData.push(nodeData);
    }
    return nodesData;
}

function createNodeQuery(){
    let queries = [];

    let nodes = document.getElementsByClassName("nodeClass");
    for(let n = 0; n < nodes.length; n++){
        let node = nodes[n];
        let properties = node.getElementsByClassName("propertyClass");
        const nodeSelect = node.getElementsByClassName("node_select");
        const nodeName = nodeSelect.length ?  nodeSelect[0].value : node.getElementsByClassName("label")[0].value;
        let query = "CREATE (n:" + nodeName + ") ";
        for(let p = 0; p < properties.length; p++){
            let property = properties[p];
            let headers = property.getElementsByClassName("headers")[0];
            const propertySelect = property.getElementsByClassName("property_select");
            const propertyName = propertySelect.length ? propertySelect[0].value : property.getElementsByClassName("property")[0].value;
            query += "SET n." + propertyName + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }
        queries.push(query + " RETURN 1");
    }
    return queries;
}

/**
 * Get all data from the edges into a javascript object to use them in backend requests
 */
function getEdgesData() {
    const edgesData = [];
    let tables = document.getElementsByClassName("edgetable");
    for (let e = 0; e<tables.length; e++) {
        let table = tables[e];
        const edge = {
            from: {
                category: '',
                identifiers: []
            },
            to: {
                category: '',
                identifiers: []
            },
            edge: {
                type: '',
                properties: []
            }
        }
        let fromNode = table.getElementsByClassName("fromname")[0];
        let edgeElement = table.getElementsByClassName("edgename")[0];
        let toNode = table.getElementsByClassName("toname")[0];

        edge.from.category = fromNode.getElementsByClassName("node_select")[0].value;
        let fromIdentifiers = fromNode.getElementsByClassName("identifierClass");
        for(let p = 0; p < fromIdentifiers.length; p++){
            let identifier = fromIdentifiers[p];
            let headers = identifier.getElementsByClassName("headers")[0];
            const indexColumn = headers.options[headers.selectedIndex].value
            const identifierName = identifier.getElementsByClassName("property_select")[0].value;
            edge.from.identifiers.push({
                indexColumn,
                identifierName
            });
        }
        edge.to.category = toNode.getElementsByClassName("node_select")[0].value;
        let toIdentifiers = toNode.getElementsByClassName("identifierClass");
        for(let p = 0; p < toIdentifiers.length; p++){
            let identifier = toIdentifiers[p];
            let headers = identifier.getElementsByClassName("headers")[0];
            const indexColumn = headers.options[headers.selectedIndex].value
            const identifierName = identifier.getElementsByClassName("property_select")[0].value;
            edge.to.identifiers.push({
                indexColumn,
                identifierName
            });
        }

        const edgeType = edgeElement.getElementsByClassName("edge_select");
        edge.edge.type = edgeType.length ? edgeType[0].value : edgeElement.getElementsByClassName("label")[0].value;
        let properties = edgeElement.getElementsByClassName("propertyClass");
        for(let p = 0; p < properties.length; p++){
            let property = properties[p];
            let headers = property.getElementsByClassName("headers")[0];
            const indexColumn = headers.options[headers.selectedIndex].value;
            const edgePropertySelect = property.getElementsByClassName("property_select");
            const propertyName = edgePropertySelect.length ? edgePropertySelect[0].value : property.getElementsByClassName("edgeproperty")[0].value;
            edge.edge.properties.push({
                indexColumn,
                propertyName
            });
        }
        edgesData.push(edge);
    }
    return edgesData;
}

function createEdgeQuery(){
    let queries = [];

    let tables = document.getElementsByClassName("edgetable");
    console.log(tables.length);
    for (let e = 0; e<tables.length; e++){
        let table = tables[e];

        let fromNode = table.getElementsByClassName("fromname")[0];
        let edge = table.getElementsByClassName("edgename")[0];
        let toNode = table.getElementsByClassName("toname")[0];

        let fromIdentifiers = fromNode.getElementsByClassName("identifierClass");
        let fromQuery = "MATCH (f:" + fromNode.getElementsByClassName("node_select")[0].value + ") ";
        for(let p = 0; p < fromIdentifiers.length; p++){
            let identifier = fromIdentifiers[p];
            let headers = identifier.getElementsByClassName("headers")[0];
            if (p>0){
                fromQuery += "AND f."
            } else {
                fromQuery += "WHERE f."
            }
            fromQuery += identifier.getElementsByClassName("property_select")[0].value + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }
         
        const edgeType = edge.getElementsByClassName("edge_select");
        const edgeTypeFinal = edgeType.length ? edgeType[0].value : edge.getElementsByClassName("label")[0].value;
        let properties = edge.getElementsByClassName("propertyClass");
        let edgeQuery = "MERGE (f)-[e:" + edgeTypeFinal + "]->(t) ";
        console.log("properties: " + properties.length);
        for(let p = 0; p < properties.length; p++){
            let property = properties[p];
            let headers = property.getElementsByClassName("headers")[0];
            const edgePropertySelect = property.getElementsByClassName("property_select");
            const propertyName = edgePropertySelect.length ? edgePropertySelect[0].value : property.getElementsByClassName("edgeproperty")[0].value;
            edgeQuery += "SET e." + propertyName + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }

        let toIdenfiers = toNode.getElementsByClassName("identifierClass");
        let toQuery = "MATCH (t:" + toNode.getElementsByClassName("node_select")[0].value + ") ";
        for(let p = 0; p < toIdenfiers.length; p++){
            let identifier = toIdenfiers[p];
            let headers = identifier.getElementsByClassName("headers")[0];
            console.log("headers: " + headers.selectedIndex);
            if (p>0){
                toQuery += "AND t."
            } else {
                toQuery += "WHERE t."
            }
            toQuery += identifier.getElementsByClassName("property_select")[0].value + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }

        let query = fromQuery + toQuery + edgeQuery;
        queries.push(query + " RETURN 1");
        console.log(query);
    }

    return queries;
}

function createDataForQuery() {
    const nodes = [];
    const nodeConfigs = getNodesData();
    const csv = JSON.parse(sessionStorage.getItem("rows"));
    for (let l = 0; l < csv.length; l++) {
        let line = csv[l].split(",");
        nodeConfigs.forEach(nodeConfig => {
            const properties = {};
            nodeConfig.properties.forEach((property) => {
                properties[property.propertyName] = line[property.indexColumn];
            })
            const node = {
                categories: [nodeConfig.name],
                properties
            };
            nodes.push(node);
        });
    }
    const queryTemplates = createEdgeQuery();
    const header = sessionStorage.getItem("headers");
    const edges = createQueries(queryTemplates, csv, header);
    return {
        nodes,
        edges
    }
}

function createQueries(queryTemplates, csv, header){
    let res = [];
    if (header != null){
        for (let l = 0; l < csv.length; l++){
            let line = csv[l].split(",");
            for (let q = 0; q < queryTemplates.length; q++){
                let qt = queryTemplates[q];
                for (let p = 0; p < line.length; p++){
                    let par = line[p];
                    if(par != ""){
                        if ((par.startsWith("\"") && par.endsWith("\"")) || (par.startsWith("'") && par.endsWith("'"))){
                            par = par.slice(1,-1);
                        }
                        par = par.replace("\"", "\\\"");
                        qt = qt.replace(new RegExp("~"+p+"~", "g"),"\""+par+"\"");
                    } else {
                        qt = qt.replace(new RegExp("~"+p+"~", "g"),"null");
                    }
                }
                console.log(qt);
                res.push(qt);
            }
        }
    }
    return res;
}

function removeNode(node){
    let nodeID = "node-" + node.split("-")[1];
    let element = document.getElementById(nodeID);
    let br1 = element.nextElementSibling;
    let br2 = br1.nextElementSibling;
    element.parentNode.removeChild(element);
    br1.parentNode.removeChild(br1);
    br2.parentNode.removeChild(br2);
}

function removeEdge(edge){
    let edgeID = "edge-" + edge.split("-")[1];
    let element = document.getElementById(edgeID);
    let table = element.parentElement.parentElement.parentElement.parentElement.parentElement;
   
    table.parentNode.removeChild(table);
    
}

function removeProperty(property){
    let propertyID = "node-" + property.split("-")[1];
    let element = document.getElementById(propertyID);
    element.parentNode.removeChild(element);
}

function removeEdgeProperty(property){
    let propertyID = "edge-" + property.split("-")[1];
    let element = document.getElementById(propertyID);
    element.parentNode.removeChild(element);
}

function removeIdentifier(identifier){
    let identifierID;
    if(identifier.startsWith("removefrom")){
        identifierID = "fromNode-" + identifier.split("-")[1];
    } else {
        identifierID = "toNode-" + identifier.split("-")[1];
    }
    let element = document.getElementById(identifierID);
    element.parentNode.removeChild(element);
}

function runQuery(query, info){
    return new Promise((resolve, reject) => {
        let body = JSON.stringify({query: query});    
        let request = new XMLHttpRequest();
        request.open("POST", serverURL + 'api/' + sessionStorage.getItem("sourceKey") + '/graph/run/query');
    
        request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        request.send(body);
        
        request.onload = () => {
            console.log(info);
            if (request.status === 200) {
                console.log ("---> success");
            } else {
                console.log(`error ${request.response}`);
                console.log ("---> error: " + request.statusText);
            }
            resolve();
        }
    });
}

function startWaiting(){
    let overlay = document.createElement("div")
    overlay.className = "overlay";
    overlay.innerHTML = "<div class=\"opacity\"></div><div class=\"highlight\"></div>"
    document.body.appendChild(overlay);
    spinner.spin(document.getElementsByClassName("highlight")[0]);
}

function startLoading(){
    let overlay = document.createElement("div")
    overlay.className = "overlay";
    overlay.innerHTML = "<div class=\"opacity\"></div><div class=\"highlight\"></div>"
    document.body.appendChild(overlay);
    let loadingBar = new ldBar(document.getElementsByClassName("highlight")[0]);
    loadingBar.set(60);
}

function stopWaiting(){
    let overlay = document.getElementsByClassName("overlay")[0];
    spinner.stop();
    overlay.parentElement.removeChild(overlay);
}

function stopWaitingNextStep(){
    let highlight = document.getElementsByClassName("highlight")[0];
    spinner.stop();
    let nextStep = document.createElement("div");
    nextStep.className = "nextstep";
    nextStep.innerHTML = nextstepHTML;
    highlight.appendChild(nextStep);
}

function newCSVButton(){
    window.location = serverURL + "plugins/" + pluginPath + "/index.html?sourceKey=" + sessionStorage.getItem("sourceKey");
}

function fillProperties(node){
    // Delete the div in case it was already created before
    const existingProperties = node.getElementsByClassName("propertyClass");
    for (var i = existingProperties.length - 1; i >= 0; i--) {
        existingProperties[0].parentNode.removeChild(existingProperties[0]);
    }

    headers = sessionStorage.getItem("headers");
    withHeaders = sessionStorage.getItem("withHeaders");
    headers = headers.split(",");
    for(let h = 0; h < headers.length; h++){
        let pc = parseInt(node.getAttribute("propertycounter")) + 1;
        node.setAttribute("propertycounter", pc);

        let property = document.createElement("div");
        property.className = "propertyClass";
        property.id = node.id + "." + pc;   
        property.innerHTML = propertyHTML;

        let deletePropertyButton = property.getElementsByClassName("removepropertybutton")[0];
        deletePropertyButton.id = "removepropertybutton-" + property.id.split("-")[1];
        let select = property.getElementsByClassName("headers")[0];
        if(withHeaders == "true"){
            for(let i in headers){
                let opt = headers[i];
                let el = document.createElement("option");
                el.textContent = opt;
                el.value = i;
                select.appendChild(el);
            }
        } else {
            for(let i = 0; i < headers; i++){
                let opt = "Column " + (i+1);  
                let el = document.createElement("option");
                el.textContent = opt;
                el.value = i;
                select.appendChild(el);
            }
        }
        select.selectedIndex = h;
        let selectProperty = property.getElementsByClassName("property_select")[0];
        selectProperty.id = "select-" + property.id.split("-")[1];
        fillOptionsNode(selectProperty, properties);
        // auto select properties with same name than column
        if (withHeaders) {
            const indexHeader = findIndexHeader(selectProperty.options, headers[h]);
            if (indexHeader !== -1) {
                selectProperty.selectedIndex = indexHeader;
            } 
        }
    
        node.appendChild(property);
    }
}

/**
 * Find the index of the option that matches the column name
 * If none matches, return -1
 */
function findIndexHeader(items, header) {
    for (let i = 0; i < items.length; i++) {
        if (header === items[i].innerText) {
            return i;
        }
    }
    return -1;
}

function checkInput(){
    let roots = true;
    const edgesRoot = document.getElementById('edges').children;
    const nodesRoot = document.getElementById('nodes').children;
    if (!edgesRoot.length && !nodesRoot.length) {
        roots = false;
    }
    let textFields = true;
    let inputs = document.getElementsByTagName("input");
    for (let i=0; i<inputs.length; i++){

        if (inputs[i].value === "" && inputs[i].type !== 'hidden'){
            inputs[i].style.border ="2px solid #EC5B62";
            textFields = false;
        } else {
            inputs[i].style.border ="";
        }
    }
    
    let selectFields = true;
    let edge_selects = Array.from(document.getElementsByClassName("edge_select"));
    let node_selects = Array.from(document.getElementsByClassName("node_select")).concat(edge_selects);
    let all_selects = Array.from(document.getElementsByClassName("property_select")).concat(node_selects);
    for (let i = 0; i < all_selects.length; i++){
        if (all_selects[i].value === ""){
            all_selects[i].style.border ="2px solid #EC5B62";
            selectFields = false;
        } else {
            all_selects[i].style.border ="";
        }
    }
    let relIds = true;
    let tables = document.getElementsByClassName("edgetable");
    for (let i=0; i<tables.length; i++){
        let fromid = tables[i].getElementsByClassName("fromname")[0].getElementsByClassName("identifierClass")[0].getElementsByTagName("select")[0];
        let toid = tables[i].getElementsByClassName("toname")[0].getElementsByClassName("identifierClass")[0].getElementsByTagName("select")[0];
        if (fromid.value == toid.value){
            fromid.style.border = "2px solid #EC5B62";
            toid.style.border = "2px solid #EC5B62";
            relIds = false;
        } else {
            fromid.style.border = "";
            toid.style.border = "";
        }
    }
    if (roots && selectFields && textFields && relIds){
        return true;
    } else {
        let error = "The following needs corrected:";
        if(!roots){ error = error + "\n → Fill at least 1 node or 1 edge"; }
        if(!selectFields){ error = error + "\n → Fill all the dropdowns"; }
        if(!textFields){ error = error + "\n → Fill all the text fields"; }
        if(!relIds){ error = error + "\n → Identifier for the edges should use different columns"; }
        return error;
    }
}