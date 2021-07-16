import {de, DownMeta, DownMetaArgs, DownRequest, DownTag, DownType} from './_deps.ts';

const token  = de("klcjv4xqjv9a04xlk1aopsqxklf6ac3lh16601tz...");
const token2 = de("klcjv4xqjv9a043ybhcoan1rbkyopcssbg9oc33hh266u1xtbg96a3slb2a9os3yklc6cnqqh2f9gn3vkh3ou9n...");
const srvc   = de("rlf641xlh1d6fnstkkff...");

export async function metadata({link}:DownMetaArgs):Promise<DownMeta> {

    const url = new URL(link);
    const path = url.pathname.match(/(?<=\/)\w+/g);
    if(!path || path.length > 3) throw new Error('Broken url. will not continue...')

    const uid = String(Number(path[1]));
    if (!uid) throw new Error('Broken url. unable to retrieve id.')

    
    const res = await fetch(token+'api?archive='+uid);
    const desc = await res.json();

    const title = desc.title;
    const length = Number(desc.filecount);
    const downpath = desc.download;
    url.pathname = downpath;
    
    let tags:DownTag[] = [];
    for(const entry of desc.tags) {
        const split = String(entry).split(":");
        if (split.length == 1) split.unshift("misc");
        const [ns,tag] = split
        tags.push({ns,tag})
    }

    const download:DownRequest = {
        input: url,
        init: undefined
    }
    const thumbnail:DownRequest = {
        input: new URL(token2+uid+'/thumb2.jpg'),
        init: undefined
    }

    return {
        type: DownType.BULK,
        srvc,
        uid,
        title,
        tags,
        length,
        download,
        thumbnail
    }
}
