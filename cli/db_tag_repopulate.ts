import { DB } from "https://deno.land/x/sqlite@v2.4.2/mod.ts";
import { resolve } from '../lib/script/_mod.ts';

type DownTag = {
    ns:string,
    tag:string
}
const log = (str:string) => console.log(str);
async function fetchTagstoDB() {
    log("DownHost DB Utility");
    log("Repopulate item tags for previously download items");
    log("WARNING: THIS WILL RESET ALL TAGS AVAILABLE IN YOUR DATABASE.");
    log("MAKE SURE YOU HAVE A COPY OF YOUR DATABASE FIRST.");
    const HasRead = Deno.args.find( (v) => v === '--has-read' || '-v');
    if(!HasRead) {
        log("Rerun this app with --has_read args at the end if you've made a backup.")
        Deno.exit();
    }

    try {
        await Deno.stat('db.sqlite');
        // successful, file or directory must exist
      } catch (error) {
        log('ERROR: Unable to find db.sqlite');
        log('Please run this utility on the same working directory as the one mentioned above.');
        Deno.exit()
    }

    const db = new DB('db.sqlite');
    resetTagDB(db);
    
    const query = db.query('SELECT hash,url from catalog');

    let source:URL, hash:string, count=0;
    for( const [local_hash,url] of query ) {
        if(!url) continue;
        source = new URL(url);
        hash = String(local_hash);
        log(`processing ${hash}`);
        const metadata = await resolve(source);
        const { srvc } = metadata;
        let tags:DownTag[] = metadata.tags ?? [];
        // add "source" tag
        tags.filter((x) => x.ns.toLowerCase() !== "source");
        tags.push({ns:"source",tag:srvc});

        // insert tags into the table
        for ( const {ns,tag} of tags) {
            db.query(`INSERT OR IGNORE INTO tagrepo(ns, tag) VALUES(?, ?)`,[ns,tag]);
            const [[id]] = db.query (`SELECT id from tagrepo WHERE ns=? AND tag=? LIMIT 1`,[ns,tag]);
            db.query(`INSERT OR IGNORE INTO tag(hash, tag_id) VALUES(?, ?)`,[hash,id]);
        }
        log(`done...(${count+=1})`)
    }

    log(`${count} items has been processed`);
}

await fetchTagstoDB();

function resetTagDB(db:DB) {
    db.query('DELETE FROM tag');
    db.query('DELETE FROM tagrepo');
    db.query('VACUUM');
}