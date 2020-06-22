import { html, css, LitElement } from 'lit-element';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';

/**
 * @typedef {import('../types').ContentFile} ContentFile
 */

export class ImportScreen extends LitElement {
  static get styles() {
    return css`
    :host {
      display: block;
      background-color: white;
      height: 100%;
    }

    h2 {
      font-size: var(--theme-h2-font-size, 56px);
      font-weight: var(--theme-h2-font-weight, 200);
      color: var(--theme-h1-color, currentColor);
    }

    .title-line {
      padding: 60px 0;
      margin: 0;
      text-align: center;
    }

    .notice {
      text-align: center;
      color: rgba(0, 0, 0, 0.74);
    }

    .button {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 40px;
    }`;
  }

  static get properties() {
    return {
      processing: { type: Boolean },
      tasks: { type: Number },
      completed: { type: Number },
    }
  }

  constructor() {
    super();
    this.processing = false;
  }

  selectHandler() {
    const input = /** @type HTMLInputElement */ (this.shadowRoot.querySelector('input[type="file"]'));
    input.click();
  }

  async filesHandler(e) {
    const node = /** @type HTMLInputElement */ (e.target);
    const {files} = node;
    if (!files.length) {
      return;
    }
    this.tasks = files.length;
    this.completed = 0;
    this.processing = true;
    const result = await this.filesToContent(Array.from(files));
    this.dispatchEvent(new CustomEvent('importprocessresult', {
      detail: {
        content: result,
        type: 'ld+graph'
      }
    }));
    this.processing = false;
  }

  /**
   * Reads a single file to string
   * @param {File} file A file to process
   * @return {Promise<ContentFile>} File content
   */
 async readFile(file) {
   return new Promise((resolve) => {
     const info = {
       lastModified: file.lastModified,
       name: file.name,
       size: file.size,
       type: file.type,
       content: ''
     };
     const reader = new FileReader();
     reader.onload = (e) => {
      const t = /** @type FileReader */ (e.target);
      info.content = String(t.result);
      this.completed++;
      resolve(info);
     };
     reader.readAsText(file);
   });
 }

 /**
  * Processes files to read it's content and returns file like object with the `content` property.
  * @param {File[]} files List of files to process.
  * @return {Promise<ContentFile[]>} File like object with `content` property.
  */
 async filesToContent(files) {
   const ps = files.map((file) => this.readFile(file));
   return Promise.all(ps);
 }

  render() {
    const { processing } = this;
    return html`
    <div class="title-line">
      <h2>Open your domain model</h2>
    </div>
    <p class="notice">
      Select files to be imported to the application.<br/>
      Currently only native (internal) format is supported.
    </p>
    <div class="button">
      ${processing ?
        html`<progress max="${this.tasks}" value="${this.completed}"></progress>` :
        html`<anypoint-button @click="${this.selectHandler}" emphasis="high">Select file(s)</anypoint-button>`
      }
    </div>
    <input hidden type="file" accept=".json,.jsonld" @change="${this.filesHandler}" multiple/>
    `;
  }
}
