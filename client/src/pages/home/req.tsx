
type APIMethod = 'POST' | 'PATCH' | 'DELETE'

type reqParams = {
    api: string,
    method?: APIMethod,
    body?: any
}

export const req = async ({ api, method = 'POST', body = null }:reqParams) => {
    const res = await fetch(`${document.baseURI}api/${api}`,
        {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body)
        })
    return await res.json();
}
