import gallery from './gallery.ts';
import remove from './remove.ts';
import { DB, Router } from '../_deps.ts';

export { list } from './list.ts';
export { default as search } from './search.ts';
export default function lib_router(db:DB) {
    const router = new Router();
    router
        .get('g/:id', async (ctx) => {
            const id = Number(ctx.params.id);
            ctx.response.body = await gallery(id,db);
        })
        .delete('g/:id', async (ctx) => {
            const id = Number(ctx.params.id);
            ctx.response.body = await remove({ id, db });
        })
    
    return router
}