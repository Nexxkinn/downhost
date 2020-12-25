import { ensureFile ,natsort,render } from "../lib/_mod.ts";
import { DB } from "../deps.ts";
import { join } from "./_deps.ts";
import { getEntries } from "../api/_deps.ts";

const title = "";

export default async function handler (id:number,catalog_dir:string,db:DB){
    const query = Array.from(db.query('SELECT filename,title,length FROM catalog WHERE id=? LIMIT 1',[id]));
    if (!query.length) return '404: Unknown ID:'+id;
    const [[filename, title, length]] = query;
    
    const html_title = 'Downhost : ' + title;
    const exists = await ensureFile(join(catalog_dir,filename))
    
    if( exists ) {
        const list = await getFilenames(join(catalog_dir,filename));
        return await render("client/reader.tsml",{title:html_title,length,id,list:JSON.stringify(list)})
    }
    else {
        return '404 not found';
    }
}

async function getFilenames(path:string) {
    const file = await Deno.open(path,{read:true});
    let filenames:string[] = new Array();

    for( const { filename } of await getEntries(file)) {
        filenames.push(filename);
    }
    file.close();
    return filenames.sort(natsort({ insensitive: true }));
}