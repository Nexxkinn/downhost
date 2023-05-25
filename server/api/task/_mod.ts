import task_add from './add.ts';
import task_update from './update.ts';
import { DB, Router } from '../_deps.ts';

export { default as task_list} from './list.ts';
export default function task_router(db:DB) {
    const router = new Router();
    router
        .post('/', async (ctx) => {
            const body = await ctx.request.body({ type: 'json' }).value;
            return await task_add({ source: new URL(body.source), db });
        })
        .patch('/:id/:function', async (ctx) => {
            const id = Number(ctx.params.id);
            const func = String(ctx.params.function);
            return await task_update(func,id, db);
        })
    
    return router;
}