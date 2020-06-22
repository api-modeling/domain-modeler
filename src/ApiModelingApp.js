import { LitElement, html, css } from 'lit-element';
import { ModelingFrontStore } from '@api-modeling/modeling-front-store';
import { ModelingEventTypes } from  '@api-modeling/modeling-events';
import { ModuleMixin } from '@api-modeling/modeling-amf-mixin';
// pages
import './packages/projects/page-project-picker.js';
import './packages/domain/page-domain-explorer.js';

const projectIdValue = Symbol('projectIdValue');
const requestProject = Symbol('requestProject');

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
    `;
  }

  static get properties() {
    return {
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
    this.route = 'start';
    this.params = {};
    this.query = {};
    this._clickHandler = this._clickHandler.bind(this);

    this.store = new ModelingFrontStore();

    this._navigateHandler = this._navigateHandler.bind(this);
    this._navigationHandler = this._navigationHandler.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('click', this._clickHandler);
    this.addEventListener('navigate', this._navigateHandler);
    window.addEventListener(ModelingEventTypes.State.Navigation.change, this._navigationHandler);
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

  _renderPage() {
    switch (this.route) {
      case 'start':
        return html`
          <page-project-picker class="page" .store="${this.store}"></page-project-picker>
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
    <header>
    </header>
    <main>
      ${this._renderPage()}
    </main>
    `;
  }
}
