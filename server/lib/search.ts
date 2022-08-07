import { DB } from '../deps.ts';


export async function search(query: string, db:DB) {

   // parse tag with name
   // add keyword into title and tag search
   // rank based on match
   // - tag match : +1
   // - title match : 1*match_percentage%
   // 
   const { keywords } = parse(query);

   /**
    * wildcard keyword tag id search
    * @param list keywords excluding tags
    * @returns tag id for each keyword
    */
   const get_id = (list: string[]) => {
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

   const keyword_id = get_id(keywords);


   // proper tag id search
   /**
    * SELECT id
       FROM tagrepo
       WHERE ns||':'||tag in ("male:mind_control","male:dilf")
    */


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
      const query  = db.query(`
         SELECT id,title 
         FROM catalog
         WHERE 
         hash IN (
            SELECT hash
            FROM tag
            GROUP BY hash
            HAVING ${kw_query}
         )
      `)
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
      const res = []
      for(const [id,title] of query) res.push({id,title});
      return res;
   }


   const result = search(keyword_id);
   return result;
}

export async function tagsearch(tag: string) {

}

function parse(query: string) {

   const keywords = query.split(" ");
   return { keywords };
   // layer of search
   // regex tag:value
   // regex quotes
   // 
}