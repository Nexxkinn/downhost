type QueryIdFilterParams = {
    offset: number,
    id_query_filter: string
 }

export function query_id_filter( { head=0, tail=0 }): QueryIdFilterParams  {
    if      ( head > 0 && tail == 0) { // check for new gallery list
        return { offset: head, id_query_filter: 'AND id > :offset'};
    }
    else if ( head == 0 && tail > 0) { // fetch more galleries
        return { offset: tail, id_query_filter: 'AND id < :offset'};
    }
    else {
        return { offset: 0, id_query_filter: ''}
    } 
}
 