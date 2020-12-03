import * as hnx from './hnx.ts';
import * as chk from './chk.ts';
import * as exh from './exh.ts';
import * as nhn from './nhn.ts';
import { de, en, DownMeta } from './_deps.ts';

// TODO: fix these redudancies.
const srvc:any = { 
    hnx, 
    chk,
    exh,
    nhn
}

const dict:{ [key: string]: string } = {
    'kla642xlkh9ou0xerb9oo33k...':'kl9jf',
    'rlf641xlh1d6fnstkkfa43szby...':'bkyo6',
    'be4of1srrdf6asqzrtqf...':'be4of',
    'k1you3qybhya43qhrf...':'k1yo4'
}

export const service = (key:string) => srvc?.[de(dict?.[key])];

export async function resolve(link: URL): Promise<DownMeta> {
    const hostname = en(link.hostname);
    const srvc = service(hostname);
    if (!srvc) throw new Error(`Unable to resolve: ${link.href}`);
    const metadata: DownMeta = await srvc.metadata(link.href);
    // console.log(metadata);
    return metadata;
}