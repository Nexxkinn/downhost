import { render } from 'solid-js/web';
import { createStore, produce } from "solid-js/store";
import { onMount, createSignal, For, Show } from 'solid-js';
import styles from '../../styles/home.css';
import {
    fastButton,
    fastTextField,
    fastDivider,
    baseLayerLuminance,
    provideFASTDesignSystem
} from "@microsoft/fast-components";
import { del_icon, inf_icon, sett_icon } from "./icons";
import { SettingsPanel } from "./settingsPanel";
import { DownPanel } from "./downPanel";
import { GallPanel } from "./galleryPanel";

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
const [input, setInput] = createSignal("");

function Page() {
    const Header = () =>
        <div class="header">
            <h1>DownHost</h1>
            <div class="nav">
                <fast-button id="settings">{sett_icon}</fast-button>
            </div>
        </div>;

    const Search = () =>
        <div class="form">
            <fast-text-field id="field"
                appearance="outline"
                placeholder="Search or put gallery link here..."
                autofocus />
            <fast-button id="submit" hidden>Download</fast-button>
        </div>;

    const Navbar = () =>
        <div id="nav" class="nav">
            <fast-button class="nav-button" id="libraryTab" appearance="accent">Library</fast-button>
            <fast-button class="nav-button" id="catalogTab" appearance="stealth">Downloads</fast-button>
        </div>

    const Panel = () => <>
        <DownPanel list={list} />
        <GallPanel list={list} />
    </>;

    onMount(async () => {
        provideFASTDesignSystem()
            .register(
                fastTextField(),
                fastButton(),
                fastDivider()
            )

        // This one handles darkmode.
        // Ask MS who wants a feature to dynamically
        // change a palete in a webapp.
        baseLayerLuminance.setValueFor(document, 0.1);

        // dummy
        let dummy = [];
        for(let _id=1; _id<=100; _id++) {
            dummy.push({id:_id,title:Math.random().toString(16).substr(2, 8)})
        }
        setList('gallery', dummy);

        // load gallery
        //const lib = await req({ api: 'lib/list' });


        // load item search
    })
    return <>
        <Header />
        <Search />
        <Navbar />
        <fast-divider />
        <Panel />
        <SettingsPanel />
    </>
}

const refresh = async () => {
    const down = await req({ api: 'task/list' });
    const lib = liblistAutoRefresh ? await req({ api: 'lib/list' }) : undefined;
    window.setTimeout(refreshList, 1000);
}

const search = async (query: string) => {
    const res = await req({ api: 'lib/search', body: { query } });

    if (res.status && !res.status) {
        console.debug('failed.', res.message);
        return;
    }
    setList('gallery', res.list);
}

const add = async (url: string) => {
    const gql = await req({ api: 'task/add', body: { source: input } });
    console.log(gql);
}

const req = async ({ api, body = {} }) => {
    const res = await fetch(`${document.baseURI}api/${api}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body)
        })
    return await res.json();
}

render(() => <Page style={styles} />, document.getElementById('root') as HTMLElement);
