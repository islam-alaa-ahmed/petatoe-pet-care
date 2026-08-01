/* PETATOE Phase 2 — Canonical records read facade.
 * Read-only facade. Business calculations remain unchanged.
 * PETATOEDataSource remains the sole owner of the mutable runtime cache.
 */
(function(w){
  'use strict';
  if(w.PETATOERecordsReadFacade && w.PETATOERecordsReadFacade.__ready) return;
  var reads=0;
  function source(){
    var ds=w.PETATOEDataSource;
    if(!ds || typeof ds.getRecordsSync!=='function') return [];
    var rows=ds.getRecordsSync();
    return Array.isArray(rows)?rows:[];
  }
  function readRows(){ reads++; return source().slice(); }
  function readRowsUnsafe(){ reads++; return source(); }
  function revision(){
    var state=w.__PETATOE_SALES_REPORTS_COMMIT_STATE__||{};
    return {revision:String(state.revision||''),sequence:Number(state.sequence||0),rows:source().length};
  }
  function status(){
    var rev=revision();
    return Object.freeze({__ready:true,owner:'data/records-read-facade.js',source:'PETATOEDataSource',reads:reads,rows:rev.rows,revision:rev.revision,sequence:rev.sequence});
  }
  w.PETATOERecordsReadFacade=Object.freeze({__ready:true,readRows:readRows,readRowsUnsafe:readRowsUnsafe,getRevision:revision,getStatus:status});
})(window);
