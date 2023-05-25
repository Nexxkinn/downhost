import { req } from './req';
import { render, Dynamic } from 'solid-js/web';
import { createStore, produce, reconcile } from "solid-js/store";
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

type DownSocketMessage = {
    event:string,
    content?: any | DownSocketMessage
}

const [list, setList] = createStore({ gallery: [], down: [] });
const [page, setPage] = createSignal(1);
const downsocket = new WebSocket('ws://localhost:8080/api/wss');
const ds_send = (msg:DownSocketMessage) => {
    downsocket.send(JSON.stringify(msg));
}

function Page() {
    const [GalAutoRefresh, setGalAutoRefresh] = createSignal(true);

    const Header = () =>
        <div class="header">
            <h1>DownHost</h1>
            <div class="nav">
                <fast-button id="settings">{sett_icon}</fast-button>
            </div>
        </div>;

    const [panel, setPanel] = createSignal("gallery");
    const panels = {
        "gallery": () => <GallPanel list={list} pageSignal={[page, setPage]} />,
        "down": () => <DownPanel list={list} />
    }

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
        console.log(panel())
        if (downsocket.readyState != downsocket.OPEN) return;
        switch ( panel() ) {
            case 'gallery' : { ds_send({event:'LIST'}); break; }
            case 'down'    : { ds_send({event:'TASKS'}); break;}
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

        downsocket.onopen = () => {
            console.log('Downsocket established');
            ds_send({event:'LIST'});
        }
        downsocket.onclose = () => {
            console.log('Downsocket closed')
        }

        downsocket.addEventListener('message', ({data} : MessageEvent<string>) => {
            console.log({response:data})
            const { event, content } : DownSocketMessage = JSON.parse(data);
            if      ( event == 'LIST' ) {
                setList('gallery', reconcile(JSON.parse(content)));
            }
            else if ( event == 'TASKS') {
                setList('down', reconcile(JSON.parse(content)));
            }
        });

    })


    return <>
        <Header />
        <Search setList={setList} SetGalAutoRefresh={setGalAutoRefresh} resetPage={() => setPage(1)} />
        <NavBar />
        <fast-divider />
        <Dynamic component={panels[panel()]} />
        <SettingsPanel />
    </>
}

render(() => <Page style={styles} />, document.getElementById('root') as HTMLElement);
