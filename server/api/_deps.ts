export { join, get_entries } from "../deps.ts";
export { DB, Request, Router, DownMode } from '../deps.ts';
export type { Bulk,Pages } from "../deps.ts";

import type { DB } from '../deps.ts';
export type GalleryListParams = {
    db: DB,
    head: number,
    tail: number,
    limit: number
}

export type SearchListParams = GalleryListParams & {
    query: string
 }