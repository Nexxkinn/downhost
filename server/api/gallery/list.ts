import { DB } from "../_deps.ts";
import { APIError, Gallery } from "../_mod.ts";


type GalleryListParams = {
    db: DB,
    offset: number
    limit: number
}

// deno-lint-ignore require-await
export default async function handler({ db, offset, limit }: GalleryListParams){
    // TODO: Implement directory tagging system.
    try {
        const query_offset = offset > 0 ? 'AND id < :offset' : '';
        const query = db.query(`SELECT id,title FROM catalog WHERE status=3 ${query_offset} ORDER BY id DESC LIMIT :limit`, { offset, limit });
        const list: Gallery[] = [];
        for( const [id,title] of query ) list.push({id,title} as Gallery);
        return list;
    }
    catch (e) {
        return { status: false, message: e.message } as APIError;
    }
}