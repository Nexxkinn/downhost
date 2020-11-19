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

export async function ensureFile(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      // successful, file or directory must exist
      return true;
    } catch (error) {
      if (error && error.kind === Deno.errors.NotFound) {
        // file or directory does not exist
        return false;
      } else {
        // unexpected error, maybe permissions, pass it along
        throw error;
      }
    }
  };