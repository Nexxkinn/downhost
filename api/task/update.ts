import { setTask } from "../../lib/_mod.ts";
import { DB } from '../_deps.ts';

export default async function handler(task:string, id: number, db: DB) {
    if (task && id) {
        await setTask(id, task, db);
        return JSON.stringify({ status: true });
    }
    else return JSON.stringify({ status: false });
}