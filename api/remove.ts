import { DB, join } from "./_deps.ts";
import { config } from "../lib/_mod.ts";

// deno-lint-ignore require-await
export default async function handler({ id, db }: { id:number, db: DB }){
    try {
        const [[hash,filename]] = db.query('SELECT hash,filename FROM catalog WHERE id=? LIMIT 1',[id]);

        Deno.removeSync(join(config.catalog_dir,filename));

        db.query("DELETE FROM catalog WHERE hash=?", [hash]);
        db.query("DELETE FROM download WHERE hash=?",[hash]);
        return JSON.stringify({ status:true });
    }
    catch(e) {
        return JSON.stringify({ status: false, message: e.message });
    }
}