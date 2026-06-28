/* PETATOE v3.10.1 - Filters State
   Single lightweight store for UI filter values. It does not replace report logic; it only keeps values stable across re-render. */
(function(){
  'use strict';
  if(window.PETATOEFiltersState && window.PETATOEFiltersState.__v3101) return;
  var store = {};
  function key(scope, id){ return String(scope||'global') + ':' + String(id||''); }
  function read(id, scope){ return store[key(scope,id)]; }
  function write(id, value, scope){ store[key(scope,id)] = value == null ? '' : String(value); return store[key(scope,id)]; }
  function snapshot(scope){
    var prefix = String(scope||'global') + ':';
    var out = {};
    Object.keys(store).forEach(function(k){ if(k.indexOf(prefix)===0) out[k.slice(prefix.length)] = store[k]; });
    return out;
  }
  function hydrate(scope, root){
    try{
      (root||document).querySelectorAll('select,input,textarea').forEach(function(el){
        if(!el.id) return;
        var v = read(el.id, scope);
        if(v !== undefined && el.value !== v) el.value = v;
      });
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-state.js",e);}
  }
  window.PETATOEFiltersState = {__v3101:true, read:read, write:write, snapshot:snapshot, hydrate:hydrate};
})();
