/* PETATOE v3.10.1 - Filters Events
   Delegated event bridge for report filters. Inline onchange handlers continue working; adapters can opt-in only where needed. */
(function(){
  'use strict';
  if(window.PETATOEFiltersEvents && window.PETATOEFiltersEvents.__v3101) return;
  var rules = [];
  var timers = {};
  function debounce(key, fn, ms){ clearTimeout(timers[key]); timers[key]=setTimeout(fn, ms||180); }
  function isField(el){ return el && /^(SELECT|INPUT|TEXTAREA)$/.test(el.tagName||''); }
  function rootMatch(el, root){ if(!root) return true; try{return !!(el.closest && el.closest(root));}catch(e){return false;} }
  function matches(el, rule, type){
    if(!rule) return false;
    if(rule.event && rule.event !== type) return false;
    if(rule.root && !rootMatch(el, rule.root)) return false;
    if(rule.ids && rule.ids.length && rule.ids.indexOf(el.id) === -1) return false;
    if(rule.selector){ try{ if(!el.matches(rule.selector)) return false; }catch(e){ return false; } }
    return true;
  }
  function dispatch(e){
    var el = e.target;
    if(!isField(el)) return;
    if(window.PETATOEFiltersState && el.id){
      var scope = el.closest && el.closest('[data-filter-scope]');
      window.PETATOEFiltersState.write(el.id, el.value, scope ? scope.getAttribute('data-filter-scope') : 'global');
    }
    for(var i=rules.length-1;i>=0;i--){
      var r=rules[i];
      if(!matches(el,r,e.type)) continue;
      if(r.exclusive){ try{ e.stopImmediatePropagation(); e.preventDefault(); }catch(x){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-events.js",x);} }
      try{ r.handler(el,e); }catch(err){ console.error('PETATOEFiltersEvents handler error', err); }
      if(r.once) rules.splice(i,1);
      if(r.exclusive) break;
    }
  }
  function register(rule){ if(rule) rules.push(rule); return rule; }
  function bootNormalize(){
    try{ if(window.PETATOEFiltersRender){ window.PETATOEFiltersRender.normalize(document); window.PETATOEFiltersRender.restoreHorizontalBars(document); } }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-events.js",e);}
  }
  document.addEventListener('change', dispatch, true);
  document.addEventListener('input', dispatch, true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootNormalize); else bootNormalize();
  try{
    // PETATOE v6.1.65: filters-render.js already owns the DOM MutationObserver
    // for select enhancement. Avoid a second subtree observer that repeats the same
    // normalization work during screen switches and Smart Reports re-renders.
    if(!window.PETATOEFiltersRender){
      var mo = new MutationObserver(function(){ debounce('__normalize__', bootNormalize, 80); });
      if(document.body) mo.observe(document.body,{childList:true,subtree:true});
      else document.addEventListener('DOMContentLoaded', function(){ try{mo.observe(document.body,{childList:true,subtree:true});}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-events.js",e);} });
    }
  }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-events.js",e);}
  window.PETATOEFiltersEvents = {__v3101:true, register:register, debounce:debounce, normalize:bootNormalize};
})();
