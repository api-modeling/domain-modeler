import { css } from 'lit-element';

export default css`
:host {
  /* height: 100%; */
  display: flex;
  flex-direction: column;
  --modeling-drawer-width: 320px;
  overflow: hidden;
  position: relative;
}

h2 {
  font-size: var(--theme-h2-font-size, 56px);
  font-weight: var(--theme-h2-font-weight, 200);
  color: var(--theme-h1-color, currentColor);
}

h2.title {
  font-size: 1.25rem;
  line-height: 2rem;
  font-weight: 500;
}

.title-line {
  padding: 60px 0;
  margin: 0;
  text-align: center;
}

header {
  height: 64px;
  background-color: #D7D7D7;
  display: flex;
  flex-direction: row;
  align-items: center;
}

.content {
  display: flex;
  flex-direction: row;
  height: 100%;
}

nav {
  background-color: #F7F7F7;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #E5E5E5;
  height: 100%;
  overflow: auto;
}

.page {
  flex: 1;
}

.project-input {
  width: 320px;
}

.project-name {
  margin: 0;
  padding: 4px;
  margin-left: 20px;
  font-size: 24px;
  font-weight: 400;
  user-select: none;
  cursor: text;
  border: 1px transparent solid;
}

.project-name:hover {
  border: 1px #9E9E9E solid;
}

.inner-editor-padding {
  padding: 16px;
}

.flex-last {
  margin-left: auto;
}

.page-padding {
  padding: 24px;
  box-sizing: border-box;
}

.name-editor {
  display: flex;
  align-items: center;
}

.full-page {
  height: 100%;
  width: 100%;
}

.spacer {
  flex: 1;
  display: block;
}

.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.zoom-input {
  width: 92px;
}
`;
