import { en, de, loadConfig, ensureFile, log, zipDir } from './_mod.ts';
import { service } from '../script/_mod.ts';
import { join } from './_deps.ts';
import { DownMeta, DownType, PageRequest } from "../script/_deps.ts";
import { DB } from "../api/_deps.ts";

const TaskList: Promise<any>[] = new Array();
const config = await loadConfig();

export enum ActionMode { STOP, START, RESUME };

export const appendTask = (task: Task) => TaskList.push(run(task));

export class Task {
    private _action: ActionMode;
    private _url: string;
    private _db: DB;

    constructor({ url, db, action = ActionMode.START }: { url: string; db: DB; action?: ActionMode; }) {
        this._url = url;
        this._action = action;
        this._db = db;
    }

    get url() { return this._url }
    get action() { return this._action }
    get db() { return this._db }

}

function run(task: Task) {
    const pto = new Promise(async (rej) => {
        const { url, db, action } = task
        switch (action) {
            case ActionMode.START: {
                const { download: fetch_args, thumbnail, srvc, type, title, uid } = await resolve(url);
                const hash = srvc + uid;

                // download thumbnail
                const thumb_path = `${config.temp_dir}/thumb/${hash}`;
                if (!await ensureFile(thumb_path)) {
                    const thumb_file = await Deno.create(thumb_path);
                    const { body } = await fetch(thumbnail.input, thumbnail.init);

                    if (body) { for await (const chunk of body) { thumb_file.writeSync(chunk) } }

                    thumb_file.close();
                }

                db.query("INSERT INTO catalog(hash,url,title,status) VALUES(?,?,?,?)", [hash, url, title, 0])

                const file_name = `[${srvc}][${uid}] ${title.replace(/[/\\?%*:|"<>]/g,'_')}.zip`;

                switch (type) {
                    case DownType.BULK: {
                        if (!('input' in fetch_args)) throw new Error("wrong DownType.");

                        const { input, init } = fetch_args;
                        const { body, headers } = await fetch(input, init);
                        if (!body) return rej('unable to download file');

                        let size = Number(headers.get('content-length'));
                        db.query("INSERT INTO download(hash,size) VALUES(?,?)", [hash, size])
                        db.query("UPDATE catalog SET status=? WHERE hash=? ", [1, hash]);

                        const file = await Deno.create(`${config.catalog_dir}/${file_name}`);
                        let len = 0;
                        for await (const chunk of body) {
                            file.writeSync(chunk);
                            len += chunk.length;
                            db.query("UPDATE download SET size_down=? WHERE hash=? ", [len, hash]);
                        }
                        break;
                    }
                    case DownType.PAGES: {

                        if ('input' in fetch_args) throw new Error("wrong DownType.");

                        const { gallery_size } = fetch_args;

                        await Deno.mkdir(`${config.temp_dir}/${hash}`);

                        db.query("INSERT INTO download(hash,size) VALUES(?,?)", [hash, gallery_size])
                        db.query("UPDATE catalog SET status=? WHERE hash=? ", [1, hash]);

                        let page_downloaded = 0;
                        /**
                         * failed fetch stage
                         * fetch_file()
                         *     V
                         * fetch_file() 3 tries
                         *     V
                         * alt_download(old_download) -> fetch_file(new_download)
                         *     |
                         * || if alt_download() = undefined || -> file is considered broken. skipping...
                         *     V
                         * fetch_file(new_download) 3 tries
                         *     V
                         * file is considered broken. skipping... 
                         * note: 
                         */
                        const fetch_file = async (page: PageRequest, retry = 3, is_alt=false) => {
                            const { input, init, filename, alt } = page;
                            let isTimeOut=false;
                            let id = 0;
                            try {
                                const file = await Deno.create(`${config.temp_dir}/${hash}/${filename}`);
                                id = setTimeout(() => { isTimeOut=true; console.error(new Error('Timed out')) }, 30000);
                                const { body, status } = await fetch(input, {...init});
                                clearTimeout(id);
                                if (!body || status !== 200) throw new Error('unable to download file');
                                for await (const chunk of body) { file.writeSync(chunk); }
                            }
                            catch (e) {
                                clearTimeout(id);
                                if(retry <= 0 || isTimeOut ) {
                                    if(alt && !is_alt) {
                                        log(`Stop downloading ${filename}, requesting alternate download...`);
                                        const new_page = await alt(page) // request alternate download
                                        await fetch_file(new_page as PageRequest,3,true);
                                    }
                                    else {
                                        log(`${filename} is considered broken, skipping...`)
                                    }
                                }
                                else {
                                    log(`Problem downloading ${filename}, retrying... (${retry})`);
                                    await fetch_file(page,retry-=1,is_alt);
                                }
                            }
                        }
                        for await (const page of fetch_args) {
                            log(`Downloading ${page.filename}`);
                            await fetch_file(page);
                            db.query("UPDATE download SET size_down=? WHERE hash=? ", [page_downloaded += 1, hash]);
                        }
                        log(JSON.stringify({ page_downloaded, gallery_size }))

                        log('compile gallery into compressed zip...')
                        const zip = await zipDir(join(config.temp_dir,hash));
                        await zip.writeZip(join(config.catalog_dir,file_name));
                        await Deno.remove(join(config.temp_dir,hash),{recursive:true});

                        log(`done: ${join(config.catalog_dir,hash)}.zip`);

                        break;
                        // TODO: get restriction e.g. delay between downloads
                    }
                }

                db.query("UPDATE catalog SET status=? WHERE hash=? ", [3, hash]);

                TaskList.splice(TaskList.indexOf(pto), 1);
                break;
            }
            case ActionMode.RESUME: {
                // grab meta from database
            }
        }

    })
    return pto;
}

async function resolve(link: string): Promise<DownMeta> {
    const url = new URL(link);
    const hostname = en(url.hostname);
    const srvc = service(hostname);
    if (!srvc) throw new Error(`Unable to resolve: ${link}`);
    const metadata: DownMeta = await srvc.metadata(link);
    //console.log(metadata);
    return metadata;
}