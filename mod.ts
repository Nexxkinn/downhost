import { Application, Router, DB, contentType } from './deps.ts';
import { log, config, ensureDir, restoreTask } from './lib/_mod.ts';
import { index, reader, thumb, image } from './route/_mod.ts';
import { api } from './api/_mod.ts';
import { info } from './index.ts';

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
#===========DownHost==========#
Version : ${info.version}`)

log('Initialize some directories...');
await ensureDir(config.catalog_dir);
await ensureDir(config.temp_dir);
await ensureDir(config.temp_dir+'/thumb/');

log('Checking web client directory...');
try {
    const stat = await Deno.stat('client/');
    if(stat.isFile) throw new Error("path is a file.");
}
catch (e) {
    if( e instanceof Deno.errors.NotFound)  { 
        console.error("Unable to find folder 'client' for web client. Please provide it in your current directory.");
        Deno.exit();
    } 
    else throw e;
}

log('Kicking up database...');
const db = start_database();
const router = new Router();
router
    .get('/',async (ctx) => {
        ctx.response.body = await index(ctx.request,db);
    })
    .post('/api/:type/:function',async (ctx) => {
        const body = await ctx.request.body({ type: 'json' }).value;
        const type = ctx.params.type;
        const func = ctx.params.function;
        ctx.response.body = await api({type,func,body},db);
    })
    .get('/image/:id/:page',async (ctx) => {
        const id   = Number(ctx.params.id);
        const page = ctx.params.page;
        if( id > 0 && page ) {
            const res  = await image(id,page,config.catalog_dir,db);
            ctx.response.body = res?.buff;
            ctx.response.type = res?.type;
        }
    })
    .get('/static/:file', async (ctx) => {
        ctx.response.body = await Deno.readFile(`client/static/${ctx.params.file}`);
        ctx.response.type = contentType(ctx.params.file || '');
    })
    .get('/reader/:id', async (ctx) => {
        ctx.response.body = await reader(Number(ctx.params.id),config.catalog_dir,db);
    })
    .get('/thumb/:id', async (ctx) => {
        ctx.response.body =  await thumb(Number(ctx.params.id),config.temp_dir,db);
        ctx.response.type = 'image/image';
    })

log('Restoring download tasks...')
const res = db.query("SELECT hash FROM catalog WHERE status != 3");
for await (const [hash] of res) { restoreTask(hash,db) }

log('Initialize Server...')
const app = new Application();

    //   app.use( async (ctx,next) => {
    //       // TODO: handle cookie authentication here.
    //       await next();
    //   })
      app.use(router.routes());
      app.use(router.allowedMethods());

      app.addEventListener("listen", (ctx) => {
          console.log(`Serving requests at ${ctx.hostname}:${ctx.port}`)
      })

await app.listen( {hostname:config.hostname,port:config.port} )
// start server

function start_database() {
    const   db = new DB('db.sqlite');
            db.query(`CREATE TABLE IF NOT EXISTS 
                catalog (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hash TEXT NOT NULL UNIQUE,
                    length INTERGER,
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
                tag (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hash TEXT NOT NULL,
                    tag_id INTERGER NOT NULL,
                    UNIQUE(hash, tag_id)
                )`)

            db.query(`CREATE TABLE IF NOT EXISTS
                tagrepo (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ns TEXT NOT NULL,
                    tag TEXT NOT NULL,
                    UNIQUE(ns, tag)
                )`)
    return db;
}
