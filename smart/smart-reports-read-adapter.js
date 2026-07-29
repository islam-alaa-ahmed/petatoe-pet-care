/* PETATOE v10.0.25 SR5.4 — Optional Smart Reports committed-data read adapter.
 * This adapter is read-only and non-blocking. It never fetches, commits, mutates,
 * normalizes or renders data. Smart Reports calculations remain untouched.
 */
(function(){
  'use strict';
  if(window.PETATOESmartReportsReadAdapter&&window.PETATOESmartReportsReadAdapter.__ready) return;

  var snapshot=[];
  var revision='';
  var sequence=0;
  var capturedAt='';

  function clean(value){ return String(value==null?'':value).trim(); }
  function committedRows(){
    return Array.isArray(window.records)?window.records:[];
  }
  function capture(detail){
    var state=window.__PETATOE_SALES_REPORTS_COMMIT_STATE__||{};
    var nextRevision=clean(detail&&detail.revision||state.revision);
    var nextSequence=Number(detail&&detail.sequence||state.sequence||0);
    var rows=committedRows();
    if(nextRevision&&nextRevision===revision&&nextSequence===sequence&&snapshot.length===rows.length) return false;
    snapshot=rows.slice();
    revision=nextRevision;
    sequence=nextSequence;
    capturedAt=new Date().toISOString();
    return true;
  }
  function readRows(){
    var state=window.__PETATOE_SALES_REPORTS_COMMIT_STATE__||{};
    var stateRevision=clean(state.revision);
    var stateSequence=Number(state.sequence||0);
    if(stateRevision!==revision||stateSequence!==sequence||snapshot.length!==committedRows().length){
      capture(state);
    }
    return snapshot.slice();
  }
  function getStatus(){
    return Object.freeze({
      __ready:true,
      source:'canonical-committed-records',
      rows:snapshot.length,
      revision:revision,
      sequence:sequence,
      capturedAt:capturedAt
    });
  }

  var api=Object.freeze({
    __ready:true,
    readRows:readRows,
    getStatus:getStatus
  });
  window.PETATOESmartReportsReadAdapter=api;
  window.petatoeSmartReportsReadRows=function(){ return api.readRows(); };

  window.addEventListener('petatoe:sales-records-committed',function(event){
    capture(event&&event.detail||null);
  });
  capture(window.__PETATOE_SALES_REPORTS_COMMIT_STATE__||null);
})();
