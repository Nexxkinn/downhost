import { DownConfig, get_entries } from "./_deps.ts";
import { alphanumSort, DB, join } from "../deps.ts";
import { en, config } from "./_mod.ts";
import { resize } from "https://deno.land/x/deno_image@v0.0.3/mod.ts";

/**
 * 
 * @param catalog_dir 
 * @param timer 
 * @param db 
 */
export async function dir_scan(db:DB,config:DownConfig) {

    // TODO: support subdirectories too
    for await ( const { isFile, name } of Deno.readDir(config.catalog_dir)) {
        if( !isFile ) continue;
        // check if it is listed in database;
        const [[exists]] = db.query('SELECT EXISTS(SELECT 1 FROM catalog WHERE filename=? LIMIT 1)',[name]);
        if( exists ) continue;

        // title only, without any tags.
        const title = name.slice(0,name.indexOf('.zip')).replace(/[\[\{](.*?)[\}\]]/g,'').trim();

        const file = await Deno.open(join(config.catalog_dir,name));
        const { thumb, g_len } = await parse(file);
        
        const hash = en(name,false).slice(0,100);
        const thumb_file = await Deno.create(join(config.temp_dir,'thumb',hash));
        
        try {
            const image = await resize(thumb, {width: 250, aspectRatio:true});
            thumb_file.writeSync(image);
        }
        catch(e){
            thumb_file.writeSync(thumb);
        }
        finally {
            file.close();
        }
        
        db.query('INSERT INTO catalog(hash,title,length,filename,status) VALUES(?,?,?,?,?)',[hash, title,g_len,name,3])
    }
}
// get config file
// scan dir
// compare filename with database
// not found -> add to database -> get thumbnail

async function parse(file:Deno.File) {

    const list = new Array();
    for ( const {filename} of await get_entries(file)) list.push(filename);
    const cover_name = alphanumSort(list,undefined)[0] as string;

    let thumb = new Uint8Array(0);
    for ( const { filename, extract } of await get_entries(file)) {
        if(filename === cover_name) { 
            thumb = await extract();
            break;
        }
    }
    return { thumb, g_len:list.length };
}

//await dir_scan(new DB('db.sqlite'),config);