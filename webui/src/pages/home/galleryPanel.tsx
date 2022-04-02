import { req } from './req';
import { del_icon, inf_icon } from "./icons";
import { onMount, For, Show, createSignal, createEffect } from 'solid-js';
import { createStore, produce } from "solid-js/store";

export function GallPanel({ visible = true, list }) {
    let footer, _pagesize = 50;

    const [page, setPage] = createSignal(1);
    const observer = new IntersectionObserver((ent, obs) => {
        for (const e of ent) {
            if (!e.isIntersecting) continue;
            const thumb = e.target;
            thumb.src = thumb.dataset.src;
            obs.unobserve(thumb);
        }
    }, { threshold: 0, rootMargin: '100px 0px' });

    const remove = async (card: HTMLElement, id: number) => {
        card.style = ` pointer-events: none; opacity: 0.50;`;
        const res = await req({ api: 'lib/remove', body: { id } });
        if (!res.status) card.style = '';
    }

    const info = (id: number) => {
        window.open(document.baseURI + 'reader/' + id, '_blank')
    }

    onMount(() => {
        const footer_obs = new IntersectionObserver((e, o) => {
            for (const entry of e) {
                if (entry.isIntersecting && list.gallery.length >= _pagesize) {
                    setPage(page() + 1);
                }
            }
        }, { threshold: 1 })
        footer_obs.observe(footer);
    })

    return <div class="lib-list">
        <For each={list.gallery.slice(0, _pagesize * page()).sort((a,b) =>b.id - a.id)}>{({ id, title }, i) => {
            let thumb, card;
            onMount(() => observer.observe(thumb));
            return <fast-card ref={card}>
                <div>
                    <a href={document.baseURI + 'reader/' + id}>
                        <img ref={thumb} style={{ width: '100%' }} data-src={document.baseURI + "thumb/" + id} />
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
                        appearance="stealth"
                        title="View this gallery"
                        onclick={()=> info(id)}>
                        {inf_icon}
                    </fast-button>
                    <fast-button
                        id="item-remove"
                        class="item-button"
                        appearance="stealth"
                        title="Remove this gallery"
                        onclick={()=> remove(card, id)}>
                        {del_icon}
                    </fast-button>
                    <div class="title" id="item-title" title={title}> {title} </div>
                </div>
            </fast-card>

        }}
        </For>
        <div ref={footer}></div>
    </div>
}
