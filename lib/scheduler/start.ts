// deno-lint-ignore-file
import type { DownRequest, DownPagesRequest, PageRequest } from "./_deps.ts";
import { create_zip, join, DownType, log } from "./_deps.ts";
import { config, ensureDir } from "../_mod.ts";

type taskStartArgs = {
    type: DownType,
    hash: string,
    compiledFilename: string,
    length: number,
    download: DownRequest | DownPagesRequest,
    signal: AbortSignal,
    setSize: (size: number) => void,
    setProgress: (size: number) => void,
}

type status = 'success' | 'aborted' | 'failed';

type TaskStartOutput = {
    status:status,
    message?:string
}

export async function Task_Start({ type, download, hash, length, compiledFilename, signal, setSize, setProgress }: taskStartArgs): Promise<TaskStartOutput> {
    // initialize database
    switch (type) {
        case DownType.BULK: {
            if (!('input' in download)) throw new Error("wrong DownType.");

            const { input, init } = download;
            const { body, headers } = await fetch(input, {...init,signal});
            if (!body) return { status:"failed", message: 'unable to download file'}

            const fileSize = Number(headers.get('content-length'));
            setSize(fileSize);

            const file = await Deno.open(join(config.catalog_dir, compiledFilename), { create: true, write: true });
            let len = 0;
            for await (const chunk of body) {
                if (signal.aborted) return { status:"aborted" };
                file.writeSync(chunk);
                len += chunk.length;
                setProgress(len);
            }
            file.close();
            break;
        }
        case DownType.PAGES: {
            if ('input' in download) throw new Error("wrong DownType.");

            let page_downloaded = 0;

            await ensureDir(`${config.temp_dir}/${hash}`);
            const zip = await create_zip(join(config.temp_dir, hash, compiledFilename));

            setSize(length);

            /**
             * failed fetch diagram:
             * 1. fetch_file()
             * 2. fetch_file() 3 tries
             * 3. alt(old_download) -> fetch_file(new_download)
             *    |-> if alt() = undefined -> file is considered broken. abort the job...
             * 4. fetch_file(new_download) 3 tries
             * 5. file is considered broken. abort the job...  
             */
            const fetch_file = async (page: PageRequest, retry = 3, is_alt = false): Promise<boolean> => {
                const { input, init, filename, alt } = page;
                const fetchControl = new AbortController();
                signal.addEventListener("abort", () => fetchControl.abort());
                const id = setTimeout(() => { fetchControl.abort(); }, 100000);
                try {
                    const { body } = await fetch(input, { signal: fetchControl.signal });
                    if (!body) throw new Error('unable to download file');

                    let buffer = new Uint8Array(0);
                    const _append = (a: Uint8Array, b: Uint8Array) => {
                        const c = new Uint8Array(a.length + b.length);
                        c.set(a, 0);
                        c.set(b, a.length);
                        return c;
                    }

                    for await (const buff of body) buffer = _append(buffer, buff);

                    clearTimeout(id);
                    if (fetchControl.signal.aborted) throw new Error('Timeout');
                    await zip.push(buffer, filename);
                    return true;
                }
                catch (e) {
                    if (signal.aborted) return false;
                    if (retry <= 0) {
                        if (alt && !is_alt) {
                            log(`Stop downloading ${filename}. requesting alternate link...`);
                            const new_page = await alt(page)
                            log(`Received alternate link. downloading ${filename}...`)
                            return fetch_file(new_page as PageRequest, 3, true);
                        }
                        else {
                            log(`${filename} is considered broken. abort the job...`);
                            return false;
                        }
                    }
                    else if (retry >= 0) {
                        log(`Problem downloading ${filename}: ${e.message} retrying... (${retry})`);
                        return fetch_file(page, retry -= 1, is_alt);
                    }
                    else {
                        log(`${filename} is considered broken. abort the job...`);
                        return false;
                    }
                }
            }

            for await (const page of download) {
                if (signal.aborted) return { status:"aborted" };
                log(`Downloading ${page.filename}`);
                const isDownloaded = await fetch_file(page);
                if (isDownloaded) setProgress(page_downloaded += 1);
                else return { status:"failed", message: `job id ${hash} has a problem: unable to download page ${page.filename}` };
            }

            if (signal.aborted) return { status:"aborted" };

            log(JSON.stringify({ page_downloaded, download }))

            log('compile gallery into compressed zip...');
            await zip.close();
            await Deno.copyFile(join(config.temp_dir, hash, compiledFilename), join(config.catalog_dir, compiledFilename))
            await Deno.remove(join(config.temp_dir, hash), { recursive: true });

            log(`done: ${join(config.catalog_dir, compiledFilename)}`);

            break;
            // TODO: get restriction e.g. delay between downloads
        }
    }

    return { status:"success" };
}