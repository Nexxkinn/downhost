import { req } from './req';
import { del_icon, inf_icon } from "./icons";
import { For, Show } from 'solid-js';
import type { ListStorage } from '.';

type DownPanelParams = {
    list: ListStorage
}

export function DownPanel({ list }: DownPanelParams) {

    const cancel = async(card:HTMLElement,id:number) => {
        // disable card
        card.style= "pointer-events: none; opacity: 0.50;";
        const res = await req({ api:`tasks/${id}/cancel`, method:'PATCH' });

        // release if failed.
        if(!res.status) card.style = '';
    }

    return <div class="down-list">
            <For each={list.down}>{(props, i) => {
                let card;
                return <fast-card ref={card}>
                    <div style="grid-area: name;" class="title">{props.title}</div>
                    <div style="grid-area: opt;">
                        <fast-button title="remove from the list" appearance="neutral" onclick={()=> cancel(card,props.id)}>
                            {del_icon}
                        </fast-button>
                    </div>
                    <fast-progress
                        style="grid-area: prog;"
                        role="progressbar"
                        value={props.size_down ? (props.size_down / props.size) * 100 : null}>
                    </fast-progress>
                </fast-card>
            }}
            </For>
        </div>
}
