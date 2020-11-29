import { DownMode, DB } from './_deps.ts';
import { default as downlist } from './downlist.ts';
import { default as add } from "./add.ts";

export async function api({ func, body }: any, db: DB): Promise<string | undefined> {
    try {
        switch (func) {
            case "downlist": {
                const page = body.page;
                return await downlist(page, db);
            }
            case "add": {
                const url = new URL(body.url);
                return await add({ url, db });
            }
            case "remove": {
                const id = body.id;

            }
            case "stop": {
                const id = body.id;
            }
            case "catalog": {
                const path = body.path;
            }
            default: return undefined;
        }
    }
    catch (e) {
        console.log(e);
    }
}

function remove({ url }: any) {
    return true;
}

function set(id: number, mode: DownMode) {
    return true;
}
