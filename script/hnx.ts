import { de, grab, Meta, Download, DownType } from "./_deps.ts";

const token = de("klcjv4xqjv9a0cxhk1copcsrbe4ju41rbk96csn...");
const srvc  = de("kla642xlkh9ou0xerb9oo33k...");

export async function download({meta, filename, db}:Download) {

    // debug
    const {u,p} = JSON.parse(Deno.readTextFileSync("token.json"));
    const cookie = await getToken(u,p);
    const { url } = meta;
    const res = await fetch(url, {
        method:"GET",
        headers: { "cookie": cookie }
    });
    
    let size = Number(res.headers.get('content-length'));
    db.query("UPDATE download SET __typename=?,size=?,status=? WHERE service=? AND uid=? ",['Bulk',size,'Downloading',srvc,meta.uid]);
    if(!res.body) return;

    const file = await Deno.create(filename);
    let   len = 0;
    for await (const chunk of res.body) {
        file.writeSync(chunk);
        len += chunk.length;
        db.query("UPDATE download SET downloaded=? WHERE service=? AND uid=? ",[len,srvc,meta.uid]);
    }
    db.query("UPDATE download SET status=? WHERE service=? AND uid=? ",['finished',srvc,meta.uid]);
}

export async function metadata(link: string):Promise<Meta> {

    const url = new URL(link);
    const [_, uid] = url.pathname.startsWith('/view/') ? link.split('/view/') : link.split('/zip/');

    if (!uid) throw new Error(`unknown link: ${link}`);

    const res = await fetch(url);
    const html = await res.text();
    const title = grab('<h1 class="title">', '</h1>', html);
    const thumb = grab('"og:image" content="', '"', html);
    
    url.pathname = `/zip/${uid}`;

    return { type:DownType.BULK, title, url, uid, service:srvc };
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

