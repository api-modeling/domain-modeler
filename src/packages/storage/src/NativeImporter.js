import { BaseImporter } from './BaseImporter.js';
/* eslint-disable no-param-reassign */

/* global MetaStore */
/** @typedef {import('../types').ContentFile} ContentFile */

/**
 * A class responsible for importing a native ld+graph data into the store.
 */
export class NativeImporter extends BaseImporter {
  /**
   * Performs an import on a native ld+graph files.
   * @param {ContentFile[]} files Imported files with content
   * @return {Promise<string>}
   */
  async process(files) {
    const { modules, entities, ids } = this.computeAtoms(files);

    await this.resetStore();
    // @todo(Pawel): can module be only one file? If so should the ID of the
    // projject be taken from that file?
    const projectId = await this.api.addProject();
    // console.log('has project', projectId);
    // console.log('creeating modules', modules);
    const mps = modules.map((mod) => {
      const id = ids[mod['@id']] || projectId;
      // @ts-ignore
      return MetaStore.post(mod, id);
    });
    await Promise.all(mps);
    const eps = entities.map((mod) => {
      const entId = mod['@id'];
      const id = ids[entId];
      // @ts-ignore
      return MetaStore.post(mod, id);
    });
    await Promise.all(eps);
    return projectId;
  }

  /**
   * Reads file data and categorizes them by type to determine import order.
   *
   * @param {ContentFile[]} files Imported files with content
   * @return {object}
   */
  computeAtoms(files) {
    // This has to be done in order. Modules first, then entity groups
    const modules = [];
    const entities = [];
    const flat = files.reduce((acc, file) => {
      const result = this.unwrap(file.content);
      return acc.concat(result);
    }, []);
    const ids = this.mapIds(flat);
    const { api } = this;
    flat.forEach((item) => {
      if (api._hasType(item, api.ns.aml.vocabularies.modularity.Module)) {
        modules.push(item);
      } else {
        entities.push(item);
      }
    });
    return {
      modules,
      entities,
      ids,
    };
  }

  /**
   * @param {string} content file content
   * @return {object[]}
   */
  unwrap(content) {
    const model = JSON.parse(content);
    const result = [];
    model.forEach((dialectItem) => {
      const item = this.api._computeEncodes(dialectItem);
      result.push(item);
    });
    return result;
  }

  /**
   * Creates a flat map of children mapped to it's parent IDs.
   * @param {object} node Current iterable object
   * @param {object=} result init object
   * @return {object} The resulting map.
   */
  mapIds(node, result = {}) {
    if (Array.isArray(node)) {
      node.forEach((item) => {
        result = this.mapIds(item, result);
      });
      return result;
    }
    const id = node['@id'];
    const mkey = this.api._getAmfKey(this.api.ns.aml.vocabularies.modularity.modules);
    if (Array.isArray(node[mkey])) {
      node[mkey].forEach((mod) => {
        result[mod['@id']] = id;
        result = this.mapIds(mod, result);
      });
    }
    const mokey = this.api._getAmfKey(this.api.ns.aml.vocabularies.modularity.dataModels);
    if (Array.isArray(node[mokey])) {
      node[mokey].forEach((mod) => {
        result[mod['@id']] = id;
        result = this.mapIds(mod, result);
      });
    }
    const ekey = this.api._getAmfKey(this.api.ns.aml.vocabularies.dataModel.entities);
    if (Array.isArray(node[ekey])) {
      node[ekey].forEach((mod) => {
        result[mod['@id']] = id;
        result = this.mapIds(mod, result);
      });
    }
    const askey = this.api._getAmfKey(this.api.ns.aml.vocabularies.dataModel.associations);
    if (Array.isArray(node[askey])) {
      node[askey].forEach((mod) => {
        result[mod['@id']] = id;
        result = this.mapIds(mod, result);
      });
    }
    const atkey = this.api._getAmfKey(this.api.ns.aml.vocabularies.dataModel.attributes);
    if (Array.isArray(node[atkey])) {
      node[atkey].forEach((mod) => {
        result[mod['@id']] = id;
        result = this.mapIds(mod, result);
      });
    }
    return result;
  }
}
