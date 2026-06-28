(function(){
  'use strict';
  if(window.__PETATOE_V38131_SETTINGS_MENU_DEDUPE__) return;
  window.__PETATOE_V38131_SETTINGS_MENU_DEDUPE__=true;
  function petBlock7847_q(s,r){return (r||document).querySelector(s)}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function cleanSettingsDuplicates(){
    var nav=petBlock7847_q('#nav')||petBlock7847_q('.nav'); if(!nav) return;

    // Prefer the approved restored v130 group. Remove/hide any older injected settings groups.
    var approved=petBlock7847_q('.pet-v130-group[data-group="settings"]',nav);
    var allSettings=qa('.pet-v130-group[data-group="settings"], .pet-v127-group[data-group="settings"], .pet-nav-group[data-group="settingsCenter"], .pet-nav-group[data-group="system"]',nav);
    if(!approved){
      // fallback: pick the group that has the largest number of settings sub buttons.
      approved=allSettings.slice().sort(function(a,b){return qa('button',b).length-qa('button',a).length})[0]||null;
    }
    allSettings.forEach(function(g){
      if(g!==approved && g.parentNode){g.parentNode.removeChild(g)}
    });

    // Remove duplicate visible groups that have the same settings label text.
    var seenSettings=false;
    qa(':scope > div',nav).forEach(function(g){
      var t=(g.textContent||'').replace(/\s+/g,' ').trim();
      if(t.indexOf('الإعدادات والصلاحيات')>-1){
        if(!seenSettings){seenSettings=true;}
        else if(g.parentNode){g.parentNode.removeChild(g)}
      }
    });

    // Remove orphan old direct settings button if any old builder appended it.
    qa(':scope > button',nav).forEach(function(b){
      var t=(b.textContent||'').replace(/\s+/g,' ').trim();
      var tab=b.getAttribute('data-tab')||'';
      if(tab==='settings' && t.indexOf('الإعدادات')>-1 && !b.classList.contains('pet-v130-direct')) b.remove();
    });
  }
  function run(){
    cleanSettingsDuplicates();
    setTimeout(cleanSettingsDuplicates,60);
    setTimeout(cleanSettingsDuplicates,240);
    setTimeout(cleanSettingsDuplicates,900);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run); else run();
  window.addEventListener('load',run);
  // If an older nav script redraws the sidebar later, clean it immediately.
  var target=document.getElementById('nav')||document.querySelector('.nav');
  if(target && window.MutationObserver){
    var busy=false;
    new MutationObserver(function(){
      if(busy) return;
      busy=true;
      setTimeout(function(){cleanSettingsDuplicates(); busy=false;},30);
    }).observe(target,{childList:true,subtree:false});
  }
})();