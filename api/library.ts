import { DB } from "./_deps.ts";
import { config } from "../lib/_mod.ts";


export default async function handler({ path, db }: { path:string, db: DB }){
    // TODO: Implement directory tagging system.
    const query = db.query('SELECT id,title FROM catalog WHERE status=3');
    const list = new Array();
    for( const [id,title] of query ) list.push({id,title});
    return JSON.stringify(list);
}