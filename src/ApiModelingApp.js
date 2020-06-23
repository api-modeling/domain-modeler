import { LitElement, html } from 'lit-element';
import { ModelingFrontStore } from '@api-modeling/modeling-front-store';
import { ModelingEventTypes, ModelingEvents } from  '@api-modeling/modeling-events';
import { ModuleMixin } from '@api-modeling/modeling-amf-mixin';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@api-modeling/modeling-editors-ui/editor-drawer.js';
import '@api-modeling/modeling-editors-ui/module-details-view.js';
import '@api-modeling/modeling-editors-ui/module-details-editor.js';
import '@api-modeling/modeling-editors-ui/model-details-view.js';
import '@api-modeling/modeling-editors-ui/model-details-editor.js';
import '@api-modeling/modeling-editors-ui/entity-details-view.js';
import '@api-modeling/modeling-editors-ui/entity-editor.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
import '@api-modeling/modeling-project-ui/domain-navigation.js';
import '@api-modeling/modeling-project-ui/module-viewer.js';

// pages
import './packages/projects/page-project-picker.js';
import './packages/storage/page-import-screen.js';

// helpers
import './packages/storage/storage-prompt.js';
import { DomainImporter } from './packages/storage/src/DomainImporter.js';
import appStyles from './ApiModelingApp.styles.js';
import { StorePersistanceApi } from './packages/storage/src/StorePersistanceApi.js'

/* global MetaStore */

/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleCreateEvent} DomainStateModuleCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleDeleteEvent} DomainStateModuleDeleteEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleUpdateEvent} DomainStateModuleUpdateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateDataModelCreateEvent} DomainStateDataModelCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateDataModelUpdateEvent} DomainStateDataModelUpdateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateDataModelDeleteEvent} DomainStateDataModelDeleteEvent */
/** @typedef {import('@anypoint-web-components/anypoint-input').AnypointInput} AnypointInput */

const projectIdValue = Symbol('projectIdValue');
const requestProject = Symbol('requestProject');
const moduleAddHandler = Symbol('moduleAddHandler');
const moduleDeleteHandler = Symbol('moduleDeleteHandler');
const moduleUpdateHandler = Symbol('moduleUpdateHandler');
const modelAddHandler = Symbol('modelAddHandler');
const modelDeleteHandler = Symbol('modelDeleteHandler');
const modelUpdateHandler = Symbol('modelUpdateHandler');

export class ApiModelingApp extends ModuleMixin(LitElement) {
  static get styles() {
    return appStyles;
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      route: { type: String },
      params: { type: Object },
      /**
       * Loaded domain modeling project
       */
      project: { type: Object },
      /**
       * An ID of the selected project
       */
      projectId: { type: String },
      rootModule: { type: Object },
      module: { type: Object },
      renderNameDialog: { type: Boolean },
      moduleDetailsOpened: { type: Boolean },
      moduleEditorOpened: { type: Boolean },
      modelDetailsOpened: { type: Boolean },
      modelEditorOpened: { type: Boolean },
      entityDetailsOpened: { type: Boolean },
      entityEditorOpened: { type: Boolean },
      projectNameEditor: { type: Boolean },
      actionSelected:  { type: String },
      actionSelectedType:  { type: String },
    };
  }

  /**
   * @return {string} The ID of the data model
   */
  get projectId() {
    return this[projectIdValue];
  }

  /**
   * Sets `entityId` property.
   * @param {string} value New value of the data model id.
   */
  set projectId(value) {
    const old = this[projectIdValue];
    if (old === value) {
      return;
    }
    this[projectIdValue] = value;
    this[requestProject](value);
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
    this.compatibility = false;
    this.route = 'start';
    this.params = {};
    this.query = {};
    this.renderNameDialog = false;
    this.moduleDetailsOpened = false;
    this.moduleEditorOpened = false;
    this.modelDetailsOpened = false;
    this.modelEditorOpened = false;
    this.entityDetailsOpened = false;
    this.entityEditorOpened = false;
    this.projectNameEditor = false;

    this.store = new ModelingFrontStore();
    this.persistance = new StorePersistanceApi(this.store);
    this.persistance.listen();

    this._navigateHandler = this._navigateHandler.bind(this);
    this._navigationHandler = this._navigationHandler.bind(this);
    this._modelingActionHandler = this._modelingActionHandler.bind(this);

    this[moduleAddHandler] = this[moduleAddHandler].bind(this);
    this[moduleDeleteHandler] = this[moduleDeleteHandler].bind(this);
    this[moduleUpdateHandler] = this[moduleUpdateHandler].bind(this);
    this[modelAddHandler] = this[modelAddHandler].bind(this);
    this[modelUpdateHandler] = this[modelUpdateHandler].bind(this);
    this[modelDeleteHandler] = this[modelDeleteHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('navigate', this._navigateHandler);
    window.addEventListener(ModelingEventTypes.State.Navigation.change, this._navigationHandler);
    window.addEventListener(ModelingEventTypes.State.Navigation.action, this._modelingActionHandler);

    window.addEventListener(ModelingEventTypes.State.Module.created, this[moduleAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Module.deleted, this[moduleDeleteHandler]);
    window.addEventListener(ModelingEventTypes.State.Module.updated, this[moduleUpdateHandler]);
    window.addEventListener(ModelingEventTypes.State.Model.created, this[modelAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Model.updated, this[modelUpdateHandler]);
    window.addEventListener(ModelingEventTypes.State.Model.deleted, this[modelDeleteHandler]);
  }

  router(route, params, query) {
    this.route = route;
    this.params = params;
    this.query = query;
    // console.log(route, params, query, data);
  }

  _navigateHandler(e) {
    const { route, params } = e.detail;
    this.route = route;
    this.params = params;
    if (route === 'domain' && params.project) {
      this.projectId = params.project;
    }
  }

  _navigationHandler(e) {
    const { selected, type } = e.detail;
    if (type === 'module') {
      this._selectModule(selected);
    } else if (type === 'entity') {
      this._selectEntity(selected);
    }
  }

  _modelingActionHandler(e) {
    const { action, property, selected } = e.detail;
    this.actionSelected = selected;
    this.actionSelectedType = property;
    if (action === 'view' && property === 'module') {
      this.moduleDetailsOpened = true;
    } else if (action === 'view' && property === 'data-model') {
      this.modelDetailsOpened = true;
    } else if (action === 'edit' && property === 'module') {
      this.moduleEditorOpened = true;
    } else if (action === 'edit' && property === 'data-model') {
      this.modelEditorOpened = true;
    }
  }

  async _selectModule(id) {
    const module = await this.store.getModule(id);
    this.module = module;
    this.route = 'domain';
  }

  async _selectEntity(id) {
    this.route = 'model';
    this.actionSelected = id;
    this.actionSelectedType = 'entity';
    this.entityDetailsOpened = true;
  }

  /**
   * Requests model definition from the data store when the entity ID change.
   *
   * @param {string} id The ID of the entity to request.
   */
  async [requestProject](id) {
    if (!id) {
      this.module = undefined;
      this.rootModule = undefined;
      this.project = undefined;
      return;
    }
    const project = await this.store.getProject(id);
    const rootModuleId = this._getLinkValue(project, this.ns.aml.vocabularies.project.modules);
    const rootModule = await this.store.getModule(rootModuleId);
    this.project = project;
    this.rootModule = rootModule;
    this.module = rootModule;
  }

  /**
   * Handler for the `domainstatemodulecreate` event.
   * If the parent of created event is the current module
   * then it is added to the list of modules.
   *
   * @param {DomainStateModuleCreateEvent} e
   */
  async [moduleAddHandler](e) {
    const { rootModule } = this;
    if (!rootModule) {
      return;
    }
    const { parent, id } = e.detail;
    if (rootModule['@id'] !== parent) {
      ModelingEvents.State.Navigation.action(this, id, 'module', 'edit');
      return;
    }
    const k = this._getAmfKey(this.ns.aml.vocabularies.modularity.modules);
    if (!(k in rootModule)) {
      rootModule[k] = [];
    }
    const mod = await ModelingEvents.Module.read(this, id);
    rootModule[k].push(mod);
    this.requestUpdate();
    ModelingEvents.State.Navigation.action(this, id, 'module', 'edit');
  }

  [moduleDeleteHandler](e) {
    const { rootModule } = this;
    if (!rootModule) {
      return;
    }
    const { id } = e.detail;
    const k = this._getAmfKey(this.ns.aml.vocabularies.modularity.modules);
    if (!(k in rootModule)) {
      return;
    }
    const index = rootModule[k].findIndex((mod) => mod['@id'] === id);
    if (index === -1) {
      return;
    }
    rootModule[k].splice(index, 1);
    this.requestUpdate();
  }

  async [moduleUpdateHandler](e) {
    const { rootModule } = this;
    if (!rootModule) {
      return;
    }
    const { id } = e.detail;
    const k = this._getAmfKey(this.ns.aml.vocabularies.modularity.modules);
    if (!(k in rootModule)) {
      return;
    }
    const index = rootModule[k].findIndex((mod) => mod['@id'] === id);
    if (index === -1) {
      return;
    }
    const mod = await ModelingEvents.Module.read(this, id);
    rootModule[k][index] = mod;
    this.requestUpdate();
  }

  /**
   * @param {DomainStateDataModelCreateEvent} e
   */
  async [modelAddHandler](e) {
    const { rootModule } = this;
    if (!rootModule) {
      return;
    }
    const { parent, id } = e.detail;
    if (rootModule['@id'] !== parent) {
      ModelingEvents.State.Navigation.action(this, id, 'data-model', 'edit');
      return;
    }
    const k = this._getAmfKey(this.ns.aml.vocabularies.modularity.dataModels);
    if (!(k in rootModule)) {
      rootModule[k] = [];
    }
    const mod = await ModelingEvents.Model.read(this, id);
    rootModule[k].push(mod);
    this.requestUpdate();
    ModelingEvents.State.Navigation.action(this, id, 'data-model', 'edit');
  }

  /**
   * @param {DomainStateDataModelUpdateEvent} e
   */
  async [modelUpdateHandler](e) {
    const { rootModule } = this;
    if (!rootModule) {
      return;
    }
    const { id } = e.detail;
    const k = this._getAmfKey(this.ns.aml.vocabularies.modularity.dataModels);
    if (!(k in rootModule)) {
      return;
    }
    const index = rootModule[k].findIndex((mod) => mod['@id'] === id);
    if (index === -1) {
      return;
    }
    const mod = await ModelingEvents.Model.read(this, id);
    rootModule[k][index] = mod;
    this.requestUpdate();
  }

  /**
   * @param {DomainStateDataModelDeleteEvent} e
   */
  async [modelDeleteHandler](e) {
    const { rootModule } = this;
    if (!rootModule) {
      return;
    }
    const { id } = e.detail;
    const k = this._getAmfKey(this.ns.aml.vocabularies.modularity.dataModels);
    if (!(k in rootModule)) {
      return;
    }
    const index = rootModule[k].findIndex((mod) => mod['@id'] === id);
    if (index === -1) {
      return;
    }
    rootModule[k].splice(index, 1);
    this.requestUpdate();
  }

  _newProjectRequestHandler() {
    this.renderNameDialog = true;
  }

  _importProjectHandler() {
    this.route = 'import';
  }

  async _restoreProjectHandler(e) {
    const { id } = e.detail;
    const project = await this.persistance.restore(id);
    this.projectId = project['@id'];
    this.route = 'domain';
  }

  async _projectSaveHandler() {
    const nameInput = /** @type AnypointInput */ (this.shadowRoot.querySelector('[name="project-name"]'));
    if (!nameInput.value) {
      return;
    }
    const descInput = /** @type AnypointInput */ (this.shadowRoot.querySelector('[name="project-description"]'));
    const info = {
      name: nameInput.value,
    };
    if (descInput.value) {
      info.description = descInput.value;
    }
    const { store } = this;
    await store.initStore();
    const pid = await store.addProject(info);
    await store.addModule(pid, {
      name: 'root module'
    });
    this.renderNameDialog = false;
    this.projectId = pid;
    this.route = 'domain';
  }

  /**
   * @param {KeyboardEvent} e
   */
  _projectNameInputHandler(e) {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      this._saveProjectNameHandler();
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

  async _deleteModuleHandler(e) {
    if (this.actionSelectedType !== 'module') {
      return;
    }
    this._closeDrawerHandler(e);
    await this.store.removeModule(this.actionSelected);
  }

  async _deleteModelHandler(e) {
    if (this.actionSelectedType !== 'data-model') {
      return;
    }
    this._closeDrawerHandler(e);
    await this.store.removeDataModel(this.actionSelected);
  }

  _editSelectedHandler(e) {
    const { property, editorProperty } = e.target.dataset;
    this[property] = false;
    this[editorProperty] = true;
  }

  async _saveModuleHandler(e) {
    if (this.actionSelectedType !== 'module') {
      return;
    }
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
    const ps = changes.map((change) => MetaStore.patchThis(change, this.actionSelected));
    await ps;
    ModelingEvents.State.Module.updated(window, this.actionSelected);
  }

  async _saveModelHandler(e) {
    if (this.actionSelectedType !== 'data-model') {
      return;
    }
    const editor = e.target.previousElementSibling.previousElementSibling;
    if (!editor.validate()) {
      return;
    }
    this.modelEditorOpened = false;
    const changes = editor.changelog();

    if (!changes.length) {
      return;
    }
    // @ts-ignore
    const ps = changes.map((change) => MetaStore.patchThis(change, this.actionSelected));
    await ps;
    ModelingEvents.State.Module.updated(window, this.actionSelected);
  }

  _projectDblclickHandler() {
    this.projectNameEditor = true;
  }

  async _saveProjectNameHandler() {
    const input = /** @type AnypointInput */ (this.shadowRoot.querySelector('.new-name-input'));
    if (!input.value) {
      return;
    }
    // @ts-ignore
    await MetaStore.patchThis({
      op: 'replace',
      path: '/name',
      value: input.value,
    }, this.projectId);
    const k = this._getAmfKey(this.ns.aml.vocabularies.core.name);
    this.project[k][0]['@value'] = input.value;
    this.projectNameEditor = false;
    await this.persistance.storeState();
  }

  async _fileImportHandler(e) {
    const { type, content } = e.detail;
    this.route = 'importprocessing';
    const factory = new DomainImporter(this.store);
    try {
      this.projectId = await factory.processImport(content, type);
      this.route = 'domain';
    } catch (_) {
      // ...
    }
  }

  _projectCreateDialogTemplate() {
    const { compatibility, renderNameDialog } = this;
    if (!renderNameDialog) {
      return '';
    }
    return html`
    <anypoint-dialog ?compatibility="${compatibility}" opened>
      <h2>Add new project</h2>
      <div>
        <anypoint-input
          class="project-input"
          name="project-name"
          required
          autovalidate
          invalidmessage="A name is required"
          ?compatibility="${compatibility}"
        >
          <label slot="label">Project name</label>
        </anypoint-input>
        <anypoint-input
          class="project-input"
          name="project-description"
          ?compatibility="${compatibility}"
        >
          <label slot="label">Description (optional)</label>
        </anypoint-input>
      </div>
      <div class="buttons">
        <anypoint-button dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button dialog-confirm autofocus @click="${this._projectSaveHandler}">Save</anypoint-button>
      </div>
    </anypoint-dialog>`;
  }

  _renderPage() {
    switch (this.route) {
      case 'start':
        return html`
          <page-project-picker
            class="page"
            .store="${this.store}"
            .persistance="${this.persistance}"
            @newprojectrequested="${this._newProjectRequestHandler}"
            @importrequested="${this._importProjectHandler}"
            @restore="${this._restoreProjectHandler}"></page-project-picker>
        `;
      case 'domain':
        return html`
        <module-viewer
          .module="${this.module}"
          .amf="${this.project}"
          class="page-padding full-page"
        ></module-viewer>
        `;
      case 'model':
        return html`<p>Data model visualization</p>`;
      case 'import':
        return html`<page-import-screen
          class="page-padding full-page"
          @importprocessresult="${this._fileImportHandler}"></page-import-screen>`;
      case 'importprocessing': return this.importProcessingTemplate();
      default: return html`Not found`;
    }
  }

  render() {
    return html`
    ${this._headerTemplate()}
    <storage-prompt></storage-prompt>
    <div class="content">
      ${this._navigationDrawerTemplate()}
      <main>
        ${this._renderPage()}
      </main>
    </div>
    ${this._projectCreateDialogTemplate()}
    ${this._moduleDetailsViewTemplate()}
    ${this._moduleDetailsEditorTemplate()}
    ${this._modelDetailsViewTemplate()}
    ${this._modelDetailsEditorTemplate()}
    ${this._entityDetailsViewTemplate()}
    ${this._entityDetailsEditorTemplate()}
    `;
  }

  _headerTemplate() {
    const { route } = this;
    if (['domain', 'model'].indexOf(route) === -1) {
      return '';
    }
    const { projectNameEditor } = this;
    return html`
    <header>
      ${projectNameEditor ? this._projectNameEditorTemplate() : this._projectNameHeaderTemplate()}
    </header>`;
  }

  _projectNameHeaderTemplate() {
    const { projectName } = this;
    return html`<h2 class="project-name" @click="${this._projectDblclickHandler}">${projectName}</h2>`;
  }

  _projectNameEditorTemplate() {
    const { projectName } = this;
    return html`
    <div class="name-editor">
      <anypoint-input .value="${projectName}" nolabelfloat outlined class="new-name-input" @keydown="${this._projectNameInputHandler}">
        <label slot="label">Project name</label>
      </anypoint-input>
      <anypoint-button emphasis="high" @click="${this._saveProjectNameHandler}">Save</anypoint-button>
    </div>`;
  }

  _navigationDrawerTemplate() {
    const { route } = this;
    if (['domain', 'model'].indexOf(route) === -1) {
      return '';
    }
    const {
      compatibility,
      rootModule,
      project,
    } = this;
    return html`
    <nav>
    <domain-navigation
      ?compatibility="${compatibility}"
      .amf="${project}"
      .module="${rootModule}"
    ></domain-navigation>
    </nav>`;
  }

  _moduleDetailsViewTemplate() {
    const {
      compatibility,
      moduleDetailsOpened,
      actionSelectedType,
      actionSelected,
    } = this;
    const moduleId = actionSelectedType === 'module' ? actionSelected : undefined;
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
        data-property="moduleDetailsOpened"
        @click="${this._deleteModuleHandler}"
        slot="action"
      >Delete</anypoint-button>
      <div class="flex-last" slot="action">
        <anypoint-button
          @click="${this._closeDrawerHandler}"
          data-property="moduleDetailsOpened"
        >Close</anypoint-button>
        <anypoint-button
          emphasis="high"
          data-property="moduleDetailsOpened"
          data-editor-property="moduleEditorOpened"
          @click="${this._editSelectedHandler}"
        >Edit</anypoint-button>
      </div>
    </editor-drawer>`;
  }

  _moduleDetailsEditorTemplate() {
    const {
      compatibility,
      moduleEditorOpened,
      actionSelectedType,
      actionSelected,
    } = this;
    const moduleId = actionSelectedType === 'module' ? actionSelected : undefined;
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
        data-property="moduleEditorOpened"
        @click="${this._deleteModuleHandler}"
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

  _modelDetailsViewTemplate() {
    const {
      compatibility,
      modelDetailsOpened,
      actionSelectedType,
      actionSelected,
    } = this;
    const dataModelId = actionSelectedType === 'data-model' ? actionSelected : undefined;
    const opened = !!dataModelId && modelDetailsOpened;
    return html`<editor-drawer
      ?opened="${opened}"
      @openedchange="${this._drawerOpenedHandler}"
      data-property="modelDetailsOpened"
      >
      <h5 slot="title">Module details</h5>
      <model-details-view
        .dataModelId="${dataModelId}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></model-details-view>
      <anypoint-button
        data-property="modelDetailsOpened"
        @click="${this._deleteModelHandler}"
        slot="action"
      >Delete</anypoint-button>
      <div class="flex-last" slot="action">
        <anypoint-button
          @click="${this._closeDrawerHandler}"
          data-property="modelDetailsOpened"
        >Close</anypoint-button>
        <anypoint-button
          emphasis="high"
          data-property="modelDetailsOpened"
          data-editor-property="modelEditorOpened"
          @click="${this._editSelectedHandler}"
        >Edit</anypoint-button>
      </div>
    </editor-drawer>`;
  }

  _modelDetailsEditorTemplate() {
    const {
      compatibility,
      modelEditorOpened,
      actionSelectedType,
      actionSelected,
    } = this;
    const dataModelId = actionSelectedType === 'data-model' ? actionSelected : undefined;
    const opened = !!dataModelId && !!modelEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this._drawerOpenedHandler}"
      data-property="moduleEditorOpened"
    >
      <h5 slot="title">Edit module details</h5>
      <model-details-editor
        .dataModelId="${dataModelId}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></model-details-editor>
      <anypoint-button
        data-property="moduleEditorOpened"
        @click="${this._deleteModelHandler}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this._saveModelHandler}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }

  _entityDetailsViewTemplate() {
    const {
      compatibility,
      entityDetailsOpened,
      actionSelectedType,
      actionSelected,
    } = this;
    const entityId = actionSelectedType === 'entity' ? actionSelected : undefined;
    const opened = !!entityId && entityDetailsOpened;
    return html`<editor-drawer
      ?opened="${opened}"
      @openedchange="${this._drawerOpenedHandler}"
      data-property="entityDetailsOpened"
      >
      <h5 slot="title">Entity details</h5>
      <entity-details-view
        .entityId="${entityId}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></entity-details-view>
      <anypoint-button
        data-property="entityDetailsOpened"
        @click="${this._deleteModelHandler}"
        slot="action"
      >Delete</anypoint-button>
      <div class="flex-last" slot="action">
        <anypoint-button
          @click="${this._closeDrawerHandler}"
          data-property="entityDetailsOpened"
        >Close</anypoint-button>
        <anypoint-button
          emphasis="high"
          data-property="entityDetailsOpened"
          data-editor-property="entityEditorOpened"
          @click="${this._editSelectedHandler}"
        >Edit</anypoint-button>
      </div>
    </editor-drawer>`;
  }

  _entityDetailsEditorTemplate() {
    const {
      compatibility,
      entityEditorOpened,
      actionSelectedType,
      actionSelected,
    } = this;
    const entityId = actionSelectedType === 'entity' ? actionSelected : undefined;
    const opened = !!entityId && !!entityEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this._drawerOpenedHandler}"
      data-property="entityEditorOpened"
    >
      <h5 slot="title">Edit entity details</h5>
      <entity-editor
        .entityId="${entityId}"
        ?compatibility="${compatibility}"
      ></entity-editor>
      <anypoint-button
        data-property="entityEditorOpened"
        @click="${this._deleteModelHandler}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this._saveModelHandler}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }

  importProcessingTemplate() {
    return html`
    <div class="title-line">
      <h2>Processing files</h2>
      <progress></progress>
    </div>
    `;
  }
}
