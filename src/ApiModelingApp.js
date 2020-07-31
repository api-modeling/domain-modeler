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
import '@api-modeling/modeling-editors-ui/association-editor.js';
import '@anypoint-web-components/anypoint-styles/colors.js';
import '@api-modeling/modeling-project-ui/domain-navigation.js';
import '@api-modeling/modeling-project-ui/module-viewer.js';
import '@anypoint-web-components/anypoint-menu-button/anypoint-menu-button.js';
import '@anypoint-web-components/anypoint-button/anypoint-icon-button.js';
import '@anypoint-web-components/anypoint-listbox/anypoint-listbox.js';
import '@anypoint-web-components/anypoint-item/anypoint-item.js';
import '@anypoint-web-components/anypoint-input-combobox/anypoint-input-combobox.js';
import '@api-modeling/modeling-icons/modeling-icon.js';

// pages
import './packages/projects/page-project-picker.js';
import './packages/projects/modeling-breadcrumbs.js';
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
/** @typedef {import('@api-modeling/modeling-events').Events.DomainNavigationEvent} DomainNavigationEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleDeleteEvent} DomainStateModuleDeleteEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleUpdateEvent} DomainStateModuleUpdateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateDataModelCreateEvent} DomainStateDataModelCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateDataModelUpdateEvent} DomainStateDataModelUpdateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateDataModelDeleteEvent} DomainStateDataModelDeleteEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateAttributeCreateEvent} DomainStateAttributeCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateEntityCreateEvent} DomainStateEntityCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateAssociationCreateEvent} DomainStateAssociationCreateEvent */
/** @typedef {import('@anypoint-web-components/anypoint-input').AnypointInput} AnypointInput */
/** @typedef {import('@anypoint-web-components/anypoint-input-combobox').AnypointInputComboboxElement} AnypointInputComboboxElement */
/** @typedef {import('@api-modeling/modeling-editors-ui').AssociationEditorElement} AssociationEditorElement */
/** @typedef {import('@api-modeling/modeling-editors-ui').EntityEditorElement} EntityEditorElement */
/** @typedef {import('@api-modeling/modeling-editors-ui').ModuleDetailsEditorElement} ModuleDetailsEditorElement */
/** @typedef {import('@api-modeling/modeling-editors-ui').ModelDetailsEditorElement} ModelDetailsEditorElement */
/** @typedef {import('@api-modeling/modeling-editors-ui').AttributeEditorElement} AttributeEditorElement */
/** @typedef {import('./packages/domain').PageModelDesigner} PageModelDesigner */

const projectIdValue = Symbol('projectIdValue');
const requestProject = Symbol('requestProject');
const moduleAddHandler = Symbol('moduleAddHandler');
const moduleDeleteHandler = Symbol('moduleDeleteHandler');
const moduleUpdateHandler = Symbol('moduleUpdateHandler');
const modelAddHandler = Symbol('modelAddHandler');
const modelDeleteHandler = Symbol('modelDeleteHandler');
const modelUpdateHandler = Symbol('modelUpdateHandler');
const unhandledRejectionHandler = Symbol('unhandledRejectionHandler');
const entityAddHandler = Symbol('entityAddHandler');
const attributeAddHandler = Symbol('attributeAddHandler');
const associationAddHandler = Symbol('associationAddHandler');
const zoomSelectionTemplate = Symbol('zoomSelectionTemplate');
const canvasZoomHandler = Symbol('canvasZoomHandler');
const zoomInputHandler = Symbol('zoomInputHandler');
const saveAttributeHandler = Symbol('saveAttributeHandler');
const saveEntityHandler = Symbol('saveEntityHandler');
const saveDataModelHandler = Symbol('saveDataModelHandler');
const saveModuleHandler = Symbol('saveModuleHandler');
const editSelectedHandler = Symbol('editSelectedHandler');
const deleteAssociationHandler = Symbol('deleteAssociationHandler');
const saveAssociationHandler = Symbol('saveAssociationHandler');
const deleteAttributeHandler = Symbol('deleteAttributeHandler');
const closeDrawerHandler = Symbol('closeDrawerHandler');
const drawerOpenedHandler = Symbol('drawerOpenedHandler');
const projectNameInputHandler = Symbol('projectNameInputHandler');
const mainMenuHandler = Symbol('mainMenuHandler');
const fileImportHandler = Symbol('fileImportHandler');
const saveProjectNameHandler = Symbol('saveProjectNameHandler');
const deleteModuleHandler = Symbol('deleteModuleHandler');
const projectDblclickHandler = Symbol('projectDblclickHandler');
const deleteEntityHandler = Symbol('deleteEntityHandler');
const deleteModelHandler = Symbol('deleteModelHandler');
const projectSaveHandler = Symbol('projectSaveHandler');
const restoreProjectHandler = Symbol('restoreProjectHandler');
const importProjectHandler = Symbol('importProjectHandler');
const newProjectRequestHandler = Symbol('newProjectRequestHandler');
const selectDataModel = Symbol('selectDataModel');
const selectModule = Symbol('selectModule');
const selectEntity = Symbol('selectEntity');
const processViewAction = Symbol('processViewAction');
const processEditAction = Symbol('processEditAction');
const processDeleteAction = Symbol('processDeleteAction');
const deleteModule = Symbol('deleteModule');
const deleteModel = Symbol('deleteModel');
const deleteEntity = Symbol('deleteEntity');
const deleteAttribute = Symbol('deleteAttribute');
const deleteAssociation = Symbol('deleteAssociation');
const navigateHandler = Symbol('navigateHandler');
const navigationHandler = Symbol('navigationHandler');
const modelingActionHandler = Symbol('modelingActionHandler');
const headerTemplate = Symbol('headerTemplate');
const projectCreateDialogTemplate = Symbol('projectCreateDialogTemplate');
const navigationDrawerTemplate = Symbol('navigationDrawerTemplate');
const renderPage = Symbol('renderPage');
const moduleDetailsViewTemplate = Symbol('moduleDetailsViewTemplate');
const moduleDetailsEditorTemplate = Symbol('moduleDetailsEditorTemplate');
const modelDetailsViewTemplate = Symbol('modelDetailsViewTemplate');
const modelDetailsEditorTemplate = Symbol('modelDetailsEditorTemplate');
const entityDetailsViewTemplate = Symbol('entityDetailsViewTemplate');
const entityDetailsEditorTemplate = Symbol('entityDetailsEditorTemplate');
const attributeEditorTemplate = Symbol('attributeEditorTemplate');
const associationEditorTemplate = Symbol('associationEditorTemplate');
const projectNameEditorTemplate = Symbol('projectNameEditorTemplate');
const projectNameHeaderTemplate = Symbol('projectNameHeaderTemplate');
const mainDropdownTemplate = Symbol('mainDropdownTemplate');
const importProcessingTemplate = Symbol('importProcessingTemplate');
const breadcrumbsTemplate = Symbol('breadcrumbsTemplate');

const zoomValues = ['25%', '33%', '50%', '100%', '150%', '200%', '300%', '400%'];
// the 100% of the scale in the zoom dropdown represents this many zoom levels
const zoomFactor = 32;

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
      rootModuleId: { type: String },
      rootModule: { type: Object },
      module: { type: Object },
      moduleId: { type: String },
      renderNameDialog: { type: Boolean },
      moduleDetailsOpened: { type: Boolean },
      moduleEditorOpened: { type: Boolean },
      modelDetailsOpened: { type: Boolean },
      modelEditorOpened: { type: Boolean },
      entityDetailsOpened: { type: Boolean },
      entityEditorOpened: { type: Boolean },
      attributeEditorOpened: { type: Boolean },
      associationEditorOpened: { type: Boolean },
      projectNameEditor: { type: Boolean },
      attributeSelected: { type: String },
      associationSelected: { type: String },
      moduleSelected: { type: String },
      entitySelected: { type: String },
      dataModelSelected: { type: String },
      zoomInputValue: { type: Number },
      zoom: { type: Number },
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
    this.associationEditorOpened = false;
    this.attributeSelected = null;
    this.associationSelected = null;
    this.moduleSelected = null;
    this.entitySelected = null;
    this.dataModelSelected = null;
    this.moduleId = null;
    this.rootModuleId = null;

    this.store = new ModelingFrontStore();
    this.persistence = new StorePersistenceApi(this.store);
    this.persistence.listen();

    this[navigateHandler] = this[navigateHandler].bind(this);
    this[navigationHandler] = this[navigationHandler].bind(this);
    this[modelingActionHandler] = this[modelingActionHandler].bind(this);
    this[moduleAddHandler] = this[moduleAddHandler].bind(this);
    this[moduleDeleteHandler] = this[moduleDeleteHandler].bind(this);
    this[moduleUpdateHandler] = this[moduleUpdateHandler].bind(this);
    this[modelAddHandler] = this[modelAddHandler].bind(this);
    this[modelUpdateHandler] = this[modelUpdateHandler].bind(this);
    this[modelDeleteHandler] = this[modelDeleteHandler].bind(this);
    this[entityAddHandler] = this[entityAddHandler].bind(this);
    this[attributeAddHandler] = this[attributeAddHandler].bind(this);
    this[associationAddHandler] = this[associationAddHandler].bind(this);

    window.onunhandledrejection = this[unhandledRejectionHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('navigate', this[navigateHandler]);
    window.addEventListener(ModelingEventTypes.State.Navigation.change, this[navigationHandler]);
    window.addEventListener(ModelingEventTypes.State.Navigation.action, this[modelingActionHandler]);

    window.addEventListener(ModelingEventTypes.State.Module.created, this[moduleAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Module.deleted, this[moduleDeleteHandler]);
    window.addEventListener(ModelingEventTypes.State.Module.updated, this[moduleUpdateHandler]);
    window.addEventListener(ModelingEventTypes.State.Model.created, this[modelAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Model.updated, this[modelUpdateHandler]);
    window.addEventListener(ModelingEventTypes.State.Model.deleted, this[modelDeleteHandler]);
    window.addEventListener(ModelingEventTypes.State.Entity.created, this[entityAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Attribute.created, this[attributeAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Association.created, this[associationAddHandler]);
  }

  [unhandledRejectionHandler](e) {
    const dialog = new ModelingAlertDialog();
    dialog.message = e.reason.message;
    // @ts-ignore
    dialog.choices = ['Dismiss'];
    // @ts-ignore
    dialog.open();
  }

  [navigateHandler](e) {
    const { route, params } = e.detail;
    this.route = route;
    this.params = params;
    if (route === 'domain' && params.project) {
      this.projectId = params.project;
    }
  }

  /**
   * @param {DomainNavigationEvent} e
   */
  [navigationHandler](e) {
    const { selected, type, parent } = e.detail;
    if (type === 'module') {
      this[selectModule](selected);
    } else if (type === 'data-model') {
      this[selectDataModel](selected);
    } else if (type === 'entity') {
      this[selectEntity](selected, parent);
    } else if (type === 'project') {
      this[selectModule]();
    }
  }

  [modelingActionHandler](e) {
    const { action, property, selected, parent } = e.detail;
    switch (action) {
      case 'view': this[processViewAction](property, selected); break;
      case 'edit': this[processEditAction](property, selected, parent); break;
      case 'delete': this[processDeleteAction](property, selected); break;
      default:
    }
  }

  [processViewAction](property, selected) {
    switch (property) {
      case 'module':
        this.moduleSelected = selected;
        this.moduleDetailsOpened = true;
        break;
      case 'data-model':
        this.dataModelSelected = selected;
        this.modelDetailsOpened = true;
        break;
      case 'entity':
        this.entitySelected = selected;
        this.entityDetailsOpened = true;
        break;
      case 'attribute':
        // @todo: have a separate view just for the attribute details
        this.attributeSelected = selected;
        this.attributeEditorOpened = true;
        break;
      default:
    }
  }

  [processEditAction](property, selected, parent) {
    switch (property) {
      case 'module':
        this.moduleSelected = selected;
        this.moduleSelectedParent = parent;
        this.moduleEditorOpened = true;
        break;
      case 'data-model':
        this.dataModelSelected = selected;
        this.dataModelSelectedParent = parent;
        this.modelEditorOpened = true;
        break;
      case 'entity':
        this.entitySelected = selected;
        this.entitySelectedParent = parent;
        this.entityEditorOpened = true;
        break;
      case 'attribute':
        this.attributeSelected = selected;
        this.attributeSelectedParent = parent;
        this.attributeEditorOpened = true;
        break;
      case 'association':
        this.associationSelected = selected;
        this.associationSelectedParent = parent;
        this.associationEditorOpened = true;
        break;
      default:
    }
  }

  [processDeleteAction](property, selected) {
    switch (property) {
      case 'module': this[deleteModule](selected); break;
      case 'data-model': this[deleteModel](selected); break;
      case 'entity': this[deleteEntity](selected); break;
      case 'attribute': this[deleteAttribute](selected); break;
      case 'association': this[deleteAssociation](selected); break;
      default:
    }
  }

  clearEditorSelectionState() {
    this.associationEditorOpened = false;
    this.attributeEditorOpened = false;
    this.modelEditorOpened = false;
    this.entityEditorOpened = false;
  }

  /**
   * Selects the module in the application and render UI for it.
   *
   * @param {string=} id The ID of the module. If not set then it request for the
   * root module.
   */
  async [selectModule](id) {
    this.clearEditorSelectionState();
    const module = await this.store.getModule(id);
    this.module = module;
    this.route = 'domain';
    this.moduleId = id;
  }

  /**
   * Selects an entity as a current selection.
   * @param {string} id The id of the entity to select
   * @param {string=} parent Optional parent
   * @return {Promise<void>}
   */
  async [selectEntity](id, parent) {
    this.clearEditorSelectionState();
    this.route = 'model';
    this.entitySelected = id;
    if (parent && parent !== this.dataModelSelected) {
      this.dataModelSelected = parent;
    }
  }

  async [selectDataModel](id) {
    this.clearEditorSelectionState();
    this.route = 'model';
    this.dataModelSelected = id;
  }

  async [deleteModule](id) {
    await this.store.removeModule(id);
    if (this.moduleId === id) {
      this.moduleId = this.rootModuleId;
    }
  }

  async [deleteModel](id) {
    await this.store.removeDataModel(id);
    if (this.dataModelSelected === id) {
      this.dataModelSelected = undefined;
      this.modelEditorOpened = false;
      this.modelDetailsOpened = false;
    }
  }

  async [deleteAttribute](id) {
    await this.store.removeAttribute(id);
    if (this.attributeSelected === id) {
      this.attributeSelected = undefined;
      this.attributeEditorOpened = false;
    }
  }

  async [deleteEntity](id) {
    await this.store.removeEntity(id);
    if (this.entitySelected === id) {
      this.entitySelected = undefined;
      this.entityEditorOpened = false;
      this.entityDetailsOpened = false;
    }
  }

  async [deleteAssociation](id) {
    await this.store.removeAssociation(id);
    if (this.associationSelected === id) {
      this.associationSelected = undefined;
      this.associationEditorOpened = false;
    }
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
      this.rootModuleId = undefined;
      this.project = undefined;
      return;
    }
    const project = await this.store.getProject(id);
    const rootModuleId = this._getLinkValue(project, this.ns.aml.vocabularies.project.modules);
    const rootModule = await this.store.getModule(rootModuleId);
    this.project = project;
    this.rootModule = rootModule;
    this.rootModuleId = rootModuleId;
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
      // ModelingEvents.State.Navigation.action(this, id, 'module', 'edit');
      this.moduleEditorOpened = true;
      this.moduleSelected = id;
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
      // ModelingEvents.State.Navigation.action(this, id, 'data-model', 'edit');
      this.modelEditorOpened = true;
      this.dataModelSelected = id;
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

  /**
   * @param {DomainStateEntityCreateEvent} e
   */
  [entityAddHandler](e) {
    this.entityEditorOpened = true;
    this.entitySelected = e.detail.id;
    this.entitySelectedParent = e.detail.parent;
  }

  /**
   * @param {DomainStateAttributeCreateEvent} e
   */
  [attributeAddHandler](e) {
    this.attributeEditorOpened = true;
    this.attributeSelected = e.detail.id;
    this.attributeSelectedParent = e.detail.parent;
  }

  /**
   * @param {DomainStateAssociationCreateEvent} e
   */
  [associationAddHandler](e) {
    this.associationEditorOpened = true;
    this.associationSelected = e.detail.id;
    this.associationSelectedParent = e.detail.parent;
  }

  [newProjectRequestHandler]() {
    this.renderNameDialog = true;
  }

  [importProjectHandler]() {
    this.route = 'import';
  }

  async [restoreProjectHandler](e) {
    const { id } = e.detail;
    const project = await this.persistence.restore(id);
    this.projectId = project['@id'];
    this.route = 'domain';
  }

  async [projectSaveHandler]() {
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
  [projectNameInputHandler](e) {
    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      this[saveProjectNameHandler]();
    }
  }

  [drawerOpenedHandler](e) {
    if (e.target.opened) {
      return;
    }
    this[closeDrawerHandler](e);
  }

  [closeDrawerHandler](e) {
    const prop = e.target.dataset.property;
    this[prop] = false;
  }

  async [deleteModuleHandler](e) {
    const { moduleSelected } = this;
    if (!moduleSelected) {
      return;
    }
    this[closeDrawerHandler](e);
    await this.store.removeModule(moduleSelected);
    this.moduleSelected = null;
  }

  async [deleteModelHandler](e) {
    const { dataModelSelected } = this;
    if (!dataModelSelected) {
      return;
    }
    this[closeDrawerHandler](e);
    await this[deleteModel](dataModelSelected);
  }

  async [deleteEntityHandler](e) {
    const { entitySelected } = this;
    if (!entitySelected) {
      return;
    }
    this[closeDrawerHandler](e);
    await this.store.removeEntity(entitySelected);
    this.entitySelected = null;
  }

  async [deleteAttributeHandler](e) {
    this[closeDrawerHandler](e);
    await this.store.removeAttribute(this.attributeSelected);
    this.attributeSelected = null;
  }

  async [deleteAssociationHandler](e) {
    this[closeDrawerHandler](e);
    await this[deleteAssociation](this.associationSelected);
  }

  [editSelectedHandler](e) {
    const { property, editorProperty } = e.target.dataset;
    this[property] = false;
    this[editorProperty] = true;
  }

  async [saveModuleHandler](e) {
    const { moduleSelected } = this;
    if (!moduleSelected) {
      return;
    }
    const editor = /** @type ModuleDetailsEditorElement */ (e.target.previousElementSibling.previousElementSibling);
    if (!editor.validate()) {
      return;
    }
    this.moduleEditorOpened = false;
    const changes = editor.changelog();
    await this.store.patchModule(changes, moduleSelected, this.moduleSelectedParent);
    this.moduleSelected = null;
    this.moduleSelectedParent = null;
  }

  async [saveDataModelHandler](e) {
    const { dataModelSelected } = this;
    if (!dataModelSelected) {
      return;
    }
    const editor = /** @type ModelDetailsEditorElement */ (e.target.previousElementSibling.previousElementSibling);
    if (!editor.validate()) {
      return;
    }
    this.modelEditorOpened = false;
    const changes = editor.changelog();

    if (!changes.length) {
      return;
    }
    await this.store.patchModule(changes, dataModelSelected, this.dataModelSelectedParent);
    this.dataModelSelected = null;
    this.dataModelSelectedParent = null;
  }

  async [saveEntityHandler](e) {
    const { entitySelected } = this;
    if (!entitySelected) {
      return;
    }
    const editor = /** @type EntityEditorElement */ (e.target.previousElementSibling.previousElementSibling);
    if (!editor.validate()) {
      return;
    }
    this.entityEditorOpened = false;
    const { changelog, view } = editor.changelog();
    if (changelog.length) {
      await this.store.patchEntity(changelog, entitySelected, this.entitySelectedParent);
    }
    if (view) {
      await this.store.storeViewModel(entitySelected, this.ns.aml.vocabularies.dataModel.Entity, view, this.entitySelectedParent);
    }
    this.entitySelected = null;
    this.entitySelectedParent = null;
  }

  async [saveAttributeHandler](e) {
    const editor = /** @type AttributeEditorElement */ (e.target.previousElementSibling.previousElementSibling);
    if (!editor.validate()) {
      return;
    }
    this.attributeEditorOpened = false;
    const { view, changelog } = editor.changelog();
    if (changelog.length) {
      await this.store.patchAttribute(changelog, this.attributeSelected, this.attributeSelectedParent);
    }
    if (view) {
      await this.store.storeViewModel(this.attributeSelected, this.ns.aml.vocabularies.dataModel.AttributeProperty, view, this.attributeSelectedParent);
    }
    this.attributeSelected = null;
    this.attributeSelectedParent = null;
  }

  async [saveAssociationHandler](e) {
    const editor = /** @type AssociationEditorElement */ (e.target.previousElementSibling.previousElementSibling);
    if (!editor.validate()) {
      return;
    }
    this.associationEditorOpened = false;
    const { view, changelog } = editor.changelog();
    if (changelog.length) {
      await this.store.patchAssociation(changelog, this.associationSelected, this.associationSelectedParent);
    }
    if (view) {
      await this.store.storeViewModel(this.associationSelected, this.ns.aml.vocabularies.dataModel.AssociationProperty, view, this.associationSelectedParent);
    }
    this.associationSelected = null;
    this.associationSelectedParent = null;
  }

  [projectDblclickHandler]() {
    this.projectNameEditor = true;
  }

  async [saveProjectNameHandler]() {
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

  async [fileImportHandler](e) {
    const { type, content } = e.detail;
    this.route = 'importprocessing';
    const factory = new DomainImporter(this.store);
    try {
      this.projectId = await factory.processImport(content, type);
      this.route = 'domain';
      this.persistence.storeState();
    } catch (cause) {
      const dialog = new ModelingAlertDialog();
      dialog.message = cause.message;
      // @ts-ignore
      dialog.choices = ['Dismiss'];
      // @ts-ignore
      dialog.open();
      this.route = 'start';
    }
  }

  [mainMenuHandler](e) {
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
    this.route = null;
    this.params = null;
    this.project = null;
    this.projectId = null;
    this.moduleId = null;
    this.rootModuleId = null;
    this.moduleSelected = null;
    this.entitySelected = null;
    this.dataModelSelected = null;
    this.attributeSelected = null;
    this.associationSelected = null;
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

  [zoomInputHandler](e) {
    const input = /** @type AnypointInputComboboxElement */ (e.target);
    const { value } = input;
    const match = /(\d+)/.exec(value);
    if (!match) {
      return;
    }
    const typedValue = Number(match[1]);
    if (Number.isNaN(typedValue)) {
      return;
    }
    this.zoomInputValue = typedValue;
    const zoom = -(zoomFactor - typedValue / 100 * zoomFactor);
    this.zoom = Math.round(zoom);
  }

  [canvasZoomHandler](e) {
    const canvas = /** @type PageModelDesigner */ (e.target);
    const { zoom } = canvas;
    this.zoom = zoom;
    this.zoomInputValue = Math.round(100 + zoom/zoomFactor * 100);
  }

  render() {
    return html`
    ${this[headerTemplate]()}
    <storage-prompt></storage-prompt>
    <div class="content">
      ${this[navigationDrawerTemplate]()}
      <main>
        ${this[breadcrumbsTemplate]()}
        ${this[renderPage]()}
      </main>
    </div>
    ${this[projectCreateDialogTemplate]()}
    ${this[moduleDetailsViewTemplate]()}
    ${this[moduleDetailsEditorTemplate]()}
    ${this[modelDetailsViewTemplate]()}
    ${this[modelDetailsEditorTemplate]()}
    ${this[entityDetailsViewTemplate]()}
    ${this[entityDetailsEditorTemplate]()}
    ${this[attributeEditorTemplate]()}
    ${this[associationEditorTemplate]()}
    `;
  }

  [projectCreateDialogTemplate]() {
    const { compatibility, renderNameDialog } = this;
    if (!renderNameDialog) {
      return '';
    }
    return html`
    <anypoint-dialog ?compatibility="${compatibility}" opened>
      <h2 class="title">Add new project</h2>
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
        <anypoint-button dialog-confirm autofocus @click="${this[projectSaveHandler]}">Save</anypoint-button>
      </div>
    </anypoint-dialog>`;
  }

  [renderPage]() {
    switch (this.route) {
      case 'start':
        return html`
          <page-project-picker
            class="page"
            .store="${this.store}"
            .persistence="${this.persistence}"
            @newprojectrequested="${this[newProjectRequestHandler]}"
            @importrequested="${this[importProjectHandler]}"
            @restore="${this[restoreProjectHandler]}"></page-project-picker>
        `;
      case 'domain':
        return html`
        <module-viewer
          .moduleId="${this.moduleId || this.rootModuleId}"
          .amf="${this.project}"
          class="page-padding full-page"
        ></module-viewer>
        `;
      case 'model':
        return html`
        <page-model-designer
          .zoom="${this.zoom}"
          .dataModelId="${this.dataModelSelected}"
          @zoomchange="${this[canvasZoomHandler]}"
        >
        </page-model-designer>`;
      case 'import':
        return html`<page-import-screen
          class="page-padding full-page"
          @importprocessresult="${this[fileImportHandler]}"></page-import-screen>`;
      case 'importprocessing': return this[importProcessingTemplate]();
      default: return html`Not found`;
    }
  }

  [headerTemplate]() {
    const { route } = this;
    if (['domain', 'model'].indexOf(route) === -1) {
      return '';
    }
    const { projectNameEditor } = this;
    return html`
    <header>
      ${projectNameEditor ? this[projectNameEditorTemplate]() : this[projectNameHeaderTemplate]()}
      <span class="spacer"></span>
      ${this[zoomSelectionTemplate]()}
      ${this[mainDropdownTemplate]()}
    </header>`;
  }

  [mainDropdownTemplate]() {
    return html`<anypoint-menu-button horizontalAlign="right" horizontalOffset="12" closeOnActivate @select="${this[mainMenuHandler]}">
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

  [projectNameHeaderTemplate]() {
    const { projectName } = this;
    return html`<h2 class="project-name" @click="${this[projectDblclickHandler]}">${projectName}</h2>`;
  }

  [projectNameEditorTemplate]() {
    const { projectName } = this;
    return html`
    <div class="name-editor">
      <anypoint-input .value="${projectName}" nolabelfloat outlined class="new-name-input" @keydown="${this[projectNameInputHandler]}">
        <label slot="label">Project name</label>
      </anypoint-input>
      <anypoint-button emphasis="high" @click="${this[saveProjectNameHandler]}">Save</anypoint-button>
    </div>`;
  }

  [navigationDrawerTemplate]() {
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

  [moduleDetailsViewTemplate]() {
    const {
      compatibility,
      moduleDetailsOpened,
      moduleSelected,
    } = this;
    const opened = !!moduleSelected && moduleDetailsOpened;
    return html`<editor-drawer
      ?opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
      data-property="moduleDetailsOpened"
      >
      <h5 slot="title">Module details</h5>
      <module-details-view
        .moduleId="${moduleSelected}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></module-details-view>
      <anypoint-button
        data-property="moduleDetailsOpened"
        @click="${this[deleteModuleHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <div class="flex-last" slot="action">
        <anypoint-button
          @click="${this[closeDrawerHandler]}"
          data-property="moduleDetailsOpened"
        >Close</anypoint-button>
        <anypoint-button
          emphasis="high"
          data-property="moduleDetailsOpened"
          data-editor-property="moduleEditorOpened"
          @click="${this[editSelectedHandler]}"
        >Edit</anypoint-button>
      </div>
    </editor-drawer>`;
  }

  [moduleDetailsEditorTemplate]() {
    const {
      compatibility,
      moduleEditorOpened,
      moduleSelected,
    } = this;
    const opened = !!moduleSelected && !!moduleEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
      data-property="moduleEditorOpened"
    >
      <h5 slot="title">Edit module details</h5>
      <module-details-editor
        .moduleId="${moduleSelected}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></module-details-editor>
      <anypoint-button
        data-property="moduleEditorOpened"
        @click="${this[deleteModuleHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this[saveModuleHandler]}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }

  [modelDetailsViewTemplate]() {
    const {
      compatibility,
      modelDetailsOpened,
      dataModelSelected,
    } = this;
    const opened = !!dataModelSelected && modelDetailsOpened;
    return html`<editor-drawer
      ?opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
      data-property="modelDetailsOpened"
      >
      <h5 slot="title">Data model details</h5>
      <model-details-view
        .dataModelId="${dataModelSelected}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></model-details-view>
      <anypoint-button
        data-property="modelDetailsOpened"
        @click="${this[deleteModelHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <div class="flex-last" slot="action">
        <anypoint-button
          @click="${this[closeDrawerHandler]}"
          data-property="modelDetailsOpened"
        >Close</anypoint-button>
        <anypoint-button
          emphasis="high"
          data-property="modelDetailsOpened"
          data-editor-property="modelEditorOpened"
          @click="${this[editSelectedHandler]}"
        >Edit</anypoint-button>
      </div>
    </editor-drawer>`;
  }

  [modelDetailsEditorTemplate]() {
    const {
      compatibility,
      modelEditorOpened,
      dataModelSelected,
    } = this;
    const opened = !!dataModelSelected && !!modelEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
      data-property="modelEditorOpened"
    >
      <h5 slot="title">Edit data model</h5>
      <model-details-editor
        .dataModelId="${dataModelSelected}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></model-details-editor>
      <anypoint-button
        data-property="modelEditorOpened"
        @click="${this[deleteModelHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this[saveDataModelHandler]}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }

  [entityDetailsViewTemplate]() {
    const {
      compatibility,
      entityDetailsOpened,
      entitySelected,
    } = this;
    const opened = !!entitySelected && entityDetailsOpened;
    return html`<editor-drawer
      ?opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
      data-property="entityDetailsOpened"
      >
      <h5 slot="title">Entity details</h5>
      <entity-details-view
        .entityId="${entitySelected}"
        ?compatibility="${compatibility}"
        class="inner-editor-padding"
      ></entity-details-view>
      <anypoint-button
        data-property="entityDetailsOpened"
        @click="${this[deleteEntityHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <div class="flex-last" slot="action">
        <anypoint-button
          @click="${this[closeDrawerHandler]}"
          data-property="entityDetailsOpened"
        >Close</anypoint-button>
        <anypoint-button
          emphasis="high"
          data-property="entityDetailsOpened"
          data-editor-property="entityEditorOpened"
          @click="${this[editSelectedHandler]}"
        >Edit</anypoint-button>
      </div>
    </editor-drawer>`;
  }

  [entityDetailsEditorTemplate]() {
    const {
      compatibility,
      entityEditorOpened,
      entitySelected,
    } = this;
    const opened = !!entitySelected && !!entityEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
      data-property="entityEditorOpened"
    >
      <h5 slot="title">Edit entity details</h5>
      <entity-editor
        .entityId="${entitySelected}"
        ?compatibility="${compatibility}"
      ></entity-editor>
      <anypoint-button
        data-property="entityEditorOpened"
        @click="${this[deleteEntityHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this[saveEntityHandler]}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }

  [importProcessingTemplate]() {
    return html`
    <div class="title-line">
      <h2>Processing files</h2>
      <progress></progress>
    </div>
    `;
  }

  [attributeEditorTemplate]() {
    const {
      compatibility,
      attributeEditorOpened,
      attributeSelected,
    } = this;
    const opened = !!attributeSelected && !!attributeEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
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
        @click="${this[deleteAttributeHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this[saveAttributeHandler]}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }

  [associationEditorTemplate]() {
    const {
      compatibility,
      associationEditorOpened,
      associationSelected,
    } = this;
    const opened = !!associationSelected && !!associationEditorOpened;
    return html`<editor-drawer
      .opened="${opened}"
      @openedchange="${this[drawerOpenedHandler]}"
      data-property="associationEditorOpened"
    >
      <h5 slot="title">Edit association</h5>
      <association-editor
        .associationId="${associationSelected}"
        ?compatibility="${compatibility}"
        class=""
      ></association-editor>
      <anypoint-button
        data-property="associationEditorOpened"
        @click="${this[deleteAssociationHandler]}"
        slot="action"
      >Delete</anypoint-button>
      <anypoint-button
        slot="action"
        class="flex-last"
        emphasis="high"
        @click="${this[saveAssociationHandler]}"
      >Save</anypoint-button>
    </editor-drawer>`;
  }

  [zoomSelectionTemplate]() {
    if (this.route !== 'model') {
      return '';
    }
    const { zoomInputValue=100 } = this;
    const value = `${zoomInputValue}`;
    return html`
    <anypoint-input-combobox
      .value="${value}"
      noLabelFloat
      noOverlap
      @input="${this[zoomInputHandler]}"
      class="zoom-input"
    >
      <label slot="label">Zoom</label>
      <span slot="suffix">%</span>
      <anypoint-listbox slot="dropdown-content" tabindex="-1">
      ${zoomValues.map((v) => html`<anypoint-item label="${v}">${v}</anypoint-item>`)}
      </anypoint-listbox>
    </anypoint-input-combobox>
    `;
  }

  [breadcrumbsTemplate]() {
    return html`<modeling-breadcrumbs ?compatibility="${this.compatibility}"></modeling-breadcrumbs>`;
  }
}
