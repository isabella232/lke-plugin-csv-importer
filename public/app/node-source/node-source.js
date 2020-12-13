class NodeSourceComponent extends HTMLElement {
  async connectedCallback() {
    const _template = document.createElement('template');
    const _style = document.createElement('style');
    await importFile(_template, './app/node-source/node-source.html');
    await importFile(_style, './app/node-source/node-source.css');
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(_style);
    this.shadowRoot.appendChild(_template.content.cloneNode(true));

    this.categories = this.getCategories();

    this.$select = this.shadowRoot.querySelector('.node_select');
    fillOptions(this.$select, this.categories);

    this.$select.addEventListener('change', this.buildProperties.bind(this));

    this.$identifiersButton = this.shadowRoot.querySelector(
      '.identifierbutton'
    );
    this.$identifiersButton.addEventListener(
      'click',
      this._addProperty.bind(this)
    );

    headers = sessionStorage.getItem('headers');
    this.withHeaders = sessionStorage.getItem('withHeaders');
    this.headers = headers.split(',');

    bus.register('checkInputs', this._checkInput.bind(this));
  }

  _checkInput() {
    if (this.$select.value === '') {
      this.$select.style.border = '2px solid #EC5B62';
    } else {
      this.$select.style.border = '';
    }
  }

  buildProperties() {
    console.log(this.$select, this.$select.value);
    this.$select.style.border = '';
    this.node.category[0] = this.$select.value;
    this.node.properties = [];
    // Delete the div in case it was already created before
    const existingProperties = this.shadowRoot.querySelectorAll(
      'mapping-row-app'
    );
    existingProperties.forEach((existingProperty) =>
      existingProperty.parentNode.removeChild(existingProperty)
    );
    this.$identifiersButton.className = this.$identifiersButton.className.replace(
      'hidden',
      ''
    );
    this._addProperty(0);
  }

  /**
   * Get all categories of nodes or edges
   */
  getCategories() {
    console.log(this.schema);
    return this.schema
      .filter((category) => category.access === 'write')
      .map((category) => category.itemType);
  }

  /**
   * For one category of node or edge get all its properties
   */
  getPropertiesEdge(edgeType) {
    const selectedCategory = this.edgeSchema.find(
      (category) =>
        category.access === 'write' && category.itemType === edgeType
    );
    if (selectedCategory) {
      return selectedCategory.properties.map(
        (property) => property.propertyKey
      );
    }
    return [];
  }

  /**
   * For one category of node or edge get all its properties
   */
  getPropertiesNode() {
    console.log(this.node.category[0], this.node);
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

  _addProperty(position) {
    const propertyContainer = this.shadowRoot.querySelector('.propertyParent');
    const options = this.getPropertiesNode();
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
    newMapping.options = options;
    newMapping.cannotCreate = true;
    const property = {
      indexColumn: position !== undefined ? position : 0,
      propertyName: '',
    };
    newMapping.property = property;
    propertyContainer.append(newMapping);
    this.node.properties.push(property);
  }
}

customElements.define('node-source-app', NodeSourceComponent);
