import { html, css, LitElement } from 'lit-element';
import '@api-modeling/modeling-project-ui/welcome-screen.js';

/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */

export class PageProjectPicker extends LitElement {
  static get styles() {
    return css`
    :host {
      display: block;
      background-color: white;
    }

    .ws {
      max-width: 900px;
      margin: 0 auto;
    }
    `;
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      projectName: { type: String },
    }
  }

  /**
   * @return {ModelingFrontStore}
   */
  get store() {
    return this._store;
  }

  set store(value) {
    this._store = value;
  }

  constructor() {
    super();
    this.compatibility = false;

    this.projectName = '';
  }

  _startNew() {
    this.dispatchEvent(new CustomEvent('newprojectrequested'));
  }

  _openImport() {
    this.dispatchEvent(new CustomEvent('importrequested'));
  }

  render() {
    const { compatibility } = this;
    return html`<welcome-screen
      recent
      open
      class="ws"
      @new="${this._startNew}"
      @open="${this._openImport}"
      ?compatibility="${compatibility}"
    >
    </welcome-screen>`;
  }
}
