let rows;
let headers;
let withHeaders;
let input;
let nodeCounter;
let edgeCounter;
let spinner = new Spinner();
let properties = [];

const nodeHTML = "<div class=\"nodeContainer\"><div class=\"labelContainer\"><div><label for=\"label\">Label</label><input type=\"hidden\" class=\"label\" placeholder=\"Type a new label\"><select onchange=\"createNewCategory(this.id)\" class=\"headers\"><option value='' disabled selected>Select a category</option><option value='##category##' \">Create new Category</option></select></div><button class=\"removenodebutton secondaryButton\" onclick=\"removeNode(this.id)\">Remove node</button></div><div class=\"propertyContainer\"><div>Properties</div><button class=\"propertybutton quietButton\" onclick=\"propertyButton(this.id)\">Add property</button></div></div>";
const fromNodeHTML = "<label for=\"label\">Label </label>\n<input type=\"text\" class=\"label\" placeholder=\"label\"><button class=\"identifierbutton quietButton\" onclick=\"identifierButton(this.id)\">Add identifier</button>";
const propertyHTML = "<label for=\"headers\"></label><select class=\"headers\"></select><label for=\"property\"> → </label><input type=\"hidden\" class=\"property\" placeholder=\"Property name\"><select onchange=\"createNewProperty(this.id)\" class=\"headers\"><option value='' disabled selected>Select a property</option><option value='##property##' \">Create new property</option></select><button class=\"removepropertybutton secondaryButton\" onclick=\"removeProperty(this.id)\">Remove property</button>";
const edgeHTML = "<label for=\"label\">Label </label>\n<input type=\"text\" class=\"label\" placeholder=\"Label\"><button class=\"edgepropertybutton quietButton\" onclick=\"edgePropertyButton(this.id)\">Add property</button><button class=\"removeedgebutton secondaryButton\" onclick=\"removeEdge(this.id)\">Remove edge</button><br>";
const edgeTableHTML = "<table><thead><th>Source node</th><th>Edge</th><th>Destination node</th></thead><tbody><tr><td class=\"fromname\"></td><td class=\"edgename\"></td><td class=\"toname\"></td></tr></tbody></table><br>"
const edgePropertyHTML = "<label for=\"headers\"></label><select class=\"headers\"></select><label for=\"property\"> → </label><input type=\"text\" class=\"edgeproperty\" placeholder=\"Property name\"></input><button class=\"removeedgepropertybutton secondaryButton\" onclick=\"removeEdgeProperty(this.id)\">Remove Property</button>";
const identifierHTML = "<label for=\"property\"><br>Idenfitier </label><select class=\"headers\"></select><label for=\"property\"> → </label><input type=\"text\" class=\"identifier\" placeholder=\"Property name\"></input><button class=\"removeidentifierbutton secondaryButton\" onclick=\"removeIdentifier(this.id)\">Remove identifier</button>";
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

    let select = node.getElementsByClassName("headers")[0];
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
    const select = node.getElementsByClassName("headers")[0];
    if (select.value === '##category##') {
        select.remove();
        const input = node.getElementsByClassName("label")[0];
        input.type = 'text';
    } else if (select.value) {
        properties = ['uid', 'first_name'];
    }
    fillProperties(node);
}

/**
 * Make the property select disapper and replace it with a text input
 */
function createNewProperty(id) {
    const node = document.getElementById("node-" + id.split("-")[1]);
    const select = node.getElementsByClassName("headers")[1];
    if (select.value === '##property##') {
        select.remove();
        const input = node.getElementsByClassName("property")[0];
        input.type = 'text';
    }
}

function addEdge(){
    let edges = document.getElementById("edges");
    let ec = parseInt(edges.getAttribute("edgecounter")) + 1;
    edges.setAttribute("edgecounter", ec);

    let table = document.createElement("table");
    table.className = "edgetable";
    table.innerHTML = edgeTableHTML;
    edges.appendChild(table);

    let edge = document.createElement("div");
    edge.className = "edgeClass"
    edge.setAttribute("propertycounter", 0);
    edge.id = "edge-" + ec;
    edge.innerHTML = edgeHTML;

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
}

function addToNode(edge){
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
}

function propertyButton(id){
    let node = document.getElementById("node-" + id.split("-")[1]);
    addProperty(node);
}

function edgePropertyButton(id){
    let edge = document.getElementById("edge-" + id.split("-")[1]);
    addEdgeProperty(edge);
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
    if (identifier.id.startsWith("from")){
        deleteIdentifierButton.id = "removefromidentifierbutton-" + identifier.id.split("-")[1];
    } else {
        deleteIdentifierButton.id = "removetoidentifierbutton-" + identifier.id.split("-")[1];
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

async function execute(){
    let check = checkInput();

    if(check == true){
        startWaiting();
        try{
            let queryTemplates = createNodeQuery().concat(createEdgeQuery());
            let csv = JSON.parse(sessionStorage.getItem("rows"));
            let header = sessionStorage.getItem("headers");
    
            let queries = createQueries(queryTemplates, csv, header);
            let len = queries.length;
            for (i in queries){
              let info = `Running query n. ${parseInt(i) + 1} of ${len}`
              await runQuery(queries[i], info);
            }
            stopWaitingNextStep();
        } catch {
            stopWaiting();
        }
    }
    else {
        alert(check);
    }
}

function createNodeQuery(){
    let queries = [];

    let nodes = document.getElementsByClassName("nodeClass");
    for(let n = 0; n < nodes.length; n++){
        let node = nodes[n];
        let properties = node.getElementsByClassName("propertyClass");
        let query = "CREATE (n:" + node.getElementsByClassName("label")[0].value + ") ";
        for(let p = 0; p < properties.length; p++){
            let property = properties[p];
            let headers = property.getElementsByClassName("headers")[0];
            query += "SET n." + property.getElementsByClassName("property")[0].value + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }

        queries.push(query + " RETURN 1");
    }
    return queries;
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
        let fromQuery = "MATCH (f:" + fromNode.getElementsByClassName("label")[0].value + ") ";
        for(let p = 0; p < fromIdentifiers.length; p++){
            let identifier = fromIdentifiers[p];
            let headers = identifier.getElementsByClassName("headers")[0];
            if (p>0){
                fromQuery += "AND f."
            } else {
                fromQuery += "WHERE f."
            }
            fromQuery += identifier.getElementsByClassName("identifier")[0].value + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }
         
        let properties = edge.getElementsByClassName("propertyClass");
        let edgeQuery = "MERGE (f)-[e:" + edge.getElementsByClassName("label")[0].value + "]->(t) ";
        console.log("properties: " + properties.length);
        for(let p = 0; p < properties.length; p++){
            let property = properties[p];
            let headers = property.getElementsByClassName("headers")[0];
            edgeQuery += "SET e." + property.getElementsByClassName("edgeproperty")[0].value + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }

        let toIdenfiers = toNode.getElementsByClassName("identifierClass");
        let toQuery = "MATCH (t:" + toNode.getElementsByClassName("label")[0].value + ") ";
        for(let p = 0; p < toIdenfiers.length; p++){
            let identifier = toIdenfiers[p];
            let headers = identifier.getElementsByClassName("headers")[0];
            console.log("headers: " + headers.selectedIndex);
            if (p>0){
                toQuery += "AND t."
            } else {
                toQuery += "WHERE t."
            }
            toQuery += identifier.getElementsByClassName("identifier")[0].value + " = ~" + headers.options[headers.selectedIndex].value + "~ ";
        }

        let query = fromQuery + toQuery + edgeQuery;
        queries.push(query + " RETURN 1");
        console.log(query);
    }

    return queries;
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
    let table = element.parentElement.parentElement.parentElement.parentElement;
   
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
        let selectProperty = property.getElementsByClassName("headers")[1];
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
    let textFields = true;
    let inputs = document.getElementsByTagName("input");
    for (let i=0; i<inputs.length; i++){
        if (inputs[i].value === ""){
            inputs[i].style.border ="2px solid #EC5B62";
            textFields = false;
        } else {
            inputs[i].style.border ="";
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
    if (textFields && relIds){
        return true;
    } else {
        let error = "The following needs corrected:";
        if(!textFields){ error = error + "\n → Fill all the text fields"; }
        if(!relIds){ error = error + "\n → Identifier for the edges should use different columns"; }
        return error;
    }
}