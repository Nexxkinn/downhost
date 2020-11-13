import {de, Download, DownMeta, DownType} from './_deps.ts';

const token = de("klcjv4xqjv9a04xlk1aopsqxklf6ac3lh16601tz...");
const srvc  = de("rlf641xlh1d6fnstkkfa43szby...");

export async function download({ meta }:Download) {
    return await fetch(meta.url);
}

export async function metadata(link:string):Promise<DownMeta> {

    const url = new URL(link);
    const path = url.pathname.match(/(?<=\/)\w+/g);
    if(!path || path.length > 3) throw new Error('Broken url. will not continue...')

    const uid = String(Number(path[1]));
    if (!uid) throw new Error('Broken url. unable to retrieve id.')

    
    const res = await fetch(token+'api?archive='+uid);
    const desc = await res.json();

    const title = desc.title;
    const downpath = desc.download;
    url.pathname = downpath;

    return {
        uid,
        title,
        type: DownType.BULK,
        url,
    }
}
