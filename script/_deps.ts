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
     * service name
     */
    srvc: string,
    /**
     * Gallery title.
     * Will also be used for filename
     */
    title:string,
    /**
     * Thumbnail request link
     */
    thumbnail: DownRequest,
    /**
     * link to download the compressed file or image files
     */
    download: DownRequest | DownPagesRequest,
    /**
     * Unique identifier given by the service.
     */
    uid: string
}

export type DownRequest = {
    input: Request | URL | string,
    init: RequestInit | undefined,
}

export type PageRequest = DownRequest & {
    filename: string
}

export type DownPagesRequest = {
    gallery_size:number;
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
