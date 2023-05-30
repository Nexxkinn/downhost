import type { GalleryListParams } from "../_deps.ts";
import type { APIError, Gallery } from "../_mod.ts";
import { query_id_filter } from "../utils.ts";

type QueryParams = {
    limit: number,
    offset?: number
}

// deno-lint-ignore require-await
export async function list({ db, head, tail, limit }: GalleryListParams){
    // TODO: Implement directory tagging system.
    try {

        const { offset, id_query_filter } = query_id_filter({head,tail})
        
        const query_params : QueryParams = { limit };
        if ( offset > 0 ) query_params.offset = offset;

        const query = db.prepareQuery(`
            SELECT  id,
                    title
            FROM    catalog
            WHERE   status=3 
                    ${id_query_filter} 
            ORDER BY id DESC 
            LIMIT :limit
            `);

        const all_galleries = query.all(query_params);
        const list: Gallery[] = [];
        for( const [id,title] of all_galleries ) list.push({id,title} as Gallery);
        return list;
    }
    catch (e) {
        return { status: false, message: e.message } as APIError;
    }
}