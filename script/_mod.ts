import * as hnx from './hnx.ts';
import * as chk from './chk.ts';
import { de } from './_deps.ts';

// TODO: fix these redudancies.
const srvc:any = { 
    hnx, 
    chk
}

const dict:{ [key: string]: string } = {
    'kla642xlkh9ou0xerb9oo33k...':'kl9jf',
    'rlf641xlh1d6fnstkkfa43szby...':'bkyo6',
}

export const service = (key:string) => srvc?.[de(dict?.[key])]; 