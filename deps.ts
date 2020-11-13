export { DB } from "https://deno.land/x/sqlite/mod.ts";
export { Application, Request, Router } from "https://deno.land/x/oak/mod.ts";
export { contentType } from "https://deno.land/x/media_types/mod.ts";

export type Item = {
    id: number,
    name: number,
    status: DownMode
}

export enum DownMode {
    DOWNLOAD,
    PAUSE,
    RESTART
}

export type Bulk = Item & {
    size: number,
    downloaded: number
}

export type Pages = Item & {
    pages: number,
    downloadedPages:number
}