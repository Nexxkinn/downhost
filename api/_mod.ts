import { DownMode, DB } from './_deps.ts';
import { default as downlist } from './downlist.ts';
import { default as add } from "./add.ts";
import { default as drop } from './remove.ts';
import { default as library } from './library.ts';

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
                return await drop({id,db});

            }
            case "stop": {
                const id = body.id;
            }
            case "library": {
                //const path = body.path;
                return await library({path:'', db});
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
