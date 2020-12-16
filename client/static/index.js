document.addEventListener("DOMContentLoaded",init);

/**
 * @typedef {Object} lib_item
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

async function init() {

    const field    = document.getElementById('field');
    const submit   = document.getElementById('submit');
    const settings = document.getElementById('settings');
    const dialog   = document.getElementById('settings-dialog');

    const catalogTab = document.getElementById('catalogTab');
    const libraryTab = document.getElementById('libraryTab');

    const catalogPanel = document.getElementById('catalogPanel');
    const libraryPanel = document.getElementById('libraryPanel');

    catalogPanel.hidden = false;
    libraryPanel.hidden = true;

    // This is a hotfix for shadow DOM bug occured in Warp JIT on firefox 83+
    // Remove it if it was fixed in later builds.
    // 11/11/2020 : https://github.com/microsoft/fast/pull/4087 fixes this issue.
    // 22/11/2020 : Nah, It's still broken in version 85.
    field.shadowRoot.getElementById('control').value = "";

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
        catalogPanel.hidden = false;

        libraryTab.appearance = "stealth";
        libraryPanel.hidden = true;
    }

    libraryTab.onclick = (_) => {
        catalogTab.appearance = "stealth";
        catalogPanel.hidden = true;

        libraryTab.appearance = "accent";
        libraryPanel.hidden = false;
    }

    settings.onclick = (_) => {
        dialog.hidden = false;
    }

    field.valueChanged = (_) => {
        submit.hidden = !field.value.startsWith('http');
    }
    await refreshList();

    
    // dummy
    // const table = document.getElementById('cataloglist');
    // downlist_item(table,{id:998,title:'title',status:1,size:100,size_down:10})
}

async function refreshList() {
    const down = await req({ api:'job/list' });
    const lib  = await req({ api:'lib/dir' });
    liblist_update(lib);
    downlist_update(down);
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

function liblist_update(list) {
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
    for (const item of list) {
        let isListed = false;
        for (const child of _lib) {
            if (child.id === item.id) { isListed = true; break; }
        }
        if (!isListed) { _lib.unshift(liblist_item(table,item)) }
    }
}

/**
 * 
 * @param {{id:number, title:string, status:number, size:number, size_down:number}[]} list 
 */
function downlist_update(list) {
    const table = document.getElementById('cataloglist');
    // remove unlisted item
    for (const {id, update, remove} of _down){
        let isListed = false;
        for(const { id:item_id, size_down } of list) {
            if ( item_id === id ) { 
                isListed = true;
                update(size_down);
                break; }
        }
        if(!isListed) { remove(); _down.splice(_down.findIndex((x) => x.id === id),1)}
    }

    // update
    for (const item of list) {
        let isListed = false;
        for (const child of _down) {
            if (child.id === item.id) { isListed = true; break; }
        }
        if (!isListed) { _down.unshift(downlist_item(table,item)) }
    }
}

/**
 * 
 * @param {HTMLElement} parent 
 * @param {{id:number, title:string}} args
 */
function liblist_item(parent,args) {
    const { id, title } = args;
    const item = document.createElement('fast-card');

    const thumb = document.createElement('img');
          thumb.loading = "lazy";
          thumb.src = "/thumb/"+id;
          thumb.style = ` width:100%;`;

    const div = document.createElement('div');
    const link = document.createElement('a');
          link.href = '/reader/'+id;
          link.append(thumb);
    div.append(link);

    const rem = document.createElement('fast-button');
          rem.appearance = 'stealth';
          rem.className  = 'option';
          rem.title      = 'Remove this gallery'
          rem.innerHTML  = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
          rem.onclick    = async () => {
            item.style = ` pointer-events: none; opacity: 0.50;`;

            const res  = await req({ api:'lib/remove', body:{ id } });
            
            if(!res.status) item.style = '';
          }

    const info = document.createElement('fast-button');
          info.appearance = 'stealth';
          info.className  = 'option';
          info.title      = 'View this gallery';
          info.innerHTML  = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="feather feather-image"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`
          info.onclick    = () => window.open('/reader/'+id, '_blank');

    const name = document.createElement('div');
          name.title = decodeHtml(title);
          name.className = 'title';
          name.id = 'item-title';
          name.append(decodeHtml(title));

    const content = document.createElement('div');
          content.style = ` width:100%; grid-template-areas: 'opt opt' 'title title'; `;
          content.append(info,rem,name);
          
    item.index = id;
    item.append(div,content);
    parent.prepend(item);

    const remove = () =>{ parent.removeChild(item)};

    return {id,remove};
}


/**
 * 
 * @param {HTMLElement} parent 
 * @param {{id:number,title:string,size:number,size_down:number}} args
 */
function downlist_item(parent, args) {
    const {id,title,size,size_down} = args;

    const item = document.createElement('fast-card');
          item.clientHeight = 0;
          item.style = `
          width:100%;
          padding:10px;
          `
    const prog = document.createElement('fast-progress');
          prog.value = size_down ? (size_down / size) * 100 : null;
          prog.max = size;
    const head = document.createElement('div');
          head.append(decodeHtml(title),prog);
    item.append(head);
    item.index = id;
    parent.prepend(item);

    const update = (size_down) => {
        prog.value = (size_down / size) * 100;
    };

    const remove = () => {
        parent.removeChild(item);
    }
    
    return {id,update,remove};
}

function decodeHtml(html) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}