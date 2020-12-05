import { de, grab, DownMeta, DownRequest, DownType, DownPagesRequest, PageRequest } from "./_deps.ts";

const token = de("klcjv4xqjv9a0cxhk1copcsrbe4ju41rbk96csn...");
const srvc = de("kla642xlkh9ou0xerb...");

export async function metadata(link: string): Promise<DownMeta> {

    const url = new URL(link);
    const [_, uid] = url.pathname.startsWith('/view/') ? link.split('/view/') : link.split('/zip/');

    if (!uid) throw new Error(`unknown link: ${link}`);

    const res = await fetch(url);
    const html = await res.text();
    const title = grab('<h1 class="title">', '</h1>', html);
    const length = Number(grab(`<td class="viewcolumn">Pages</td>\n\t\t\t\t\t\t\t<td>\n\t\t\t\t\t\t\t\t`, '\t', html));
    const thumb = grab('"og:image" content="', '"', html);

    const thumbnail: DownRequest = { input: new URL(thumb), init: undefined }

    const canDownload = html.includes('/download/');
    let download, type;
    if (canDownload) {
        type = DownType.BULK;
        url.pathname = `/zip/${uid}`;
        download = await fetch_link(url);
    }
    else {
        type = DownType.PAGES;
        url.pathname = `/read/${uid}`;
        const reader_fetch = await fetch(url);
        const reader_html = await reader_fetch.text();
        const reader_data = grab('initReader("', '"', reader_html);
        const pages: any = parse_data(reader_data);
        download = {
            [Symbol.asyncIterator]() {
                return {
                    async next() {
                        if (pages.length === 0) return Promise.resolve({ value: { init: undefined, input: '', filename: '' }, done: true });
                        const { link: input, filename } = pages.shift() || {};

                        const alt = async ({ init, filename }: PageRequest) => {
                            return { input, init, filename }
                        }

                        const download: PageRequest = {
                            filename,
                            input,
                            init: undefined,
                            alt
                        }
                        return Promise.resolve({ value: download, done: false });
                    }
                }
            }
        }
    }
    return { type, srvc, title, uid, length, thumbnail, download };
}

async function fetch_link(url: URL): Promise<DownRequest> {

    const { u, p } = JSON.parse(Deno.readTextFileSync("auth.json"))['hnx'];
    const cookie = await getToken(u, p);

    const res: DownRequest = {
        input: url,
        init: {
            method: "GET",
            headers: { "cookie": cookie }
        }
    }
    return res;
}

async function getToken(u: string, p: string) {

    const res = await fetch(token, { method: "HEAD" });

    const cookies = res.headers.get('Set-Cookie') || "";
    const cfduid = grab("__cfduid=", ";", cookies);
    const cf_bm = grab("__cf_bm=", ";", cookies);
    const session = grab("session=", ";", cookies);

    const formdata = new FormData();
    formdata.append('username', u);
    formdata.append('password', p);
    const cookie = `session=${session}; __cfduid=${cfduid}; __cf_bm=${cf_bm};`
    const login = await fetch(`${token}login`, { method: 'POST', body: formdata, headers: { cookie } });

    if (login.url === `${token}login`) throw Error("Wrong username or password");
    return cookie;
}
function parse_data(input: string) {
        return parse_data_v2(input);
}

function parse_data_v2(input: string) {
    let data_atob = atob(input);
    let key = new Array();
    let decoded = '';
    
    for (let i = 0; i < 0x100; i++) key.push(i) 
    
    // generate key
    let offset = 0x0;
    for (let i = 0x0; i < 0x100; i++) {
        offset = (offset + key[i] + data_atob.charCodeAt(i % 0x40)) % 0x100;
        [key[i], key[offset]] = [key[offset], key[i]];
    }

    // parse data using key
    offset = 0x0;
    let x=0, decode = 0x0, randr = 0x0;
    for (let i = 0x0; i + 0x40 < data_atob.length; i++) {
        x = (x + 1) % 0x100;
        offset = (randr + key[(offset + key[x]) % 0x100]) % 0x100;
        randr = (randr + x + key[x]) % 0x100;
        [key[x], key[offset]] = [key[offset], key[x]];
        decode = key[(offset + key[(x + key[(decode + randr) % 0x100]) % 0x100]) % 0x100];
        decoded += String.fromCharCode(data_atob.charCodeAt(i + 0x40) ^ decode);
    }
    const parsed = JSON.parse(decoded);
    const { b, r, i, f } = parsed;
    const data: { link: string, filename: string }[] = [];
    for (const { h, p } of f) {
        data.push({
            link: b + r + h + '/' + i + '/' + p,
            filename: p
        });
    };
    return data
}


// function parse_data_v1(input: string) {
//     let data_atob = atob(input);
//     let token = data_atob.slice(0x0, 0x40);
//     let key = new Array();
//     let decoded = '';

//     for (let i = 0; i < 0x100; i++) key.push(i)

//     // generate key
//     let offset = 0x0;
//     for (let i = 0x0; i < 0x100; i++) {
//         offset = (offset + key[i] + token.charCodeAt(i % token.length)) % 0x100;
//         [key[i], key[offset]] = [key[offset], key[i]];
//     }

//     // parse data using key
//     offset = 0x0;
//     let randr = 0x0;
//     for (let i = 0x0; i < data_atob.length - 0x40; i++) {
//         randr = (randr + 0x1) % 0x100;
//         offset = (offset + key[randr]) % 0x100;
//         [key[randr], key[offset]] = [key[offset], key[randr]];
//         decoded += String.fromCharCode(data_atob.charCodeAt(i + 0x40) ^ key[(key[randr] + key[offset]) % 0x100]);
//     }
//     console.log(decoded);
//     const parsed = JSON.parse(decoded);
//     const { b, r, i, f } = parsed;
//     const data: { link: string, filename: string }[] = [];
//     for (const { h, p } of f) {
//         data.push({
//             link: b + r + h + '/' + i + '/' + p,
//             filename: p
//         });
//     };
//     return data
// }
