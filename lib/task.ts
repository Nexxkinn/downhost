import { en,de, loadConfig } from './_mod.ts';
import { service } from '../script/_mod.ts';
import { DownMeta, DownPagesRequest, DownRequest, DownType } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";

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
                const { metadata, download, hostname } = await resolve(task.url);
                const { type, url,title, uid } = metadata;
                const hash = hostname.replaceAll(/\./g,'') + uid;

                db.query("INSERT INTO catalog(hash,url,title,status) VALUES(?,?,?,?)",[hash,url.href,title,0])
                
                const file_name =  `[${de(hostname)}][${metadata.uid}] ${metadata.title}.zip`;
                
                const fetch_args:DownRequest | DownPagesRequest = await download(metadata);

                switch(type) {
                    case DownType.BULK : {
                        if (fetch_args instanceof Array) throw new Error("wrong DownType.");
                        
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

                        if (!(fetch_args instanceof Array)) throw new Error("wrong DownType.");

                        await Deno.mkdir(`${config.temp_dir}/${hash}`);

                        db.query("INSERT INTO download(hash,size) VALUES(?,?)",[hash,fetch_args.length])
                        db.query("UPDATE catalog SET status=? WHERE hash=? ",[1,hash]);

                        for(let len=0; len < fetch_args.length; len++ ) {

                            const { input, init, filename } = fetch_args[len];
                            const { body } = await fetch(input,init);
                            if(!body) return rej('unable to download file');
                            const file = await Deno.create(`${config.temp_dir}/${hash}/${filename}`);

                            for await (const chunk of body) { file.writeSync(chunk); }

                            db.query("UPDATE download SET size_down=? WHERE hash=? ",[len+1,hash]);
                            break;

                        }
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

async function resolve(link:string){
    const url = new URL(link);
    const hostname = en(url.hostname);
    const srvc = service(hostname);
    if (!srvc) throw new Error(`Unable to resolve: ${link}`);
    const metadata:DownMeta = await srvc.metadata(link);
    const download          = srvc.download;
    //console.log(metadata);
    return { metadata,download, hostname };
}