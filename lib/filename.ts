import { log } from "./_mod.ts";

export function filename(srvc: string, uid: string, title: string) {
    const header = `[${srvc}][${uid}]`;
    let name = '';
    let step = 0;
    do {
        switch (step) {
            case 0: { // remove unicode escape strings
                name = title.replace(/&(?:\#(?:(?<dec>[0-9]+)|[Xx](?<hex>[0-9A-Fa-f]+))|(?<named>[A-Za-z0-9]+));/g, '');
                step++;
                break;
            }
            case 1: { // remove second or alt title
                name = name.split('|')[0];
                step++;
                break;
            }
            case 2: { // limit to first 180 letters only.
                name = name.slice(0, 180);
                step++;
                break;
            }
            case 3: { // retain title only
                name = name.replace(/[\[\{](.*?)[\}\]]/g, '');
                step++;
                break;
            }
            default: { // last chance. header only.
                name = '';
                break;
            }
        }
    }
    while (header.length + name.length + 4 > 200)
    name = name.replace(/[!?]/g,'');
    name = name.replace(/[/\\%*:|"<>]/g, '-');
    name = name.replace(/\s*[\-]\s*/g,'-');
    const filename = header + name + '.zip';
    log(JSON.stringify({filename,length:filename.length}));
    return filename;
}