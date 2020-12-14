function importFile(_template, url) {
  return new Promise((resolve) => {
    const req = new XMLHttpRequest();

    req.onload = function () {
      _template.innerHTML = req.response
        .trim()
        .replace(/[\n\r]+/g, '')
        .replace(/> +</g, '><');
      resolve();
    };

    req.open('get', url, true);
    req.send();
  });
}

function fillOptions(select, options) {
  options.forEach((option) => {
    var opt = document.createElement('option');
    opt.value = option;
    opt.innerHTML = option;
    select.append(opt);
  });
}

function fillOptionsBefore(select, options) {
  options.forEach((option) => {
    var opt = document.createElement('option');
    opt.value = option;
    opt.innerHTML = option;
    select.insertBefore(opt, select.lastChild);
  });
}

class EventBus {
  constructor() {
    this._bus = document.createElement('div');
  }

  register(event, callback) {
    this._bus.addEventListener(event, callback);
  }

  remove(event, callback) {
    this._bus.removeEventListener(event, callback);
  }
  fire(event, detail = {}) {
    this._bus.dispatchEvent(new CustomEvent(event, { detail }));
  }
}
const bus = new EventBus();

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
        const message =
          typeof xmlHttp.response === 'string'
            ? xmlHttp.response
            : JSON.parse(xmlHttp.response).body.error;
        // If failed
        reject({
          status: xmlHttp.status,
          statusText: xmlHttp.statusText,
          body: message,
        });
      }
    };
    xmlHttp.open(verb, url);
    xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xmlHttp.send(JSON.stringify(body));
  });
}
