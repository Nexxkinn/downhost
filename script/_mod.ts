import * as hnx from './hnx.ts';
import * as chk from './chk.ts';
import * as exh from './exh.ts';
import * as nhn from './nhn.ts';
import { de } from './_deps.ts';

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