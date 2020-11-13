export async function ensureDir(path:string) {
    try {
        const stat = await Deno.stat(path);
        if(stat.isFile) throw new Error("path is a file.");
    }
    catch (e) {
        if( e instanceof Deno.errors.NotFound) await Deno.mkdir(path);
        else throw e;
    }
}