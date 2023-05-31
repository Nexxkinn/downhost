import { render, Dynamic } from 'solid-js/web';
import { createStore, produce, reconcile } from "solid-js/store";
import { onMount, createEffect } from 'solid-js';
import {
    fastButton,
    fastTextField,
    fastDivider,
    fastProgress,
    baseLayerLuminance,
    provideFASTDesignSystem
} from "@microsoft/fast-components";
import { sett_icon } from "./icons";
import { SettingsPanel } from "./SettingsPanel";
import { DownPanel } from "./DownPanel";
import { GallPanel } from "./GalleryPanel";
import { Search } from "./Search";
import { removeIndex } from '../../utils/lists';

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
    head: number,
    tail: number,
    is_end: boolean,
    list: Item[]
}

type DownListResult = {
    list: any[]
}

export type GalleryListParams = {
    head: number,
    tail: number,
    query: string
}

export type DownSocketMessage = {
    event:string,
    content?: GalleryListResult | GalleryListParams | DownSocketMessage
}

export type ListStorage = {
    type: 'gallery' | 'down',
    socket_open: boolean,
    gallery: GalleryListParams & {
        is_end: boolean,
        list: Item[]
    },
    down: DownItem[]
}

export const PAGE_SIZE_LIMIT = 50;

const isGListResult = (x:any): x is GalleryListResult => x.head || x.tail;

const [storage, setStorage] = createStore<ListStorage>({ 
    type:'gallery',
    socket_open: false,
    gallery: { head:0, tail:0, is_end:false, query:'', list: new Array<any>()},
    down: new Array<any>() 
});

function Page() {

    const socket = new WebSocket('ws://localhost:8080/api/wss');
    const send = (msg:DownSocketMessage) => {
        if (!storage.socket_open) return;
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
            send({event:'LIST', content: { head:0, tail:0, query: ''}});
        }
        socket.onclose = () => {
            console.debug('Downsocket closed')
        }

        socket.addEventListener('message', ({data} : MessageEvent<string>) => {
            const { event, content } : DownSocketMessage = JSON.parse(data);
            console.debug({event});

            if (isGListResult(content)) {
                switch ( event ) {
                    case 'LIST':
                    case 'SEARCH' : {
                        setStorage( 'gallery', produce( (g) => {
                            g.head = content.head;
                            g.tail = content.tail;
                            g.is_end = content.is_end;
                            g.list   = content.list ;
                        })); 
                        break;
                    }
                    case 'EXT_LIST' : {
                        setStorage( 'gallery', produce( (g) => { 
                            g.tail   = content.tail;
                            g.is_end = content.is_end;
                            g.list.push(...content.list); 
                        })); 
                        break;
                    }
                    case 'UPD_LIST' : {
                        if ( content.list.length ==0 ) break;

                        setStorage( 'gallery', produce( (g) => { 
                            g.head = content.head;
                            g.list.unshift(...content.list);
                        })); 
                        break;
                    }
                }
            }
            // else if ( event == 'NEW_G') {
            //     let new_item:any = JSON.parse(content as any);
            //     setStorage( 'gallery','list',(stor) => [new_item,...stor])
            // }
            else if ( event == 'TASKS') {
                const { list } : DownListResult = content as any;
                console.debug({list_tasks: list});
                setStorage( 'down', reconcile(list) );
            }
        });

        const refresh = async () => {
            if ( !storage.socket_open ) return;
            switch (storage.type) {
                case "gallery": {
                    const msg : GalleryListParams = {
                        head: storage.gallery.head,
                        tail: 0,
                        query: storage.gallery.query
                    }
                    send({event:'UPD_LIST', content: msg});
                    break;
                }
                case "down": {
                    send({event:'TASKS'});
                    break;
                }
            }
        }

        setInterval( refresh, 3000)

    })

    const removeGalleryItemList = (index:number) => {
        setStorage('gallery','list',(l) => removeIndex(l,index))
    }

    const panels = {
        "gallery": () => <GallPanel storage={storage} remove_element={removeGalleryItemList} socket_msg={send} />,
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
