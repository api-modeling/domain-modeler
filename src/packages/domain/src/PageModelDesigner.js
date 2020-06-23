import { html, css, LitElement } from 'lit-element';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@api-modeling/modeling-icons/modeling-icon.js';
import { ModelingEvents } from  '@api-modeling/modeling-events';

/** @typedef {import('@api-modeling/modeling-amf-mixin/src/AmfTypes').DataModelInstance} DataModelInstance */

export class PageModelDesigner extends LitElement {
  static get styles() {
    return css`
    :host {
      display: block;
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
    `;
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      dataModel: { type: Object },
      dataModelId: { type: String },
    };
  }

  constructor() {
    super();
    this.dataModel = /** @type DataModelInstance */ (null);
    this.dataModelId = null;
    this.compatibility = false;
  }

  _addEntityHandler() {
    ModelingEvents.Entity.create(this, this.dataModelId);
  }

  render() {
    const {
      compatibility,
      dataModel,
    } = this;

    return html`
      <non-existing-component
        ?compatibility="${compatibility}"
        .dataModel="${dataModel}"
      ></non-existing-component>
      ${this._uiControlsTemplate()}
    `;
  }

  _uiControlsTemplate() {
    const fab = this._fabTemplate();
    const zoom = this._zoomControlTemplate();
    return html`
    <div class="ui-controls">
    ${zoom}
    ${fab}
    </div>
    `;
  }

  _zoomControlTemplate() {
    return html`
    <div class="zoom-controls">
      <anypoint-icon-button
        title="Zoom in"
        aria-label="Activate to zoom in the view"
        class="zoom-control"
      >
        <modeling-icon icon="add"></modeling-icon>
      </anypoint-icon-button>
      <anypoint-icon-button
        title="Zoom out"
        aria-label="Activate to zoom out the view"
        class="zoom-control"
      >
        <modeling-icon icon="remove"></modeling-icon>
      </anypoint-icon-button>
    </div>
    `;
  }

  _fabTemplate() {
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
}
