window.onload = init;

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
        const url = field.value;
        if (!url) return;
        const body = { url };
        const gql = await req({ func:'add', body });
        field.value = "";
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
    const res = await req({ func:'downlist' });
    updatelist(res);
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

function updatelist(list) {
    const table = document.getElementById('list');

    for (const item of list) {
        const { id, title, size,size_down, status } = item;

        const percent = Number(size_down) != 0 ? size*100/size_down : '0';

        let isListed = false;
        for (const child of table.children) {
            if (child.index === id) {
                updateItem(child, { percent, status });
                isListed = true;
                break;
            }
        }
        if (!isListed) {
            table.appendChild(createItem({ id, title, percent, status }))
        }
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createItem({ id, title, percent = '', status = 0 }) {
    const item = document.createElement('fast-card');

    const thumb = document.createElement('img');
          thumb.src = "/thumb/"+id;
          thumb.style = ` width:100%;
                          border-radius:4px;`;

    const div = document.createElement('div');

    if (status === 3) {
        const link = document.createElement('a');
              link.href = '/reader/'+id;
              link.append(thumb);
        div.append(link);
    }
    else {
        div.append(thumb);
    }

    const content = document.createElement('div');
          content.style = "width:100%;";
          content.innerHTML = `<div title="${title}" class="title" id="item-title">${title}</div>`
          //<div name="stat">${status}</div>;
          //<div name="prog">${percent}</div>

    item.index = id;
    item.append(div,content);
    // debug
    //item.expanded = true;
    //item.innerHTML = "".concat(head);
    // displaySkeleton(item);
    return item;
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {any} item 
 */
function updateItem(element, { percent, status }) {
    return;
    [head, perc, stat] = [...element.children];
    perc.innerHTML = String(percent);
    stat.innerHTML = String(status);
}

/**
 * 
 * @param {HTMLElement} element 
 */
function displaySkeleton(element){
    const placeholder = document.getElementById('placeholder').cloneNode(true);
    placeholder.hidden = false;
    element.appendChild(placeholder);
}