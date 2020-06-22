import { LitElement, html, css } from 'lit-element';
import { ModelingFrontStore } from '@api-modeling/modeling-front-store';
import { ModelingEventTypes } from  '@api-modeling/modeling-events';
import { ModuleMixin } from '@api-modeling/modeling-amf-mixin';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog.js';
import '@anypoint-web-components/anypoint-input/anypoint-input.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
// pages
import './packages/projects/page-project-picker.js';
import './packages/domain/page-domain-explorer.js';

/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleCreateEvent} DomainStateModuleCreateEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleDeleteEvent} DomainStateModuleDeleteEvent */
/** @typedef {import('@api-modeling/modeling-events').Events.DomainStateModuleUpdateEvent} DomainStateModuleUpdateEvent */

const projectIdValue = Symbol('projectIdValue');
const requestProject = Symbol('requestProject');
const moduleAddHandler = Symbol('moduleAddHandler');
const moduleDeleteHandler = Symbol('moduleDeleteHandler');
const moduleUpdateHandler = Symbol('moduleUpdateHandler');

export class ApiModelingApp extends ModuleMixin(LitElement) {
  static get styles() {
    return css`
    :host {
      height: 100%;
      display: block;
    }

    main {
      height: 100%;
      display: block;
    }

    .page {
      height: 100%;
    }

    .project-input {
      width: 320px;
    }
    `;
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      params: { type: Object },
      query: { type: Object },
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
    };
  }

  static get routes() {
    return [{
      name: 'start',
      pattern: '',
      data: { title: 'Start' }
    }, {
      name: 'start',
      pattern: 'start',
      data: { title: 'Start' }
    }, {
      name: 'domain',
      pattern: '/domain/:domain'
    }, {
      name: 'not-found',
      pattern: '*'
    }];
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

  constructor() {
    super();
    this.compatibility = false;
    this.route = 'start';
    this.params = {};
    this.query = {};
    this.renderNameDialog = false;
    this._clickHandler = this._clickHandler.bind(this);

    this.store = new ModelingFrontStore();

    this._navigateHandler = this._navigateHandler.bind(this);
    this._navigationHandler = this._navigationHandler.bind(this);

    this[moduleAddHandler] = this[moduleAddHandler].bind(this);
    this[moduleDeleteHandler] = this[moduleDeleteHandler].bind(this);
    this[moduleUpdateHandler] = this[moduleUpdateHandler].bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._clickHandler);
    this.addEventListener('navigate', this._navigateHandler);
    window.addEventListener(ModelingEventTypes.State.Navigation.change, this._navigationHandler);

    window.addEventListener(ModelingEventTypes.State.Module.created, this[moduleAddHandler]);
    window.addEventListener(ModelingEventTypes.State.Module.deleted, this[moduleDeleteHandler]);
    window.addEventListener(ModelingEventTypes.State.Module.updated, this[moduleUpdateHandler]);
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
    if (e.detail.type === 'module') {
      this._selectModule(e.detail.selected);
    }
  }

  async _selectModule(id) {
    const module = await this.store.getModule(id);
    this.module = module;
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
    if (!this.rootModule) {
      return;
    }
    const { parent } = e.detail;
    if (this.rootModule['@id'] !== parent) {
      return;
    }
    this[requestProject](this.projectId);
  }

  [moduleDeleteHandler]() {
    if (!this.rootModule) {
      return;
    }
    this[requestProject](this.projectId);
  }

  [moduleUpdateHandler]() {
    if (!this.rootModule) {
      return;
    }
    this[requestProject](this.projectId);
  }

  _clickHandler(e) {
    if (!e.composed) {
      return;
    }
    const path = e.composedPath();
    const anchor = path.find((node) => node.nodeName === 'A');
    if (!anchor) {
      return;
    }
    const href = anchor.getAttribute('href');
    if (!href) {
      return;
    }
    if (anchor.href.indexOf(window.location.host) !== 0) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.navigate(href);
  }

  _newProjectRequestHandler() {
    this.renderNameDialog = true;
  }

  async _projectSaveHandler() {
    const nameInput = this.shadowRoot.querySelector('[name="project-name"]');
    if (!nameInput.value) {
      return;
    }
    const descInput = this.shadowRoot.querySelector('[name="project-description"]');
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
            @newprojectrequested="${this._newProjectRequestHandler}"></page-project-picker>
        `;
      case 'domain':
        return html`
          <page-domain-explorer class="page" .module="${this.module}" .project="${this.project}" .rootModule="${this.rootModule}"></page-domain-explorer>
        `;
      default: return html`Not found`;
    }
  }

  render() {
    return html`
    ${this._projectCreateDialogTemplate()}
    <main>
      ${this._renderPage()}
    </main>
    `;
  }
}
