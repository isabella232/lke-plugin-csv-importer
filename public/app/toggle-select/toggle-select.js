class ToggleSelectComponent extends HTMLElement {
  async connectedCallback() {
    const _template = document.createElement('template');
    const _style = document.createElement('style');
    await importFile(_template, './app/toggle-select/toggle-select.html');
    await importFile(_style, './app/toggle-select/toggle-select.css');
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(_style);
    this.shadowRoot.appendChild(_template.content.cloneNode(true));
    this.$select = this.shadowRoot.querySelector('.select');
    this.$input = this.shadowRoot.querySelectorAll('.label')[0];
    this.$select.addEventListener('change', this._onSelect.bind(this));

    this._setVariables();
    this._fillOptions();
    bus.register('checkInputs', this._checkInput.bind(this));
  }

  _setVariables() {
    if (this.label) {
      this.shadowRoot.querySelector('label').innerText = this.label;
    }
    if (this.placeholder) {
      this.$select.firstChild.textContent = this.placeholder;
    }
    if (this.toggleLabel) {
      this.$select.lastChild.textContent = this.toggleLabel;
    }
    if (this.cannotCreate) {
      this.$select.lastChild.remove();
    }
  }

  _checkInput() {
    if (this.$input.type === 'text' && this.$input.value === '') {
      this.$input.style.border = '2px solid #EC5B62';
    } else if (this.$select.value === '') {
      this.$select.style.border = '2px solid #EC5B62';
    } else {
      this.$input.style.border = '';
      this.$select.style.border = '';
    }
  }

  _onSelect() {
    if (this.$select.value === '##toggle##') {
      this.$select.remove();
      this.$input.type = 'text';
      properties = [];
    } else if (this.$select.value) {
      this.$select.style.border = '';
      this.$input.style.border = '';
      this.dispatchEvent(
        new CustomEvent('onSelect', {
          detail: this.$select.value,
        })
      );
    }
  }

  /**
   * Provided a select element and a list of string it builds the html options
   */
  _fillOptions() {
    fillOptionsBefore(this.$select, this.options);
    console.log('matching', this.matching);
    if (this.matching) {
      const indexColumn = this.options.findIndex(
        (option) => option === this.matching
      );
      console.log(indexColumn);
      if (indexColumn !== -1) {
        this.$select.selectedIndex = indexColumn + 1;
        this.dispatchEvent(
          new CustomEvent('onSelect', {
            detail: this.matching,
          })
        );
      }
    }
  }
}

customElements.define('toggle-select-app', ToggleSelectComponent);
