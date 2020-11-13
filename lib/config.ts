
import type { DownConfig } from './_deps.ts';
export async function loadConfig(): Promise<DownConfig>{
    const config:DownConfig = JSON.parse(await Deno.readTextFile('config.json'));
    if(!config.hostname) config.hostname= "localhost";
    if(!config.port) config.port= 8080;
    if(!config.temp_dir) config.temp_dir= ".temp";
    if(!config.catalog_dir) config.catalog_dir= "catalog";
    if(!config.pass) config.pass = "";
    return config;
}