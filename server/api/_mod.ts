import { DB, Router } from './_deps.ts';
import { auth, log } from '../lib/_mod.ts';
import task_router, { task_list } from './task/_mod.ts';
import lib_router, { list, search } from './gallery/_mod.ts';

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
    
    const task = task_router(db);
    const library = lib_router(db);
    const downsocket = downsocket_router(db);

    router.use('/api/tasks/',task.routes())
    router.use('/api/lib/',library.routes())
    router.use('/api',downsocket.routes())
    
    return router
}

export type APIError = {
    status: boolean,
    message: string
}

const isError = (x:any) : x is APIError => 'status' in x;

export type Gallery = {
    id: number,
    title: string
}

export type Task = {
    id:number,
    title: string,
    status: number,
    size: number,
    size_down: number
}

type GalleryListParams = {
    head: number,
    tail: number,
    query: string
}

type GalleryListResponse = {
    head: number,
    tail: number,
    is_end: boolean,
    list: any[]
}

type TaskListResponse = {
    list: Task[]
}

type DownSocketEvent = {
    event: string
}

type DownSocketMessage  = DownSocketEvent & {
    content?: GalleryListParams | DownSocketMessage
}

type DownSocketResponse = DownSocketEvent & {
    content?: GalleryListResponse | TaskListResponse | DownSocketMessage
}

function downsocket_router(db:DB) {
    const PAGE_SIZE_LIMIT = 50;
    const router = new Router();
    router.get('/wss', async (ctx) => {
        // use websocket for gallery listing.
        if (!ctx.isUpgradable) { ctx.throw(501) }

        const ws = ctx.upgrade();
        ws.onopen  = () => { log(' Downsocket established ') }
        ws.onclose = () => { log(' DownSocket closed ') }
        ws.onmessage = async (m) => {

            const { event, content } : DownSocketMessage = JSON.parse(m.data);

            if      ( content && ( event == 'LIST' || event == 'EXT_LIST' || event == 'UPD_LIST') ) {

                const { head, tail, query } = content as GalleryListParams;

                log(JSON.stringify({ head, tail, query }));

                const g_list = !query 
                    ? await list({db, head, tail, limit: PAGE_SIZE_LIMIT})
                    : await search({db, query, head, tail, limit: PAGE_SIZE_LIMIT});

                if ( isError(g_list) ) {
                    return ws.send(JSON.stringify(g_list));
                }
                const response : GalleryListResponse = {
                    head: g_list.at(0)?.id || 0,
                    tail: g_list.at(-1)?.id || 0,
                    is_end: g_list.length < PAGE_SIZE_LIMIT,
                    list:g_list
                }
                const socket_response : DownSocketResponse = { event: event, content: response }
                ws.send(JSON.stringify(socket_response));
            }
            else if ( event == 'TASKS') {
                const list = await task_list(db);
                const socket_response : DownSocketResponse = { event: event, content: { list } }
                ws.send(JSON.stringify(socket_response));
            }
            
            else if ( event == 'ECHO' ) {
                const socket_response : DownSocketResponse = { event: event }
                ws.send(JSON.stringify(socket_response));
            } 
        }
    })
    
    return router;
}

// export async function api({type, func, body }: any, db: DB): Promise<string | undefined> {
//     try {
//         switch (type) {
//             case "task": return await task({func,body},db);
//             case "lib" : return await lib({func,body},db);
//             default: return JSON.stringify({ status: false });
//         }
//     }
//     catch (e) {
//         console.log(e);
//     }
// }