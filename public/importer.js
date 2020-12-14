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
// Keep schema of nodes in the state to avoid multiple requests
let schemaNode;
// Keep schema of edges in the state to avoid multiple requests
let schemaEdge;

const propertyHTML =
  '<label for="headers"></label><select class="headers"></select><label for="property"> → </label><input type="hidden" class="property" placeholder="Property name"><select onchange="createNewProperty(this.id)" class="property_select label"><option value=\'\' disabled selected>Select a property</option><option value=\'##property##\' ">Create new property</option></select><button class="removepropertybutton removeButton" onclick="removeProperty(this.id)"/>';
const edgeHTML =
  '<div><div class="labelContainer"><div><label for="label" class="titleLabel">Label </label>\n<input type="hidden" class="label" placeholder="Edge type"><select onchange="onEdgeSelected(this.id)" class="edge_select label"><option value=\'\' disabled selected>Select a type</option><option value=\'##type##\' ">Create new type</option></select></div><button class="removeedgebutton dangerButton" onclick="removeEdge(this.id)">Remove edge</button></div><div class="propertyContainer"><div>Properties</div><button class="edgepropertybutton quietButton" onclick="edgePropertyButton(this.id)">Add property</button></div></div>';
const edgeTableHTML =
  '<div class="edgeClass"><div class="sourceNodeContainer"><div class="sourceNodeTitle">SOURCE NODE</div><div class="fromname"></div></div><div class="edgeContainer"><div class="edgeTitle">EDGE</div><div class="edgename"></div></div><div class="destinationNodeContainer"><div class="destinationNodeTitle">DESTINATION NODE</div><div class="toname"></div></div></div>';
const edgePropertyHTML =
  '<label for="headers"></label><select class="headers"></select><label for="property"> → </label><input type="hidden" class="edgeproperty" placeholder="Property name"><select onchange="createNewPropertyEdge(this.id)" class="property_select label"><option value=\'\' disabled selected>Select a property</option><option value=\'##property##\' ">Create new property</option></select><button class="removeedgepropertybutton removeButton" onclick="removeEdgeProperty(this.id)"/>';
const identifierHTML =
  '<label for="property"></label><select class="headers"></select><label for="property"> → </label><select class="property_select label"><option value=\'\' disabled selected>Select a property</option></select><button class="removeidentifierbutton removeButton" onclick="removeIdentifier(this.id)"/>';
const nextstepHTML =
  '<p class="popupTitle">The file has been successfully imported</p><a href=\'\' class="quietButton">Go to Linkurious</a><button class="newcsvbutton primaryButton" onclick="newCSVButton()">Upload another file</button>';

const basePathRegex = /(?<basePath>.*)\/plugins\/(?<pluginPath>.*?)(\/|$)/;
const basePath =
  basePathRegex.exec(window.location.pathname)?.groups.basePath || '';
const pluginPath = basePathRegex.exec(window.location.pathname).groups
  .pluginPath;
const serverURL = new URL(basePath, window.location.origin).href;

function showFile() {
  const input = document.getElementById('importFile').files[0];
  const fileName = document.getElementById('fileName');
  fileName.innerText = input.name;
}

function readFile() {
  const params = new URLSearchParams(window.location.search);
  sessionStorage.setItem('sourceKey', params.get('sourceKey'));

  input = document.getElementById('importFile').files[0];
  if (!input || !input.name.endsWith('.csv')) {
    document.getElementById('fileError').innerHTML = 'Select a valid file ';
  } else {
    startWaiting();
    let fr = new FileReader();
    fr.onload = function (event) {
      stopWaiting();
      rows = event.target.result.split(/\r?\n|\r/);
      withHeaders = document.getElementById('withHeaders').checked;
      if (withHeaders) {
        headers = rows.shift();
      } else {
        headers = rows[0].split(',').length;
      }
      rows = JSON.stringify(rows);
      sessionStorage.setItem('rows', rows);
      sessionStorage.setItem('headers', headers);
      sessionStorage.setItem('withHeaders', withHeaders);
      window.location = serverURL + 'plugins/' + pluginPath + '/mapping.html';
    };
    fr.readAsText(input);
  }
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

function startWaiting() {
  let overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML =
    '<div class="opacity"></div><div class="highlight"></div>';
  document.body.appendChild(overlay);
  spinner.spin(document.getElementsByClassName('highlight')[0]);
}

function startLoading() {
  let overlay = document.createElement('div');
  overlay.className = 'overlay';
  overlay.innerHTML =
    '<div class="opacity"></div><div class="highlight"></div>';
  document.body.appendChild(overlay);
  let loadingBar = new ldBar(document.getElementsByClassName('highlight')[0]);
  loadingBar.set(60);
}

function stopWaiting() {
  let overlay = document.getElementsByClassName('overlay')[0];
  spinner.stop();
  overlay.parentElement.removeChild(overlay);
}

function stopWaitingNextStep(feedback) {
  let highlight = document.getElementsByClassName('highlight')[0];
  spinner.stop();
  let nextStep = document.createElement('div');
  nextStep.className = 'nextstep';
  nextStep.innerHTML = nextstepHTML;
  if (feedback.warningEdges || feedback.warningNodes) {
    const title = nextStep.getElementsByTagName('p')[0];
    title.innerText = 'The file has been partly imported';
  }
  highlight.appendChild(nextStep);
  const nextStepInserted = document.getElementsByClassName('nextstep')[0];
  if (feedback.warningEdges) {
    addParagraphToPopUp(nextStepInserted, feedback.warningEdges, true);
  }
  if (feedback.messageEdges) {
    addParagraphToPopUp(nextStepInserted, feedback.messageEdges, false);
  }
  if (feedback.warningNodes) {
    addParagraphToPopUp(nextStepInserted, feedback.warningNodes, true);
  }
  if (feedback.messageNodes) {
    addParagraphToPopUp(nextStepInserted, feedback.messageNodes, false);
  }
}

function addParagraphToPopUp(nextStep, message, warning) {
  const elem = document.createElement('p');
  elem.className = 'infoPopup';
  if (warning) {
    elem.className += ' warningPopup';
  }
  elem.innerText = message;
  insertAfter(elem, nextStep.firstChild);
}

function insertAfter(newElement, referenceElement) {
  referenceElement.parentNode.insertBefore(
    newElement,
    referenceElement.nextSibling
  );
}

function newCSVButton() {
  window.location =
    serverURL +
    'plugins/' +
    pluginPath +
    '/index.html?sourceKey=' +
    sessionStorage.getItem('sourceKey');
}
