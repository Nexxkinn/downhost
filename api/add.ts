import { DB } from "./_deps.ts";
import { appendTask, Task } from "../lib/_mod.ts";

export default async function handler({ url, db }: { url:URL, db: DB }){
    appendTask(new Task({ url:url.toString(), db }));
    return JSON.stringify({ status:true });
}
