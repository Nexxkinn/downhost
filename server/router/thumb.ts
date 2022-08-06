import { DB, join } from "./_deps.ts";

export default async function handler (id:number,temp_dir:string,db:DB){
    const query = db.query('SELECT hash FROM catalog WHERE id = ? LIMIT 1',[id]);
    const [[hash]] = Array.from(query);
    return  await Deno.readFile(join(temp_dir,'thumb',hash));
}