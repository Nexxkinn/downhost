import type { SetStoreFunction } from "solid-js/store";
import { req } from "./req";
import { createSignal, createEffect } from 'solid-js';
import type { DownSocketMessage, GalleryListParams, ListStorage } from ".";

type SearchParams = {
    setList: SetStoreFunction<ListStorage>,
    socket_msg: (msg: DownSocketMessage) => void
}

export function Search({setList, socket_msg}:SearchParams) {
    let submit:any, textfield:any;
	const [input, setInput] = createSignal("");

    const submit_click = async (e) => {
        submit.disabled = true;
        textfield.disabled = true;
        if (input().startsWith('http')) {
            const gql = await req({ api: 'task/add', body: { source: input() } });
            console.debug(gql);
            textfield.value = "";
        }
        else {
            // search
            setList('gallery', (g) => {
                g.offset = 0;
                g.query  = input();
                const msg : GalleryListParams  = {
                    offset: g.offset,
                    query: g.query
                }
                socket_msg({event:'LIST', content: msg})
                return g
            })
            // const res = await req({ api: 'lib/search', body: { query: input() } })
			// SetGalAutoRefresh(false);
            // if (res.status && !res.status) {
            //     console.debug('failed.', res.message);
            //     setList('gallery', []);
            // }
            // else setList('gallery', res.list);
            // resetPage();
        }
        submit.disabled = false;
        textfield.disabled = false;
    }

    createEffect(() => {
        if(!input()) return;
        
        setList('gallery', (g) => {
            g.offset = 0;
            g.query  = '';
            g.list   = [];
            const msg : GalleryListParams  = {
                offset: g.offset,
                query: g.query
            }
            socket_msg({event:'LIST', content: msg})
            return g
        })
    })

    return <div class="form">
        <fast-text-field ref={textfield}
            autofocus
            appearance="outline"
            placeholder="Search or put gallery link here..."
            onInput={(e) => setInput(e.target.value)}
            onkeydown={(e) => { e.key === 'Enter' ? submit.click() : null }}
        />
        <fast-button ref={submit} hidden={!input()} onclick={submit_click}>
            {input().startsWith('http') ? "Download" : "Search"}
        </fast-button>
    </div>
};
