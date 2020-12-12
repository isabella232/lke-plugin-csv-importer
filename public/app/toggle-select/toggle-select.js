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
    this.$select.addEventListener('change', this._onSelect.bind(this));
    console.log(this.options);
    this._fillOptions();
  }

  _onSelect() {
    if (this.$select.value === this.createOption) {
      this.$select.remove();
      const input = this.shadowRoot.querySelectorAll('.label')[0];
      input.type = 'text';
      properties = [];
    } else if (this.$categorySelect.value) {
      this.dispatchEvent(
        new CustomEvent('onSelect', {
          selectedOption: this.$categorySelect.value,
        })
      );
    }
  }

  /**
   * Provided a select element and a list of string it builds the html options
   */
  _fillOptions() {
    console.log(this.$select, this.$select.lastChild);
    this.options.forEach((option) => {
      var opt = document.createElement('option');
      opt.value = option;
      opt.innerHTML = option;
      this.$select.insertBefore(opt, this.$select.lastChild);
    });
  }
}

customElements.define('toggle-select-app', ToggleSelectComponent);
