import { DB, DownType } from "./_deps.ts";
import { addTask, log, resolve } from "../_mod.ts";

export async function restoreTask( hash:string, db:DB ){
    
    let [downloadTask]  = db.query<[number,number]>(`SELECT id, size_down FROM download WHERE hash=? LIMIT 1`,[hash]);
    if( !downloadTask ) {
        db.query("DELETE FROM catalog WHERE hash=?", [hash]);
        db.query("DELETE FROM download WHERE hash=?",[hash]);
        db.query("DELETE FROM tag WHERE hash=?",[hash]);
        log(`A task can't be restored, please try re-add it again.`)
        return false;
    }
    const [id,offset] = downloadTask;

    let url_query = db.prepareQuery<[string]>("SELECT url FROM catalog where hash=? LIMIT 1");
    let [url] = url_query.one([hash]);
    let source = new URL(url);
    const metadata = await resolve(source,offset);

    if (metadata.type === DownType.BULK ) {
        // restart bulk download from begining
        db.query("UPDATE catalog SET status=? WHERE hash=?", [0, hash]);
        db.query("UPDATE download SET size_down=? WHERE hash=?", [0, hash]);
    }

    const status = await addTask({source,metadata,offset,db});

    log(`task ${id} has successfully been restored.`)
    return status;
}