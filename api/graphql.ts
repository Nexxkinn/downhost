import { DownMode, Request, DB, graphql, buildSchema } from './_deps.ts';
import { appendTask, Task } from "../lib/_mod.ts";
let schema = buildSchema(await Deno.readTextFile("client/schema.gql"));
let rootValue = { getlist, add, set, delete: remove }

export default async function handler(req: Request, db: DB) {
    try {
        const json = await req.body({ type: 'json' }).value;
        const source = json['query'];
        const variableValues = 'variables' in json ? json.variables : {};
        const response = await graphql({
            schema,
            source,
            rootValue,
            contextValue: { db },
            variableValues
        })
        return response;
    }
    catch (e) {
        console.log(e);
    }
}

function getlist(_: any, { db }: { db: DB }) {
    const list = new Array();
    const res = db.query("SELECT __typename,id, uid,name,status,size,downloaded FROM download");
    for (const [__typename, id, uid, name, status, size, downloaded] of res) {
        const progress = size && downloaded ? ((downloaded / size) * 100).toFixed(2) : "0";
        list.push({ __typename, id, uid, name, status, progress })
    }
    return list;
}

function add({ url }: { url: string }, { db }: { db: DB }) {
    appendTask(new Task({ url, db }));
    return true;
}

function remove({ url }: any) {
    return true;
}

function set(id: number, mode: DownMode) {
    return true;
}
