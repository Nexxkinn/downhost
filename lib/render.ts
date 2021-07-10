import { config } from "../lib/config.ts";
import { base64Decode, join } from "./_deps.ts";
import { webui } from "./webui.ts";

const regex = /(?<=\{\@).+(?=\})/g
const decoder = new TextDecoder();
export async function render(file:string,react:any){
    react.base_url = config.base_url;
    let html = decoder.decode(getWebUI(file));
    for(const key of html.matchAll(regex)){
        html = html.replace(`{@${key}}`,react[String(key)] || "");
    }
    return html;
}

export const getWebUI = (path:string) => config.webui_dir
                ? Deno.readFileSync(join(config.webui_dir,path)) 
                : base64Decode(webui[path])