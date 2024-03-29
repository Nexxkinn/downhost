import { req } from './req';
import { del_icon, inf_icon } from "./icons";
import { onMount, For, createEffect } from 'solid-js';
import { DownSocketMessage, ListStorage, PAGE_SIZE_LIMIT } from '.';
import { removeIndex } from '../../utils/lists';
import { modifyMutable } from 'solid-js/store';

type GallPanelArgs = {
    visible: boolean,
    storage: ListStorage,
    remove_element: ( id: number ) => void,
    socket_msg: ( msg: DownSocketMessage) => void

}

export function GallPanel({ visible = true, storage, remove_element, socket_msg }:GallPanelArgs) {
    let footer:any, _pageLimitSize = 50;

    // lazy loading downhost thumbnails.
    const observer = new IntersectionObserver((ent, obs) => {
        for (const e of ent) {
            if (!e.isIntersecting) continue;
            const thumb = e.target;
            thumb.src = thumb.dataset.src;
            obs.unobserve(thumb);
        }
    }, { threshold: 0, rootMargin: '100px 0px' });

    const remove = async (card: HTMLElement, id: number, index:number) => {
        card.style = ` pointer-events: none; opacity: 0.50;`;
        const res = await req({ api: `lib/g/${id}`, method:'DELETE' });
        if (!res.status) card.style = '';
        else { remove_element(index) }
    }

    const info = (id: number) => {
        window.open(document.baseURI + 'reader/' + id, '_blank')
    }

    // enable automatic extend page loading.
    onMount(() => {
        const footer_obs = new IntersectionObserver((e, o) => {
            for (const entry of e) {
                if ( entry.isIntersecting && !storage.gallery.is_end ) {
                    const { tail, query } = storage.gallery;
                    if ( !storage.socket_open && storage.gallery.list.length < PAGE_SIZE_LIMIT ) return;
                    
                    console.debug('Downsocket event EXT_LIST executed')
                    socket_msg({ event:'EXT_LIST',content:{ head:0, tail , query } as any}) // TODO: add types here
                }
            }
        }, { threshold: 1 })
        footer_obs.observe(footer);
    })

    return <div class="lib-list">
        <For each={storage.gallery.list}>{({ id, title }, index) => {
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
                        onclick={()=> remove(card, id, index())}>
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
