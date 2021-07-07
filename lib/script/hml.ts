import { de, grab, DownMeta, DownRequest, DownType, DownPagesRequest, PageRequest, DownMetaArgs } from "./_deps.ts";

const token  = de("kly9v33kkg9onnv...");
const srvc   = de("kly9v33kkg9onnv...");
const gid_rx = /([\d]+)\.html/g;

export async function metadata({link}:DownMetaArgs): Promise<DownMeta> {
    const [[,uid]]    = link.matchAll(gid_rx);
    const g_i = await get_info(uid);

    const title = g_i.title;
    const length = g_i.files.length;

    const files:any = new Array<{filename:string,url:string}>();

    const get_subdomain = (hash:string) => {
        let  num = parseInt(hash.slice(hash.length - 3, hash.length - 1),16);
        const fe = num < 0x30 ? 2 : 3;
             num = num < 0x09 ? 1 : num;
        return String.fromCharCode(97 + (num % fe))
    }

    for( const {hash,name} of g_i.files) {
        const sub = get_subdomain(hash);
        const ext = name.split('.').pop();
        const path = `${hash.slice(hash.length -1)}/${hash.slice(hash.length - 3, hash.length - 1)}`;
        const url = `https://${sub}b.${token}/images/${path}/${hash}.${ext}`;
        
        files.push({filename:name,url});
    }

    const tn_file = () => {
        const file = files[0];
        const path = file.url.split('/images/').pop();
        return `https://tn.${token}/smallbigtn/${path}`;
    }

    const thumbnail:DownRequest = {
        input:tn_file(),
        init:undefined,
    }

    const download = {
        [Symbol.asyncIterator]() {
            return {
                async next() {
                    if (files.length === 0) return Promise.resolve({ value: { init: undefined, input: '', filename: '' }, done: true });
                    
                    const { filename, url:input } = files.shift() || {};
                    
                    const download: PageRequest = {
                        filename,
                        input,
                        init: { headers: { 'referer': link } }
                    }
                    return Promise.resolve({ value: download, done: false });
                }
            }
        }
    }

    return { 
        type:DownType.PAGES,
        srvc,
        title,
        tags:undefined,
        length,
        uid,
        download,
        thumbnail
    }
}

async function get_info(id:string){
    const g_info_url = `https://ltn.${token}/galleries/${id}.js`;

    const g_info_fetch = await fetch(g_info_url);
    const g_info_res = await g_info_fetch.text();
    return JSON.parse(g_info_res.split("galleryinfo = ")?.pop() || '');
}