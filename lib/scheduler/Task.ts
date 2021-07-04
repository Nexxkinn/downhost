// deno-lint-ignore-file
import { DB, status } from "./_deps.ts";
import { filename } from "../_mod.ts";
import { resolve } from "../script/_mod.ts";
import type { DownMeta } from "./_deps.ts";

import { Task_Start } from "./start.ts";

type TaskArgs = {
    source: URL,
    metadata?: DownMeta,
    db: DB,
    clear: () => void,
}

export type Task = {
    hash: string;
    srvc: string;
    status: status;
    start: () => Promise<void>;
    stop: (msg: string) => Promise<void>;
    cancel: (msg: string) => Promise<void>;
}

export async function Task({ source, metadata, db, clear }: TaskArgs): Promise<Task> {

    if (!metadata) metadata = await resolve(source);
    const { download, type, srvc, length, uid, title } = metadata;
    const compiledFilename = filename(srvc, uid, title);
    const hash = srvc + uid;
    let _status = status.INITIALIZED;
    let stopControl = new AbortController();

    const start = async () => {
        _status = status.RUNNING;
        if (stopControl.signal.aborted) { _status = status.STOPPED; stopControl = new AbortController(); }

        // TODO: resume task
        db.query('UPDATE download SET size=?,size_down=?  WHERE hash=?', [0, 0, hash]);

        const setSize = (size: number) => {
            db.query("UPDATE download SET size=?  WHERE hash=?", [size, hash]);
            db.query("UPDATE catalog SET status=? WHERE hash=?", [1, hash]);
        }

        const setProgress = (size: number) => {
            db.query("UPDATE download SET size_down=? WHERE hash=?", [size, hash]);
        }

        const TaskResult = await Task_Start({
            download,
            type,
            hash,
            length,
            compiledFilename,
            signal: stopControl.signal,
            setSize,
            setProgress
        });

        switch (TaskResult.status) {
            case "success": {
                db.query("UPDATE catalog SET status=?,filename=? WHERE hash=? ", [3, compiledFilename, hash]);
                db.query("DELETE FROM download WHERE hash=?", [hash]);
                clear();
                break;
            }
            case "aborted": {
                console.log(`Task ${hash} has successfully been aborted.`);
                break;
            }
            case "failed": {
                stop(TaskResult.message || `Task ${hash} failed with unknown cause`);
                break;
            }
        }
    }

    // deno-lint-ignore require-await
    const stop = async (msg:string) => {
        console.log(msg);
        stopControl.abort();
        _status = status.STOPPED;
        db.query("UPDATE catalog SET status=? WHERE hash=?", [2, hash]);
    }

    // deno-lint-ignore require-await
    const cancel = async (msg: string) => {
        console.log(msg);
        stopControl.abort();
        db.query("DELETE FROM catalog WHERE hash=?", [hash]);
        db.query("DELETE FROM download WHERE hash=?", [hash]);
        clear();
    }


    return { hash, srvc, start, stop, cancel, get status() { return _status } }
}
