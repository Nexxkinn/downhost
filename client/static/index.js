window.onload = init;

async function init() {

    const submit = document.getElementById('submit');
    const field  = document.getElementById('field');

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
    const item = document.createElement('fast-accordion-item');
    const head = `<span slot="heading" class="itemname">
                    <div> ${name} </div>
                    </span>`;
    const perc = `<div name="prog">${percent}</div>`;
    const stat = `<div name="stat">${status}</div>`;

    item.name = id;
    item.innerHTML = "".concat(head,perc,stat);
    return item;
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {any} item 
 */
function updateItem(element, { percent, status }) {
    [head, perc, stat] = [...element.children];
    perc.innerHTML = String(percent);
    stat.innerHTML = String(status);
}