class NodeSourceComponent extends HTMLElement {
  async connectedCallback() {
    await bootupComponent.call(this, {
      template: './app/node-source/node-source.html',
      style: './app/node-source/node-source.css',
    });

    this._setVariables();

    this.categories = this.getCategories();

    this.$select = this.shadowRoot.querySelector('.node_select');
    const allCategories = this.categories.concat(
      this.nodes
        .map((node) => node.category[0])
        .filter((category) => this.categories.indexOf(category) < 0)
    );
    fillOptions(this.$select, allCategories);

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

  _setVariables() {
    if (this.title) {
      this.shadowRoot.querySelector('.sourceNodeTitle').innerText = this.title;
    }
  }

  _checkInput() {
    if (this.$select.value === '') {
      this.$select.style.border = '2px solid #EC5B62';
    } else {
      this.$select.style.border = '';
    }
  }

  buildProperties() {
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

  getAllProperties() {
    const selectedCategory = this.nodes.filter(
      (node) => node.category[0] === this.$select.value
    );
    let newProperties = [];
    if (selectedCategory.length) {
      newProperties = selectedCategory[0].properties.map(
        (property) => property.propertyName
      );
    }
    const propertiesAPI = this.getPropertiesNode();
    return propertiesAPI.concat(
      newProperties.filter(
        (property) => property && propertiesAPI.indexOf(property) < 0
      )
    );
  }

  _addProperty(position) {
    const id = this.node.properties.length
      ? this.node.properties[this.node.properties.length - 1].id + 1
      : 0;
    const propertyContainer = this.shadowRoot.querySelector('.propertyParent');
    const options = this.getAllProperties();
    const newMapping = document.createElement('mapping-row-app');
    newMapping.addEventListener('onDelete', () => {
      newMapping.parentNode.removeChild(newMapping);
      const indexProp = this.node.properties.findIndex(
        (property) => property.id === id
      );
      this.node.properties.splice(indexProp, 1);
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
      id,
      indexColumn: position !== undefined ? position : 0,
      propertyName: '',
    };
    newMapping.property = property;
    propertyContainer.append(newMapping);
    this.node.properties.push(property);
  }
}

customElements.define('node-source-app', NodeSourceComponent);
