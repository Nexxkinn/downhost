import { render } from 'solid-js/web';
import { createStore, produce } from "solid-js/store";
import { onMount, createSignal, For } from 'solid-js';
import styles from '../../styles/home.css';
import {
    fastButton,
    fastTextField,
    accentColor,
    baseLayerLuminance,
    fillColor,
    provideFASTDesignSystem
} from "@microsoft/fast-components";
import { del_icon, inf_icon, sett_icon } from "./icons";
import { SettingsPanel } from "./settingsPanel";

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

function GallPanel({ visibility }) {
    return <>
        <For each={list.gallery}>{({ id, title }, i) => {
            <fast-card>
                <div>
                    <a href={document.baseURI + 'reader/' + id}>
                        <img style={{ width: '100%' }} src={document.baseURI + "thumb/" + id} />
                    </a>
                </div>
                <div style={{
                    width: '100%',
                    background: 'var(--background-color)',
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
                    <div class="title" id="item-title" title={title}> {title} </div>
                </div>
            </fast-card>
        }}
        </For>
    </>
}

function DownPanel({ visibility }) {
    return <>
        <For each={list.gallery}>{({ id, title, size, status, size_down }, i) => {
            <fast-card>
                <div style="grid-area: name;">{title}</div>
                <div style="grid-area: opt;">
                    <fast-button title="remove from the list" appearance="neutral">
                        {del_icon}
                    </fast-button>
                </div>
                <fast-progress
                    style="grid-area: prog;"
                    role="progressbar"
                    max={size}
                    value={size_down ? (size_down / size) * 100 : null}>
                </fast-progress>
            </fast-card>
        }}
        </For>
    </>
}


function Page() {
    const [input, setInput] = createSignal("");
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

    const Header = () => {
        return <>
            <div class="header">
                <h1>DownHost</h1>
                <div class="nav">
                    <fast-button id="settings">{sett_icon}</fast-button>
                </div>
            </div>
        </>
    };

    const Search = () => {
        return <>
            <div class="form">
                <fast-text-field appearance="outline" placeholder="Search or put gallery link here..." autofocus id="field">
                </fast-text-field>
                <fast-button id="submit" hidden>Download</fast-button>
            </div>
        </>
    };

    const Navbar = () => {
        return <>
            <div id="nav" class="nav">
                <fast-button class="nav-button" id="libraryTab" appearance="accent">Library</fast-button>
                <fast-button class="nav-button" id="catalogTab" appearance="stealth">Downloads</fast-button>
            </div>
        </>

    };

    const Panel = () => {
        return <>
            <div id="panel">
                <div id="downpanel" hidden>
                    <div id="downlist" class="down-list" ></div>
                </div>
                <div id="libpanel" hidden>
                    <div id="liblist" class="lib-list"></div>
                    <div id="lib-footer"></div>
                </div>
            </div>
        </>
    };

    onMount(() => {
        provideFASTDesignSystem()
            .register(
                fastTextField(),
                fastButton()
            )
        baseLayerLuminance.setValueFor(document, 0.1);
        // load item search
    })
    return <>
        <Header />
        <Search />
        <Navbar />
        <fast-divider></fast-divider>
        <Panel />
        <SettingsPanel />
    </>
}

render(() => <Page style={styles} />, document.getElementById('root') as HTMLElement);
