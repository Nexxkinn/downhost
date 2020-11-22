import { de, grab, DownMeta, DownRequest, DownType, DownPagesRequest, PageRequest } from "./_deps.ts";

const token   = de("klcjv4xqjv9a0ctrk1you3qybhya43qhrf96rnsbkda9gcshrb...");
const t_token = de("klcjv4xqjv9a02lrk1you3qybhya43qhrf96rnsbkda9gcshrb...");
const srvc    = de("k1you3qybhyf...");

export async function metadata(link: string): Promise<DownMeta> {
    const url = new URL(link);
    const g_fetch = await fetch(url);
    const g_html = await g_fetch.text();

    const g_data = JSON.parse(grab('JSON.parse(', ');', g_html)); // Not yet parsed, actually. It's only parsed unicode characters.
    const g_json = JSON.parse(g_data);

    const { title, id:uid, media_id, images, num_pages: gallery_size } = g_json;
    const {pages, cover} = images;
    const thumbnail:DownRequest = {
        input: `${t_token}/${media_id}/thumb.${cover.t === 'j' ? 'jpg' : 'png'}`,
        init:undefined
    }

    let page_index = 0;
    const download: DownPagesRequest = {
        gallery_size,
        [Symbol.asyncIterator]() {
            return {
                async next() {
                    if (pages.length === 0) return Promise.resolve({ value: { init: undefined, input: '', filename: '' }, done: true });
                    page_index += 1;
                    const { t } = pages.shift();
                    //if (t !== 'j') log(`OwO there's a file other than jpg !: ` + JSON.stringify({ page }));

                    const filename = `${page_index}.${t === 'j' ? 'jpg' : 'png'}`;
                    const input = `${token}/${media_id}/${filename}`;

                    const request:PageRequest = {
                        input,
                        init:undefined,
                        filename
                    };

                    return Promise.resolve({ value: request, done: false })
                }
            }
        }
    }
    return { type:DownType.PAGES, uid, srvc, title:title.english, thumbnail, download}
}



