import { AppInit, log, config, ensureDir, restoreTask } from './lib/_mod.ts';
import { info } from './index.ts';
import { DB } from './deps.ts';

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

log('Checking WebUI directory...');
try {
    if(config.webui_dir) {
        const stat = await Deno.stat(config.webui_dir);
        if(stat.isFile) throw new Error("path is a file.");
    }
}
catch (e) {
    if( e instanceof Deno.errors.NotFound)  { 
        console.error(`Unable to find custom WebUI folder \"${config.webui_dir}\". Using built-in one instead.`);
        config.webui_dir = "";
    } 
    else throw e;
}

log('Kicking up database...');
const db = start_database();

log('Restoring download tasks...')
const res = db.query("SELECT hash FROM catalog WHERE status != 3");
for await (const [hash] of res) { restoreTask(hash,db) }

log('Initialize Server...');
const app = await AppInit(db);
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
                    id INTEGER PRIMARY KEY,
                    hash TEXT NOT NULL,
                    tag_id INTERGER NOT NULL,
                    UNIQUE(hash, tag_id)
                )`)

            db.query(`CREATE TABLE IF NOT EXISTS
                tagrepo (
                    id INTEGER PRIMARY KEY,
                    ns TEXT NOT NULL,
                    tag TEXT NOT NULL,
                    UNIQUE(ns, tag)
                )`)
    return db;
}
