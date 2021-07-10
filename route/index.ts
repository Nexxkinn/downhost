import { render } from "../lib/_mod.ts";
import { Request } from './_deps.ts';
import { DB } from "../deps.ts";

const title = "DownHost";

export default async function handler (req:Request,db:DB){
    return await render("index.tsml",{title})
}