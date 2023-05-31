import type { DB, SearchListParams } from '../_deps.ts';
import type { APIError, Gallery } from '../_mod.ts';
import { query_id_filter } from "../utils.ts";

type QueryParams = {
   limit: number,
   offset?: number
}

/**
    * wildcard keyword tag id search
    * @param list keywords excluding tags
    * @returns tag id for each keyword
    */
function get_id( db:DB, list: string[] ) {
   if (list.length === 0) return [];

   const tagid_list:string[] = [];
   const query = `
      SELECT GROUP_CONCAT(id) as tag_id
      FROM   tagrepo
      WHERE  tag LIKE ?`

   for (const kw of list) {
      for ( const [tag_id] of db.query<[string]>(query,['%'+kw+'%']) )
         tagid_list.push(tag_id);
   }
   return tagid_list;
}

async function _search(params: string[], head:number, tail:number, limit: number, db:DB) {

   // parse tag with name
   // add keyword into title and tag search
   // rank based on match
   // - tag match : +1
   // - title match : 1*match_percentage%
   // 
   // const { keywords } = parse(params);

   const keyword_id = get_id( db, params );

   /**
    * Item search
    * @param keyword_id list of keword tag ids
    * @returns id and title
    */
   const search = (keyword_id:string[]) => {
      let kw_query = '';
      for(const [i,id] of keyword_id.entries()) {
         kw_query += `SUM(tag_id IN (${id})) >= 1${i < keyword_id.length -1 ? ' AND\n' : ''}`
      }

      const { offset, id_query_filter } = query_id_filter({head,tail})

      const query_params : QueryParams = { limit };
      if ( offset > 0 ) query_params.offset = offset;

      const query  = db.query(`
         SELECT id,title 
         FROM   catalog
         WHERE  hash IN (
                  SELECT hash
                  FROM tag
                  GROUP BY hash
                  HAVING ${kw_query} )
         ${id_query_filter}
         ORDER by  id DESC
         LIMIT     :limit
      `, query_params)

      /**
       * // add filtering for a proper tag exists
          AND
         hash IN (
            FROM tag
            GROUP BY hash
            HAVING SUM(tag_id IN (14501,14577,15662)) >= 1 AND
                     SUM(tag_id IN (21866)) >=1
         )
      */

      const res : Gallery[] = []
      for(const [id,title] of query) res.push({id,title} as Gallery);
      return res;
   }

   const result  = search(keyword_id);
   return result;
}

function parse(query: string) {

   const keywords = query.split(" ");
   return { keywords };
   // layer of search
   // regex tag:value
   // regex quotes
   // 
}

export default async function handler({ query, head, tail, limit, db }: SearchListParams){
   try {
       const { keywords } = parse(query);
       const list = await _search(keywords, head, tail, limit, db);
       return list;
   }
   catch (e) {
       return { status: false, message: e.message } as APIError;
   }
}

