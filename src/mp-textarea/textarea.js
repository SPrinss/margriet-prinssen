import { Properties } from 'html-element-property-mixins';
import { StringConverter, NumberConverter, BooleanConverter } from 'html-element-property-mixins/src/utils/attribute-converters/index.js';
import { html, render as litRender} from 'lit-html/lib/shady-render.js';
export { html } from 'lit-html';

export class HTMLTextAreaElement extends Properties(HTMLElement) {
  
  static get properties() {

    return {

      accessKey: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      autocomplete: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      autofocus: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      cols: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      dirname: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConvertepr: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      disabled: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      maxlength: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      minlength: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },

      placeholder: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      readonly: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      required: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: BooleanConverter.fromAttribute,
        toAttributeConverter: BooleanConverter.toAttribute,
      },

      rows: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      spellcheck: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      },

      tabIndex: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: NumberConverter.fromAttribute,
        toAttributeConverter: NumberConverter.toAttribute,
      },


      value: {
        observe: true,
        DOM: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
        changedHandler: '_handleValu'
      },      

      wrap: {
        observe: true,
        DOM: true,
        reflect: true,
        fromAttributeConverter: StringConverter.fromAttribute,
        toAttributeConverter: StringConverter.toAttribute,
      }

    };

  }

  constructor() {
    super();

    const $element = document.createElement('textarea');
    this.accessKey = $element.accessKey;
    this.autocomplete = $element.autocomplete;
    this.autofocus = $element.autofocus;
    this.cols = $element.cols;
    this.dirname = $element.dirname;
    this.disabled = $element.disabled;
    this.maxlength = $element.maxlength;
    this.minlength = $element.minlength;
    this.placeholder = $element.placeholder;
    this.readonly = $element.readonly;
    this.required = $element.required;
    this.rows = $element.rows;
    this.spellcheck = $element.spellcheck;
    this.tabIndex = $element.tabIndex;
    this.value = $element.value;
    this.wrap = $element.wrap;

    this.attachShadow({mode: 'open', delegatesFocus: true});
    this.render();
    this.__initFocusDelegation();
  }

  propertyChangedCallback(propName, oldValue, newValue) {
    super.propertyChangedCallback(propName, oldValue, newValue);
    this.render();
  }

  get styles() {
    return html`
      <style>
        :host { outline: none }

        textarea:invalid {
          border: 1px solid red;
        }
      </style>
    `;
  }

  get template() {
    return html`
      ${this.styles}
      <textarea
      .accessKey="${this.accessKey}"
      .autocomplete="${this.autocomplete}"
      ?autofocus="${this.autofocus}"
      .cols="${this.cols}"
      .dirname="${this.dirname}"
      ?disabled="${this.disabled}"
      .maxlength="${this.maxlength}"
      .minlength="${this.minlength}"
      .placeholder="${this.placeholder}"
      ?readonly="${this.readonly}"
      ?required="${this.required}"
      .rows="${this.rows}"
      .spellcheck="${this.spellcheck}"
      .tabIndex="${this.tabIndex}"
      .wrap="${this.wrap}"
      .value="${this.value}"
      @input="${this.__handleInput}"
      @change="${this.__handleInput}"
      ></textarea>
    `;
  }

  render() {
    window.cancelAnimationFrame(this._renderDebouncer);
    this._renderDebouncer = window.requestAnimationFrame(() => {
      litRender(this.template, this.shadowRoot, {eventContext: this, scopeName: this.localName});
    });
  }

  get accessKey() {
    return this._accessKey;
  }

  set accessKey(val) {
    this._accessKey = val;
  }

  get list() {
    return this.$element.list;
  }

  get tabIndex() {
    return this._tabIndex;
  }

  set tabIndex(val) {
    this._tabIndex = parseInt(val);
  }

  get validationMessage() {
    return this.$element.validationMessage();
  }

  get validity() {
    return this.$element.validity();
  }

  get willValidate() {
    return this.$element.willValidate();
  }

  checkValidity()	{
    return this.$element.checkValidity();
  }

  reportValidity() {
    return this.$element.reportValidity();
  }

  select() {
    return this.$element.select();
  }

  setCustomValidity(val) {
    this.$element.setCustomValidity(val);
  }

  setRangeText() {
    this.$element.setRangeText(...arguments);
  }

  setSelectionRange() {
    this.$element.setSelectionRange(...arguments);
  }


  get $element() {
    if(!this.shadowRoot) return {};
    return this.shadowRoot.querySelector('textarea') || {};
  }

  __initFocusDelegation() {
    if(this.shadowRoot.delegatesFocus) return;
    this.addEventListener('focus', () => this.$element.focus());
    this.addEventListener('click', () => this.$element.focus());
  }
  
  __handleInput(e) {
    e.stopPropagation();
    this.value = e.target.value;
    this.checked = e.target.checked;
    const evt = new CustomEvent(e.type, {...e.bubbles, ...e.cancelable, ...e.detail});
    this.dispatchEvent(evt);
  }

}