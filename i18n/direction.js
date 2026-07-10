/* PETATOE v9 Enterprise Direction Engine
   Controls document direction and layout direction only. No business or data logic. */
(function(){
  'use strict';
  var RTL_LANGS={ar:true,fa:true,he:true,ur:true};
  function normalizeLanguage(language){return String(language||'ar').toLowerCase().split('-')[0];}
  function directionFor(language){return RTL_LANGS[normalizeLanguage(language)]?'rtl':'ltr';}
  function apply(language,options){
    options=options||{};
    var lang=normalizeLanguage(language),dir=directionFor(lang),root=document.documentElement;
    root.setAttribute('lang',lang);root.setAttribute('dir',dir);root.setAttribute('data-layout-dir',dir);
    root.classList.toggle('pet-layout-rtl',dir==='rtl');root.classList.toggle('pet-layout-ltr',dir==='ltr');
    if(document.body){document.body.setAttribute('dir',dir);document.body.setAttribute('data-layout-dir',dir);document.body.setAttribute('data-petatoe-lang',lang);}
    document.querySelectorAll('[data-directional-icon]').forEach(function(el){el.classList.toggle('pet-directional-mirrored',dir==='ltr');});
    if(!options.silent) window.dispatchEvent(new CustomEvent('petatoe:direction-changed',{detail:{language:lang,direction:dir}}));
    return dir;
  }
  window.PETATOE_DIRECTION={apply:apply,getDirection:function(){return document.documentElement.getAttribute('dir')||'rtl';},directionFor:directionFor,isRtl:function(){return (document.documentElement.getAttribute('dir')||'rtl')==='rtl';}};
})();
