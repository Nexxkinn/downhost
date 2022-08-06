import index from './index.ts';
import image from './image.ts';
import reader from './reader.ts';
import thumb from './thumb.ts';
import login from './login.ts';

import { DB, Router, contentType } from './_deps.ts';
import { config, getWebUI } from '../lib/_mod.ts';

export function client_router(db: DB) {
    const router = new Router();
    router
        .get('/', async (ctx) => {
            ctx.response.body = await index(ctx.request, db);
            ctx.response.headers.append('Cache-Control', 'no-cache, no-store');
        })
        .get('/image/:id/:page', async (ctx) => {
            const id = Number(ctx.params.id);
            const page = ctx.params.page;
            if (id > 0 && page) {
                const res = await image(id, page, config.catalog_dir, db);
                ctx.response.body = res?.buff;
                ctx.response.type = res?.type;
                ctx.response.headers.append('X-Content-Type-Options', 'nosniff');
                ctx.response.headers.append('Cache-Control', 'public, max-age=2592000, immutable')
            }
        })
        .get('/reader/:id', async (ctx) => {
            ctx.response.body = await reader(Number(ctx.params.id), config.catalog_dir, db);
        })
        .get('/thumb/:id', async (ctx) => {
            ctx.response.body = await thumb(Number(ctx.params.id), config.temp_dir, db);
            ctx.response.type = 'image/image';
            ctx.response.headers.append('X-Content-Type-Options', 'nosniff');
            ctx.response.headers.append('Cache-Control', 'public, max-age=2592000, immutable')
        })
        .get('/login', async (ctx) => {
            ctx.response.body = await login();
        })
        .get('/assets/:file', async (ctx) => {
            ctx.response.body = getWebUI(`assets/${ctx.params.file}`);
            ctx.response.type = contentType(ctx.params.file || '');
            ctx.response.headers.append('X-Content-Type-Options', 'nosniff');
        })
    
        return router
}