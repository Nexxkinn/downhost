import { en,de } from './_mod.ts';
import { service } from '../script/_mod.ts';
import { Download, DownMeta } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";

const TaskList:Promise<any>[] = new Array();

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
                const hash = hostname + uid;

                db.query("INSERT INTO catalog(hash,url,title,status) VALUES(?,?,?,?)",[hash,url.href,title,0])
                
                const dow:Download = {
                    meta: metadata,
                    path: `[${metadata.uid}] ${metadata.title}.zip`,
                }
                const res = await download(dow);
                if(!res.body) return rej('unable to download file');

                let size = Number(res.headers.get('content-length'));
                db.query("INSERT INTO download(hash,size) VALUES(?,?)",[hash,size])
                db.query("UPDATE catalog SET status=? WHERE hash=? ",[1,hash]);

                const file = await Deno.create(dow.path);
                let   len = 0;
                for await (const chunk of res.body) {
                    file.writeSync(chunk);
                    len += chunk.length;
                    db.query("UPDATE download SET size_down=? WHERE hash=? ",[len,hash]);
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