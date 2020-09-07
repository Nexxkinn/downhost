import { Application, Router, DB } from './deps.ts';
import { index, graphql } from './api/_mod.ts';

const config = JSON.parse(await Deno.readTextFile('config.json'));
console.log(`### ${config.name} version ${config.version} ###`);
console.log('Downloading static files');

const router = new Router();
const db = new DB();
db.query(`CREATE TABLE IF NOT EXISTS 
    download (
        __typename TEXT NOT NULL,
        service TEXT NOT NULL,
        uid TEXT NOT NULL,
        filename TEXT,
        url TEXT,
        name TEXT,
        status TEXT,
        size INTERGER,
        downloaded INTERGER,
        PRIMARY KEY (service, uid)
        )`);

// dummy
// db.query("INSERT INTO download(__typename,name,status) VALUES('Bulk','test','paused')")
router
    .get('/',async (ctx) => {
        ctx.response.body = await index(ctx.request,db);
    })
    .post('/graphql',async (ctx) => {
        ctx.response.body = await graphql(ctx.request,db);
    })
    .get('/static/:file', async (ctx) => {
        ctx.response.body = await Deno.readTextFile(`client/${ctx.params.file}`);
    })

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", (ctx) => {
    console.log(`Serving requests at ${ctx.hostname}:${ctx.port}`)
})

await app.listen({hostname:'localhost',port:8080})
// start server
