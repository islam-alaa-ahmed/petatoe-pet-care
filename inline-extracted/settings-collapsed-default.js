(function(){
  'use strict';
  if(window.__PETATOE_V38141_SETTINGS_COLLAPSE__) return;
  window.__PETATOE_V38141_SETTINGS_COLLAPSE__=true;
  function qs(sel,root){return (root||document).querySelector(sel);}
  function closeSettingsDefault(){
    var nav=qs('#nav'); if(!nav) return;
    var group=qs('.pet-nav-group[data-group="settingsCenter"]',nav);
    if(!group) return;
    if(group.getAttribute('data-user-opened')==='1') return;
    group.classList.remove('open');
    var toggle=qs('.pet-nav-group-toggle',group);
    if(toggle) toggle.setAttribute('aria-expanded','false');
    var icon=qs('.pet-nav-group-toggle i',group);
    if(icon) icon.textContent='▶';
  }
  document.addEventListener('click',function(e){
    var toggle=e.target.closest && e.target.closest('.pet-nav-group[data-group="settingsCenter"] .pet-nav-group-toggle');
    if(toggle){
      var group=toggle.closest('.pet-nav-group');
      if(group) setTimeout(function(){ group.setAttribute('data-user-opened','1'); },0);
    }
  },true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',closeSettingsDefault); else closeSettingsDefault();
  setTimeout(closeSettingsDefault,250);
  setTimeout(closeSettingsDefault,900);
  setTimeout(closeSettingsDefault,1800);
})();