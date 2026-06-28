/* PETATOE v3.10.0 - Tables Core
   Utilities صغيرة للجداول، تمهيدًا لفصل كامل لاحقًا. */
(function(){
  'use strict';
  if(window.PETATOETables && window.PETATOETables.__v310) return;
  function showMoreState(key, step){
    var k='petatoe_table_show_more_'+key;
    var S=window.PETATOEStorage;var n=Number((S&&S.get?S.get(k,''): '')||step||10);
    return {value:n, more:function(){n+=Number(step||10);if(S&&S.set)S.set(k,String(n));return n;}, reset:function(){n=Number(step||10);if(S&&S.set)S.set(k,String(n));return n;}};
  }
  window.PETATOETables = {__v310:true, showMoreState:showMoreState};
})();
