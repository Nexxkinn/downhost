// import { DB } from "../deps.ts";
export { de } from '../lib/_mod.ts';

export type DownMeta = {
    /**
     * Download type:
     * 
     * __Bulk__ : Download single compressed file
     * 
     * __Pages__ : Sscrap images from the gallery page.
     */
    type:DownType,
    /**
     * Gallery title.
     * Will also be used for filename
     */
    title:string,
    /**
     * Download link that will be used in `download()`
     */
    url: URL,
    /**
     * Unique identifier given by the service.
     */
    uid: string
}

export type Download = {
    path: string,
    meta:DownMeta,
}

export enum DownType {
    BULK="Bulk",
    PAGES="Pages"
}

export const grab = (start:string,end:string,text:string) => {
    return text.split(start)?.pop()?.split(end)[0] || ''
}
