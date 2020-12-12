document.addEventListener("DOMContentLoaded", init);

async function init (){
    const g_size = len, g_id = g, g_list = list;

    let options = {
        threshold: 0.5
      }

    let observer = new IntersectionObserver((entries,observer) => {
        for(const entry of entries){
            if(entry.isIntersecting){
                observer.disconnect();
                append();
            }
        }
    }, options);

    let i = 0;
    const append = () => {
        if( i >= g_size ) return;
        const img = document.createElement('img');
        img.src = '/image/'+g_id+'/'+g_list[i];
        img.onload = () => { img.style = 'min-height:unset;' }
        observer.observe(img);
        document.body.append(img);
        i++;
    }

    append();
};