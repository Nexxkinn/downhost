import { req } from './req';
import { render, Dynamic } from 'solid-js/web';
import { createStore, modifyMutable, produce, reconcile } from "solid-js/store";
import { onMount, createSignal, createEffect, For, Show } from 'solid-js';
import styles from '../../styles/home.css';
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
    size: number,
    status: number,
    size_down: number
}

type GalleryListResult = {
    offset: number,
    is_end: boolean,
    list: string
}

export type DownSocketMessage = {
    event:string,
    content?: GalleryListResult | DownSocketMessage
}

export type ListStorage = {
    type: 'gallery' | 'search' | 'down',
    gallery: {
        offset: number,
        is_end: boolean,
        list: any[],
        query: string
    },
    down: any[]
}

const isGListResult = (x:any): x is GalleryListResult => x.offset;

const [storage, setStorage] = createStore<ListStorage>({ 
    type:'gallery', 
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
            setPanel("gallery");
        }
        const down_click = () => {
            galtab.appearance = "stealth";
            downtab.appearance = "accent";
            setPanel("down");
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

    createEffect( () => {
        if (socket.readyState != socket.OPEN) return;
        switch ( panel() ) {
            case 'gallery' : { send({event:'LIST'}); break; }
            case 'down'    : { send({event:'TASKS'}); break;}
        }
    })

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
            console.log('Downsocket established');
        }
        socket.onclose = () => {
            console.log('Downsocket closed')
        }

        socket.addEventListener('message', ({data} : MessageEvent<string>) => {
            const { event, content } : DownSocketMessage = JSON.parse(data);
            console.debug({socket_event:event});

            if (isGListResult(content)) {
                setStorage( 'gallery', produce( (g) => {

                    switch ( event ) {
                        case 'LIST':
                        case 'SEARCH' : {
                            g.list    = JSON.parse(content.list) ; break;
                        }
                        case 'EXT_LIST' : {
                            g.list.push(JSON.parse(content.list)); break;
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
        <Search setList={setStorage} />
        <NavBar />
        <fast-divider />
        <Dynamic component={panels[panel()]} />
        <SettingsPanel />
    </>
}

render(() => <Page style={styles} />, document.getElementById('root') as HTMLElement);
