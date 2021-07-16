// deno-lint-ignore-file
import { DB } from '../_deps.ts';

export default async function handler(db: DB) {
    const list = new Array();
    const res = db.query("SELECT download.id id, title, status, size, size_down FROM catalog INNER JOIN download ON catalog.hash = download.hash");
    // deno-lint-ignore camelcase
    for (const [id, title, status, size, size_down] of res) {
        if(status !== 3) list.push({ id, title, status, size, size_down })
    }
    return JSON.stringify(list);
}