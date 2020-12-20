document.addEventListener("DOMContentLoaded",init);

/**
 * @typedef {Object} lib_item
 * @property {HTMLElement} item
 * @property {number} id
 * @property {() => void} remove
 */

 /**
  * @typedef {Object} downlist_item
  * @property {number} id
  * @property {(size_down:number) => void} update
  * @property {() => void} remove
  */

/**
 * @type {Array<lib_item>}
 */
const _lib  = new Array();

/**
 * @type {Array<downlist_item>}
 */
const _down = new Array();

/**
 * true:
 *  - iOS/iPadOS
 *  - Android
 *  - Mobile OS
 * false:
 *  - Windows
 *  - MacOS
 *  - Linux
 *  - Any OS
 */
const is_mobile = () => {
    const isIOS = (/iPad|iPhone|iPod/.test(navigator.platform) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
        !window.MSStream
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android|BlackBerry|Opera Mini|IEMobile|CRiOS|OPiOS|Mobile|FxiOS/i.test(navigator.userAgent);
    return isIOS || isAndroid || isMobile;
};

const lite_mode = is_mobile();

let observer,catalog_observer,rem_icon,info_icon;
/**
 * @type DocumentFragment
 */
let liblist_element;
let PAGE_SIZE=50, page=0;

async function init() {
    const field    = document.getElementById('field');
    const submit   = document.getElementById('submit');
    const settings = document.getElementById('settings');
    const dialog   = document.getElementById('settings-dialog');

    const catalogTab = document.getElementById('catalogTab');
    const libraryTab = document.getElementById('libraryTab');

    const catalogPanel = document.getElementById('downpanel');
    const libraryPanel = document.getElementById('libpanel');


    const parser    = new DOMParser()
    const rem_svg   = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    const info_svg  = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
    rem_icon  = parser.parseFromString(rem_svg,'image/svg+xml');
    info_icon = parser.parseFromString(info_svg,'image/svg+xml');

    observer = new IntersectionObserver((entries,observer) => {
        for(const entry of entries){
            if(!entry.isIntersecting) continue;
            const thumb = entry.target;
            thumb.src = thumb.dataset.src;
            observer.unobserve(thumb);
        }
    }, { threshold: 0, rootMargin:'100px 0px' });

    lib_observer = new IntersectionObserver((e,o) => {
        for(const entry of e){
            if(entry.isIntersecting){
                page++;
                liblist_updateElement(false);
            }
        }
    },{ threshold: 1 })

    liblist_element = liblist_createElement();

    catalogPanel.style.display = 'none';
    libraryPanel.style.display = 'grid';
    
    // This is a hotfix for shadow DOM bug occured in Warp JIT on firefox 83+
    // Remove it if it was fixed in later builds.
    // 11/11/2020 : https://github.com/microsoft/fast/pull/4087 fixes this issue.
    // 22/11/2020 : Nah, It's still broken in version 85.
    // 17/12/2020 : Might've been fixed in version 86.
    // field.shadowRoot.getElementById('control').value = "";

    document.getElementById('dialog-close').onclick = () => dialog.hidden = true;

    submit.onclick = async (_) => {
        // add loading
        field.disabled = true;
        submit.disabled = true;
        const source = field.value;
        if (!source) return;
        const gql = await req({ api:'job/add', body: { source } });
        field.value = "";
        field.disabled = false;
        submit.disabled = false;
        console.log(gql);
    }

    catalogTab.onclick = (_) => {
        catalogTab.appearance = "accent";
        catalogPanel.style.display = 'block';

        libraryTab.appearance = "stealth";
        libraryPanel.style.display = 'none';
    }

    libraryTab.onclick = (_) => {
        catalogTab.appearance = "stealth";
        catalogPanel.style.display = 'none';

        libraryTab.appearance = "accent";
        libraryPanel.style.display = 'grid';
    }

    settings.onclick = (_) => {
        dialog.hidden = false;
    }

    field.valueChanged = (_) => {
        submit.hidden = !field.value.startsWith('http');
    }

    await refreshList();

    const liblist = document.getElementById('lib-footer');
    lib_observer.observe(liblist);

    
    // dummy
    // const table = document.getElementById('downlist');
    // downlist_item(table,{id:998,title:'title',status:1,size:100,size_down:10})
}

async function refreshList() {
    const down = await req({ api:'job/list' });
    const lib  = await req({ api:'lib/dir' });
    const lib_update = liblist_update(lib);
    const dow_update = downlist_update(down);
    await Promise.all([lib_update,dow_update]);
    window.setTimeout(refreshList, 1000);
}

async function req({ api, body = {} }) {
    const res = await fetch(`/api/${api}`,
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

/**
 * 
 * @param {{id:number,title:string}[]} list 
 */
async function liblist_update(list) {
    const table = document.getElementById('liblist');
    // remove unlisted item
    for (const {id, remove} of _lib){
        let isListed = false;
        for(const { id:item_id } of list) {
            if ( item_id === id ) { isListed = true; break; }
        }
        if(!isListed) { remove(); _lib.splice(_lib.findIndex((x) => x.id === id),1)}
    }

    // update
    let _need_update = false;
    for (const item of list) {
        let isListed = false;
        for (const child of _lib) {
            if (child.id === item.id) { isListed = true; break; }
        }
        if (!isListed) {
            _need_update = true;
            _lib.unshift(liblist(table,item))
        }
    }
    if(_need_update) liblist_updateElement();
}

function liblist_updateElement(prepend=true){
    const table = document.getElementById('liblist');
    const items = _lib.slice(PAGE_SIZE*page,PAGE_SIZE*(page+1));
    let list = document.createDocumentFragment();
    for(const { item } of items) {
        if(table.contains(item)) continue;
        list.appendChild(item);
    }
    if(prepend) table.prepend(list);
    else table.appendChild(list);
}

/**
 * 
 * @param {{id:number, title:string, status:number, size:number, size_down:number}[]} list 
 */
async function downlist_update(list) {
    const table = document.getElementById('downlist');
    // remove unlisted item
    for (const {id, update, remove} of _down){
        let isListed = false;
        for(const { id:item_id, status, size_down } of list) {
            if ( item_id === id ) { 
                isListed = true;
                update(status,size_down);
                break;
            }
        }
        if(!isListed) { remove(); _down.splice(_down.findIndex((x) => x.id === id),1)}
    }

    // add new item
    for (const item of list) {
        let isListed = false;
        for (const child of _down) {
            if (child.id === item.id) { isListed = true; break; }
        }
        if (!isListed) { _down.unshift(downlist(table,item)) }
    }
}

/**
 * 
 * @param {HTMLElement} parent 
 * @param {{id:number, title:string}} args
 */
function liblist(parent,args) {
    const { id, title } = args;
    const item = liblist_element.firstChild.cloneNode(true);
    item.index = id;

    const thumb = item.querySelector('img');
    thumb.dataset.src = "/thumb/"+id;
    observer.observe(thumb);

    const link = item.querySelector('a');
    link.href = '/reader/'+id;

    const rem = item.querySelector('#item-remove');
    rem.onclick    = async () => {
        item.style = ` pointer-events: none; opacity: 0.50;`;
        const res  = await req({ api:'lib/remove', body:{ id } });
        if(!res.status) item.style = '';
      }
    
    const info = item.querySelector('#item-info');
    info.onclick    = () => window.open('/reader/'+id, '_blank');
    
    const name = item.querySelector('#item-title')
    const name_tn = document.createTextNode(title);
    name.title = name_tn.nodeValue;
    name.appendChild(name_tn);
    
    const remove = () =>{ parent.removeChild(item) };

    return {item, id,remove};
}

function liblist_createElement() {
    const doc = document.createDocumentFragment();
    const item = document.createElement('fast-card');

    const thumb = document.createElement('img');
    thumb.style.width = '100%';

    const div  = document.createElement('div');
    const link = document.createElement('a');
          link.append(thumb);
    div.append(link);

    const rem = document.createElement('fast-button');
          rem.appearance = 'stealth';
          rem.className  = 'item-button';
          rem.id         = 'item-remove';
          rem.title      = 'Remove this gallery';
          rem.appendChild(rem_icon.documentElement.cloneNode(true));

    const info = document.createElement('fast-button');
          info.appearance = 'stealth';
          info.className  = 'item-button';
          info.id         = 'item-info';
          info.title      = 'View this gallery';
          info.appendChild(info_icon.documentElement.cloneNode(true));

    const name = document.createElement('div');
          name.className = 'title';
          name.id = 'item-title';

    const content = document.createElement('div');
          content.style = ` width:100%; grid-template-areas: 'opt opt' 'title title'; background: var(--background-color);`;
          content.append(info,rem,name);
    
    item.append(div,content);
    doc.appendChild(item);
    return doc;         
}


/**
 * 
 * @param {HTMLElement} parent 
 * @param {{id:number,title:string,status:number,size:number,size_down:number}} args
 */
function downlist(parent, args) {
    const {id,title,size,status,size_down} = args;

    const item = document.createElement('fast-card');
          item.clientHeight = 0;

    const prog = document.createElement('fast-progress');
          prog.style = 'grid-area: prog;';
          prog.value = size_down ? (size_down / size) * 100 : null;
          prog.max = size;
    
    // const nav_icon_strt = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-play"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    // const nav_icon_stop = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-octagon"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon></svg>';
    // const nav = document.createElement('fast-button');
    //       nav.dataset.status = status;
    //       nav.title = 'stop downloading';

    // const strt = async () => {
    //     nav.style = ` pointer-events: none; opacity: 0.50;`;
    //     const res = await req({ api:'job/start', body: { id } });
    //     console.log(`start: ${id} / ${res}`);
    // }
    // const stop = async () => {
    //     nav.style = ` pointer-events: none; opacity: 0.50;`;
    //     const res = await req({ api:'job/stop', body: { id } });
    //     console.log(`stop: ${id} / ${res}`);
    // }

    // if(status === 2) {
    //     // start
    //     nav.onclick = strt;
    //     nav.innerHTML = nav_icon_strt;
    // }
    // else {
    //     // stop
    //     nav.onclick = stop;
    //     nav.innerHTML = nav_icon_stop;
    // }

    const cancel = document.createElement('fast-button');
          cancel.title = 'remove from the list';
          cancel.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
          cancel.onclick = async () => {
            item.style = ` pointer-events: none; opacity: 0.50;`;
            const res = await req({ api:'job/cancel', body: { id } });
            if(!res.status) item.style = '';
            console.log(`cancel: ${id} / ${res}`);
        }

    const man  = document.createElement('div');
          man.style = 'grid-area: opt;';
          man.append(cancel);
          // man.append(nav,cancel);

    const name = document.createElement('div');
          name.style = 'grid-area: name;';
          name.appendChild(document.createTextNode(title));

    item.append(name,man,prog);
    item.index = id;
    parent.prepend(item);

    const update = (status,size_down) => {
        prog.value = (size_down / size) * 100;

        // if( nav.dataset.status !== status ){
        //     nav.dataset.status = status;
        //     nav.style = '';
        //     if(status === 2) {
        //         // start
        //         nav.onclick = strt;
        //         nav.innerHTML = nav_icon_strt;
        //     }
        //     else {
        //         // stop
        //         nav.onclick = stop;
        //         nav.innerHTML = nav_icon_stop;
        //     }
        // }
    };

    const remove = () => {
        parent.removeChild(item);
    }
    
    return {id,update,remove};
}
