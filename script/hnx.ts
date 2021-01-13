import { de, grab, DownMeta, DownRequest, DownType, PageRequest } from "./_deps.ts";

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
    const parse = (c = 5): any => {
        try {
            switch (c) {
                case 5: return parse_data_v15(input);
                // case 4: return parse_data_v13(input);
                // case 3: return parse_data_v12(input);
                // case 2: return parse_data_v8(input);
                // case 1: return parse_data_v6(input);
                default: throw new Error('unable to parse any variant');
            }
        }
        catch (e) {
            if (c === 0) throw e;
            return parse(c -= 1);
        }
    }
    return parse();
}

function parse_data_v15(input: string) {
    let data_atob = atob(input);
    let key = new Array();
    let decoded = '';

    let var_1 = [], var_2 = [];

    // unknown 1
    for (let i = 0x2; var_2.length < 0x10; ++i) {
        if (!var_1[i]) {
            var_2.push(i);
            for (let x = i << 0x1; x <= 0x100; x += i)
                var_1[x] = 1;
        }
    }

    // unknown 2
    let var_3 = 0x0;
    for (let i = 0x0; i < 0x40; i++) {
        var_3 = var_3 ^ data_atob.charCodeAt(i);
        for (let x = 0x0; x < 0x8; x++) var_3 = var_3 & 0x1 ? var_3 >> 0x1 ^ 0xc : var_3 >> 0x1; // shift bit 8 times
    }
    var_3 = var_3 & 0x7; // 0 - 15.

    for (let i = 0; i < 0x100; i++) key.push(i)

    let offset = 0x0;
    for (let i = 0x0; i < 0x100; i++) {
        offset = (offset + key[i] + data_atob.charCodeAt(i % 0x40)) % 0x100;
        [key[i], key[offset]] = [key[offset], key[i]];
    }

    offset = 0x0;
    let x = 0, decode = 0x0, d_0 = 0x0;
    let var_4 = var_2[var_3];
    for (let i = 0x0; i + 0x40 < data_atob.length; i++) {

        x = (x + var_4) % 0x100;

        const o_1 = key[(offset + key[x]) % 0x100];
        offset = (d_0 + o_1) % 0x100;
        d_0 = (d_0 + x + key[x]) % 0x100;

        [key[x], key[offset]] = [key[offset], key[x]];

        const get_key = (code: number[]): any => { // [d0,decode,x,offset]
            if (code.length === 1) return code[0];
            return key[(code.shift() + get_key(code)) % 0x100];
        }
        decode = get_key([offset, x, decode, d_0]);
        decoded += String.fromCharCode(data_atob.charCodeAt(i + 0x40) ^ decode);
    }
    const parsed = JSON.parse(decoded);
    const { pages } : { pages:string[]} = parsed;
    const data: { link: string, filename: string }[] = [];
    const regex = /\d+\.(?:png|jpg)/g;
    for (const link of pages) {
        const [filename] = link.match(regex) || [];
        data.push({
            link,
            filename
        });
    };
    return data
}

// function parse_data_v8(input: string) {
//     let data_atob = atob(input);
//     let key = new Array();
//     let decoded = '';

//     for (let i = 0; i < 0x100; i++) key.push(i)

//     // generate key
//     let offset = 0x0;
//     for (let i = 0x0; i < 0x100; i++) {
//         offset = (offset + key[i] + data_atob.charCodeAt(i % 0x40)) % 0x100;
//         [key[i], key[offset]] = [key[offset], key[i]];
//     }

//     // parse data using key
//     offset = 0x0;
//     let x = 0, decode = 0x0, randr = 0x0;
//     for (let i = 0x0; i + 0x40 < data_atob.length; i++) {
//         x = (x + 1) % 0x100;

//         offset = (randr + key[(offset + key[x]) % 0x100]) % 0x100;
//         randr = (randr + x + key[x]) % 0x100;

//         [key[x], key[offset]] = [key[offset], key[x]];

//         const get_key = (code: number[]): any => {
//             if (code.length === 1) return code[0];
//             return key[(code.shift() + get_key(code)) % 0x100];
//         }
//         decode = get_key([offset, x, decode, randr])

//         decoded += String.fromCharCode(data_atob.charCodeAt(i + 0x40) ^ decode);
//     }
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

// function parse_data_v6(input: string) {
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
//     let x = 0x0, decode = 0x0;
//     for (let i = 0x0; i < data_atob.length - 0x40; i++) {
//         x = (x + 1) % 0x100;

//         offset = (offset + key[x]) % 0x100;

//         [key[x], key[offset]] = [key[offset], key[x]];

//         decode = key[(key[x] + key[offset]) % 0x100];
//         decoded += String.fromCharCode(data_atob.charCodeAt(i + 0x40) ^ decode);
//     }
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

//const data_v3 = 'L4wHgH8XoDPX8G1j+7giYXqmLgCNwH4tNjsalTzBM02qGRsDLmsr4fm3ZPU4QmaqmrktNqcMpKjJxRwUtf6/G/MCWCc1VXyhLoUGjes1oC+rJ/8YQgLehe16Zro0S3S8mGE8WgBMLqRdIiNfvhXcV14eYAAScGW0wiPifA8OtT4vPbAAtl9eVwp5P+rrqGbrwm5W1AnmA/8AfXPAbDojoFOM0zpoHIfbB/5eAlha8xrQ8vEEj0lwtCWdrA0OImdkM46GqWVRKOlG+hTnJpM2nq8JHODJNULCFI7dGQQT17wPC7Tn2VH9SSLqQrqapcRzK7IhAV3xy+C9VP6GkJCR/4rvzuIattKFqFWTo5PguamZMxTNT8B0OGl7+39OIoO8Hp762Sqx6QQZRqNceMpCa3WMpxXQkAxI/OG1z9eQBny0A0KHWW6PrPNBvuIsSIjzgPrGgYWFWGQZoKCy5gPgesNhdBpk/g/U9RquThr0uHlnyZFL8RTZefhnPT/n5ig9KIpqKh9PRGEH4KIQnC+77kiZZG6Hyg/yXcoXAEw6fxc06EUj6AxYUXA8oY3gjTJUHVge5zEiE9YKpORWZhdOj6rfYUnT3Od8+GX8M18xJIRDkPfna/lT4wcz4G/2HQDN/p6xg2MQ79gsOjVGtQ2fKAxw6kUeQMmhK+kbvwwbP02m7o/otJFzZbCiwZ5v9UQ4g6GDHhH/NgDUPlwx+FI/F7MCOp1RS4pXJWMMiqyu4J6dc5lcOvu/3L+G/n7PDyIkHLqzyiyNRL/Su4nO/KeSP/sqUYxzPcLDMZoxszvx7TZVy/CWxd3RIV432GvoxjganTpid42Wu3ihKe+D4ocg68cNv3eVwmIl0eKtvfebMQ+2l07TOr+duD4OIfbDvOezDds/spbE3hj2d0a+UQMkIoLeeQ2JgGeoSqrk0TC3JBy5Oidt/9s49GRgygSEAv4Lc3IYgyEmNj4szHL/WvNrfKgD7pF0R4r7Rlh71D3G6+6XJdiuV4+pE5LpU0rezf+dMCRn4YHrbBDkxtTPB15JOOb8pNig2n+nIzTQ92Xt/rmCXRejdxyoeY0bfUdM0gFzJp6NkgzhWOCGM8H2JqLkbZitNQgzO/pFLq5RnWsztjrjmM/0SybdC3FXcRXDCBKBFOfoNUDA8rtm7XVTih6ant+l/H0ZD5FG1MeAI+PCgKMejJd8naoemt0xlusz3AURPWk8uPvrc8UTfelt+3B/efUq31eFQDl1U39FMnVF6VIFxI9Y4vd9CiZ2llItD2VGNLhhLWf9jBY/GFtbSR8z3+b/oQJvRCOLGOuEsw8PAwDqUSHslkFJxFUIi3HMu5RH1pegGRv9DMbwELrDMmU4Vs/TNJq7IJHzEbooTO3VYbnzH1gFOrMFUP6QOOB55fGt/Am6BoVWKoTeYOGGZALElsup6FaCuNsUij4UVcmli0h6owsfdPRBk0h7EHMaQE3xqcRgNZLNTBimeVTRscqv9LlK924xwLBdwBHeA/NAcAFm7WKtxA3WiuPaD+cPJO7iDGV0pzczCP4l+NaOd/QTsj60MsO8FiOW98CkOJY1igKLbxC8ZN7qtPKzKNYuvfZjGE2rykzHQIiAB4LpVF1IElXfb3CIro9Rs6ByaTj1y49T5O0GsFH3IJBG/FHUnvFFo9Sgwx2CHlG//rIY+Va1SNSr1bDKqJurqh33OcgKLUCu9Fk/PodElXCTRcwd08rV8/wgjyR9uOO0qY6/rjXC7gqWVCbnB1k2DxXWquAVFkH/dmvySxRxImDOPDDTIQIjKIgVzMUDnusTsKElkRHHMj8ThKktj4x/GbDjkk0SrB3jmsEBgaHuVrChFy/QiYuLbWjP9863+UVKfWJbAND0o221rMFtbqsP3MSEZyW35WBz1MrBBqPcvVH3RVAy5c6yyNe4YezgC3+cuuuTvvHKqZAOfA==';
//const data_v4 = 'xc+HebWkFIgHwnZzc3jkZHK49qJVkTsXb1IPKknfsVPaEgyD8fl29xHTs6qeVbKUhWEl7zCfOPfFnRf5h8xPf2zK3wGoZuUx3+2pNLYlfvT95nkHPh6BCH7OcpbCLNzekmkFcwmMCzC0uYUDCgQkPo5NE74SL+lneKOkYK9EGU1fwsbtVCE9BExcQbA9aQRAdB+ovvWUX9e6QTiERHFWutOlr+eTLnPdcZ50yR8uagp7C/r93a2NWxXQWn+BQfpruW+zH0s8C43hRqtLUjN5yrzYF/XwlCJs0ZolNI0T18g4kkSQymMsGuB/f+czRzlc/N/0V+eVP8Imw56qIEIrejDIoc9ZUrbKWrClxvZYMB4Zrj7HbsRUWeqeZqXJ4SUIOvSmsfGKOYq3/mJyvAIUb028NOsLuYJZOWAYjmMN3LPIMJ58ukp5LD/hs8uJMdQ5oAHR2gS3xnHYY4cJF7HYxtwL7orJLwFjuI3/8C0z/iVawMIJNlXpuP/RA0arBgfwR+hHzgVFUpOVV0cnhhkM3E3sBV7bGpo+XPsFZOZVvq0va6gX39NEizyuV8yoLbz6/okvfFSlaj7yh94+J+ZkFp3ARLpYXQi4GFw6aY4Pyd6i16SXiQOpiPLqsSBHAeXrbVI/jFzeJQ/6S9C/Wjz2JFLMu/flKUFkdXlaGLlB/7PjT45sfRZDjHmzzSrFHBgxqj3MlEYNh+rZp6wWZsJRRsYkf8HMY2mWeOjSfIyDU3zMFGqoR3y3fCx0ShJHbWTyWdBWkXNkgrjFEf/yv0EvVSeOfzQZXz3qDyrPDKZ3Y/ja6A0kN+ms038yrFlCjB68SviPRm+pefak2awK4gZQ0yLQ/bzE8EXuNBKnM1cpp+B5TeSBTrfHpQKARSqgDZIg5EQq/W2sHAyhFNT3cZFBNtU=';
//const data_v15 = '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';