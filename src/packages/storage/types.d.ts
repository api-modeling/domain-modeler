export declare interface ContentFile {
  lastModified: string;
  name: string;
  type: string;
  content: string;
  size: number;
}

export declare interface RecentIndexItem {
  /**
   * The name of created project
   */
  name: string;
  /**
   * Timestamp when the project was created
   */
  time: number;
  /**
   * The ID of the project
   */
  _id: string;
}

export declare interface RecentProjectsQueryOptions {
  /**
   * Number of records in the response. Default to 25.
   */
  limit?: number;
  /**
   * Start key returned by the previous response
   */
  startkey?: string;
  /**
   * PouchDB pagination option.
   */
  skip?: number;
}

export declare interface RecentProjectsQueryResult {
  /**
   * Options to be passed to the next page query
   */
  options: RecentProjectsQueryOptions;
  /**
   * List of items returned by the query.
   */
  items: RecentIndexItem[];
}
