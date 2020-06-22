import { html, css, LitElement } from 'lit-element';
import { ArcOverlayMixin } from '@advanced-rest-client/arc-overlay-mixin';
import dialogStyles from '@anypoint-web-components/anypoint-dialog/src/AnypointDialogInternalStyles.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';

const hasSupport = !!navigator.storage && !!navigator.storage.persisted &&
  // @ts-ignore
  !!navigator.permissions && !!navigator.permissions.query;

export class StoragePrompt extends ArcOverlayMixin(LitElement) {
  static get styles() {
    return [
      dialogStyles,
      css`
      .content {
        max-width: 600px;
      }`
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    this.requestStorage();
  }

  async requestStorage() {
    if (!hasSupport) {
      return;
    }
    const persisted = await navigator.storage.persisted();
    // @ts-ignore
    const permission = await navigator.permissions.query({name: "persistent-storage"});
    if (!persisted && permission.status === 'granted') {
      this._notifyGranted();
    } else if (!persisted && permission.state === "prompt") {
      this.opened = true;
    }
  }

  async _requestPersist() {
    const persist = await navigator.storage.persist();
    if (persist) {
      this._notifyGranted();
      this.opened = false;
    }
  }

  _notifyGranted() {
    this.dispatchEvent(new CustomEvent('storagegranted'));
  }

  render() {
    return html`
    <div class="title">Enable storage for storing data</div>
    <div class="content">
      <p>
        This application may store significant amount of data on your device.
        In order to persists your data locally allow this application to store
        data in secured partition.
      </p>
    </div>
    <div class="buttons">
      <anypoint-button @click="${this.close}">Close</anypoint-button>
      <anypoint-button @click="${this._requestPersist}">Allow</anypoint-button>
    </div>
    `;
  }
}
