import { React ,render } from "../lib/_mod.ts";
import { DB } from "../deps.ts";

const title = "";

export default async function handler (id:string,db:DB){
    const filename = db.query('SELECT filename FROM download WHERE id=? LIMIT 1',[Number(id)]);
    return await render("client/reader.tsml",{title,body})
}