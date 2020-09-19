import { DB } from "../deps.ts";
export { de } from '../lib/_mod.ts';

export type Meta = {
    type:DownType,
    service:string,
    title:string,
    url: URL,
    uid: string
}

export type Download = {
    path: string,
    meta:Meta,
}

export enum DownType {
    BULK="Bulk",
    PAGES="Pages"
}

export const grab = (start:string,end:string,text:string) => {
    return text.split(start)?.pop()?.split(end)[0] || ''
}
