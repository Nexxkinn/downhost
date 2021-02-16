import { config } from "../lib/config.ts";
const regex = /(?<=\{\@).+(?=\})/g
export async function render(file:string,react:any){
    react.base_url = config.base_url;
    let html = await Deno.readTextFile(file);
    for(const key of html.matchAll(regex)){
        html = html.replace(`{@${key}}`,react[String(key)] || "");
    }
    return html;
}