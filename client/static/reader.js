window.onload = async () => {
    const g_size = len, g_id = g, g_list = list;

    for(let i=0; i < g_size; i++) {
        const img = document.createElement('img');
        img.src = '/image/'+g_id+'/'+g_list[i];
        img.loading = 'lazy';
        img.width = '800';
        document.body.append(img);
    }
};