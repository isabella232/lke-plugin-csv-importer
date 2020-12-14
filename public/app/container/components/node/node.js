class NodeComponent extends HTMLElement {
  async connectedCallback() {
    await bootupComponent.call(this, {
      template: './app/container/components/node/node.html',
      style: './app/container/components/node/node.css',
    });

    this.categories = this.getCategories();
    this.$toggleSelect = this.shadowRoot.querySelector('toggle-select-app');
    this.$toggleSelect.options = this.categories;
    this.$toggleSelect.label = 'Category';
    this.$toggleSelect.placeholder = 'Select a category';
    this.$toggleSelect.toggleLabel = 'Create a new category';

    this.selectedCategory = null;
    this.$toggleSelect.addEventListener(
      'onSelect',
      this.buildProperties.bind(this)
    );
    this.$toggleSelect.addEventListener(
      'onChange',
      (event) => (this.node.category[0] = event.detail)
    );

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

  buildProperties(event) {
    this.node.category[0] = event.detail;
    this.node.properties = [];
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
      this._addProperty(h, event.detail === '');
    }
  }

  _addProperty(position, cannotSelect) {
    const id = this.node.properties.length
      ? this.node.properties[this.node.properties.length - 1].id + 1
      : 0;
    const propertyContainer = this.shadowRoot.querySelector('.container');
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
    newMapping.options = this.getProperties();
    newMapping.cannotSelect = cannotSelect;
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

customElements.define('node-app', NodeComponent);
