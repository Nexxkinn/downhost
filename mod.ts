import { Application, Router, DB, contentType } from './deps.ts';
import { log, loadConfig, ensureDir } from './lib/_mod.ts';
import { index } from './route/_mod.ts';
import { api } from './api/_mod.ts';
import { info } from './index.ts';

log("load config file");
const config = await loadConfig();

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

log('prepare some directories');
await ensureDir(config.catalog_dir);
await ensureDir(config.temp_dir);
await ensureDir(config.catalog_dir+'/thumb/')

log('Kicking up database...');
const db = start_database();
const router = new Router();
router
    .get('/',async (ctx) => {
        ctx.response.body = await index(ctx.request,db);
    })
    .post('/api/:function',async (ctx) => {
        const body = await ctx.request.body({ type: 'json' }).value;
        const func = ctx.params.function;
        ctx.response.body = await api({func,body},db);
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

function start_database() {
    const db = new DB('db.sqlite');
    db.query(`CREATE TABLE IF NOT EXISTS 
        catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL UNIQUE,
            thumb_hash TEXT,
            filename TEXT,
            url TEXT,
            title TEXT,
            status INTERGER
            )`);
    db.query(`CREATE TABLE IF NOT EXISTS
        download (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL UNIQUE,
            size INTERGER,
            size_down INTERGER
        )`);
    db.query(`CREATE TABLE IF NOT EXISTS
        thumbnail (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT UNIQUE,
            path TEXT,
            filename TEXT
        )
    `)
    return db;
}
