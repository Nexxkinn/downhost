import { DownMeta } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";
import { create_job } from "./job.ts";

const tasklist: {
    hash: string;
    srvc: string;
    isStopped: boolean;
    start: () => Promise<void>;
    stop: (msg: string) => Promise<void>;
    cancel: (msg: string) => Promise<void>;
}[] = new Array();

export type Task = {
    url:URL,
    service:DownMeta, 
    db:DB
}

export async function append_task(url:URL, service:DownMeta, db:DB) {
    const {srvc,uid} = service;
    const hash = srvc + uid;
    const remove = () => {
        const i = tasklist.findIndex(x => x.hash === hash);
        tasklist.splice(i, 1);
    }
    const job = await create_job(url, service, db, remove);
          job.start();
    tasklist.push(job);
    return true;
}

export async function set_task(id:number,act:string,db:DB) {
    const [[hash]] = db.query('SELECT hash from download WHERE id=? LIMIT 1',[id]);
    if(!hash) return;
    const job = tasklist.find(x => x.hash === hash);
    if(!job) return;
    switch(act){
        case 'stop'  : return job.stop(`job id ${hash} has been stopped by user request.`);
        case 'cancel': return job.cancel(`job id ${hash} has been removed by user request.`);
        case 'start' : if(job.isStopped) return job.start();
    }
    
}

export async function cancel_task(id:number,db:DB) {
    const [[hash]] = db.query('SELECT hash from download WHERE id=?',[id]);
    if(!hash) return;
    const job = tasklist.find(x => x.hash === hash);
    if(!job) return;
    
}