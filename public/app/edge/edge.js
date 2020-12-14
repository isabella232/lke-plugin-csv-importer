class EdgeComponent extends HTMLElement {
  async connectedCallback() {
    await bootupComponent.call(this, {
      template: './app/edge/edge.html',
      style: './app/edge/edge.css',
    });

    this._setNodeVariables();

    this.types = this.getTypes();

    this.$toggleSelect = this.shadowRoot.querySelector('toggle-select-app');
    this.$toggleSelect.options = this.types;
    this.$toggleSelect.label = 'Type';
    this.$toggleSelect.placeholder = 'Select a type';
    this.$toggleSelect.inputPlaceholder = 'Edge type';
    this.$toggleSelect.toggleLabel = 'Create a new type';

    this.$toggleSelect.addEventListener('onSelect', (event) => {
      this.edge.edge.category[0] = event.detail;
    });
    this.$toggleSelect.addEventListener('onChange', (event) => {
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

    headers = sessionStorage.getItem('headers');
    this.withHeaders = sessionStorage.getItem('withHeaders');
    this.headers = headers.split(',');
  }

  _setNodeVariables() {
    this.$nodeMappings = this.shadowRoot.querySelectorAll('node-source-app');

    this.$nodeMappings[0].schema = this.nodeSchema;
    this.$nodeMappings[0].node = this.edge.from;
    this.$nodeMappings[0].title = 'SOURCE NODE';
    this.$nodeMappings[0].nodes = this.nodes;

    this.$nodeMappings[1].schema = this.nodeSchema;
    this.$nodeMappings[1].node = this.edge.to;
    this.$nodeMappings[1].title = 'DESTINATION NODE';
    this.$nodeMappings[1].nodes = this.nodes;
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
    const id = this.edge.edge.properties.length
      ? this.edge.edge.properties[this.edge.edge.properties.length - 1].id + 1
      : 0;
    const propertyContainer = this.shadowRoot.querySelector('.propertyParent');
    const options = this.getPropertiesEdge(this.edge.edge.category[0]);
    const newMapping = document.createElement('mapping-row-app');
    newMapping.addEventListener('onDelete', () => {
      newMapping.parentNode.removeChild(newMapping);
      const indexProp = this.edge.edge.properties.findIndex(
        (property) => property.id === id
      );
      this.edge.edge.properties.splice(indexProp, 1);
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
      id,
      indexColumn: 0,
      propertyName: '',
    };
    newMapping.property = property;
    propertyContainer.append(newMapping);
    this.edge.edge.properties.push(property);
  }
}

customElements.define('edge-app', EdgeComponent);
