// import { DB } from "../deps.ts";
export { de,en } from '../_mod.ts';
export { log } from '../_mod.ts';

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
     * service name
     */
    srvc: string,
    /**
     * Gallery title.
     * Will also be used for filename
     */
    title:string,
    /**
     * Gallery tags
     */
    tags:DownTag[] | undefined,
    /**
     * Thumbnail request link
     */
    thumbnail: DownRequest,
    /**
     * link to download the compressed file or image files
     */
    download: DownRequest | DownPagesRequest,
    /**
     * total pages in the gallery
     */
    length: number,
    /**
     * Unique identifier given by the service.
     */
    uid: string
}

export type DownMetaArgs = {
    link:string,
    offset?:number
}

export type DownTag = {
    ns:string,
    tag:string
}

export type DownRequest = {
    input: Request | URL | string,
    init: RequestInit | undefined,
    /**
     * Handle failed download and give an alternative one.
     * Fired when fetch() failed or too long to download.
     */
    alt?(download: DownRequest | PageRequest) : Promise<DownRequest | PageRequest>,
}

export type PageRequest = DownRequest & {
    filename: string
}

export type DownPagesRequest = {
    [Symbol.asyncIterator](): {
        next(): Promise<{
            value: PageRequest;
            done: boolean;
        }>;
    };
}


export enum DownType {
    BULK="Bulk",
    PAGES="Pages"
}

export const grab = (start:string,end:string,text:string) => {
    return text.split(start)?.pop()?.split(end)[0] || ''
}
