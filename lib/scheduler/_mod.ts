import { Task } from "./Task.ts";
import { DB, DownMeta, status } from "./_deps.ts";
export { rebuild } from "./rebuild.ts";
const tasklist = new Array<Task>();

type addTaskNew = {
    source:URL,
    metadata:DownMeta,
    db:DB
}

type addTaskRestore = {
    task:Task
}

type addTaskArgs = addTaskNew | addTaskRestore;

export async function addTask(args:addTaskArgs){

    const remove = () => {
        // TODO: check if task is completely removed from the list.
        tasklist.splice(tasklist.findIndex(x => x.hash === task.hash), 1);
    }
    
    let task:Task;
    if('task' in args ) {
        task = args.task;
    }
    else {
        task = await Task({...args, clear:remove});
        const { source, db, metadata } = args;
        const { length, title } = metadata;
        const { hash } = task;

        // prepare the table.
        db.query("INSERT OR IGNORE INTO catalog(hash,url,title,length,status) VALUES(?,?,?,?,?)", [hash, source.href, title, length, 0])
        db.query("INSERT OR IGNORE INTO download(hash) VALUES(?)", [hash]);
        task.start(); // autostart
    }
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