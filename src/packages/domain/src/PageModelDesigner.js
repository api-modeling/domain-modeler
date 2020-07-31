import { html, css, LitElement } from 'lit-element';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@api-modeling/modeling-icons/modeling-icon.js';
import '@api-modeling/modeling-visualization/modeling-canvas.js';
import '@api-modeling/modeling-visualization/modeling-canvas-entity.js';
import '@api-modeling/modeling-visualization/modeling-canvas-external-entity.js';
import { ModelingEvents, ModelingEventTypes } from  '@api-modeling/modeling-events';
import { EntityMixin, AttributeMixin } from '@api-modeling/modeling-amf-mixin';
import { computeDataModelEntities, computeExternalDataModelEntities } from '@api-modeling/modeling-visualization';

/** @typedef {import('@api-modeling/modeling-amf-mixin').DataModelInstance} DataModelInstance */
/** @typedef {import('@api-modeling/modeling-amf-mixin').EntityInstance} EntityInstance */
/** @typedef {import('@api-modeling/modeling-visualization').ModelingCanvasElement} ModelingCanvasElement */
/** @typedef {import('@api-modeling/modeling-visualization').EntityItem} EntityItem */
/** @typedef {import('@api-modeling/modeling-visualization').ExternalEntity} ExternalEntity */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateEntityCreateEvent} DomainStateEntityCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateEntityDeleteEvent} DomainStateEntityDeleteEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateAssociationCreateEvent} DomainStateAssociationCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateAssociationDeleteEvent} DomainStateAssociationDeleteEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateAssociationUpdateEvent} DomainStateAssociationUpdateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainNavigationEvent} DomainNavigationEvent */


const dataModelIdValue = Symbol('dataModelIdValue');
const requestModel = Symbol('requestModel');
const entitiesValue = Symbol('entitiesValue');
const externalEntitiesValue = Symbol('externalEntitiesValue');
const modelValue = Symbol('modelValue');
const entitiesTemplate = Symbol('entitiesTemplate');
const externalEntitiesTemplate = Symbol('externalEntitiesTemplate');
const uiControlsTemplate = Symbol('uiControlsTemplate');
const zoomControlTemplate = Symbol('zoomControlTemplate');
const fabTemplate = Symbol('fabTemplate');
const zoomInHandler = Symbol('zoomInHandler');
const zoomOutHandler = Symbol('zoomOutHandler');
const entityAddHandler = Symbol('entityAddHandler');
const entityDeleteHandler = Symbol('entityDeleteHandler');
const navigationHandler = Symbol('navigationHandler');
const associationAddHandler = Symbol('associationAddHandler');
const associationUpdateHandler = Symbol('associationUpdateHandler');
const associationDeleteHandler = Symbol('associationDeleteHandler');
const zoomValue = Symbol('zoomValue');
const zoomHandler = Symbol('zoomHandler');
const notifyZoom = Symbol('notifyZoom');
const zoomTimeout = Symbol('zoomTimeout');

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
      zoom: { type: Number },
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

  get zoom() {
    return this[zoomValue];
  }

  set zoom(value) {
    const old = this[zoomValue];
    if (old === value) {
      return;
    }
    this[zoomValue] = value;
    this.requestUpdate();
  }

  constructor() {
    super();
    // this.dataModel = /** @type DataModelInstance */ (null);
    this.dataModelId = undefined;
    this.compatibility = false;
    this[entityAddHandler] = this[entityAddHandler].bind(this);
    this[entityDeleteHandler] = this[entityDeleteHandler].bind(this);
    this[navigationHandler] = this[navigationHandler].bind(this);
    this[associationAddHandler] = this[associationAddHandler].bind(this);
    this[associationUpdateHandler] = this[associationUpdateHandler].bind(this);
    this[associationDeleteHandler] = this[associationDeleteHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(ModelingEventTypes.State.Entity.created, this[entityAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Entity.deleted, this[entityDeleteHandler]);
    window.addEventListener(ModelingEventTypes.State.Association.created, this[associationAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Association.updated, this[associationUpdateHandler]);
    window.addEventListener(ModelingEventTypes.State.Association.deleted, this[associationDeleteHandler]);
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
    window.removeEventListener(ModelingEventTypes.State.Association.created, this[associationAddHandler]);
    window.removeEventListener(ModelingEventTypes.State.Association.updated, this[associationUpdateHandler]);
    window.removeEventListener(ModelingEventTypes.State.Association.deleted, this[associationDeleteHandler]);
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
      const entities = /** @type EntityInstance[] */ (this._getValueArray(model, this.ns.aml.vocabularies.dataModel.entities));
      await this.setEntitiesData(id, entities);
    } catch (e) {
      ModelingEvents.Reporting.error(this, e, 'Unable to read data model definition.', 'module-designer');
    }
    this.loading = false;
    this.requestUpdate();
  }

  /**
   * Processes entities data and sets the values in the element state to render.
   *
   * This function takes care of listing external entities (from another data model or a module)
   * found in the associations.
   *
   * @param {string} dataModelId The parent data model ID
   * @param {EntityInstance[]} entities
   * @return {Promise<void>}
   */
  async setEntitiesData(dataModelId, entities) {
    if (!entities.length) {
      this[entitiesValue] = undefined;
      this[externalEntitiesValue] = undefined;
      return;
    }

    const dmEntities = await computeDataModelEntities(this, dataModelId, entities);
    const exEntities = computeExternalDataModelEntities(dmEntities);
    this[entitiesValue] = dmEntities;
    this[externalEntitiesValue] = exEntities;
  }

  [zoomInHandler]() {
    const { zoom=0 } = this;
    this.zoom = zoom + 1;
    this[notifyZoom]();
  }

  [zoomOutHandler]() {
    const { zoom=0 } = this;
    this.zoom = zoom - 1;
    this[notifyZoom]();
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
      this[entitiesValue] = /** @type EntityItem[] */ ([]);
    }
    const item = /** @type EntityItem */ ({
      entity: id,
      links: [],
    });
    this[entitiesValue].push(item);
    this.requestUpdate();
  }

  /**
   * @param {DomainStateEntityDeleteEvent} e
   */
  [entityDeleteHandler](e) {
    const { id } = e.detail;
    const items = /** @type EntityItem[] */ (this[entitiesValue] || []);
    const index = items.findIndex((item) => item.entity === id);
    if (index === -1) {
      return;
    }
    this[entitiesValue].splice(index, 1);
    this.requestUpdate();
  }

  /**
   * @param {DomainStateAssociationCreateEvent} e
   */
  async [associationAddHandler](e) {
    const { id, parent } = e.detail;
    const entities = /** @type EntityItem[] */ (this[entitiesValue] || []);
    let entityLinks;
    let entityId;
    for (let i = 0, len = entities.length; i < len; i++) {
      const { entity, links } = entities[i];
      if (entity === parent) {
        entityLinks = links;
        entityId = entity;
        break;
      }
    }
    if (!entityLinks) {
      return;
    }
    const assoc = await ModelingEvents.Association.read(this, id);
    const target = this._getLinkValue(assoc, this.ns.aml.vocabularies.dataModel.target);
    if (target) {
      entityLinks.push({
        id,
        target,
        source: entityId,
        model: this.dataModelId,
      });
      const exEntities = computeExternalDataModelEntities(entities);
      this[entitiesValue] = entities;
      this[externalEntitiesValue] = exEntities;
      this.requestUpdate();
    }
  }

  /**
   * @param {DomainStateAssociationUpdateEvent} e
   */
  async [associationUpdateHandler](e) {
    const { id, parent } = e.detail;
    const entities = /** @type EntityItem[] */ (this[entitiesValue] || []);
    const index = entities.findIndex((entity) => entity.entity === parent);
    // the parent is not in this visualization
    if (index === -1) {
      return;
    }
    const assoc = await ModelingEvents.Association.read(this, id);
    const target = this._getLinkValue(assoc, this.ns.aml.vocabularies.dataModel.target);
    if (!target) {
      // @todo(pawel): probably this should remove the edge if exists in the list of links.
      return;
    }
    const { links } = entities[index];
    const linkIndex = links.findIndex((link) => link.id === id);
    if (linkIndex === -1) {
      links.push({
        id,
        target,
        source: parent,
        model: this.dataModelId,
      });
    } else {
      const link = links[linkIndex];
      link.target = target;
    }
    const exEntities = computeExternalDataModelEntities(entities);
    this[entitiesValue] = entities;
    this[externalEntitiesValue] = exEntities;
    this.requestUpdate();
  }

  /**
   * @param {DomainStateAssociationDeleteEvent} e
   */
  [associationDeleteHandler](e) {
    const { id } = e.detail;
    const entities = /** @type EntityItem[] */ (this[entitiesValue] || []);
    for (let i = 0, len = entities.length; i < len; i++) {
      const { links } = entities[i];
      for (let j = 0, linksLen = links.length; j < linksLen; j++) {
        if (links[j].id === id) {
          links.splice(j, 1);
          const exEntities = computeExternalDataModelEntities(entities);
          this[entitiesValue] = entities;
          this[externalEntitiesValue] = exEntities;
          this.requestUpdate();
          return;
        }
      }
    }
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
   * @param {CustomEvent} e
   */
  [zoomHandler](e) {
    const canvas = /** @type ModelingCanvasElement */ (e.target);
    this[zoomValue] = canvas.zoom;
    this[notifyZoom]();
  }

  [notifyZoom]() {
    if (this[zoomTimeout]) {
      clearTimeout(this[zoomTimeout]);
    }
    this[zoomTimeout] = setTimeout(() => {
      this.dispatchEvent(new CustomEvent('zoomchange'));
    }, 10);
  }

  /**
   * Sets selected state on an entity
   *
   * @param {string} id The ID of the entity to select.
   */
  selectEntity(id) {
    const items = /** @type EntityItem[] */ (this[entitiesValue] || []);
    const index = items.findIndex((item) => item.entity === id);
    if (index === -1) {
      return;
    }
    // @ts-ignore
    this.canvas.selected = index;
  }

  render() {
    const {
      compatibility,
      zoom,
      dataModelId,
    } = this;
    return html`
      <modeling-canvas
        class="canvas"
        ?compatibility="${compatibility}"
        .zoom="${zoom}"
        .contextId="${dataModelId}"
        @zoomchange="${this[zoomHandler]}"
      >
        ${this[entitiesTemplate]()}
        ${this[externalEntitiesTemplate]()}
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
    const entities = /** @type EntityItem[] */ (this[entitiesValue] || []);
    if (!entities.length) {
      return '';
    }
    return entities.map((item) => html`<modeling-canvas-entity
      ?compatibility="${compatibility}"
      .domainId="${item.entity}"
      interactive
    ></modeling-canvas-entity>`);
  }

  [externalEntitiesTemplate]() {
    const { compatibility } = this;
    const entities = /** @type ExternalEntity[] */ (this[externalEntitiesValue] || []);
    if (!entities.length) {
      return '';
    }
    return entities.map((item) => html`
    <modeling-canvas-external-entity
      ?compatibility="${compatibility}"
      .domainId="${item.domainId}"
      .dataModel="${item.model}"
      .associations="${item.associations}"
      interactive
    ></modeling-canvas-external-entity>`);
  }
}
