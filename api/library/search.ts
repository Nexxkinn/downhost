import { DB } from "../_deps.ts";
import { search } from "../../lib/search.ts";

export default async function handler({ query, db }: { query:string, db: DB }){
    try {
        const result = await search(query,db);
        return JSON.stringify({list:result});
    }
    catch (e) {
        return JSON.stringify({ status: false, message: e.message });
    }
}