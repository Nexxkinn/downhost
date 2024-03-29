// deno-lint-ignore-file
import { de, grab, DownMeta, PageRequest, DownType, DownPagesRequest, DownRequest, log, DownMetaArgs, DownTag } from "./_deps.ts";

const token = de('klcjv4xqjv9a01snkla642xlkg9o04qj...');
const s_token = de('klcjv4xqjv9a041rbe4of1srrdf6asqzrtqf...');
const token2 = de('klcjv4xqjv9a01qzrtc6c41rby66f1srrdf6asqzrtqa0csrbda9fsqfklnm...');
const regex_token = de('klcjv4xqjtrp09lzbe4of1srrdf6asqzrtqf...');
const srvc = de('be4of1srrdf6a...');

export async function metadata({link,offset}:DownMetaArgs): Promise<DownMeta> {
  // TODO: check hostname
  const url = new URL(link);

  // parse url pathname
  const regex = /\/g\/([0-9]+)\/([a-fA-F0-9]+)\/?/g;
  const [_, gid, imgkey] = regex.exec(url.pathname) || [];

  //console.log({imgkey,gid});
  let cookie = await getCookie();

  const req = await fetch(link, { headers: { cookie } });
  const html = await req.text();

  cookie += ` igneous=${grab('igneous=', ';', req.headers.get('Set-Cookie') || '')};`;

  // TODO : check if gallery is accessible.

  const title = grab('<div id="gd2"><h1 id="gn">', '</h1>', html);
  const length = Number(grab('Length:</td><td class="gdt2">', ' pages', html));
  const thumb = s_token + '/t/' + grab('background:transparent url(' + s_token + '/t/', ') no-repeat">', html);

  // console.log({title, gallery_size, thumb})

  const contain_pages = html.includes('/?p=');  // check if gallery contains pages.
  const s_regex = new RegExp(`<a href="${regex_token}(\/s\/([a-fA-F0-9]+)\/[0-9]+\-([0-9]+))`, 'g');
  let s_pages = new Array();
  if (!contain_pages) {
    const html_gallery = grab(`<div id="gdt">`,`<div class="gtb">`,html);
    s_pages = Array.from(html_gallery.matchAll(s_regex)).map(x => { x.shift(); return x; });
  }
  else {
    const g_pages = getGalleryPages(html);
    for (let page = 0; page <= g_pages; page++) {
      const html_page = await fetch(link + `?p=` + page, { headers: { cookie } });
      const html_p_body = await html_page.text();
      const html_gallery = grab(`<div id="gdt">`,`<div class="gtb">`,html_p_body);
      const matches = Array.from(html_gallery.matchAll(s_regex));
      const pages = matches.map(x => { x.shift(); return x; })
      s_pages.push(...Array.from(pages));
    }
  }

  // remove already downloaded pages from s_pages
  if(offset && offset < length && offset < s_pages.length) s_pages.splice(0,offset);

  // get showkey
  const [s_path] = s_pages[0];
  const s_fetch = await fetch(token + s_path, { headers: { cookie } });
  const s_html = await s_fetch.text();
  const showkey = grab('var showkey="', '";', s_html);

  // pages

  const tags = parseTags(html);

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
  const thumbnail: DownRequest = {
    input: thumb,
    init: { headers: { cookie } }
  }

  const download: DownPagesRequest = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (s_pages.length === 0) return Promise.resolve({ value: { init: undefined, input: '', filename: '' }, done: true })
          const [s_url, s_imgkey, s_page] = s_pages.shift();
          const payload = {
            gid,
            imgkey: s_imgkey,
            method: "showpage",
            page: s_page,
            showkey
          }
          let nl = '';

          const alt = async function (args: PageRequest): Promise<PageRequest> {
            const { init, filename } = args;
            try {
              const alt_fetch = await fetch(token + s_url + '?nl=' + nl, { headers: { cookie } });
              const alt_html = await alt_fetch.text();
              const alt_input = grab('<img id="img" src="', '" style=', alt_html);
              return {
                input: alt_input,
                init,
                filename
              }
            }
            catch (e) {
              log('Remote host is probably angry, Retrying in 10s...');
              await new Promise(r => setTimeout(r, 10000));
              return await alt(args);
            }
          }
          const api_fetch = async (): Promise<Response> => {
            try {
              return await fetch(token + '/api.php', {
                body: JSON.stringify(payload),
                method: 'POST',
                headers: {
                  "Content-Type": "application/json",
                  "cookie": cookie
                }
              })
            }
            catch (e) {
              log('Remote host is probably angry, retrying in 20s...');
              await new Promise(r => setTimeout(r, 20000));
              return await api_fetch();
            }
          }

          try {
            const res = await api_fetch();
            const { i, i3, i6 } = await res.json();
            nl = grab("nl('", "')", i6);
            const filename = grab('<div>', ' ::', i);
            const input = grab('<img id="img" src="', '" style=', i3);
            const download: PageRequest = {
              filename,
              input,
              init: undefined,
              alt
            }
            return Promise.resolve({ value: download, done: false });
          }
          catch (e) {
            throw new Error(e);
          }
        }
      };
    }
  };

  return { type: DownType.PAGES, download, tags, title, length, thumbnail, srvc, uid: gid }
}

async function getCookie() {
  const { i, h } = JSON.parse(Deno.readTextFileSync("auth.json"))['exh'];
  const cookie = `ipb_member_id=${i}; ipb_pass_hash=${h};`;
  return cookie;

  // unused.
  // const api = token2 + '?act=Login&CODE=01';
  //
  // const form = new FormData();
  // form.append('referer', token2);
  // form.append('b', '');
  // form.append('bt', '');
  // form.append('UserName', u);
  // form.append('PassWord', p);
  // form.append('CookieDate', '1');
  //
  // const login = await fetch(api, { method: 'POST', body: form });
  //
  // const login_cookie = login.headers.get('Set-Cookie') || "";
  // const pass = grab('ipb_pass_hash=', ';', login_cookie);
  // const id = grab('ipb_member_id=', ';', login_cookie);
  //
  // const cookie = `ipb_member_id=${id}; ipb_pass_hash=${pass};`;
  // return cookie;
}

function parseTags(html:string) {
  //const regex = /(?<=\/tag\/)(.+?)\:(.+?)(?=\")/g
  const regex = /(?<=\/tag\/).+?(?=\")/g
  const parse = html.matchAll(regex);
  let tags:DownTag[] = [];
  if(!parse) return tags;
  for(const res of parse) {
    const split = String(res).replaceAll("+"," ").split(":");
    if (split.length == 1) split.unshift("misc");
    const [ns,tag] = split;
    tags.push({ns,tag});
  }
  return tags;
}

function getGalleryPages(html: string) {
  const p_regex = /\/\?p=([0-9]+)/g
  const p_match = Array.from(html.matchAll(p_regex));
  const p_list = p_match.map((x) => Number(x[1]));
  const total_page = Math.max(...p_list);
  return total_page;
}
