class EdgeComponent extends HTMLElement {
  async connectedCallback() {
    const _template = document.createElement('template');
    const _style = document.createElement('style');
    await importFile(_template, './app/edge/edge.html');
    await importFile(_style, './app/edge/edge.css');
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(_style);
    this.shadowRoot.appendChild(_template.content.cloneNode(true));

    this.types = this.getTypes();

    this.$toggleSelect = this.shadowRoot.querySelector('toggle-select-app');
    this.$toggleSelect.options = this.types;

    this.$toggleSelect.addEventListener('onSelect', (event) => {
      this.edge.edge.category[0] = event.detail;
    });

    this.$deleteEdgeButton = this.shadowRoot.querySelector('.removeedgebutton');
    this.$deleteEdgeButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('onDelete'));
    });
    this.$addPropertyButton = this.shadowRoot.querySelector(
      '.edgepropertybutton'
    );
    this.$addPropertyButton.addEventListener('click', () => {
      this._addProperty();
    });

    this.$nodeMappings = this.shadowRoot.querySelectorAll('node-source-app');
    console.log(this.$nodeMappings[0], this.nodeSchema);
    this.$nodeMappings[0].schema = this.nodeSchema;
    this.$nodeMappings[0].node = this.edge.from;
    this.$nodeMappings[1].schema = this.nodeSchema;
    this.$nodeMappings[1].node = this.edge.to;

    headers = sessionStorage.getItem('headers');
    this.withHeaders = sessionStorage.getItem('withHeaders');
    this.headers = headers.split(',');
  }

  /**
   * Get all categories of nodes or edges
   */
  getTypes() {
    return this.edgeSchema
      .filter((type) => type.access === 'write')
      .map((type) => type.itemType);
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
  getPropertiesNode(nodeCategory) {
    const selectedCategory = this.nodeSchema.find(
      (category) =>
        category.access === 'write' && category.itemType === nodeCategory
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

  _addProperty() {
    const propertyContainer = this.shadowRoot.querySelector('.propertyParent');
    const options = this.getPropertiesEdge(this.edge.edge.category[0]);
    const newMapping = document.createElement('mapping-row-app');
    newMapping.addEventListener('onDelete', () => {
      newMapping.parentNode.removeChild(newMapping);
    });
    const columns = this.withHeaders
      ? this.headers
      : this.headers.map((header, index) => {
          return `Column ${index + 1}`;
        });
    newMapping.position = 0;
    newMapping.columns = columns;
    newMapping.options = options;
    const property = {
      indexColumn: 0,
      propertyName: '',
    };
    newMapping.property = property;
    propertyContainer.append(newMapping);
    this.edge.edge.properties.push(property);
  }
}

customElements.define('edge-app', EdgeComponent);
