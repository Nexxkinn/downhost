window.onload = async () => {
    const g_size = len, g_id = g;

    for(let i=1; i <= g_size; i++) {
        const img = document.createElement('img');
        img.src = '/image/'+g_id+'/'+i;
        img.loading = 'lazy';
        img.width = '800';
        document.body.append(img);
    }
};