import { DB } from "./_deps.ts";

export default async function handler({ id, db }: { id:number, db: DB }){
    db.query("DELETE FROM catalog WHERE id=?", [id]);
    return JSON.stringify({ status:true });
    
}