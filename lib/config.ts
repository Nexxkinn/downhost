
import type { DownConfig } from './_deps.ts';
async function loadConfig(): Promise<DownConfig>{
    try {
        const config:DownConfig = JSON.parse(await Deno.readTextFile('config.json'));
        if(!config.hostname) config.hostname= "localhost";
        if(!config.port) config.port= 8080;
        if(!config.temp_dir) config.temp_dir= ".temp";
        if(!config.catalog_dir) config.catalog_dir= "catalog";
        if(!config.pass) config.pass = "";
        if(!config.base_url) config.base_url = "/";
        return config;
    }
    catch(e) {
        throw new Error('downhost is unable to find config.json in your current directory. Stopping...')
    }
}

export const config = await loadConfig();