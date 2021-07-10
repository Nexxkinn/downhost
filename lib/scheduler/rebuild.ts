import { DB, DownType } from "./_deps.ts";
import { addTask, log, resolve } from "../_mod.ts";

export async function restoreTask( hash:string, db:DB ){

    let   [[id,offset]]  = db.query("SELECT id, size_down FROM download WHERE hash=? LIMIT 1", [hash]);
    let   [[source]] = db.query("SELECT url FROM catalog where hash=? LIMIT 1", [hash]);
    
            source = new URL(source);
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