import { React ,render } from "../lib/_mod.ts";
import { Request } from './_deps.ts';
import { DB } from "../deps.ts";

const title = "DownHost";
const body = <h1> DownHost </h1>

export default async function handler (req:Request,db:DB){
    return await render("client/index.tsml",{title,body})
}