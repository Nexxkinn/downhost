import { onMount, For, Show, createSignal } from 'solid-js';
import { createStore, produce } from "solid-js/store";
import { del_icon, inf_icon } from "./icons";

export function GallPanel({ visible = true, list }) {
    let footer, _pagesize = 50;
    const [page, setPage] = createSignal(1);

    onMount(() => {
        const footer_obs = new IntersectionObserver((e, o) => {
            for (const entry of e) {
                if (entry.isIntersecting && list.gallery.length >= _pagesize) {
                    console.log('footer fired');
                    setPage(page()+1);
                }
            }
        }, { threshold: 1 })
        footer_obs.observe(footer);
    })

    return <Show when={visible}>
        <div class="lib-list">
            <For each={list.gallery}>{(props, i) =>
                <Show when={i() < _pagesize * page()}>
                    <fast-card>
                        <div>
                            <a href={document.baseURI + 'reader/' + props.id}>
                                <img style={{ width: '100%' }} src={document.baseURI + "thumb/" + props.id} />
                            </a>
                        </div>
                        <div style={{
                            width: '100%',
                            background: 'var(--neutral-fill-stealth-active)',
                            'grid-template-areas': `"opt opt" "title title"`
                        }}>
                            <fast-button
                                id="item-info"
                                class="item-button"
                                title="View this gallery"
                                appearance="stealth">
                                {inf_icon}
                            </fast-button>
                            <fast-button
                                id="item-remove"
                                class="item-button"
                                title="Remove this gallery"
                                appearance="stealth">
                                {del_icon}
                            </fast-button>
                            <div class="title" id="item-title" title={props.title}> {props.title} </div>
                        </div>
                    </fast-card>
                </Show> }
            </For>
            <div ref={footer}></div>
        </div>
    </Show>
}
