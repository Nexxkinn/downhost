import { set_task } from "../lib/job_man.ts";
import { DB } from './_deps.ts';

export default async function handler(body: any, db: DB) {
    const { id, task } = body;
    if (task && id) {
        await set_task(body.id, body.task, db);
        return JSON.stringify({ status: true });
    }
    else return JSON.stringify({ status: false });
}