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
import '@api-modeling/modeling-editors-ui/attribute-editor.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
import '@api-modeling/modeling-project-ui/domain-navigation.js';
import '@api-modeling/modeling-project-ui/module-viewer.js';
import '@anypoint-web-components/anypoint-menu-button/anypoint-menu-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@api-modeling/modeling-icons/modeling-icon.js';

// pages
import './packages/projects/page-project-picker.js';
import './packages/storage/page-import-screen.js';
import './packages/domain/page-model-designer.js';

// helpers
import './packages/storage/storage-prompt.js';
import { DomainImporter } from './packages/storage/src/DomainImporter.js';
import appStyles from './ApiModelingApp.styles.js';
import { StorePersistenceApi } from './packages/storage/src/StorePersistenceApi.js'
import ModelingAlertDialog from './packages/helpers/modeling-alert-dialog.js';

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
const unhandledRejectionHandler = Symbol('unhandledRejectionHandler');

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
      dataModelId: { type: String },
      rootModule: { type: Object },
      module: { type: Object },
      renderNameDialog: { type: Boolean },
      moduleDetailsOpened: { type: Boolean },
      moduleEditorOpened: { type: Boolean },
      modelDetailsOpened: { type: Boolean },
      modelEditorOpened: { type: Boolean },
      entityDetailsOpened: { type: Boolean },
      entityEditorOpened: { type: Boolean },
      attributeEditorOpened: { type: Boolean },
      projectNameEditor: { type: Boolean },
      actionSelected:  { type: String },
      actionSelectedType:  { type: String },
      attributeSelected: { type: String },
      moduleSelected: { type: String },
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
    this.attributeEditorOpened = false;
    this.attributeSelected = null;
    this.moduleSelected = null;

    this.store = new ModelingFrontStore();
    this.persistence = new StorePersistenceApi(this.store);
    this.persistence.listen();

    this._navigateHandler = this._navigateHandler.bind(this);
    this._navigationHandler = this._navigationHandler.bind(this);
    this._modelingActionHandler = this._modelingActionHandler.bind(this);

    this[moduleAddHandler] = this[moduleAddHandler].bind(this);
    this[moduleDeleteHandler] = this[moduleDeleteHandler].bind(this);
    this[moduleUpdateHandler] = this[moduleUpdateHandler].bind(this);
    this[modelAddHandler] = this[modelAddHandler].bind(this);
    this[modelUpdateHandler] = this[modelUpdateHandler].bind(this);
    this[modelDeleteHandler] = this[modelDeleteHandler].bind(this);

    window.onunhandledrejection = this[unhandledRejectionHandler].bind(this);
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

  [unhandledRejectionHandler](e) {
    const dialog = new ModelingAlertDialog();
    dialog.message = e.reason.message;
    // @ts-ignore
    dialog.choices = ['Dismiss'];
    // @ts-ignore
    dialog.open();
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
    } else if (type === 'data-model') {
      this._selectDataModel(selected);
    } else if (type === 'entity') {
      this._selectEntity(selected);
    }
  }

  _modelingActionHandler(e) {
    const { action, property, selected } = e.detail;

    switch (action) {
      case 'view': this._processViewAction(property, selected); break;
      case 'edit': this._processEditAction(property, selected); break;
      default:
    }
  }

  _processViewAction(property, selected) {
    this.actionSelectedType = property;
    switch (property) {
      case 'module':
        this.moduleSelected = selected;
        this.moduleDetailsOpened = true;
        break;
      case 'data-model':
        this.actionSelected = selected;
        this.modelDetailsOpened = true;
        break;
      default:
    }
  }

  _processEditAction(property, selected) {
    switch (property) {
      case 'module':
        this.moduleSelected = selected;
        this.actionSelectedType = property;
        this.moduleEditorOpened = true;
        break;
      case 'data-model':
        this.actionSelected = selected;
        this.actionSelectedType = property;
        this.modelEditorOpened = true;
        break;
      case 'attribute':
        this.attributeSelected = selected;
        this.attributeEditorOpened = true;
        break;
      default:
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

  async _selectDataModel(id) {
    this.route = 'model';
    this.dataModelId = id;
    this.actionSelected = id;
    this.actionSelectedType = 'data-model';
    this.modelDetailsOpened = true;
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
    const project = await this.persistence.restore(id);
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
    await this.store.removeModule(this.moduleSelected);
  }

  async _deleteModelHandler(e) {
    if (this.actionSelectedType !== 'data-model') {
      return;
    }
    this._closeDrawerHandler(e);
    await this.store.removeDataModel(this.actionSelected);
  }

  async _deleteEntityHandler(e) {
    if (this.actionSelectedType !== 'entity') {
      return;
    }
    this._closeDrawerHandler(e);
    await this.store.removeEntity(this.actionSelected);
  }

  async _deleteAttributeHandler(e) {
    this._closeDrawerHandler(e);
    await this.store.removeAttribute(this.attributeSelected);
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
    await this.store.patchModule(changes, this.moduleSelected);
    ModelingEvents.State.Module.updated(window, this.moduleSelected);
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

  async _saveEntityHandler(e) {
    if (this.actionSelectedType !== 'entity') {
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
    ModelingEvents.State.Entity.updated(window, this.actionSelected);
  }

  async _saveAttributeHandler(e) {
    const editor = e.target.previousElementSibling.previousElementSibling;
    if (!editor.validate()) {
      return;
    }
    this.attributeEditorOpened = false;
    const changes = editor.changelog();

    if (!changes.length) {
      return;
    }
    // @ts-ignore
    const ps = changes.map((change) => MetaStore.patchThis(change, this.attributeSelected));
    await ps;
    ModelingEvents.State.Attribute.updated(window, this.attributeSelected);
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
    await this.persistence.storeState();
  }

  async _fileImportHandler(e) {
    const { type, content } = e.detail;
    this.route = 'importprocessing';
    const factory = new DomainImporter(this.store);
    try {
      this.projectId = await factory.processImport(content, type);
      this.route = 'domain';
      this.persistence.storeState();
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
            .persistence="${this.persistence}"
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
        return html`
        <page-model-designer
          .dataModelId="${this.dataModelId}"
        >
        </page-model-designer>`;
      case 'import':
        return html`<page-import-screen
          class="page-padding full-page"
          @importprocessresult="${this._fileImportHandler}"></page-import-screen>`;
      case 'importprocessing': return this.importProcessingTemplate();
      default: return html`Not found`;
    }
  }

  _mainMenuHandler(e) {
    const { item } = e.detail;
    if (!item) {
      // cancelled selection
      return;
    }
    const { action } = item.dataset;
    switch (action) {
      case 'close':
        this.closeProject();
        break;
      case 'delete':
        this.deleteProject();
        break;
      default:
    }
  }

  /**
   * Clears the variables responsible for actions and routing
   */
  crearState() {
    this.actionSelected = null;
    this.actionSelectedType = null;
    this.route = null;
    this.params = null;
    this.project = null;
    this.projectId = null;
    this.dataModelId = null;
    this.moduleSelected = null;
    this.attributeSelected = null;
  }

  /**
   * Closes current project and returns to the main screen
   * @return {Promise<void>}
   */
  async closeProject() {
    await this.persistence.resetStore();
    this.crearState();
    this.route = 'start';
  }

  /**
   * Removes currernt project from the data store and returns to the main screen.
   * @return {Promise<void>}
   */
  async deleteProject() {
    const { projectId } = this;
    await this.persistence.resetStore();
    await this.persistence.deleteProject(projectId);
    this.crearState();
    this.route = 'start';
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
    ${this._attributeEditorTemplate()}
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
      <span class="spacer"></span>
      ${this._mainDropdownTemplate()}
    </header>`;
  }

  _mainDropdownTemplate() {
    return html`<anypoint-menu-button horizontalAlign="right" horizontalOffset="12" closeOnActivate @select="${this._mainMenuHandler}">
      <anypoint-icon-button
        slot="dropdown-trigger"
        aria-label="activate for project menu"
        title="Project menu"
      >
        <modeling-icon icon="moreVert" alt="menu"></modeling-icon>
      </anypoint-icon-button>
      <anypoint-listbox slot="dropdown-content">
        <anypoint-item data-action="close" class="menu-item">
          <modeling-icon icon="close" alt="Close icon" class="menu-icon"></modeling-icon>
          Close project
        </anypoint-item>
        <anypoint-item data-action="delete" class="menu-item">
          <modeling-icon icon="deleteIcon" alt="Delete icon" class="menu-icon"></modeling-icon>
          Delete project
        </anypoint-item>
      </anypoint-listbox>
    </anypoint-menu-button>`;
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
      moduleSelected,
    } = this;
    const moduleId = actionSelectedType === 'module' ? moduleSelected : undefined;
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
      moduleSelected,
    } = this;
    const moduleId = actionSelectedType === 'module' ? moduleSelected : undefined;
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
        @click="${this._deleteEntityHandler}"
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
        @click="${this._deleteEntityHandler}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this._saveEntityHandler}"
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

  _attributeEditorTemplate() {
    const {
      compatibility,
      attributeEditorOpened,
      attributeSelected,
    } = this;
    const opened = !!attributeSelected && !!attributeEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this._drawerOpenedHandler}"
      data-property="attributeEditorOpened"
    >
      <h5 slot="title">Edit attribute</h5>
      <attribute-editor
        .attributeId="${attributeSelected}"
        ?compatibility="${compatibility}"
        class=""
      ></attribute-editor>
      <anypoint-button
        data-property="attributeEditorOpened"
        @click="${this._deleteAttributeHandler}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this._saveAttributeHandler}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }
}
