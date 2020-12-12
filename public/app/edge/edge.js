class NodeComponent extends HTMLElement {
  async connectedCallback() {
    const _template = document.createElement('template');
    const _style = document.createElement('style');
    await importFile(_template, './app/node/node.html');
    await importFile(_style, './app/node/node.css');
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(_style);
    this.shadowRoot.appendChild(_template.content.cloneNode(true));
    this.categories = this.getCategories();
    this.$toggleSelect = this.shadowRoot.querySelector('toggle-select-app');
    this.$toggleSelect.options = this.categories;

    this.selectedCategory = null;
    this.$toggleSelect.addEventListener('onSelect', (event) => {
      this.node.category[0] = event.detail;
      this.buildProperties();
    });

    this.$deleteNodeButton = this.shadowRoot.querySelector('.removenodebutton');
    this.$deleteNodeButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('onDelete'));
    });
    this.$addPropertyButton = this.shadowRoot.querySelector('.propertybutton');
    this.$addPropertyButton.addEventListener('click', () => {
      this._addProperty();
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

  /**
   * For one category of node or edge get all its properties
   */
  getProperties() {
    const selectedCategory = this.schema.find(
      (category) =>
        category.access === 'write' &&
        category.itemType === this.node.category[0]
    );
    if (selectedCategory) {
      return selectedCategory.properties.map(
        (property) => property.propertyKey
      );
    }
    return [];
  }

  buildProperties() {
    // Delete the div in case it was already created before
    const existingProperties = this.shadowRoot.querySelectorAll(
      'mapping-row-app'
    );
    existingProperties.forEach((existingProperty) =>
      existingProperty.parentNode.removeChild(existingProperty)
    );

    headers = sessionStorage.getItem('headers');
    this.withHeaders = sessionStorage.getItem('withHeaders');
    this.headers = headers.split(',');
    this.$addPropertyButton.className = this.$addPropertyButton.className.replace(
      'hidden',
      ''
    );
    for (let h = 0; h < this.headers.length; h++) {
      this._addProperty(h);
    }
  }

  _addProperty(position) {
    const propertyContainer = this.shadowRoot.querySelector('.container');
    const newMapping = document.createElement('mapping-row-app');
    newMapping.addEventListener('onDelete', () => {
      newMapping.parentNode.removeChild(newMapping);
    });
    const columns = this.withHeaders
      ? this.headers
      : this.headers.map((header, index) => {
          return `Column ${index + 1}`;
        });
    if (position !== undefined) {
      newMapping.position = position;
    }
    newMapping.columns = columns;
    newMapping.options = this.getProperties();
    const property = {
      indexColumn: position !== undefined ? position : 0,
      propertyName: '',
    };
    newMapping.property = property;
    propertyContainer.append(newMapping);
    this.node.properties.push(property);
  }
}

customElements.define('node-app', NodeComponent);
