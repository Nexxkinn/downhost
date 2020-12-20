import { DownMeta } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";
import { create_job } from "./job.ts";
import { status } from "./_deps.ts";
import { resolve } from "../script/_mod.ts";

const tasklist: {
    hash: string;
    srvc: string;
    status: status;
    start: () => Promise<void>;
    stop: (msg: string) => Promise<void>;
    cancel: (msg: string) => Promise<void>;
}[] = new Array();

export async function append_job(url: URL, service: DownMeta, db: DB) {
    const { srvc, uid } = service;
    const hash = srvc + uid;

    // TODO: check if there's any task that has yet running
    const remove = () => {
        tasklist.splice(tasklist.findIndex(x => x.hash === hash), 1);
    }

    // TODO: start only if it hasn't reached parallel download limit
    const job = await create_job(url, service, db, remove);
    job.start();

    tasklist.push(job);
    return true;
}

export async function restore_job(source:URL,db:DB){
    const service = await resolve(source);
    return await append_job(source,service,db);
}

export async function set_job(id: number, task: string, db: DB) {
    const [[hash]] = db.query('SELECT hash from download WHERE id=? LIMIT 1', [id]);
    if (!hash) return;
    const job = tasklist.find(x => x.hash === hash);
    if (!job) return;
    switch (task) {
        case 'start': if (job.status === status.STOPPED) return job.start(); break;
        case 'stop': return job.stop(`job id ${hash} has been stopped by user request.`);
        case 'cancel': return job.cancel(`job id ${hash} has been removed by user request.`);
        default: return;
    }
}

