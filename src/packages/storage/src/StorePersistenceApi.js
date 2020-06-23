import { ModelingEventTypes } from  '@api-modeling/modeling-events';
import 'pouchdb/dist/pouchdb.min.js';
import 'pouchdb/dist/pouchdb.find.min.js';

const eventsTargetValue = Symbol('eventsTargetValue');
const changeHandler = Symbol('changeHandler');

/* global MetaStore, PouchDB */

/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */
/** @typedef {import('../types').RecentProjectsQueryOptions} RecentProjectsQueryOptions */
/** @typedef {import('../types').RecentProjectsQueryResult} RecentProjectsQueryResult */

let listening = false;

/**
 * While modeling-frontent-storage module acts as a bridge between the front end
 * the the low-level storage, this module is designed to function as a persistence layer for the
 * application data.
 *
 * If automatically stores the state in the application store when data change
 * in PouchDB wrapper for IndexedDB. This is then used to recall "recent"
 * projects, restore state, support revisions, and replication with CouchDB
 * data stores.
 *
 * Basic setup:
 *
 * ```javascript
 * const persistence = new StorePersistenceApi(new ModelingFrontStore());
 * persistence.listen();
 *
 * ...
 *
 * const queryResult = await persistence.recent();
 *
 * ...
 *
 * const project = await persistence.restore(queryResult.items[0]._id);
 * ```
 */
export class StorePersistenceApi {
  /**
   * @param {ModelingFrontStore} api An instance of the modeling front store
   * @param {EventTarget=} eventsTarget A node to listen to modeling events.
   */
  constructor(api, eventsTarget=window) {
    this.api = api;
    this[eventsTargetValue] = eventsTarget;
    this[changeHandler] = this[changeHandler].bind(this);

    this.offlineStore = new PouchDB('offline-domain-project');
    this.offlineStoreIndex = new PouchDB('offline-domain-project-index');
  }

  /**
   * Starts listening to modeling state events and calls change function to store the state
   * when an event is triggered.
   */
  listen() {
    if (listening) {
      return;
    }
    listening = true;
    const node = this[eventsTargetValue];
    node.addEventListener(ModelingEventTypes.State.Module.created, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Model.created, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Entity.created, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Attribute.created, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Association.created, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Module.deleted, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Model.deleted, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Entity.deleted, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Attribute.deleted, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Association.deleted, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Module.updated, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Model.updated, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Entity.updated, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Attribute.updated, this[changeHandler]);
    node.addEventListener(ModelingEventTypes.State.Association.updated, this[changeHandler]);
  }

  /**
   * Removes previosult registered event listeners.
   */
  unlisten() {
    listening = false;
    const node = this[eventsTargetValue];
    node.removeEventListener(ModelingEventTypes.State.Module.created, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Model.created, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Entity.created, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Attribute.created, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Association.created, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Module.deleted, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Model.deleted, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Entity.deleted, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Attribute.deleted, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Association.deleted, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Module.updated, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Model.updated, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Entity.updated, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Attribute.updated, this[changeHandler]);
    node.removeEventListener(ModelingEventTypes.State.Association.updated, this[changeHandler]);
  }

  async [changeHandler]() {
    await this.storeState();
  }

  /**
   * Stores current store state in the local storage
   * @return {Promise<void>}
   */
  async storeState() {
    const { data, id, name } = await this.gatherInfo();
    await this.storeOfflineProject(data, id);
    await this.offlineStoreIndex.createIndex({
      index: {
        fields: ['name', 'time']
      }
    });
    await this.storeOfflineIndexProject(name, id);
  }

  async storeOfflineProject(data, id) {
    let rev;
    try {
      const response = await this.offlineStore.allDocs({ key: id });
      rev = response.rows[0].value.rev;
    } catch (_) {
      // ..
    }
    const putData = {
      _id: id,
      data,
      time: Date.now(),
    };
    if (rev) {
      putData._rev = rev;
    }
    await this.offlineStore.put(putData);
  }

  async storeOfflineIndexProject(name, id) {
    let rev;
    try {
      const response = await this.offlineStoreIndex.allDocs({ key: id });
      rev = response.rows[0].value.rev;
    } catch (_) {
      // ..
    }
    const putData = {
      _id: id,
      name,
      time: Date.now(),
    };
    if (rev) {
      putData._rev = rev;
    }
    await this.offlineStoreIndex.put(putData);
  }

  async gatherInfo() {
    // @ts-ignore
    const projectModel = await MetaStore.get();
    const [project] = projectModel;
    const name = this.api._getValue(project, this.api.ns.aml.vocabularies.core.name);
    // @ts-ignore
    const data = await MetaStore.retrieveStore();
    return {
      data,
      name,
      id: project['@id'],
    }
  }

  /**
   * Reads a list of recent projects.
   *
   * @param {RecentProjectsQueryOptions=} opts
   * @return {Promise<RecentProjectsQueryResult>}
   */
  async recent(opts={}) {
    const options = { ...opts };
    options.limit = options.limit || 25;
    const response = await this.offlineStoreIndex.allDocs({ ...options, include_docs: true });
    const result = {
      options,
      items: []
    };
    if (response && response.rows.length > 0) {
      options.startkey = response.rows[response.rows.length - 1].id;
      options.skip = 1;
      response.rows.forEach((item) => {
        if (!item.key.startsWith('_design')) {
          result.items.push(item.doc);
        }
      });
    }
    return result;
  }

  async restore(id) {
    await this.resetStore();
    const doc = await this.offlineStore.get(id);
    // @ts-ignore
    await MetaStore.loadStore(doc.data);
    // @ts-ignore
    const projectResult = await MetaStore.get();
    const [project] = projectResult;
    return project;
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

  /**
   * Removes a project from the stores.
   * @return {Promise<void>}
   */
  async deleteProject(id) {
    try {
      // This is in the try block in case if for any reason
      // both stores got desynchronized. Remove index so it won't
      // be shown in the recents.
      const dataResult = await this.offlineStore.allDocs({ key: id });
      const dataRev = dataResult.rows[0].value.rev;
      await this.offlineStore.remove(id, dataRev);
    } catch (e) {
      // ..
    }
    const response = await this.offlineStoreIndex.allDocs({ key: id });
    const { rev } = response.rows[0].value;
    await this.offlineStoreIndex.remove(id, rev);
  }
}
