window.onload = init;

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
        const url = field.value;
        if (!url) return;
        const body = { url };
        const gql = await req({ func:'add', body });
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
}

async function refreshList() {
    const down = await req({ func:'downlist' });
    const lib  = await req({ func:'library' });
    liblist_update(lib);
    downlist_update(down);
    window.setTimeout(refreshList, 1000);
}

async function req({ func, body = {} }) {
    const res = await fetch(`/api/${func}`,
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
        if (!isListed) { _lib.push(liblist_item(table,item)) }
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
        if (!isListed) { _down.push(downlist_item(table,item)) }
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
          thumb.src = "/thumb/"+id;
          thumb.style = ` width:100%;
                          border-radius:4px;`;

    const div = document.createElement('div');
    const link = document.createElement('a');
          link.href = '/reader/'+id;
          link.append(thumb);
    div.append(link);

    const content = document.createElement('div');
          content.style = "width:100%;";
          content.innerHTML = `<div title="${title}" class="title" id="item-title">${title}</div>`

    item.index = id;
    item.append(div,content);
    parent.appendChild(item);

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

    const item = document.createElement('fast-accordion-item');
    const head = document.createElement('span');
          head.slot = 'heading';
          head.innerHTML = title+'/'+size_down+'/'+size;
    item.append(head);
    item.index = id;
    parent.appendChild(item);

    const update = (size_down) => {
        head.innerHTML = title+'/'+size_down+'/'+size;
    };
    const remove = () => {
        parent.removeChild(item);
    }
    return {id,update,remove};
}