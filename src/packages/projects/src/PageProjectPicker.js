import { html, css, LitElement } from 'lit-element';
import { nothing } from 'lit-html';
import '@api-modeling/modeling-project-ui/welcome-screen.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-item/anypoint-item-body.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@github/time-elements';

/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */
/** @typedef {import('../../storage/src/StorePersistanceApi.js').StorePersistanceApi} StorePersistanceApi */

const queryOptions = Symbol('queryOptions');

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
      recent: { type: Array },
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

  /**
   * @return {StorePersistanceApi}
   */
  get persistance() {
    return this._persistance;
  }

  set persistance(value) {
    this._persistance = value;
  }

  constructor() {
    super();
    this.compatibility = false;
    this.recent = null;
  }

  connectedCallback() {
    super.connectedCallback();
    const { recent } = this;
    if (!recent || !recent.length) {
      this.queryRecent();
    }
  }

  async queryRecent() {
    const qo = this[queryOptions] || {};
    qo.limit = 5;
    const result = await this.persistance.recent(qo);
    this[queryOptions] = result.options;
    this.recent = result.items;
  }

  _startNew() {
    this.dispatchEvent(new CustomEvent('newprojectrequested'));
  }

  _openImport() {
    this.dispatchEvent(new CustomEvent('importrequested'));
  }

  /**
   * @param {number} timestamp Timestamp to map to ISO string
   * @return {string|null}
   */
  getIsoTime(timestamp) {
    if (!timestamp) {
      return null;
    }
    const d = new Date(timestamp);
    return d.toISOString();
  }

  _selectionHandler(e) {
    const item = this.recent[e.target.selected];
    this.dispatchEvent(new CustomEvent('restore', {
      detail: {
        id: item._id,
      }
    }));
  }

  render() {
    const { compatibility, recent } = this;
    return html`<welcome-screen
      recent
      open
      class="ws"
      @new="${this._startNew}"
      @open="${this._openImport}"
      ?compatibility="${compatibility}"
    >${recent && recent.length ? this.recentTemplate() : nothing}</welcome-screen>`;
  }

  recentTemplate() {
    const { compatibility, recent } = this;
    return html`
    <anypoint-listbox ?compatibility="${compatibility}" slot="recent" @selectedchange="${this._selectionHandler}">
    ${recent.map((item) => this.recentTemplateItem(item))}
    </anypoint-listbox>
    `;
  }

  recentTemplateItem(item) {
    const { compatibility } = this;
    return html`<anypoint-item role="menuitemcheckbox" ?compatibility="${compatibility}">
      <anypoint-item-body twoline  ?compatibility="${compatibility}">
        <div>${item.name}</div>
        <div secondary><relative-time datetime="${this.getIsoTime(item.time)}"></relative-time></div>
      </anypoint-item-body>
    </anypoint-item>`;
  }
}
