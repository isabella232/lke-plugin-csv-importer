class MappingRowComponent extends HTMLElement {
  async connectedCallback() {
    const _template = document.createElement('template');
    const _style = document.createElement('style');
    await importFile(_template, './app/mapping-row/mapping-row.html');
    await importFile(_style, './app/mapping-row/mapping-row.css');
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(_style);
    this.shadowRoot.appendChild(_template.content.cloneNode(true));

    const toggleSelect = this.shadowRoot.querySelector('toggle-select-app');
    toggleSelect.options = this.options;
    toggleSelect.matching = this.columns[this.position];
    toggleSelect.value;
    this.$button = this.shadowRoot.querySelector('button');
    this.$button.addEventListener('click', this._onDelete.bind(this));
    this.$select = this.shadowRoot.querySelector('.headers');
    this.$select.addEventListener('onchange', () => {
      this.property.indexColumn = select.selectedIndex;
    });
    toggleSelect.addEventListener('onSelect', (event) => {
      this.property.propertyName = event.detail;
    });
    bus.register('checkInputs', this._checkInput.bind(this));

    this._fillOptions();
  }

  _checkInput() {
    if (this.$select.value === '') {
      this.$select.style.border = '2px solid #EC5B62';
    }
  }

  /**
   * Provided a select element and a list of string it builds the html options
   */
  _fillOptions() {
    fillOptions(this.$select, this.columns);
    if (this.position) {
      this.$select.selectedIndex = this.position;
    }
  }

  _onDelete() {
    this.dispatchEvent(
      new CustomEvent('onDelete', {
        detail: this.position,
      })
    );
  }
}

customElements.define('mapping-row-app', MappingRowComponent);
