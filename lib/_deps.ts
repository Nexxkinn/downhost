export { join, create_zip, get_entries, open_zip, b64Dec } from "../deps.ts";

export type DownConfig = {
    hostname:string,
    port:number,
    base_url:string,
    base_dir:string,
    catalog_dir:string,
    webui_dir:string,
    temp_dir:string,
    pass:string
}

export enum status {
    INITIALIZED,
    RUNNING,
    STOPPED,
    COMPLETED,
}