import { index, reader, thumb, image, login } from '../route/_mod.ts';
import { Application, Router, DB, contentType } from '../deps.ts';
import { config, getWebUI, AuthMiddleware, auth } from '../lib/_mod.ts';
import { api } from '../api/_mod.ts';

export async function AppInit(db: DB) {
    const router = new Router();
    router
        .get('/', async (ctx) => {
            ctx.response.body = await index(ctx.request, db);
            ctx.response.headers.append('Cache-Control', 'no-cache, no-store');
        })
        .post('/login', async(ctx) => {
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
        .get('/static/:file', async (ctx) => {
            ctx.response.body = getWebUI(`static/${ctx.params.file}`);
            ctx.response.type = contentType(ctx.params.file || '');
            ctx.response.headers.append('X-Content-Type-Options', 'nosniff');
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

    const app = new Application();

    app.use(AuthMiddleware);
    app.use(router.routes());
    app.use(router.allowedMethods());

    app.addEventListener("listen", (ctx) => {
        console.log(`Serving requests at ${ctx.hostname}:${ctx.port}`)
    })
    return app;
}