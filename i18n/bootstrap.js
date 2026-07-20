/* PETATOE v9 i18n First-Paint Bootstrap
   Applies the persisted locale before CSS/layout paint and coordinates a deterministic reveal. */
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
  var startedAt=(window.performance&&performance.now)?performance.now():Date.now();
  root.setAttribute('lang',lang);
  root.setAttribute('dir',dir);
  root.setAttribute('data-layout-dir',dir);
  root.setAttribute('data-pet-i18n-booting','true');
  root.setAttribute('data-pet-i18n-nav-ready','false');
  root.setAttribute('data-pet-i18n-initial-language',lang);
  root.classList.toggle('pet-layout-rtl',dir==='rtl');
  root.classList.toggle('pet-layout-ltr',dir==='ltr');
  window.__PETATOE_INITIAL_LANGUAGE__=lang;

  var emergencyTimer=0;
  var coordinator={
    language:lang,
    startedAt:startedAt,
    revealed:false,
    reveal:function(reason,failed){
      if(this.revealed)return false;
      this.revealed=true;
      if(emergencyTimer){clearTimeout(emergencyTimer);emergencyTimer=0;}
      root.removeAttribute('data-pet-i18n-booting');
      root.setAttribute('data-pet-i18n-ready',failed?'degraded':'true');
      root.setAttribute('data-pet-i18n-reveal-reason',String(reason||'ready'));
      if(failed)root.setAttribute('data-pet-i18n-boot-failed','true');
      var endedAt=(window.performance&&performance.now)?performance.now():Date.now();
      root.setAttribute('data-pet-i18n-boot-ms',String(Math.max(0,Math.round(endedAt-startedAt))));
      try{window.dispatchEvent(new CustomEvent('petatoe:i18n-first-paint-ready',{detail:{language:lang,reason:reason||'ready',degraded:!!failed,durationMs:Math.max(0,endedAt-startedAt)}}));}catch(_){}
      return true;
    }
  };
  window.PETATOE_I18N_BOOT=coordinator;

  function armEmergencyReveal(){
    if(emergencyTimer||coordinator.revealed)return;
    emergencyTimer=setTimeout(function(){
      coordinator.reveal('emergency-timeout',true);
    },8000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',armEmergencyReveal,{once:true});
  else armEmergencyReveal();
})();
