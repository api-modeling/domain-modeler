import { html, css, LitElement } from 'lit-element';
import { ScopedElementsMixin } from '@open-wc/scoped-elements';
import { WelcomeScreen } from '@api-modeling/modeling-project-ui';
import { AnypointDialog } from '@anypoint-web-components/anypoint-dialog';
import { AnypointInput } from '@anypoint-web-components/anypoint-input';
import { AnypointButton } from '@anypoint-web-components/anypoint-button';

/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */

export class PageProjectPicker extends ScopedElementsMixin(LitElement) {
  static get styles() {
    return css``;
  }

  static get scopedElements() {
    return {
      'welcome-screen': WelcomeScreen,
      'anypoint-dialog': AnypointDialog,
      'anypoint-input': AnypointInput,
      'anypoint-button': AnypointButton,
    };
  }

  static get properties() {
    return {
      compatibility: { type: Boolean },
      projectName: { type: String },
      renderNameDialog: { type: Boolean },
    }
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

  constructor() {
    super();
    this.compatibility = false;
    this.renderNameDialog = false;
    this.projectName = '';
  }

  _startNew() {
    this.renderNameDialog = true;
  }

  _nameHandler(e) {
    this.projectName = e.target.value;
  }

  async _projectSaveHandler() {
    const { projectName, store } = this;
    if (!projectName) {
      return;
    }
    await store.initStore();
    const pid = await store.addProject({
      name: projectName,
    });
    await store.addModule(pid, {
      name: 'root module'
    });
    // this.navigate(`domain/${encodeURIComponent(pid)}`);
    this.dispatchEvent(new CustomEvent('navigate', {
      bubbles: true,
      composed: true,
      detail: {
        route: 'domain',
        params: {
          project: pid
        }
      }
    }));
  }

  render() {
    const { compatibility } = this;
    return html`<welcome-screen
      recent
      @new="${this._startNew}"
      ?compatibility="${compatibility}"
    >
    </welcome-screen>
    ${this._dialogTemplate()}`;
  }

  _dialogTemplate() {
    const { compatibility, projectName, renderNameDialog } = this;
    if (!renderNameDialog) {
      return '';
    }
    return html`<anypoint-dialog ?compatibility="${compatibility}" opened>
      <h2>Add new project</h2>
      <div>
        <anypoint-input
          class="text-input"
          name="project-name"
          required
          autovalidate
          invalidmessage="A name is required"
          .value="${projectName}"
          @input="${this._nameHandler}"
          ?compatibility="${compatibility}"
        >
          <label slot="label">Project name</label>
        </anypoint-input>
      </div>
      <div class="buttons">
        <anypoint-button dialog-dismiss>Cancel</anypoint-button>
        <anypoint-button dialog-confirm autofocus @click="${this._projectSaveHandler}">Save</anypoint-button>
      </div>
    </anypoint-dialog>`;
  }
}
