let count = 0;
const isdebug = Deno.args.find( (v) => v === '--verbose');
export function log(text:string){
    if(!isdebug) return;
    console.log(`[${count +=1}] ${text}`);
}