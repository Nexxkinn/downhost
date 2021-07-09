import { Task } from "./Task.ts";
import type { DownMeta, DownTag } from "./_deps.ts";
import { DB, status } from "./_deps.ts";
export { restoreTask } from "./rebuild.ts";
const tasklist = new Array<Task>();

type addTaskArgs = {
    source:URL,
    offset?:number,
    metadata:DownMeta,
    db:DB
}

export async function addTask(args:addTaskArgs){

    const remove = () => {
        // TODO: check if task is completely removed from the list.
        tasklist.splice(tasklist.findIndex(x => x.hash === task.hash), 1);
    }
    
    const task = await Task({...args, clear:remove});
    const { source, db, metadata } = args;
    const { srvc, length, title } = metadata;
    const { hash } = task;
 
    let tags:DownTag[] = metadata.tags ?? [];
    // add "source" tag
    tags.filter((x) => x.ns.toLowerCase() !== "source");
    tags.push({ns:"source",tag:srvc});

    // insert tags into the table
    for ( const {ns,tag} of tags) {
        db.query(`INSERT OR IGNORE INTO tagrepo(ns, tag) VALUES(?, ?)`,[ns,tag]);
        const [[id]] = db.query (`SELECT id from tagrepo WHERE ns=? AND tag=? LIMIT 1`,[ns,tag]);
        db.query(`INSERT OR IGNORE INTO tag(hash, tag_id) VALUES(?, ?)`,[hash,id]);
    }

    // add "source" tag
    db.query(`INSERT OR IGNORE INTO tagrepo(ns, tag) VALUES(?, ?)`,["source",srvc]);

    // prepare the table.
    db.query("INSERT OR IGNORE INTO catalog(hash,url,title,length,status) VALUES(?,?,?,?,?)", [hash, source.href, title, length, 0])
    db.query("INSERT OR IGNORE INTO download(hash,size_down) VALUES(?,?)", [hash,args.offset ?? 0]);

    task.start(); // autostart
    tasklist.push(task);
    return true;
}
// deno-lint-ignore require-await
export async function setTask(id: number, task: string, db: DB) {
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