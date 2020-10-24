import { Application, Router, DB, contentType } from './deps.ts';
import { index, graphql } from './api/_mod.ts';
import { info } from './index.ts';
import { log } from './lib/_mod.ts';

const config = JSON.parse(await Deno.readTextFile('config.json'));

console.log(
`#=============================#
#                             #
#         HHH     HHH         #
#         HHH     HHH         #
#         HHHHHHHHHHH         #
#         HHH     HHH         #
#     HHHHHHH     HHHHHHH     #
#       HHH         HHH       #
#         HHH     HHH         #
#           HHH HHH           #
#             HHH             #
#                             #
#===========DownHost==========#`)

log(`Version : ${info.version}`)
log('Downloading static files');
log('Initialize database...');
const db = initDB();

log('prepare initial directories');

const router = new Router();

router
    .get('/',async (ctx) => {
        ctx.response.body = await index(ctx.request,db);
    })
    .post('/graphql',async (ctx) => {
        ctx.response.body = await graphql(ctx.request,db);
    })
    .get('/static/:file', async (ctx) => {
        ctx.response.body = await Deno.readFile(`client/static/${ctx.params.file}`);
        ctx.response.type = contentType(ctx.params.file || '');
    })
    .get('/reader/:id', async (ctx) => {
        //ctx.response.body = await 
    })

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", (ctx) => {
    console.log(`Serving requests at ${ctx.hostname}:${ctx.port}`)
})

await app.listen( {hostname:config.hostname,port:config.port} )
// start server

function initDB() {
    const db = new DB('database.sqlite');
    db.query(`CREATE TABLE IF NOT EXISTS 
        download (
            __typename TEXT NOT NULL,
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service TEXT NOT NULL,
            uid TEXT NOT NULL,
            filename TEXT,
            url TEXT,
            name TEXT,
            status TEXT,
            size INTERGER,
            downloaded INTERGER,
            UNIQUE (service, uid)
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
    db.query(`CREATE TABLE IF NOT EXISTS 
        library (
            path TEXT
            )`);
    return db;
}
