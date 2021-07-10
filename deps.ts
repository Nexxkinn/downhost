export { DB } from "https://deno.land/x/sqlite/mod.ts";
export { Application, Request, Router } from "https://deno.land/x/oak/mod.ts";
export { contentType } from "https://deno.land/x/media_types/mod.ts";
export { join } from "https://deno.land/std@0.78.0/path/mod.ts";
export { decode as base64Decode } from "https://deno.land/std/encoding/base64.ts";
export { get_entries, compress, create_zip, open_zip } from "https://deno.land/x/littlezip@0.4.0/mod.ts";

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