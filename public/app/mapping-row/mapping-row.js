class MappingRowComponent extends HTMLElement {
  async connectedCallback() {
    await bootupComponent.call(this, {
      template: './app/mapping-row/mapping-row.html',
      style: './app/mapping-row/mapping-row.css',
    });

    const toggleSelect = this.shadowRoot.querySelector('toggle-select-app');
    toggleSelect.options = this.options;
    toggleSelect.matching = this.columns[this.position];
    toggleSelect.cannotCreate = this.cannotCreate;
    toggleSelect.hideLabel = true;
    toggleSelect.placeholder = 'Select a property';
    toggleSelect.toggleLabel = 'Create new property';
    toggleSelect.inputPlaceholder = 'New property name';
    toggleSelect.cannotSelect = this.cannotSelect;
    this.$button = this.shadowRoot.querySelector('button');
    this.$button.addEventListener('click', this._onDelete.bind(this));
    this.$select = this.shadowRoot.querySelector('.headers');
    this.$select.addEventListener('change', () => {
      this.property.indexColumn = this.$select.selectedIndex;
    });
    toggleSelect.addEventListener('onSelect', (event) => {
      this.property.propertyName = event.detail;
    });
    toggleSelect.addEventListener('onChange', (event) => {
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
