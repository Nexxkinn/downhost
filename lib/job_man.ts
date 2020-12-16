import { DownMeta } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";
import { create_job } from "./job.ts";
import { status } from "./_deps.ts";

const tasklist: {
    hash: string;
    srvc: string;
    status: status;
    start: () => Promise<void>;
    stop: (msg: string) => Promise<void>;
    cancel: (msg: string) => Promise<void>;
}[] = new Array();

export async function append_task(url: URL, service: DownMeta, db: DB) {
    const { srvc, uid } = service;
    const hash = srvc + uid;

    const remove = () => {
        const i = tasklist.findIndex(x => x.hash === hash);
        tasklist.splice(i, 1);
        // TODO: check if there's any task that has yet running
    }

    const job = await create_job(url, service, db, remove);
    job.start(); // TODO: start only if it hasn't reached parallel download limit

    tasklist.push(job);
    return true;
}

export async function set_task(id: number, task: string, db: DB) {
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

