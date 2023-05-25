import gallery from './gallery.ts';
import remove from './remove.ts';
import search from './search.ts';
import { DB, Router } from '../_deps.ts';

export { default as gallery_list } from './list.ts';
export default function lib_router(db:DB) {
    const router = new Router();
    router
        .get('/search', async(ctx) => {
            const args = ctx.request.url.searchParams;
            const query = args.getAll('tag');
            return await search({ query , db });
        })
        .get('/g/:id', async (ctx) => {
            const id = Number(ctx.params.id);
            return await gallery(id,db);
        })
        .delete('/g/:id', async (ctx) => {
            const id = Number(ctx.params.id);
            return await remove({ id, db });
        })
    
    return router
}