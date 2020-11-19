import { de, grab, DownMeta, DownRequest, DownType } from "./_deps.ts";

const token    = de("klcjv4xqjv9a0cxhk1copcsrbe4ju41rbk96csn...");
const srvc  = de("kla642xlkh9ou0xerb...");

export async function metadata(link: string):Promise<DownMeta> {

    const url = new URL(link);
    const [_, uid] = url.pathname.startsWith('/view/') ? link.split('/view/') : link.split('/zip/');

    if (!uid) throw new Error(`unknown link: ${link}`);

    const res = await fetch(url);
    const html = await res.text();
    const title = grab('<h1 class="title">', '</h1>', html);
    const thumb = grab('"og:image" content="', '"', html);

    
    url.pathname = `/zip/${uid}`;

    const thumbnail:DownRequest = { input:new URL(thumb), init:undefined }
    const download:DownRequest = await fetch_link(url); 

    return { type:DownType.BULK, srvc, title, uid, thumbnail, download };
}

async function fetch_link(url:URL): Promise<DownRequest>{
    
    const {u,p} = JSON.parse(Deno.readTextFileSync("auth.json"))['hnx'];
    const cookie = await getToken(u,p);

    const res:DownRequest = {
        input : url,
        init : {
            method: "GET",
            headers: { "cookie": cookie }
        }
    }
    return res;
}

async function getToken(u:string,p:string){

    const res = await fetch(token, { method: "HEAD"} );

    const cookies = res.headers.get('Set-Cookie')||"";
    const cfduid  = grab("__cfduid=",";",cookies);
    const cf_bm   = grab("__cf_bm=",";",cookies);
    const session = grab("session=",";",cookies);

    const formdata = new FormData();
    formdata.append('username',u);
    formdata.append('password',p);
    const cookie = `session=${session}; __cfduid=${cfduid}; __cf_bm=${cf_bm};`
    const login  = await fetch(`${token}login`,{ method: 'POST', body: formdata, headers: {cookie} });

    if( login.url === `${token}login` ) throw Error("Wrong username or password");
    return cookie;
}

