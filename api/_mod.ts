import { DB } from './_deps.ts';
import { default as job_list } from './job_list.ts';
import { default as job_update } from './job_update.ts';
import { default as job_add } from "./job_add.ts";
import { default as remove } from './remove.ts';
import { default as library } from './library.ts';
import { default as gallery } from './gallery.ts';

export async function api({type, func, body }: any, db: DB): Promise<string | undefined> {
    try {
        switch (type) {
            case "job": return await job({func,body},db);
            case "lib": return await lib({func,body},db);
            case "g"  : return await gallery(Number(func),db);
            default: return JSON.stringify({ status: false });
        }
    }
    catch (e) {
        console.log(e);
    }
}

async function job({func,body}:any,db:DB) {
    switch (func) {
        case 'list': {
            return await job_list(db);
        }
        case 'add': {
            return await job_add({ source: new URL(body.source), db });
        }
        case 'start': case 'stop': case 'cancel': {
            return await job_update(func,Number(body.id), db);
        }
        default: {
            return JSON.stringify({ status: false });
        }
    }
}

async function lib({func,body}:any, db:DB) {
    switch(func) {
        case "remove": {
            const { id } = body;
            return await remove({ id, db });
        }
        case "dir": {
            //const path = body.path;
            return await library({ path: '', db });
        }
        default: return JSON.stringify({ status: false });
    }
}