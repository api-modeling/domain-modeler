import { html, css, LitElement } from 'lit-element';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { DomainNavigationElement, ModuleViewerElement } from '@api-modeling/modeling-project-ui';
import { ModuleMixin } from '@api-modeling/modeling-amf-mixin';
import { ModelingEventTypes, ModelingEvents } from  '@api-modeling/modeling-events';
import { EditorDrawerElement, ModuleDetailsViewElement, ModuleDetailsEditorElement } from '@api-modeling/modeling-editors-ui';
import { AnypointButton } from '@anypoint-web-components/anypoint-button';

/* global MetaStore */

/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */
/** @typedef {import('@api-modeling/modeling-amf-mixin/src/AmfTypes').ModuleInstance} ModuleInstance */
/** @typedef {import('@api-modeling/modeling-amf-mixin/src/AmfTypes').ProjectInstance} ProjectInstance */

export class PageDomainExplorer extends ModuleMixin(ScopedElementsMixin(LitElement)) {
  static get styles() {
    return css`
    :host {
      --modeling-drawer-width: 320px;
      overflow: hidden;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    header {
      height: 64px;
      background-color: #D7D7D7;
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .project-name {
      margin: 0;
      padding: 0 0 0 24px;
      font-size: 24px;
      font-weight: 400;
    }

    .content {
      display: flex;
      flex-direction: row;
      background-color: #E5E5E5;
      flex: 1;
    }

    nav {
      background-color: #F7F7F7;
    }

    main {
      flex: 1;
      padding: 12px 24px;
    }

    .inner-editor-padding {
      padding: 16px;
    }

    .flex-last {
      margin-left: auto;
    }
    `;
  }

  static get scopedElements() {
    return {
      'domain-navigation': DomainNavigationElement,
      'module-viewer': ModuleViewerElement,
      'editor-drawer': EditorDrawerElement,
      'module-details-view': ModuleDetailsViewElement,
      'module-details-editor': ModuleDetailsEditorElement,
      'anypoint-button': AnypointButton,
    };
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      module: { type: Object },
      rootModule: { type: Object },
      project: { type: Object },
      moduleDetailsOpened: { type: Boolean },
      selected: { type: String },
      selectedType: { type: String },
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

  get projectName() {
    const { project } = this;
    let name = this._getValue(project, this.ns.aml.vocabularies.core.name);
    if (!name) {
      name = 'New project';
    }
    return String(name);
  }

  constructor() {
    super();
    this.module = /** @type ModuleInstance */ (null);
    this.rootModule = /** @type ModuleInstance */ (null);
    this.project = /** @type ProjectInstance */ (null);
    this.compatibility = false;
    this.moduleDetailsOpened = false;
    this.moduleEditorOpened = false;

    this._actionHandler = this._actionHandler.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener(ModelingEventTypes.State.Navigation.action, this._actionHandler);
  }

  _actionHandler(e) {
    const { action, property, selected } = e.detail;
    this.selected = selected;
    this.selectedType = property;
    if (action === 'view' && property === 'module') {
      this.moduleDetailsOpened = true;
    }
  }

  _drawerOpenedHandler(e) {
    if (e.target.opened) {
      return;
    }
    this._closeDrawerHandler(e);
  }

  _closeDrawerHandler(e) {
    const prop = e.target.dataset.property;
    this[prop] = false;
  }

  _deleteSelectedHandler() {
    this.moduleDetailsOpened = false;
  }

  _editModuleHandler() {
    this.moduleDetailsOpened = false;
    this.moduleEditorOpened = true;
  }

  async _saveModuleHandler(e) {
    const editor = e.target.previousElementSibling.previousElementSibling;
    if (!editor.validate()) {
      return;
    }
    this.moduleEditorOpened = false;
    const changes = editor.changelog();

    if (!changes.length) {
      return;
    }
    // @ts-ignore
    const ps = changes.map((change) => MetaStore.patchThis(change, this.dataModelId));
    await ps;
    ModelingEvents.State.Module.updated(window, this.selected);
  }

  render() {
    return html`
    ${this._headerTemplate()}
    <div class="content">
      ${this._navigationDrawerTemplate()}
      <main>
        ${this._renderPage()}
      </main>
    </div>
    ${this._moduleDetailsViewTemplate()}
    ${this._moduleDetailsEditorTemplate()}
    `;
  }

  _headerTemplate() {
    return html`
    <header>
      ${this._projectNameHeaderTemplate()}
    </header>`;
  }

  _projectNameHeaderTemplate() {
    const { projectName } = this;
    return html`<h2 class="project-name">${projectName}</h2>`;
  }

  _navigationDrawerTemplate() {
    const {
      compatibility,
      rootModule,
    } = this;
    return html`
    <nav>
    <domain-navigation
      ?compatibility="${compatibility}"
      .amf="${rootModule}"
      .module="${rootModule}"
    ></domain-navigation>
    </nav>`;
  }

  _renderPage() {
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

  _moduleDetailsViewTemplate() {
    const {
      compatibility,
      moduleDetailsOpened,
      selectedType,
      selected,
    } = this;
    const moduleId = selectedType === 'module' ? selected : undefined;
    const opened = !!moduleId && moduleDetailsOpened;
    return html`<editor-drawer
      ?opened="${opened}"
      @openedchange="${this._drawerOpenedHandler}"
      data-property="moduleDetailsOpened"
      >
      <h5 slot="title">Module details</h5>
      <module-details-view
        .moduleId="${moduleId}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></module-details-view>
      <anypoint-button
        @click="${this._deleteSelectedHandler}"
        slot="action"
      >Delete</anypoint-button>
      <div class="flex-last" slot="action">
        <anypoint-button
          @click="${this._closeDrawerHandler}"
          data-property="moduleDetailsOpened"
        >Close</anypoint-button>
        <anypoint-button
          emphasis="high"
          @click="${this._editModuleHandler}"
        >Edit</anypoint-button>
      </div>
    </editor-drawer>`;
  }

  _moduleDetailsEditorTemplate() {
    const {
      compatibility,
      moduleEditorOpened,
      selectedType,
      selected,
    } = this;
    const moduleId = selectedType === 'module' ? selected : undefined;
    const opened = !!moduleId && !!moduleEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this._drawerOpenedHandler}"
      data-property="moduleEditorOpened"
    >
      <h5 slot="title">Edit module details</h5>
      <module-details-editor
        .moduleId="${moduleId}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></module-details-editor>
      <anypoint-button
        @click="${this._deleteSelectedHandler}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this._saveModuleHandler}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }
}
