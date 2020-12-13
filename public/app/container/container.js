class ContainerComponent extends HTMLElement {
  async connectedCallback() {
    const _template = document.createElement('template');
    const _style = document.createElement('style');
    await importFile(_template, './app/container/container.html');
    await importFile(_style, './app/container/container.css');
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(_style);
    this.shadowRoot.appendChild(_template.content.cloneNode(true));
    this.$nodeButton = this.shadowRoot.querySelector('#nodebutton');
    this.$nodesContainer = this.shadowRoot.querySelector('#nodes');
    this.$edgesContainer = this.shadowRoot.querySelector('#edges');
    this.$nodeButton.addEventListener('click', this._addNode.bind(this));

    this.$edgeButton = this.shadowRoot.querySelector('#edgebutton');
    this.$edgeButton.addEventListener('click', this._addEdge.bind(this));

    this.$runButton = this.shadowRoot.querySelector('#runbutton');
    this.$runButton.addEventListener('click', this._run.bind(this));
    this.form = {
      nodes: [],
      edges: [],
    };
    this.nodeSchema = await this.getSchema('node');
    this.edgeSchema = await this.getSchema('edge');
  }

  _run() {
    console.log(this.form);
    const errors = this._generateErrors();
    bus.fire('checkInputs');
    if (errors.length) {
      alert(`Error:\n- ${errors.join('\n -')}`);
    } else if (this._checkData()) {
      console.log('all good');
    }
  }

  _generateErrors() {
    const errors = [];
    if (!this.form.nodes.length && !this.form.edges.length) {
      errors.push('Please map at least 1 node or 1 edge');
    }
    if (this.form.nodes.some((node) => !node.properties.length)) {
      errors.push('You have nodes without properties');
    }
    if (this._checkSameIdentifiers()) {
      errors.push(
        'Edge source and destination cannot have the same identifiers'
      );
    }
    return errors;
  }

  _checkData() {
    console.log(
      this.form.nodes.every(this._checkValidNode) &&
        this.form.edges.every((edge) => {
          return (
            this._checkValidNode(edge.from) &&
            this._checkValidNode(edge.to) &&
            this._checkValidNode(edge.edge) &&
            edge.from.properties
              .map((property) => property.indexColumn)
              .join('') !==
              edge.to.properties
                .map((property) => property.indexColumn)
                .join('')
          );
        })
    );
    return (
      this.form.nodes.every(this._checkValidNode) &&
      this.form.edges.every((edge) => {
        return (
          this._checkValidNode(edge.from) &&
          this._checkValidNode(edge.to) &&
          this._checkValidNode(edge.edge) &&
          edge.from.properties
            .map((property) => property.indexColumn)
            .join('') !==
            edge.to.properties.map((property) => property.indexColumn).join('')
        );
      })
    );
  }

  _checkSameIdentifiers() {
    return this.form.edges.some((edge) => {
      return (
        edge.from.properties.length &&
        edge.to.properties.length &&
        edge.from.properties
          .map((property) => property.indexColumn)
          .join('') ===
          edge.to.properties.map((property) => property.indexColumn).join('')
      );
    });
  }

  _checkValidNode(node) {
    console.log(
      node,
      !!node.category[0] &&
        node.properties.every(
          (property) =>
            property.indexColumn !== undefined && property.propertyName
        )
    );
    return (
      !!node.category[0] &&
      node.properties.every(
        (property) =>
          property.indexColumn !== undefined && property.propertyName
      )
    );
  }

  async _addNode() {
    const id = this.form.nodes.length
      ? this.form.nodes[this.form.nodes.length - 1].id + 1
      : 0;
    const node = {
      id,
      category: [''],
      properties: [],
    };
    this.form.nodes.push(node);
    const newNode = document.createElement('node-app');
    newNode.schema = this.nodeSchema;
    newNode.node = node;
    newNode.addEventListener('onDelete', () => {
      newNode.remove();
      const indexNode = this.form.nodes.findIndex((node) => node.id === id);
      this.form.nodes.splice(indexNode, 1);
    });
    this.$nodesContainer.append(newNode);
  }

  async _addEdge() {
    const id = this.form.edges.length
      ? this.form.edges[this.form.edges.length - 1].id + 1
      : 0;
    const edge = {
      id,
      from: {
        category: [''],
        properties: [],
      },
      to: {
        category: [''],
        properties: [],
      },
      edge: {
        category: [''],
        properties: [],
      },
    };
    this.form.edges.push(edge);
    const newEdge = document.createElement('edge-app');
    newEdge.edgeSchema = this.edgeSchema;
    newEdge.nodeSchema = this.nodeSchema;
    newEdge.edge = edge;
    newEdge.nodes = this.form.nodes;
    newEdge.addEventListener('onDelete', () => {
      newEdge.remove();
      const indexEdge = this.form.edges.findIndex((edge) => edge.id === id);
      this.form.edges.splice(indexEdge, 1);
    });
    this.$edgesContainer.append(newEdge);
  }

  /**
   * Get all categories of nodes or edges
   */
  async getCategories(entityType) {
    const schema = entityType === 'edge' ? this.edgeSchema : this.nodeSchema;
    return schema
      .filter((category) => category.access === 'write')
      .map((category) => category.itemType);
  }

  /**
   * make a request to get the schema for node or edge
   * @returns {Promise<void>}
   */
  async getSchema(entityType) {
    try {
      const result = await makeRequest(
        'GET',
        `api/getSchema?sourceKey=${sessionStorage.getItem(
          'sourceKey'
        )}&entityType=${entityType}`,
        null
      );
      return JSON.parse(result.response).body.results;
    } catch (e) {
      handleError(e);
    }
  }
}

customElements.define('container-app', ContainerComponent);
