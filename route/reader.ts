import { ensureFile ,render } from "../lib/_mod.ts";
import { DB } from "../deps.ts";
import { join } from "./_deps.ts";

const title = "";

export default async function handler (id:number,catalog_dir:string,db:DB){
    const query = Array.from(db.query('SELECT filename,title,length FROM catalog WHERE id=? LIMIT 1',[id]));
    if (!query.length) return '404: Unknown ID:'+id;
    const [[filename, title, length]] = query;
    const html_title = 'Downhost : ' + title;
    const exists = await ensureFile(join(catalog_dir,filename))

    if( exists ) {
        return await render("client/reader.tsml",{title:html_title,length,id})
    }
    else {
        return '404 not found';
    }
}