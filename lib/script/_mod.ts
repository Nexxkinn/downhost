import * as chk from './chk.ts';
import * as exh from './exh.ts';
import * as nhn from './nhn.ts';
import * as hml from './hml.ts';
import { de, en, DownMeta } from './_deps.ts';

// TODO: fix these redudancies.
// deno-lint-ignore no-explicit-any
const srvc:any = {
    chk,
    exh,
    nhn,
    hml
}

const dict:{ [key: string]: string } = {
    'rlf641xlh1d6fnstkkfa43szby...':'bkyo6',
    'be4of1srrdf6asqzrtqf...':'be4of',
    'k1you3qybhya43qhrf...':'k1yo4',
    'kly9v33kkg9onnv...':'kl66n'
}

const service = (key:string) => srvc?.[de(dict?.[key])];

export async function resolve(link: URL,offset?:number): Promise<DownMeta> {
    const hostname = en(link.hostname);
    const srvc = service(hostname);
    if (!srvc) throw new Error(`Unable to resolve: ${link.href}`);
    const metadata: DownMeta = await srvc.metadata({link:link.href,offset});
    // console.log(metadata);
    return metadata;
}

export async function extService(link:string) {
    const w = await import(new URL('https://www.google.com/test.ts').href);
}