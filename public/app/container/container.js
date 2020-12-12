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
    this.$nodeButton.addEventListener('click', this._addNode.bind(this));
    this.nodeSchema = await this.getSchema('node');
    this.edgeSchema = await this.getSchema('edge');
    console.log(this.nodeName);
  }

  async _addNode() {
    const newNode = document.createElement('node-app');
    newNode.schema = this.nodeSchema;
    this.$nodesContainer.append(newNode);
    // let nodes = document.getElementById('nodes');
    // let nc = parseInt(nodes.getAttribute('nodecounter')) + 1;
    // nodes.setAttribute('nodecounter', nc);
    // let node = document.createElement('div');
    // node.className = 'nodeClass';
    // node.setAttribute('propertycounter', 0);
    // node.id = 'node-' + nc;
    // node.innerHTML = nodeHTML;
    // let button = node.getElementsByClassName('propertybutton')[0];
    // button.id = 'button-' + nc;
    // let select = node.getElementsByClassName('node_select')[0];
    // select.id = 'select-' + nc;
    // fillOptionsNode(select, nodeCategories);
    // let deleteButton = node.getElementsByClassName('removenodebutton')[0];
    // deleteButton.id = 'deletenodebutton-' + nc;
    // nodeCounter++;
    // document.getElementById('nodes').appendChild(node);
    // node.insertAdjacentElement('afterend', document.createElement('br'));
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
