class NodeComponent extends HTMLElement {
  async connectedCallback() {
    const _template = document.createElement('template');
    const _style = document.createElement('style');
    await importFile(_template, './app/node/node.html');
    await importFile(_style, './app/node/node.css');
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(_style);
    this.shadowRoot.appendChild(_template.content.cloneNode(true));
    console.log(this.schema);
    this.categories = this.getCategories();
    this.$toggleSelect = this.shadowRoot.querySelector('toggle-select-app');
    console.log(this.$toggleSelect);
    this.$toggleSelect.options = this.categories;

    this.selectedOption = null;
    toggleSelect.addEventListener('onSelect', (event) => {
      this.selectedOption = event.selectedOption;
      this.buildProperties();
    });
  }

  /**
   * Get all categories of nodes or edges
   */
  getCategories() {
    return this.schema
      .filter((category) => category.access === 'write')
      .map((category) => category.itemType);
  }

  buildProperties() {
    // Delete the div in case it was already created before
    const existingProperties = this.shadowRoot.querySelectorAll(
      '.propertyClass'
    );
    for (var i = existingProperties.length - 1; i >= 0; i--) {
      existingProperties[0].parentNode.removeChild(existingProperties[0]);
    }

    headers = sessionStorage.getItem('headers');
    withHeaders = sessionStorage.getItem('withHeaders');
    headers = headers.split(',');
    for (let h = 0; h < headers.length; h++) {
      let pc = parseInt(node.getAttribute('propertycounter')) + 1;
      node.setAttribute('propertycounter', pc);

      let property = document.createElement('div');
      property.className = 'propertyClass';
      property.id = node.id + '.' + pc;
      property.innerHTML = propertyHTML;

      let deletePropertyButton = property.getElementsByClassName(
        'removepropertybutton'
      )[0];
      deletePropertyButton.id =
        'removepropertybutton-' + property.id.split('-')[1];
      let select = property.getElementsByClassName('headers')[0];
      if (withHeaders == 'true') {
        for (let i in headers) {
          let opt = headers[i];
          let el = document.createElement('option');
          el.textContent = opt;
          el.value = i;
          select.appendChild(el);
        }
      } else {
        for (let i = 0; i < headers; i++) {
          let opt = 'Column ' + (i + 1);
          let el = document.createElement('option');
          el.textContent = opt;
          el.value = i;
          select.appendChild(el);
        }
      }
      select.selectedIndex = h;
      let selectProperty = property.getElementsByClassName(
        'property_select'
      )[0];
      selectProperty.id = 'select-' + property.id.split('-')[1];
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
}

customElements.define('node-app', NodeComponent);
