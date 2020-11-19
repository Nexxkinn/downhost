import { de, grab, DownMeta, PageRequest, DownType, DownPagesRequest, DownRequest } from "./_deps.ts";

const token = de('klcjv4xqjv9a01snkla642xlkg9o04qj...');
const token2= de('klcjv4xqjv9a01qzrtc6c41rby66f1srrdf6asqzrtqa0csrbda9fsqfklnm...');
const srvc  = de('rkf6v4xlk1aop...');

export async function metadata(link: string):Promise<DownMeta> {
    // check hostname
    const url = new URL(link);
    
    // parse url pathname
    const regex = /\/g\/([0-9]+)\/([a-fA-F0-9]+)\/?/g;
    const [_,gid,imgkey] = regex.exec(url.pathname) || [];

    console.log({imgkey,gid});
    let cookie = await getCookie();

    const req  = await fetch( link, { headers: { cookie } });
    const html = await req.text();
    
    cookie += ` igneous=${grab('igneous=',';',req.headers.get('Set-Cookie') || '')};`;

    // TODO : check if gallery is accessible.

    const title     = grab('<div id="gd2"><h1 id="gn">','</h1>',html);
    const gallery_size = Number(grab('Length:</td><td class="gdt2">',' pages',html));
    const thumb = token + '/t/' + grab('background:transparent url('+token+'/t/',') 0 0 no-repeat">',html);

    // console.log({title, gallery_size, thumb})

    const contain_pages = html.includes('/?p=');  // check if gallery contains pages.
    const s_regex = /\/s\/([a-fA-F0-9]+)\/[0-9]+\-([0-9]+)/g;
    let   s_pages = new Array();
    if(!contain_pages) {
      s_pages = Array.from(html.matchAll(s_regex)) || [];
    }
    else {
      const g_pages = getGalleryPages(html);
      for(let page=0; page <= g_pages; page++) {
        const html_page = await fetch(link+`?p=`+page,{ headers: { cookie } });
        const html_p_body = await html_page.text();
        const pages = html_p_body.matchAll(s_regex)
        s_pages.push(...Array.from(pages));
      }
    }

    // get showkey
    const [s_path] = s_pages[0];
    const s_fetch = await fetch( token+s_path, { headers: { cookie }} );
    const s_html = await s_fetch.text();
    const showkey = grab('var showkey="','";',s_html);

    // pages

    // flowchart
    // load gallery page html
    // extract data for each pages -> /s/__imgkey__/__gid__-__page__
    // foreach page:
        // request to /api.php <- gid, imgkey, method, page, showkey 
            // gid : __gid__ 
            // imgkey : __imgkey__ 
            // method: "showpage"
            // page: __page__
        // extract image source in { i3 } property
        // download image in the page with header "Sec-Fetch-Dest: document"
    //
    const thumbnail:DownRequest = {
      input: thumb,
      init: { headers: { cookie }}
    }
    
    const download:DownPagesRequest = {
      gallery_size,
      [Symbol.asyncIterator]() {
        return {
          async next() {
            const [,s_imgkey,s_page] = s_pages.shift();
            const done = s_pages.length === 0;
            const payload = {
              gid,
              imgkey: s_imgkey,
              method: "showpage",
              page: s_page,
              showkey
            }
            const api_fetch = await fetch(token+'/api.php',{ 
              body: JSON.stringify(payload),
              method:'POST',
              headers:{
                "Content-Type":"application/json",
                "cookie":cookie
                }})
            const {i,i3} = await api_fetch.json();
            const filename = grab('<div>',' ::',i);
            const input = grab('<img id="img" src="','" style=',i3);
            const download:PageRequest = {
              filename,
              input,
              init:undefined
            } 
            return Promise.resolve({ value: download, done });
          }
        };
      }
    };

  return {type:DownType.PAGES, download, title, thumbnail, srvc, uid:gid }
}

async function getCookie(){
    const { u, p } = JSON.parse(Deno.readTextFileSync("auth.json"))['exh'];
    const api = token2+'?act=Login&CODE=01';

    const form = new FormData();
    form.append('referer',token2);
    form.append('b','');
    form.append('bt','');
    form.append('UserName',u);
    form.append('PassWord',p);
    form.append('CookieDate','1');

    const login   = await fetch(api,{ method: 'POST', body: form});

    const login_cookie = login.headers.get('Set-Cookie') || "";
    const pass      = grab('ipb_pass_hash=' ,';',login_cookie);
    const id        = grab('ipb_member_id=' ,';',login_cookie);

    const cookie = `ipb_member_id=${id}; ipb_pass_hash=${pass};`;
    return cookie;
}

function getGalleryPages(html:string){
  const p_regex = /\/\?p=([0-9]+)/g
  const p_match = Array.from(html.matchAll(p_regex));
  const p_list = p_match.map((x) => Number(x[1]));
  const total_page = Math.max(...p_list);
  return total_page;
}