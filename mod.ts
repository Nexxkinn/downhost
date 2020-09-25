import { Application, Router, DB, contentType } from './deps.ts';
import { index, graphql } from './api/_mod.ts';
import { info } from './index.ts';

const config = JSON.parse(await Deno.readTextFile('config.json'));
console.log(`### ${info.name} version ${info.version} ###`);
console.log('Downloading static files');

const router = new Router();
const db = new DB('database.sqlite');
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
db.query(`CREATE TABLE IF NOT EXISTS 
    credential (
        service TEXT NOT NULL,
        user TEXT,
        pass TEXT,
        token TEXT
        )`);
db.query(`CREATE TABLE IF NOT EXISTS 
    user (
        user TEXT,
        pass TEXT,
        access TEXT
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
        ctx.response.body = await Deno.readTextFile(`client/static/${ctx.params.file}`);
        ctx.response.type = contentType(ctx.params.file || '');
    })

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", (ctx) => {
    console.log(`Serving requests at ${ctx.hostname}:${ctx.port}`)
})

await app.listen( {hostname:config.hostname,port:config.port} )
// start server
