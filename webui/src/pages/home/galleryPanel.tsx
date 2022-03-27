import { onMount, For, Show } from 'solid-js';
import { del_icon, inf_icon } from "./icons";

export function GallPanel({ visible = true, list }) {
    let footer;
    onMount(() => {
        const lib_observer = new IntersectionObserver((e, o) => {
            for (const entry of e) {
                if (entry.isIntersecting) {
                    console.log('footer fired')
                    //liblist_updateElement(false);
                }
            }
        }, { threshold: 1 })
        const footer = document.getElementById('lib-footer');
        lib_observer.observe(footer);
    })
    return <Show when={visible}>
        <div class="lib-list" hidden>
            <For each={list.gallery}>{(props, i) =>
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
            }
            </For>
            <div ref={footer} id="lib-footer"></div>
        </div>
    </Show>
}
