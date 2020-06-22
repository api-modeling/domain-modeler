import { html, css, LitElement } from 'lit-element';
import '@api-modeling/modeling-project-ui/module-viewer.js';
import { ModuleMixin } from '@api-modeling/modeling-amf-mixin';
// import { ModelingEventTypes, ModelingEvents } from  '@api-modeling/modeling-events';


/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */
/** @typedef {import('@api-modeling/modeling-amf-mixin/src/AmfTypes').ModuleInstance} ModuleInstance */
/** @typedef {import('@api-modeling/modeling-amf-mixin/src/AmfTypes').ProjectInstance} ProjectInstance */

export class PageDomainExplorer extends ModuleMixin(LitElement) {
  static get styles() {
    return css`
    :host {
      display: block;
      background-color: #E5E5E5;
      padding: 12px 24px;
    }
    `;
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      module: { type: Object },
      rootModule: { type: Object },
      project: { type: Object },
    };
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
    this.module = /** @type ModuleInstance */ (null);
    this.rootModule = /** @type ModuleInstance */ (null);
    this.project = /** @type ProjectInstance */ (null);
    this.compatibility = false;
  }

  render() {
    const {
      compatibility,
      module,
      project,
    } = this;
    if (!module) {
      return '';
    }

    return html`<module-viewer
      ?compatibility="${compatibility}"
      .module="${module}"
      .amf="${project}"></module-viewer>`;
  }
}
