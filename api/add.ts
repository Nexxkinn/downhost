import { join,DB } from "./_deps.ts";
import { appendTask, Task, config, ensureFile } from "../lib/_mod.ts";
import { resolve } from "../script/_mod.ts";

export default async function handler({ url, db }: { url:URL, db: DB }){
    // download thumbnail
    const service = await resolve(url);
    const { thumbnail, title, length, srvc, uid } = service;
    const hash = srvc + uid;

    const thumb_path = join(config.temp_dir,'thumb',hash);
    if (!await ensureFile(thumb_path)) {
        const thumb_file = await Deno.create(thumb_path);
        const { body } = await fetch(thumbnail.input, thumbnail.init);
        if (body) { for await (const chunk of body) { thumb_file.writeSync(chunk) } }
        thumb_file.close();
    }
    
    appendTask(new Task({url, service, db }));
    return JSON.stringify({ status:true });
}
