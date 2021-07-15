import { join } from "https://deno.land/std@0.99.0/path/mod.ts";
import { encode } from "https://deno.land/std/encoding/base64.ts";

async function scanClientDir() {
    let client:any = {};
    const scan = async (dirpath:string) => {
        for await ( const entry of Deno.readDir(dirpath) ) {
            if(entry.isDirectory) await scan(join(dirpath,entry.name));
            else {
                const path = join(dirpath,entry.name).replaceAll('\\','/');
                const compiled = await compileFile(path);
                client[path] = compiled;
            }
        }

    }
    Deno.chdir('webui')
    await scan('./');
    Deno.chdir('../');
    
    const client_encoded = new TextEncoder().encode("export const webui:{[key: string]: string} = " + JSON.stringify(client) + ";");
    await Deno.writeFile("lib/webui.ts",client_encoded);
}

async function compileFile(path:string){
    const file = await Deno.readFile(path);
    return encode(file);
}

await scanClientDir();