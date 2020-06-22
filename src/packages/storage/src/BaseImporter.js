/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */
/* global MetaStore */

export class BaseImporter {
  /**
   * @param {ModelingFrontStore} api An instance of the modeling front store
   */
  constructor(api) {
    this.api = api;
  }

  /**
   * Resets the state of the store to nothing.
   * @return {Promise<void>}
   */
  async resetStore() {
    await this.api.initStore();
    try {
      // @ts-ignore
      const projectResult = await MetaStore.get();
      const [project] = projectResult;
      if (!project) {
        return;
      }
      // @ts-ignore
      await MetaStore.deleteThis(project['@id']);
    } catch (e) {
      // console.error(e);
    }
  }
}
