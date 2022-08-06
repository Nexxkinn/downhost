//import { index, reader, thumb, image, login } from './route/_mod.ts';
import { Application, DB } from './deps.ts';
import { AuthMiddleware } from './lib/_mod.ts';
import { client_router } from './router/_mod.ts';
import { api_router } from './api/_mod.ts';

export async function app_init(db: DB) {

    const app = new Application();
    const api    = api_router(db);
    const client = client_router(db);

    app.use(AuthMiddleware);
    app.use(api.routes());
    app.use(api.allowedMethods());
    app.use(client.routes());

    app.addEventListener("listen", (ctx) => {
        console.log(`Serving requests at ${ctx.hostname}:${ctx.port}`)
    })
    return app;
}
