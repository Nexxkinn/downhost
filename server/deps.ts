export { DB } from "https://deno.land/x/sqlite@v3.4.0/mod.ts";
export { Application, Request, Router, Context } from "https://deno.land/x/oak@v12.5.0/mod.ts";
export { typeByExtension } from "https://deno.land/std@0.185.0/media_types/mod.ts";
export { join } from "https://deno.land/std@0.101.0/path/mod.ts";
export { decode as b64Dec, encode as b64Enc } from "https://deno.land/std@0.189.0/encoding/base64.ts";
export { get_entries, compress, create_zip, open_zip } from "https://deno.land/x/littlezip@0.4.1/mod.ts";

import { posix } from "https://deno.land/std@0.101.0/path/mod.ts";
export const { join:urljoin } = posix;

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