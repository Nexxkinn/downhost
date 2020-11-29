import { DB, join, getEntries } from "./_deps.ts";
import { contentType } from "../deps.ts";

export default async function handler(id:number,page:number,catalog_dir:string, db: DB) {
    const query = db.query('SELECT filename FROM catalog WHERE id = ? LIMIT 1',[id]);
    const [[filename]] = Array.from(query);
    const file = await Deno.open(join(catalog_dir,filename));

    let res;
    for ( const {index,filename, extract} of await getEntries(file) ){
        if(index === page){
            const file = await extract();
            const type = contentType(filename);
            res = { buff: file, type }
            break;
        }
    }
    return res;
}