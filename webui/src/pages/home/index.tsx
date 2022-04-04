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

type DownItem = ItemArgs & {
    size: number,
    status: number,
    size_down: number
}

const [list, setList] = createStore({ gallery: [], down: [] });
const [page, setPage] = createSignal(1);

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

        //dummy
        //                 let dummy = [];
        //                 for (let _id = 1; _id <= 101; _id++) {
        //                     dummy.push({
        //                         id: _id,
        //                         title: Math.random().toString(16).substr(2, 8),
        //                         size: 100,
        //                         size_down: Math.floor(Math.random() * (100 - 0 + 1) + 0),
        //                         status:1
        //                     })
        //                 }
        //setList('down', dummy);
        //setList('gallery',dummy);
        //console.log({ dummy });

        // load gallery
        const refresh = async () => {
            switch (panel()) {
                case "gallery": {
                    if (GalAutoRefresh()) {
                        const upd = await req({ api: 'lib/list' });
                        setList('gallery', reconcile(upd));
                    }
                    break;
                }
                case "down": {
                    const upd = await req({ api: 'task/list' });
                    setList('down', reconcile(upd));
                    break;

                }
            }

            window.setTimeout(refresh, 1000);
        }

        await refresh();
        // load item search


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
