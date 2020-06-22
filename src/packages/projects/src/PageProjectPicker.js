import { html, css, LitElement } from 'lit-element';
import '@api-modeling/modeling-project-ui/welcome-screen.js';

/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */

export class PageProjectPicker extends LitElement {
  static get styles() {
    return css`
    :host {
      display: block;
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

  render() {
    const { compatibility } = this;
    return html`<welcome-screen
      recent
      @new="${this._startNew}"
      ?compatibility="${compatibility}"
    >
    </welcome-screen>`;
  }
}
