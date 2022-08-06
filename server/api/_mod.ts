import { DB, Router } from './_deps.ts';
import { auth } from '../lib/_mod.ts';
import { task_add, task_list, task_update } from './task/_mod.ts';
import { lib_gallery, lib_remove, lib_list, lib_search } from './library/_mod.ts';

export function api_router(db:DB) {
    const router = new Router();
    router
        .post('/api/login', async(ctx) => {
            const body = await ctx.request.body({ type: 'json' }).value;
            if (body) {
                const token = auth(body.pass);
                if (token) {
                    ctx.cookies.set('Token',token)
                    ctx.cookies.set('Max-Age',String(60*60*24)) // 1 day.
                    ctx.response.status = 200;
                }
                else ctx.response.status = 401;
            } 
            else ctx.response.status = 401;
        })
        .post('/api/:type/:function', async (ctx) => {
            const body = await ctx.request.body({ type: 'json' }).value;
            const type = ctx.params.type;
            const func = ctx.params.function;
            ctx.response.body = await api({ type, func, body }, db);
        })
    
    return router

}

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