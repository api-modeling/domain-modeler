import { NativeImporter } from './NativeImporter.js';

/** @typedef {import('@api-modeling/modeling-front-store').ModelingFrontStore} ModelingFrontStore */
/** @typedef {import('../types').ContentFile} ContentFile */


export class DomainImporter {
  /**
   * @param {ModelingFrontStore} api An instance of the modeling front store
   */
  constructor(api) {
    this.api = api;
  }

  /**
   * Performs an import of an external domain.
   * @param {ContentFile[]} files Imported files with content
   * @param {string} type Import data type.
   * @return {Promise<string>} Promise resolved to the ID of created project
   */
  async processImport(files, type) {
    switch (type) {
      case 'ld+graph': return this.importNative(files);
      default: throw new Error(`Unknown import format ${type}`);
    }
  }

  /**
   * Performs an import on a native ld+graph files.
   * @param {ContentFile[]} files Imported files with content
   * @return {Promise<string>} Promise resolved to the ID of created project
   */
  async importNative(files) {
    const importer = new NativeImporter(this.api);
    return importer.process(files);
  }
}
