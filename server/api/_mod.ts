import { DB, Router } from './_deps.ts';
import { auth, log } from '../lib/_mod.ts';
import task_router, { task_list } from './task/_mod.ts';
import lib_router, { gallery_list } from './gallery/_mod.ts';

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


type DownSocketMessage = {
    event: string,
    content?: any | DownSocketMessage
}

function downsocket_router(db:DB) {
    const router = new Router();
    router
        .get('/wss', async (ctx) => {
            // use websocket for gallery listing.
            if (!ctx.isUpgradable) { ctx.throw(501) }

            const ws = ctx.upgrade();
            ws.onopen = () => { log(' Downsocket established ')}
            ws.onmessage = async (m) => {

                const { event } : DownSocketMessage = JSON.parse(m.data);

                if      ( event == 'LIST' ) {
                    const list = await gallery_list({db});
                    const res : DownSocketMessage = { event: event, content: list }
                    ws.send(JSON.stringify(res));
                }
                else if ( event == 'TASKS') {
                    const list = await task_list(db);
                    const res : DownSocketMessage = { event: event, content: list }
                    ws.send(JSON.stringify(res));
                }
                else if ( event == 'ECHO' ) {
                    const res : DownSocketMessage = { event: event, content: 'ECHO' }
                    ws.send(JSON.stringify(res));
                } 
            }
            ws.onclose = () => { log(' DownSocket closed ') }

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