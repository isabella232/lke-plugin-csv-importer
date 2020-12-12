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
