import { join, DB } from "../_deps.ts";
import { config, ensureFile, getFilenames } from "../../lib/_mod.ts";

export default async function handler(id:number, db : DB) {
    const query = Array.from(db.query('SELECT filename,length FROM catalog WHERE id=? LIMIT 1',[id]));
    // TODO: handle tags.
    if (!query.length) return '404: Unknown ID:'+id;
    const [[filename]] = query;

    const exists = await ensureFile(join(config.catalog_dir,filename))
    if( exists ) {
        const list = await getFilenames(join(config.catalog_dir,filename));
        return JSON.stringify({list:JSON.stringify(list)});
    }
    else {
        return JSON.stringify({ status: false, message: 'Not Found' })
    }
}


