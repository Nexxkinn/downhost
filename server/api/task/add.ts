import { join, DB } from "../_deps.ts";
import { addTask, resolve, config, ensureFile } from "../../lib/_mod.ts";

export default async function handler({ source, db }: { source: URL, db: DB }) {
    try {
        const metadata = await resolve(source);
        const { thumbnail, srvc, uid } = metadata;
        const hash = srvc + uid;
        
        // download thumbnail
        const thumbPath = join(config.temp_dir, 'thumb', hash);
        if (!await ensureFile(thumbPath)) {
            const thumbFile = await Deno.create(thumbPath);
            const { body } = await fetch(thumbnail.input, thumbnail.init);
            if (body) { for await (const chunk of body) { thumbFile.writeSync(chunk) } }
            thumbFile.close();
        }

        await addTask({source,metadata, db});
        return JSON.stringify({ status: true });
    }
    catch (e) {
        return JSON.stringify({ status: false, message: e.message })
    }
}
