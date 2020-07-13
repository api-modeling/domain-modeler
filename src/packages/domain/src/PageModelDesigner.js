import { html, css, LitElement } from 'lit-element';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@api-modeling/modeling-icons/modeling-icon.js';
import '@api-modeling/modeling-visualization/modeling-canvas.js';
import '@api-modeling/modeling-visualization/modeling-canvas-entity.js';
import { ModelingEvents, ModelingEventTypes } from  '@api-modeling/modeling-events';
import { EntityMixin, AttributeMixin } from '@api-modeling/modeling-amf-mixin';

/** @typedef {import('@api-modeling/modeling-amf-mixin').DataModelInstance} DataModelInstance */
/** @typedef {import('@api-modeling/modeling-visualization').ModelingCanvasElement} ModelingCanvasElement */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateEntityCreateEvent} DomainStateEntityCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateEntityDeleteEvent} DomainStateEntityDeleteEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainNavigationEvent} DomainNavigationEvent */

const dataModelIdValue = Symbol('dataModelIdValue');
const requestModel = Symbol('requestModel');
const entitiesValue = Symbol('entitiesValue');
const modelValue = Symbol('modelValue');
const entitiesTemplate = Symbol('entitiesTemplate');
const uiControlsTemplate = Symbol('uiControlsTemplate');
const zoomControlTemplate = Symbol('zoomControlTemplate');
const fabTemplate = Symbol('fabTemplate');
const zoomInHandler = Symbol('zoomInHandler');
const zoomOutHandler = Symbol('zoomOutHandler');
const entityAddHandler = Symbol('entityAddHandler');
const entityDeleteHandler = Symbol('entityDeleteHandler');
const navigationHandler = Symbol('navigationHandler');

export class PageModelDesigner extends AttributeMixin(EntityMixin(LitElement)) {
  static get styles() {
    return css`
    :host {
      display: block;
      flex: 1;
    }

    .fab {
      width: 56px;
      height: 56px;
      position: relative;
      user-select: none;
      -webkit-tap-highlight-color: rgba(0,0,0,0);
      -webkit-tap-highlight-color: transparent;
    }
    .fab .fab-icon {
      color: var(--text-primary-color);
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      flex-direction: column;
      margin-bottom: 12px;
    }

    .zoom-control {
      background-color: white;
      border: 1px solid #AFAFAF;
      width: 36px;
      height: 36px;
    }

    .zoom-control:not(:last-child) {
      border-bottom: none;
    }

    .ui-controls {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1;
    }

    .canvas {
      width: 100%;
      height: 100%;
    }
    `;
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      dataModelId: { type: String },
    };
  }

  /**
   * @return {string} The ID of the data model
   */
  get dataModelId() {
    return this[dataModelIdValue];
  }

  /**
   * Sets `entityId` property.
   * @param {string} value New value of the data model id.
   */
  set dataModelId(value) {
    const old = this[dataModelIdValue];
    if (old === value) {
      return;
    }
    this[dataModelIdValue] = value;
    this[requestModel](value);
  }

  /**
   * @return {ModelingCanvasElement}
   */
  get canvas() {
    return this.shadowRoot.querySelector('modeling-canvas');
  }

  constructor() {
    super();
    // this.dataModel = /** @type DataModelInstance */ (null);
    this.dataModelId = null;
    this.compatibility = false;
    this[entityAddHandler] = this[entityAddHandler].bind(this);
    this[entityDeleteHandler] = this[entityDeleteHandler].bind(this);
    this[navigationHandler] = this[navigationHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(ModelingEventTypes.State.Entity.created, this[entityAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Entity.deleted, this[entityDeleteHandler]);
    window.addEventListener(ModelingEventTypes.State.Navigation.change, this[navigationHandler]);

    const { dataModelId } = this;
    if (dataModelId && !this[modelValue]) {
      this[requestModel](dataModelId);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener(ModelingEventTypes.State.Entity.created, this[entityAddHandler]);
    window.removeEventListener(ModelingEventTypes.State.Entity.deleted, this[entityDeleteHandler]);
    window.removeEventListener(ModelingEventTypes.State.Navigation.change, this[navigationHandler]);
  }

  async _addEntityHandler() {
    await ModelingEvents.Entity.create(this, this.dataModelId);
  }

  async [requestModel](id) {
    if (!this.parentElement || this.loading) {
      // At the time of calling this method the element might
      // not yet been added to the DOM.
      return;
    }
    if (!id) {
      this[entitiesValue] = null;
      this[modelValue] = null;
      return;
    }
    this.loading = true;
    try {
      const model = await ModelingEvents.Model.read(this, id);
      const entities = this._getValueArray(model, this.ns.aml.vocabularies.dataModel.entities);
      this[entitiesValue] = entities;
      this[modelValue] = model;
    } catch (e) {
      ModelingEvents.Reporting.error(this, e, 'Unable to read data model definition.', 'module-designer');
    }
    this.loading = false;
    this.requestUpdate();
  }

  [zoomInHandler]() {
    const { canvas } = this;
    const { zoom } = canvas;
    canvas.zoom = zoom + 1;
  }

  [zoomOutHandler]() {
    const { canvas } = this;
    const { zoom } = canvas;
    canvas.zoom = zoom - 1;
  }

  /**
   * @param {DomainStateEntityCreateEvent} e
   */
  [entityAddHandler](e) {
    const { id, parent } = e.detail;
    if (parent !== this.dataModelId) {
      return;
    }
    if (!this[entitiesValue]) {
      this[entitiesValue] = [];
    }
    this[entitiesValue].push({
      '@id': id,
    });
    this.requestUpdate();
  }

  /**
   * @param {DomainStateEntityDeleteEvent} e
   */
  [entityDeleteHandler](e) {
    const { id } = e.detail;
    if (!this[entitiesValue]) {
      return;
    }
    const index = this[entitiesValue].findIndex((item) => item['@id'] === id);
    if (index === -1) {
      return;
    }
    this[entitiesValue].splice(index, 1);
    this.requestUpdate();
  }

  /**
   * @poaram {DomainNavigationEvent} e
   */
  [navigationHandler](e) {
    const { selected, type } = e.detail;
    if (type === 'entity') {
      this.selectEntity(selected);
    }
  }

  /**
   * Sets selected state on an entity
   *
   * @param {string} id The ID of the entity to select.
   */
  selectEntity(id) {
    if (!this[entitiesValue]) {
      return;
    }
    const index = this[entitiesValue].findIndex((item) => item['@id'] === id);
    if (index === -1) {
      return;
    }
    // @ts-ignore
    this.canvas.selected = index;
  }

  render() {
    const {
      compatibility,
    } = this;

    return html`
      <modeling-canvas
        class="canvas"
        ?compatibility="${compatibility}"
      >
        ${this[entitiesTemplate]()}
      </modeling-canvas>
      ${this[uiControlsTemplate]()}
    `;
  }

  [uiControlsTemplate]() {
    const fab = this[fabTemplate]();
    const zoom = this[zoomControlTemplate]();
    return html`
    <div class="ui-controls">
    ${zoom}
    ${fab}
    </div>
    `;
  }

  [zoomControlTemplate]() {
    return html`
    <div class="zoom-controls">
      <anypoint-icon-button
        title="Zoom in"
        aria-label="Activate to zoom in the view"
        class="zoom-control"
        @click="${this[zoomInHandler]}"
      >
        <modeling-icon icon="add"></modeling-icon>
      </anypoint-icon-button>
      <anypoint-icon-button
        title="Zoom out"
        aria-label="Activate to zoom out the view"
        class="zoom-control"
        @click="${this[zoomOutHandler]}"
      >
        <modeling-icon icon="remove"></modeling-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  [fabTemplate]() {
    return html`
    <anypoint-icon-button
      class="fab"
      aria-label="Activate to add a new entity"
      title="Add new entity"
      emphasis="high"
      @click="${this._addEntityHandler}"
    >
      <modeling-icon icon="add" class="fab-icon"></modeling-icon>
    </anypoint-icon-button>
    `;
  }

  [entitiesTemplate]() {
    const { compatibility } = this;
    const entities = this[entitiesValue] || [];
    if (!entities.length) {
      return '';
    }
    return entities.map((item) => html`<modeling-canvas-entity
      ?compatibility="${compatibility}"
      .domainId="${item['@id']}"
    ></modeling-canvas-entity>`);
  }
}
