window.onload = init;

async function init() {

    const submit = document.getElementById('submit');
    submit.onclick = async (_) => {
        const url = document.getElementById('url').value;
        if (!url) return;
        const query = `mutation add($www:String) {
            add(url:$www)
        }
        `
        const variables = { www:url }
        const gql = await fetch_gql({query,variables});
        console.log(gql);
    }
    await refreshList();
}

async function refreshList() {
    const query = `query { getlist { ... { id name progress status } } }`
    const res = await fetch_gql({query});
    const list = res.data.getlist;

    updatelist(list);
    window.setTimeout(refreshList,1000);
}

async function fetch_gql({query,variables={}}){
    const res = await fetch('graphql',
    {
        method:'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        body: JSON.stringify({query,variables})
    })
    return await res.json();
}

function updatelist(list){
    const table = document.getElementById('list');
    table.innerHTML = '';
    for(const item of list){
        const {id, name, progress, status} = item;
        table.appendChild(addItem({id:'item_'+id, name,percent:progress,status}))
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addItem({id,name,percent='',status=''}){
    const item = document.createElement('fast-accordion-item');
    const divname = document.createElement('span');

    divname.slot = "heading";
    divname.className = "itemname"
    divname.append(name);

    item.id = id;
    item.append(divname,percent,status);
    return item;
}