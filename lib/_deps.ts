export { join, create_zip, getEntries } from "../deps.ts";

export type DownConfig = {
    hostname:string,
    port:number,
    base_url:string,
    base_dir:string,
    catalog_dir:string,
    temp_dir:string,
    pass:string
}