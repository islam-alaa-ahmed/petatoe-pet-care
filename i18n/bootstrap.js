/* PETATOE v9 i18n First-Paint Bootstrap
   Applies the persisted locale before CSS/layout paint to prevent Arabic/English FOUC. */
(function(){
  'use strict';
  var STORAGE_KEY='petatoe.ui.language';
  var supported={ar:true,en:true};
  var lang='ar';
  try{
    var saved=String(localStorage.getItem(STORAGE_KEY)||'').toLowerCase();
    if(supported[saved]) lang=saved;
  }catch(_){}
  var dir=lang==='ar'?'rtl':'ltr';
  var root=document.documentElement;
  root.setAttribute('lang',lang);
  root.setAttribute('dir',dir);
  root.setAttribute('data-layout-dir',dir);
  root.setAttribute('data-pet-i18n-booting','true');
  root.setAttribute('data-pet-i18n-nav-ready','false');
  root.classList.toggle('pet-layout-rtl',dir==='rtl');
  root.classList.toggle('pet-layout-ltr',dir==='ltr');
  window.__PETATOE_INITIAL_LANGUAGE__=lang;
  window.__PETATOE_I18N_BOOT_FAILSAFE__=setTimeout(function(){
    root.removeAttribute('data-pet-i18n-booting');
  },5000);
})();
