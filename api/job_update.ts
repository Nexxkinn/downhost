import { set_job } from "../lib/job_man.ts";
import { DB } from './_deps.ts';

export default async function handler(task:string, id: number, db: DB) {
    if (task && id) {
        await set_job(id, task, db);
        return JSON.stringify({ status: true });
    }
    else return JSON.stringify({ status: false });
}