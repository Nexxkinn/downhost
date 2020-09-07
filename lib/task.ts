import {en,de} from './_mod.ts';
import * as script from '../script/_mod.ts';
import { Download, Meta } from "../script/_deps.ts";
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
    const pto = new Promise(async() => {
        const { url, db, action } = task
        switch(action){
            case ActionMode.START: {
                const { metadata, download } = await resolve(task.url);
                const { type, service,uid,title} = metadata
                db.query("INSERT INTO download(__typename,service,uid,name,status) VALUES(?,?,?,?,?)",[type,service,uid,title,'queueing'])
                const dow:Download = {
                    meta: metadata,
                    filename: `[${metadata.uid}]${metadata.title}.zip`,
                    db:task.db
                }

                await download(dow);
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
    let metadata:Meta;
    let download;
    switch(hostname){
        case 'kla642xlkh9ou0xerb9oo33k...':
            metadata = await script.hnx.metadata(link);
            download = script.hnx.download;
            return { metadata, download };
        default:
            throw new Error(`unable to resolve ${link}`);
    }
}