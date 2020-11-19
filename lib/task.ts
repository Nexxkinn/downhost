import { en,de, loadConfig, ensureFile } from './_mod.ts';
import { service } from '../script/_mod.ts';
import { DownMeta, DownType } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";
import type { DownRequest } from "../script/_deps.ts";

const TaskList:Promise<any>[] = new Array();
const config = await loadConfig();

export enum ActionMode { STOP, START, RESUME };

export const appendTask = (task:Task) => TaskList.push(run(task));

export class Task {
    private _action:ActionMode;
    private _url:string;
    private _db:DB;

    constructor({ url, db, action = ActionMode.START }: { url: string; db: DB; action?: ActionMode; }){
        this._url = url;
        this._action = action;
        this._db = db;
    }

    get url(){ return this._url }
    get action(){ return this._action }
    get db(){ return this._db }
    
}

function run(task:Task){
    const pto = new Promise(async(rej) => {
        const { url, db, action } = task
        switch(action){
            case ActionMode.START: {
                const { download:fetch_args, thumbnail, srvc, type, title, uid } = await resolve(url);
                const hash = service + uid;
                
                // download thumbnail
                const thumb_path = `${config.temp_dir}/thumb/${hash}`;
                if (!await ensureFile(thumb_path)) {
                    const thumb_file = await Deno.create(thumb_path);
                    const { body } = await fetch(thumbnail.input,thumbnail.init);

                    if (body) { for await (const chunk of body) { thumb_file.writeSync(chunk) } }
                    
                    thumb_file.close();
                }

                db.query("INSERT INTO catalog(hash,url,title,status) VALUES(?,?,?,?)",[hash,url,title,0])
                
                const file_name =  `[${srvc}][${uid}] ${title}.zip`;
                
                switch(type) {
                    case DownType.BULK : {
                        if (!('input' in fetch_args)) throw new Error("wrong DownType.");
                        
                        const { input, init } = fetch_args;
                        const { body, headers } = await fetch(input,init);
                        if(!body) return rej('unable to download file');

                        let size = Number(headers.get('content-length'));
                        db.query("INSERT INTO download(hash,size) VALUES(?,?)",[hash,size])
                        db.query("UPDATE catalog SET status=? WHERE hash=? ",[1,hash]);

                        const file = await Deno.create(`${config.catalog_dir}/${file_name}`);
                        let   len = 0;
                        for await (const chunk of body) {
                            file.writeSync(chunk);
                            len += chunk.length;
                            db.query("UPDATE download SET size_down=? WHERE hash=? ",[len,hash]);
                        }
                        break;
                    }
                    case DownType.PAGES : {

                        if ('input' in fetch_args) throw new Error("wrong DownType.");

                        const { gallery_size } = fetch_args;

                        await Deno.mkdir(`${config.temp_dir}/${hash}`);

                        db.query("INSERT INTO download(hash,size) VALUES(?,?)",[hash,gallery_size])
                        db.query("UPDATE catalog SET status=? WHERE hash=? ",[1,hash]);

                        let page_downloaded=0;
                        for await ( const page of fetch_args){
                            const { input, init, filename } = page;
                            const { body } = await fetch(input,init);
                            if(!body) return rej('unable to download file');
                            const file = await Deno.create(`${config.temp_dir}/${hash}/${filename}`);

                            for await (const chunk of body) { file.writeSync(chunk); }

                            db.query("UPDATE download SET size_down=? WHERE hash=? ",[page_downloaded+=1,hash]);
                        }
                        console.log({page_downloaded,gallery_size})
                        
                        break;
                        // TODO: get restriction e.g. delay between downloads
                    }
                }
                
                db.query("UPDATE catalog SET status=? WHERE hash=? ",[3,hash]);

                TaskList.splice(TaskList.indexOf(pto),1);
                break;
            }
            case ActionMode.RESUME: {
                // grab meta from database
            }
        }
        
    })
    return pto;
}

async function resolve(link:string): Promise<DownMeta> {
    const url = new URL(link);
    const hostname = en(url.hostname);
    const srvc = service(hostname);
    if (!srvc) throw new Error(`Unable to resolve: ${link}`);
    const metadata:DownMeta = await srvc.metadata(link);
    //console.log(metadata);
    return metadata;
}