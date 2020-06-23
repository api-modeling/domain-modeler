import PlainAlertDialog from "elix/src/plain/PlainAlertDialog.js";
import { defaultState, template } from "elix/src/base/internal.js";
import { fragmentFrom } from "elix/src/core/htmlLiterals.js";
import { AnypointButton } from '@anypoint-web-components/anypoint-button';

const messageValue = Symbol('messageValue');

export default class ModelingAlertDialog extends PlainAlertDialog {
  get [defaultState]() {
    return {
      ...super[defaultState],
      choiceButtonPartType: AnypointButton,
    }
  }

  get [template]() {
    const result = super[template];
    const content = result.content.querySelector('#alertDialogContent');
    content.insertAdjacentHTML('afterbegin', '<h2 class="error-title">An error ocurred</h2>');
    result.content.append(
      fragmentFrom.html`
        <style>
          [part~="frame"] {
            padding: 1em;
            font-family: monospace;
            background-color: #F44336;
            color: #fff;
          }

          [part~="choice-button-container"] {
            margin-top: 2em;
          }

          [part~="choice-button"] {
            color: white;
          }

          .error-title {
            font-family: Roboto;
            font-size: 1.5rem;
            font-weight: 400;
            margin-bottom: 2rem;
          }
        </style>
      `
    );
    return result;
  }

  get message() {
    return this[messageValue];
  }

  set message(value) {
    const old = this[messageValue];
    if (old === value) {
      return;
    }
    this[messageValue] = value;
    this.textContent = value;
  }
}
