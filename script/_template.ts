import { de, grab, DownMeta, DownRequest, DownType, DownPagesRequest } from "./_deps.ts";

const token = de("");
const srvc  = de("");

export async function download(meta:DownMeta):Promise< DownRequest | DownPagesRequest> {
    throw new Error('template')
}

export async function metadata(link: string):Promise<DownMeta> {
    throw new Error('template')
}



