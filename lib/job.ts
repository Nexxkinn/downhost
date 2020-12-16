import { en, de, config, ensureDir, ensureFile, log } from './_mod.ts';
import { join, create_zip, status } from './_deps.ts';
import { DownMeta, DownType, PageRequest } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";


export async function create_job(source: URL, meta: DownMeta, db: DB, remove:() => void) {
    const { download, srvc, type, title, length, uid } = meta;
    let _stat  = status.INITIALIZED;
    let abc    = new AbortController();
    const hash = srvc + uid;
    const file_name = gen_filename(srvc, uid, title);

    const start  = async () => {
        _stat = status.RUNNING;
        if (abc.signal.aborted) { _stat = status.STOPPED; abc = new AbortController(); }

        // initialize database
        db.query("INSERT OR IGNORE INTO catalog(hash,url,title,length,status) VALUES(?,?,?,?,?)", [hash, source.href, title, length, 0])
        db.query("INSERT OR IGNORE INTO download(hash) VALUES(?)", [hash]);
        db.query('UPDATE download SET size=?,size_down=?  WHERE hash=?', [0,0,hash]);

        switch (type) {
            case DownType.BULK: {
                if (!('input' in download)) throw new Error("wrong DownType.");

                const { input, init } = download;
                const { body, headers } = await fetch(input, init);
                if (!body) return stop('unable to download file');

                const size = Number(headers.get('content-length'));
                db.query("UPDATE download SET size=?  WHERE hash=?", [size, hash]);
                db.query("UPDATE catalog SET status=? WHERE hash=?", [1, hash]);

                const file = await Deno.open(`${config.catalog_dir}/${file_name}`);
                let len = 0;
                for await (const chunk of body) {
                    if (abc.signal.aborted) return;
                    file.writeSync(chunk);
                    len += chunk.length;
                    db.query("UPDATE download SET size_down=? WHERE hash=?", [len, hash]);
                }
                file.close();
                break;
            }
            case DownType.PAGES: {
                if ('input' in download) throw new Error("wrong DownType.");

                let page_downloaded = 0;

                await ensureDir(`${config.temp_dir}/${hash}`);
                const zip = await create_zip(join(config.temp_dir, hash, file_name));

                db.query("UPDATE download SET size=?  WHERE hash=?", [length, hash])
                db.query("UPDATE catalog SET status=? WHERE hash=?", [1, hash]);

                /**
                 * failed fetch diagram:
                 * 1. fetch_file()
                 * 2. fetch_file() 3 tries
                 * 3. alt(old_download) -> fetch_file(new_download)
                 *    |-> if alt() = undefined -> file is considered broken. pause the job...
                 * 4. fetch_file(new_download) 3 tries
                 * 5. file is considered broken. pause the job...  
                 */
                const fetch_file = async (page: PageRequest, retry = 3, is_alt = false): Promise<Boolean> => {
                    const { input, init, filename, alt } = page;
                    const abc = new AbortController();
                    try {
                        // this is our current implementation to make a timeout abort fetch
                        // because Deno has yet to implement AbortController feature on fetch.
                        // TODO    : Refactor this code to use AbortController() once available.
                        // Tracker : https://github.com/denoland/deno/pull/6093
                        await new Promise(async (resolve: any, reject: any) => {

                            const id = setTimeout(() => { abc.abort(); return reject('Timed out'); }, 30000);
                            try {
                                const res = await fetch(input, init);
                                await save_file(res, filename, abc.signal);
                                resolve();
                            }
                            catch (e) {
                                reject(e.message);
                            }
                            finally {
                                clearTimeout(id);
                            }
                        })
                        return true;
                    }
                    catch (e) {
                        if (retry <= 0 || abc.signal.aborted) {
                            if (alt && !is_alt) {
                                log(`Stop downloading ${filename}, requesting alternate link...`);
                                const new_page = await alt(page)
                                log(`Received alternate link, downloading ${filename}...`)
                                return await fetch_file(new_page as PageRequest, 3, true);
                            }
                            else {
                                log(`${filename} is considered broken, abort the job...`);
                                return false;
                            }
                        }
                        else if (retry >= 0) {
                            log(`Problem downloading ${filename}, retrying... (${retry})`);
                            return await fetch_file(page, retry -= 1, is_alt);
                        }
                        else {
                            log(`${filename} is considered broken, abort the job...`);
                            return false;
                        }
                    }
                }

                const save_file = async ({ body, status }: Response, filename: string, signal: AbortSignal) => {
                    if (!body || status !== 200) throw new Error('unable to download file');

                    let buffer = new Uint8Array(0);
                    const _append = (a: Uint8Array, b: Uint8Array) => {
                        const c = new Uint8Array(a.length + b.length);
                        c.set(a, 0);
                        c.set(b, a.length);
                        return c;
                    }
                    for await (const chunk of body) {
                        if (signal.aborted) return;
                        buffer = _append(buffer, chunk)
                    };
                    if (signal.aborted) return;
                    await zip.push(buffer, filename);
                }

                for await (const page of download) {
                    if (abc.signal.aborted) return;
                    log(`Downloading ${page.filename}`);
                    const is_downloaded = await fetch_file(page);
                    if (is_downloaded) db.query("UPDATE download SET size_down=? WHERE hash=? ", [page_downloaded += 1, hash]);
                    else return stop(`job id ${hash} has a problem: unable to download page ${page.filename}`);
                }

                if (abc.signal.aborted) return;

                log(JSON.stringify({ page_downloaded, length }))

                log('compile gallery into compressed zip...');
                await zip.end();
                await Deno.copyFile(join(config.temp_dir, hash, file_name), join(config.catalog_dir, file_name))
                await Deno.remove(join(config.temp_dir, hash), { recursive: true });

                log(`done: ${join(config.catalog_dir, file_name)}`);

                break;
                // TODO: get restriction e.g. delay between downloads
            }
        }

        db.query("UPDATE catalog SET status=?,filename=? WHERE hash=? ", [3, file_name, hash]);
        remove();
    }

    const stop   = async (msg:string) => {
        console.log(msg);
        abc.abort();
        _stat = status.STOPPED;
        db.query("UPDATE catalog SET status=? WHERE hash=?", [2, hash]);
    }

    const cancel = async (msg:string) => {
        console.log(msg);
        abc.abort();
        db.query("DELETE catalog WHERE hash=?", [hash]);
        db.query("DELETE download WHERE hash=?", [hash]);
        remove();
    }

    const stat = () => _stat;

    return { hash, srvc, status:stat, start, stop, cancel }
}

function gen_filename(srvc: string, uid: string, title: string) {
    const header = `[${srvc}][${uid}]`;
    let name = '';
    let step = 0;
    do {
        switch (step) {
            case 0: { // remove unicode escape strings
                name = title.replace(/&(?:\#(?:(?<dec>[0-9]+)|[Xx](?<hex>[0-9A-Fa-f]+))|(?<named>[A-Za-z0-9]+));/g, '');
                step++;
                break;
            }
            case 1: { // remove second or alt title
                name = name.split('|')[0];
                step++;
                break;
            }
            case 2: { // limit to first 180 letters only.
                name = name.slice(0, 180);
                step++;
                break;
            }
            case 3: { // retain title only
                name = name.replace(/[\[\{](.*?)[\}\]]/g, '');
                step++;
                break;
            }
            default: { // last chance. header only.
                name = '';
                break;
            }
        }
    }
    while (header.length + name.length + 4 > 200)
    const filename = header + name.replace(/[/\\?%*:|"<>]/g, '-') + '.zip';
    log(filename);
    return filename;
}

