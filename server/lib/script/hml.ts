import { de, DownMeta, DownRequest, DownType, PageRequest, DownMetaArgs, DownTag } from "./_deps.ts";

const token  = de("kly9v33kkg9onnv...");
const srvc   = de("kly9v33kkg9onnv...");
const gid_rx = /([\d]+)\.html/g;

export async function metadata({link,offset}:DownMetaArgs): Promise<DownMeta> {
    const [[,uid]]    = link.matchAll(gid_rx);
    const g_i = await get_info(uid);

    const title  = g_i.title;
    const length = g_i.files.length;
    const tags   = parseTags(g_i.tags);

    const files:any[] = new Array<{filename:string,url:string}>();

    const get_subdomain = (hash:string) => {
        let  num = parseInt(hash.slice(hash.length - 3, hash.length - 1),16);
        const off = num < 0x44 ? 2 : num < 0x88 ? 1 : 0;
        return String.fromCharCode(97 + off) // (97 + (num % fe))
    }

    for( const {hash,name} of g_i.files) {
        const sub = get_subdomain(hash);
        const ext = name.split('.').pop();
        const path = `${hash.slice(hash.length -1)}/${hash.slice(hash.length - 3, hash.length - 1)}`;
        const url = `https://${sub}b.${token}/images/${path}/${hash}.${ext}`;
        
        files.push({filename:name,url});
    }

    // remove already downloaded pages from s_pages
    if(offset && offset < length && offset < files.length) files.splice(0,offset);

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
        tags,
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

function parseTags(query:any){
    const tags:DownTag[] = [];
    let ns:string, name:string;
    for(const tag of query) {
        if('male' in tag || 'female' in tag) {
            ns = tag.male ? 'male' : tag.female ? 'female' : 'misc';
        }
        else ns = "misc";
        name = tag.tag;
        tags.push({ns,tag:name});
    }
    return tags;
}