import { join, DB } from "./_deps.ts";
import { append_task, config, ensureFile } from "../lib/_mod.ts";
import { resolve } from "../script/_mod.ts";

export default async function handler({ source, db }: { source: URL, db: DB }) {
    try {
        const service = await resolve(source);
        const { thumbnail, srvc, uid } = service;
        const hash = srvc + uid;
        
        // download thumbnail
        const thumb_path = join(config.temp_dir, 'thumb', hash);
        if (!await ensureFile(thumb_path)) {
            const thumb_file = await Deno.create(thumb_path);
            const { body } = await fetch(thumbnail.input, thumbnail.init);
            if (body) { for await (const chunk of body) { thumb_file.writeSync(chunk) } }
            thumb_file.close();
        }

        await append_task(source, service, db);
        return JSON.stringify({ status: true });
    }
    catch (e) {
        return JSON.stringify({ status: false, message: e.message })
    }
}
