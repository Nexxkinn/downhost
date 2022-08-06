import { ensureFile ,getFilenames,render } from "../lib/_mod.ts";
import { DB } from "../deps.ts";
import { join } from "./_deps.ts";

const title = "";

export default async function handler (id:number,catalog_dir:string,db:DB){
    const query = Array.from(db.query('SELECT filename,title,length FROM catalog WHERE id=? LIMIT 1',[id]));
    if (!query.length) return '404: Unknown ID:'+id;
    const [[filename, title, length]] = query;
    
    const html_title = 'Reader : ' + title;
    const exists = await ensureFile(join(catalog_dir,filename))
    
    if( exists ) {
        const list = await getFilenames(join(catalog_dir,filename));
        return await render("reader.html",{title:html_title,length,id,list:JSON.stringify(list)})
    }
    else {
        return '404 not found';
    }
}
