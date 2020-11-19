import { DB } from './_deps.ts';

export default async function handler({id,db}:{id:number, db: DB}):Promise<Uint8Array>{
    const query = db.query('SELECT hash FROM catalog WHERE hash = ? LIMIT 1',[id]);
    const [hash] = query;

    throw new Error('not yet implemented');
}