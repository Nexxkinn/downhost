import { DB, join, get_entries } from "./_deps.ts";
import { contentType } from "../deps.ts";

export default async function handler(id:number,img_name:string,catalog_dir:string, db: DB) {
    const query = db.query<[string]>('SELECT filename FROM catalog WHERE id = ? LIMIT 1',[id]);
    const [[filename]] = Array.from(query);
    const file = await Deno.open(join(catalog_dir,filename));

    let res;
    for ( const {filename, extract} of await get_entries(file) ){
        if(filename === img_name){
            const file = await extract();
            const type = contentType(filename);
            res = { buff: file, type }
            break;
        }
    }
    file.close();
    return res;
}