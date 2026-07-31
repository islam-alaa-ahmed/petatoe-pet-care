/* PETATOE v10.0.25 SG-4.6.1 - Tables Core Compatibility Bridge
   Preserve the renderer-owned PETATOETables namespace while adding the legacy
   show-more state helper. Do not replace renderer methods during reportsUI lazy hydration. */
(function(){
  'use strict';
  var Tables = window.PETATOETables = window.PETATOETables || {};
  if(Tables.__v310 && typeof Tables.showMoreState === 'function') return;

  function showMoreState(key, step){
    var k='pet_table_limit_'+String(key||'default');
    var S=window.PETATOEStorage;
    var n=Number((S&&S.get?S.get(k,''):'')||step||10);
    return {
      value:n,
      more:function(){n+=Number(step||10);if(S&&S.set)S.set(k,n);return n;},
      reset:function(){n=Number(step||10);if(S&&S.remove)S.remove(k);return n;}
    };
  }

  Tables.__v310 = true;
  Tables.showMoreState = Tables.showMoreState || showMoreState;
})();
