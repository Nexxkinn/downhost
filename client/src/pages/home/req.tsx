export const req = async ({ api, body = {} }) => {
    const res = await fetch(`${document.baseURI}api/${api}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(body)
        })
    return await res.json();
}
