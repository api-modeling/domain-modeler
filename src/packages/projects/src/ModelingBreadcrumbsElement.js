import { html, css, LitElement } from 'lit-element';
import { ModelingEventTypes, ModelingEvents } from  '@api-modeling/modeling-events';
import { ModelingAmfMixin } from '@api-modeling/modeling-amf-mixin';

/** @typedef {import('@api-modeling/modeling-events').Events.DomainNavigationEvent} DomainNavigationEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainPathQueryItem} DomainPathQueryItem */
/** @typedef {import('lit-element').TemplateResult} TemplateResult */

const navigationHandler = Symbol('navigationHandler');
const clickHandler = Symbol('clickHandler');
const pathValue = Symbol('pathValue');
const pathTemplate = Symbol('pathTemplate');
const getUrl = Symbol('getUrl');
const typeToLabel = Symbol('typeToLabel');

export class ModelingBreadcrumbsElement extends ModelingAmfMixin(LitElement) {
  static get styles() {
    return css`
    :host {
      display: block;
      background-color: rgb(247, 247, 247);
      padding: 0 8px;
    }

    .separator {

    }

    .breadcrumb {
      color: var(--primary-color);
      display: inline-block;
      padding: 4px 4px;
    }
    `;
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
    }
  }

  constructor() {
    super();
    this[navigationHandler] = this[navigationHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(ModelingEventTypes.State.Navigation.change, this[navigationHandler]);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(ModelingEventTypes.State.Navigation.change, this[navigationHandler]);
  }

  /**
   * @param {DomainNavigationEvent} e
   */
  [navigationHandler](e) {
    const { selected } = e.detail;
    this.select(selected);
  }

  async select(id) {
    const path = await ModelingEvents.Query.path(this, id);
    path.reverse();
    this[pathValue] = path;
    this.requestUpdate();
  }

  /**
   * Translates AMF type to a label value.
   * @param {string} type
   * @returns {string}
   */
  [typeToLabel](type) {
    switch (type) {
      case this.ns.aml.vocabularies.dataModel.DataModel: return 'model';
      case this.ns.aml.vocabularies.dataModel.Entity: return 'entity';
      case this.ns.aml.vocabularies.dataModel.AssociationProperty: return 'association';
      case this.ns.aml.vocabularies.dataModel.AttributeProperty: return 'attribute';
      case this.ns.aml.vocabularies.modularity.Module: return 'module';
      case this.ns.aml.vocabularies.project.Project: return 'project';
      default: return 'unknown';
    }
  }

  /**
   * Generates route URL for a breadcrumb item
   * @param {DomainPathQueryItem} item
   * @return {string}
   */
  [getUrl](item) {
    const type = this[typeToLabel](item.type);
    const result = `/${type}/${item.id}`;
    return result
  }

  /**
   * @param {PointerEvent} e
   */
  [clickHandler](e) {
    e.preventDefault();
    e.stopPropagation();

    const node = /** @type HTMLAnchorElement */ (e.target);
    const index = Number(node.dataset.index);
    const item = /** @type DomainPathQueryItem */ (this[pathValue][index]);
    const parent = /** @type DomainPathQueryItem */ (this[pathValue][index - 1] || {});
    const type = this[typeToLabel](item.type);
    ModelingEvents.State.Navigation.change(this, item.id, type, parent.id);
  }

  render() {
    const path = /** @type DomainPathQueryItem[] */ (this[pathValue] || []);
    return html`
    ${path.map((item, index) => this[pathTemplate](item, index, path))}
    `;
  }

  /**
   * @param {DomainPathQueryItem} item The path item to render
   * @param {number} index Index in the path array
   * @param {DomainPathQueryItem[]} list The entire path array
   * @returns {TemplateResult|string} Template for a path item
   */
  [pathTemplate](item, index, list) {
    if (item.name === 'root module') {
      return '';
    }
    const name = item.displayName || item.name || 'Unknown';
    const isLast = list.length === 2 || list.length - 1 === index;
    return html`
    <a class="breadcrumb" data-index="${index}" href="#${this[getUrl](item)}" @click="${this[clickHandler]}">${name}</a>
    ${isLast ? '' : html`<span class="separator">⋅</span>`}
    `;
  }
}
