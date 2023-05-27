// deno-lint-ignore-file
import { DB } from '../_deps.ts';
import { Task } from '../_mod.ts';

export default async function handler(db: DB) {
    const list = new Array<Task>();
    const res = db.query("SELECT download.id id, title, status, size, size_down FROM catalog INNER JOIN download ON catalog.hash = download.hash");
    // deno-lint-ignore camelcase
    for (const [id, title, status, size, size_down] of res) {
        if(status !== 3) list.push({ id, title, status, size, size_down } as Task)
    }
    return list;
}