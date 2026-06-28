/* PETATOE v3.10.5 — Theme Engine Core */
(function(window, document){
  'use strict';
  var STORAGE_KEY = 'petatoe_theme';
  var VALID = { dark:true, light:true };
  function normalize(theme){ return VALID[theme] ? theme : 'dark'; }
  function readStored(){
    try { var S=window.PETATOEStorage; return normalize((S&&S.get?S.get(STORAGE_KEY,''): '') || document.documentElement.getAttribute('data-theme') || 'dark'); }
    catch(e){ return normalize(document.documentElement.getAttribute('data-theme') || 'dark'); }
  }
  function writeStored(theme){ try { var S=window.PETATOEStorage; if(S&&S.set)S.set(STORAGE_KEY, normalize(theme)); } catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/theme/theme-engine.js",e);} }
  function apply(theme, opts){
    theme = normalize(theme);
    opts = opts || {};
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    if(document.body){
      document.body.setAttribute('data-theme', theme);
      document.body.classList.toggle('theme-dark', theme === 'dark');
      document.body.classList.toggle('theme-light', theme === 'light');
    }
    if(!opts.silent){ writeStored(theme); }
    try { window.dispatchEvent(new CustomEvent('petatoe:theme-change', { detail:{ theme:theme } })); } catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/theme/theme-engine.js",e);}
    return theme;
  }
  function current(){ return normalize(document.documentElement.getAttribute('data-theme') || readStored()); }
  function toggle(){ return apply(current()==='dark' ? 'light' : 'dark'); }
  function init(){ apply(readStored(), {silent:true}); }
  Object.assign(window.PETATOETheme, { init:init, apply:apply, set:apply, current:current, toggle:toggle, normalize:normalize, storageKey:STORAGE_KEY });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window, document);
