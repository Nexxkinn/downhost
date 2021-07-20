import { DB } from './_deps.ts';
import { task_add, task_list, task_update } from './task/_mod.ts';
import { lib_gallery, lib_remove, lib_list, lib_search } from './library/_mod.ts';

export async function api({type, func, body }: any, db: DB): Promise<string | undefined> {
    try {
        switch (type) {
            case "task": return await task({func,body},db);
            case "lib" : return await lib({func,body},db);
            default: return JSON.stringify({ status: false });
        }
    }
    catch (e) {
        console.log(e);
    }
}

async function task({func,body}:any,db:DB) {
    switch (func) {
        case 'list': {
            return await task_list(db);
        }
        case 'add': {
            return await task_add({ source: new URL(body.source), db });
        }
        case 'start': case 'stop': case 'cancel': {
            return await task_update(func,Number(body.id), db);
        }
        default: {
            return JSON.stringify({ status: false });
        }
    }
}

async function lib({func,body}:any, db:DB) {
    switch(func) {
        case "list": {
            return await lib_list({db});
        }
        case "remove": {
            const { id } = body;
            return await lib_remove({ id, db });
        }
        case 'search': {
            const { query } = body;
            return await lib_search({ query , db });
        }
        case "g": {
            const { id } = body;
            return await lib_gallery(Number(id),db);
        }
        default: return JSON.stringify({ status: false });
    }
}