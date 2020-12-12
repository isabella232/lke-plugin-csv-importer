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
