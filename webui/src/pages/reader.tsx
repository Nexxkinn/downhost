import styles from '../styles/reader.css';
import { render } from 'solid-js/web';
import { onMount, createSignal, createEffect } from "solid-js";
import {
    fastButton,
	fastTextField,
    fastDialog,
    provideFASTDesignSystem
} from "@microsoft/fast-components";

type ReaderMode = 'v' | 'h' | null;
//dummy
var len=1, list=['https://picsum.photos/id/1020/1000/2000','https://picsum.photos/id/1021/1000/2000','https://picsum.photos/id/1023/1000/600'], g=1
const g_size = len, g_id = g, g_list = list;

const [nav_visible, set_nav_visible] = createSignal(false);

function ReaderPage(){
    provideFASTDesignSystem()
        .register(
            fastTextField(),
            fastButton(),
            fastDialog()
        )
    const mode:ReaderMode = window.localStorage.getItem('dh_readermode');
    switch(mode) {
        case 'h': return HReader();
        case 'v': default: return VReader();
    }
}

function NavDialog() {
    let dialog;
    createEffect(() => nav_visible() ? dialog.show() : dialog.hide());
    return <>
        <fast-dialog ref={dialog} hidden modal>
        <div style="padding: 0 10px 10px; color: var(--neutral-foreground-rest);">
            <h2>Dialog with text and a button.</h2>
            <fast-button onclick={()=>set_nav_visible(false)}>Save</fast-button>
        </div>
        </fast-dialog>
    </>
}

function HReader(){
    let page=0;
    let _image, _show_nav;
    const _load = (pg:number) => {
            if(pg < 0) { page=0; return; }
            _image.src=g_list[page];

        }

    onMount(() => {
        // later
    })

    return <>

        <div style={{position:"absolute", width:"100%", height:"100%", "max-width":"100vw", "max-height":"100vh", display:"flex"}}>
            <div style={{width:"100%"}} id="left" onclick={()=>_load(page-=1)}/>
            <div style={{width:"50%"}} id="center" onclick={()=>set_nav_visible(true)}>  </div>
            <div style={{width:"100%"}} id="right" onclick={()=>_load(page+=1)}/>
            <NavDialog />
        </div>
        <img ref={_image} src={g_list[0]} />
    </>
}

async function VReader (){
    let options = { threshold: 0 }

    let observer = new IntersectionObserver((entries,observer) => {
        for(const entry of entries){
            if(entry.isIntersecting){
//              console.log(entry.intersectionRatio);
                observer.disconnect();
                append();
            }
        }
    }, options);

    let i = 0;
    const append = () => {
        if( i >= g_size ) return;
        const img = <img
            src={document.baseURI + 'image/'+g_id+'/'+g_list[i]}
            onload={() => { img.style = 'min-height:unset;' }} />;
        observer.observe(img);
        document.body.append(img);
        i++;
    }

    append();
}

render(() => <ReaderPage class={styles}/>, document.getElementById('root') as HTMLElement);
