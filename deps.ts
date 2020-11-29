export { DB } from "https://deno.land/x/sqlite/mod.ts";
export { Application, Request, Router } from "https://deno.land/x/oak/mod.ts";
export { contentType } from "https://deno.land/x/media_types/mod.ts";
export { join } from "https://deno.land/std@0.78.0/path/mod.ts";
export { getEntries, compress } from "https://deno.land/x/littlezip/_mod.ts";

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
    size_down: number
}

export type Pages = Item & {
    pages: number,
    pages_down:number
}