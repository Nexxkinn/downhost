window.onload = init;

async function init() {

    const field    = document.getElementById('field');
    const submit   = document.getElementById('submit');
    const settings = document.getElementById('settings');
    const dialog   = document.getElementById('settings-dialog');

    // This is a hotfix for shadow DOM bug occured in Warp JIT on firefox 83+
    // Remove it if it was fixed in later builds.
    field.shadowRoot.getElementById('control').value = "";

    document.getElementById('dialog-close').onclick = () => dialog.hidden = true;

    submit.onclick = async (_) => {
        const url = field.value;
        if (!url) return;
        const query = `mutation add($www:String) {
            add(url:$www)
        }
        `
        const variables = { www: url }
        const gql = await fetch_gql({ query, variables });
        field.value = "";
        console.log(gql);
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
    const query = `query { getlist { ... { id name progress status } } }`
    const res = await fetch_gql({ query });
    const list = res.data.getlist;

    updatelist(list);
    window.setTimeout(refreshList, 1000);
}

async function fetch_gql({ query, variables = {} }) {
    const res = await fetch('graphql',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        })
    return await res.json();
}

function updatelist(list) {
    const table = document.getElementById('list');

    for (const item of list) {
        const { id, name, progress, status } = item;

        let isListed = false;
        for (const child of table.children) {
            if (child.name === id) {
                updateItem(child, { percent:progress, status });
                isListed = true;
                break;
            }
        }
        if (!isListed) {
            table.appendChild(createItem({ id, name, percent: progress, status }))
        }
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createItem({ id, name, percent = '', status = '' }) {
    const item = document.createElement('fast-card');

    const thumb = document.createElement('fast-skeleton');
          thumb.shape = "circle";
          thumb.style = ` max-width:160px;  
                          height:190px;
                          border-radius:4px;`;

    const content = document.createElement('div');
          content.style = "padding: 0 10px 10px;";
          content.innerHTML = `<div class="title">${name}</div>`
          //<div name="stat">${status}</div>;
          //<div name="prog">${percent}</div>

    item.name = id;
    item.append(thumb,content);
    item.style = "width:150px;"
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