import { req } from "./req";
import { createSignal, createEffect } from 'solid-js';

export function Search({setList,SetGalAutoRefresh}) {
    let submit, textfield;
	const [input, setInput] = createSignal("");

    const submit_click = async (e) => {
        submit.disabled = true;
        textfield.disabled = true;
        if (input().startsWith('http')) {
            const gql = await req({ api: 'task/add', body: { source: input() } });
            console.log(gql);
            textfield.value = "";
        }
        else {
            // search
            const res = await req({ api: 'lib/search', body: { query: input() } })
			SetGalAutoRefresh(false);
            if (res.status && !res.status) {
                console.debug('failed.', res.message);
                setList('gallery', []);
            }
            else setList('gallery', res.list);
        }
        submit.disabled = false;
        textfield.disabled = false;
    }

    createEffect(() => { if(!input()) SetGalAutoRefresh(true) })

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
