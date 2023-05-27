import { req } from './req';
import { render, Dynamic } from 'solid-js/web';
import { createStore, modifyMutable, produce, reconcile } from "solid-js/store";
import { onMount, createSignal, createEffect, For, Show } from 'solid-js';
import {
    fastButton,
    fastTextField,
    fastDivider,
    fastProgress,
    baseLayerLuminance,
    provideFASTDesignSystem
} from "@microsoft/fast-components";
import { del_icon, inf_icon, sett_icon } from "./icons";
import { SettingsPanel } from "./SettingsPanel";
import { DownPanel } from "./DownPanel";
import { GallPanel } from "./GalleryPanel";
import { Search } from "./Search";

type Item = {
    id: number,
    title: string
}

type DownItem = Item & {
    status: number,
    size: number,
    size_down: number
}

type GalleryListResult = {
    offset: number,
    is_end: boolean,
    list: Item[]
}

export type GalleryListParams = {
    offset: number,
    query: string
}

export type DownSocketMessage = {
    event:string,
    content?: GalleryListResult | GalleryListParams | DownSocketMessage
}

export type ListStorage = {
    type: 'gallery' | 'search' | 'down',
    socket_open: boolean,
    gallery: GalleryListParams & {
        is_end: boolean,
        list: Item[]
    },
    down: DownItem[]
}

export const PAGE_SIZE_LIMIT = 50;

const isGListResult = (x:any): x is GalleryListResult => x.offset;

const [storage, setStorage] = createStore<ListStorage>({ 
    type:'gallery',
    socket_open: false,
    gallery: { offset:0, is_end:false, query:'', list: new Array<any>()},
    down: new Array<any>() 
});

function Page() {

    const [panel, setPanel] = createSignal("gallery");

    const socket = new WebSocket('ws://localhost:8080/api/wss');
    const send = (msg:DownSocketMessage) => {
        socket.send(JSON.stringify(msg));
    }

    const Header = () =>
        <div class="header">
            <h1>DownHost</h1>
            <div class="nav">
                <fast-button id="settings">{sett_icon}</fast-button>
            </div>
        </div>;

    const NavBar = () => {
        let galtab, downtab;
        const gal_click = () => {
            galtab.appearance = "accent";
            downtab.appearance = "stealth";
            setStorage('type','gallery');
        }
        const down_click = () => {
            galtab.appearance = "stealth";
            downtab.appearance = "accent";
            setStorage('type','down');
        }
        return <div class="nav">
            <fast-button ref={galtab}
                class="nav-button"
                appearance="accent"
                onclick={gal_click}>
                Library
            </fast-button>
            <fast-button ref={downtab}
                class="nav-button"
                appearance="stealth"
                onclick={down_click}>
                Downloads
            </fast-button>
        </div>
    };

    // createEffect( () => {
    //     const type = panel();
    //     if ( socket.readyState !== socket.OPEN ) return;
    //     switch ( type ) {
    //         case 'gallery' : { send({event:'LIST', content: { offset:0, query: storage.gallery.query }}); break; }
    //         case 'down'    : { send({event:'TASKS'}); break;}
    //     }
    // })

    onMount(async () => {
        provideFASTDesignSystem()
            .register(
                fastTextField(),
                fastButton(),
                fastDivider(),
                fastProgress()
            )

        // This one handles darkmode.
        // Ask MS who wants a feature to dynamically
        // change a palete in a webapp.
        baseLayerLuminance.setValueFor(document, 0.1);

        socket.onopen = () => {
            console.debug('Downsocket established');
            setStorage('socket_open',true);
            send({event:'LIST', content: { offset:0, query: ''}});
        }
        socket.onclose = () => {
            console.debug('Downsocket closed')
        }

        socket.addEventListener('message', ({data} : MessageEvent<string>) => {
            const { event, content } : DownSocketMessage = JSON.parse(data);
            console.debug({data});

            if (isGListResult(content)) {
                setStorage( 'gallery', produce( (g) => {

                    switch ( event ) {
                        case 'LIST':
                        case 'SEARCH' : {
                            g.list    = content.list ; break;
                        }
                        case 'EXT_LIST' : {
                            g.list.push(...content.list); break;
                        }
                    }

                    g.offset = content.offset;
                    g.is_end = content.is_end;
                }));
            }
            // else if ( event == 'NEW_G') {
            //     let new_item:any = JSON.parse(content as any);
            //     setStorage( 'gallery','list',(stor) => [new_item,...stor])
            // }
            else if ( event == 'TASKS') {
                setStorage( 'down', JSON.parse(content as any));
            }
        });

    })

    const panels = {
        "gallery": () => <GallPanel storage={storage} socket_msg={send} />,
        "down": () => <DownPanel list={storage} />
    }

    return <>
        <Header />
        <Search setList={setStorage} socket_msg={send}/>
        <NavBar />
        <fast-divider />
        <Dynamic component={panels[storage.type]} />
        <SettingsPanel />
    </>
}

render(() => <Page/>, document.getElementById('root') as HTMLElement);
