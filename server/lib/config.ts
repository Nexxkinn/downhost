
import type { DownConfig } from './_deps.ts';
import { ensureFile } from "./ensureFileDir.ts";

async function loadConfig(): Promise<DownConfig>{

    if(await ensureFile('config.json')){
        const config:DownConfig = JSON.parse(await Deno.readTextFile('config.json'));
        if(!config.hostname) config.hostname= "localhost";
        if(!config.port) config.port= 8080;
        if(!config.temp_dir) config.temp_dir= ".temp";
        if(!config.catalog_dir) config.catalog_dir= "catalog";
        if(!config.pass) config.pass = "";
        if(!config.base_url) config.base_url = "/";
        if(!config.webui_dir) config.webui_dir = "";
        return config;
    }
    else {
        console.log('Warning: Unable to find config.json, using default config instead.');
        return default_config;
    }
}

const default_config:DownConfig = {
    hostname:'localhost',
    port:8080,
    temp_dir: '.temp',
    catalog_dir:'catalog',
    webui_dir:"",
    pass:"",
    base_url:"/",
    base_dir:"",
}

export const config = await loadConfig();