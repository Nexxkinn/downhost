// deno-lint-ignore-file
import { get_entries } from "./_deps.ts";
import { natsort } from "./_mod.ts";

export async function getFilenames(path:string) {
    const file = await Deno.open(path,{read:true});
    let filenames:string[] = new Array();

    for( const { filename } of await get_entries(file)) {
        filenames.push(filename);
    }
    file.close();
    return filenames.sort(natsort({ insensitive: true }));
}