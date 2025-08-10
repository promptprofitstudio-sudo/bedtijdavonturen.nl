
(function(){
  try{
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    ['utm_source','utm_medium','utm_campaign','ref'].forEach(k=>{
      const v = params.get(k);
      if(v){ localStorage.setItem(k, v); }
    });
    const obs = new MutationObserver(()=>{
      const ifr = document.querySelector('iframe[src*="mailerlite"]');
      if(ifr && !ifr.dataset.utmAttached){
        try{
          const u = new URL(ifr.src);
          ['utm_source','utm_medium','utm_campaign','ref'].forEach(k=>{
            const val = localStorage.getItem(k);
            if(val){ u.searchParams.set(k, val); }
          });
          ifr.src = u.toString();
          ifr.dataset.utmAttached = "1";
        }catch(e){}
      }
    });
    obs.observe(document.documentElement,{subtree:true,childList:true});
  }catch(e){}
})();
