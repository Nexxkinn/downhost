import { For, Show } from 'solid-js';
import { del_icon, inf_icon } from "./icons";

export function DownPanel({ list }) {

    const cancel = async(card:HTMLElement,id:number) => {
        // disable card
        card.style= "pointer-events: none; opacity: 0.50;";
        const res = await req({ api:'task/cancel', body: { id } });

        // release if failed.
        if(!res.status) card.style = '';
    }
    return <div class="down-list">
            <For each={list.down}>{({id,title,size,size_down,status}, i) => {
                let card;
                return <fast-card ref={card}>
                    <div style="grid-area: name;" class="title">{title}</div>
                    <div style="grid-area: opt;">
                        <fast-button title="remove from the list" appearance="neutral" onclick={()=> cancel(card,id)}>
                            {del_icon}
                        </fast-button>
                    </div>
                    <fast-progress
                        style="grid-area: prog;"
                        role="progressbar"
                        max={size}
                        value={size_down ? (size_down / size) * 100 : null}>
                    </fast-progress>
                </fast-card>
            }}
            </For>
        </div>
}
