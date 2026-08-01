(function(){
  'use strict';
  if(window.PETATOEOperationsVehiclePolicy && window.PETATOEOperationsVehiclePolicy.__ready === true) return;

  function text(value){ return String(value == null ? '' : value).trim(); }
  function key(value){ return text(value).toLowerCase().replace(/\s+/g,' '); }
  function statusActive(value){
    var s=key(value || 'active');
    return !s || ['active','enabled','نشط','مفعل','مفعّل'].indexOf(s)>-1;
  }
  function add(out, seen, value){
    value=value&&typeof value==='object'?(value.name||value.vehicle||value.car||value.plate||value.code||value.id):value;
    value=text(value);
    var k=key(value);
    if(!k || seen[k]) return;
    seen[k]=true;
    out.push(value);
  }
  function unique(values){
    var out=[], seen=Object.create(null);
    (values||[]).forEach(function(value){ add(out,seen,value); });
    return out.sort(function(a,b){ return a.localeCompare(b,'ar',{numeric:true,sensitivity:'base'}); });
  }
  function setupActiveVehicles(){
    var rows=[];
    try{
      var setup=window.PETATOESetup;
      if(setup && typeof setup.getVehicles==='function') rows=setup.getVehicles()||[];
      else if(setup && typeof setup.masterData==='function') rows=((setup.masterData(false)||{}).cars)||[];
    }catch(_e){ rows=[]; }
    return unique((rows||[]).filter(function(row){ return !row || typeof row!=='object' || statusActive(row.status); }));
  }
  function operationsMaster(){
    try{
      var storage=window.PETATOEOperationsStorage;
      if(storage && typeof storage.readNormalizedMasterData==='function') return storage.readNormalizedMasterData()||{};
      if(storage && typeof storage.readMasterData==='function') return storage.readMasterData(null)||{};
    }catch(_e){}
    return {};
  }
  function operationsActiveVehicles(){
    var master=operationsMaster(), assignments=Array.isArray(master.vehicleAssignments)?master.vehicleAssignments:[];
    var enabled=assignments.filter(function(row){ return row && !row.disabled; }).map(function(row){ return row.vehicle; });
    if(enabled.length) return unique(enabled);
    return unique(master.vehicles||[]);
  }
  function fleetActiveVehicles(){
    var rows=[];
    try{
      var repo=window.PETATOERepositories && window.PETATOERepositories.Fleet;
      var fleet=repo && typeof repo.getSync==='function' ? (repo.getSync()||{}) : null;
      if(!fleet && window.PETATOEStorage && typeof window.PETATOEStorage.getJSON==='function') fleet=window.PETATOEStorage.getJSON('PETATOE_FLEET_MANAGEMENT_V1',{})||{};
      rows=fleet && Array.isArray(fleet.vehicles)?fleet.vehicles:[];
    }catch(_e){ rows=[]; }
    return unique(rows.filter(function(row){ return !row || typeof row!=='object' || statusActive(row.status); }));
  }
  function activeMasterVehicleNames(){
    var setup=setupActiveVehicles();
    if(setup.length) return setup;
    var operations=operationsActiveVehicles();
    if(operations.length) return operations;
    return fleetActiveVehicles();
  }
  function historicalVehicleNames(rows, options){
    options=options||{};
    var from=text(options.from), to=text(options.to);
    return unique((Array.isArray(rows)?rows:[]).filter(function(row){
      var d=text(row && (row.date||row.invoiceDate||row.invoice_date));
      return (!from || !d || d>=from) && (!to || !d || d<=to);
    }).map(function(row){ return row && (row.vehicle||row.van||row.car||row.vehicleName); }));
  }
  function currentVehicleNames(){ return activeMasterVehicleNames(); }
  function administrativeVehicleNames(){ return activeMasterVehicleNames(); }
  function filterCurrentRows(rows){
    rows=Array.isArray(rows)?rows:[];
    var active=currentVehicleNames(), allowed=Object.create(null);
    active.forEach(function(name){ allowed[key(name)]=true; });
    if(!active.length) return rows.slice();
    return rows.filter(function(row){
      var name=text(row && (row.vehicle||row.van||row.car||row.vehicleName));
      return !name || !!allowed[key(name)];
    });
  }
  function isCurrentVehicleActive(value){
    var target=key(value);
    if(!target) return true;
    return currentVehicleNames().some(function(name){ return key(name)===target; });
  }

  window.PETATOEOperationsVehiclePolicy=Object.freeze({
    __ready:true,
    __owner:'operations/operations-vehicle-policy.js',
    version:'10.0.25-phase11-operations-vehicle-policy-contract-1',
    currentVehicleNames:currentVehicleNames,
    administrativeVehicleNames:administrativeVehicleNames,
    historicalVehicleNames:historicalVehicleNames,
    filterCurrentRows:filterCurrentRows,
    isCurrentVehicleActive:isCurrentVehicleActive,
    snapshot:function(){
      return {
        current:currentVehicleNames(),
        administrative:administrativeVehicleNames(),
        policy:{current:'active-master-only',historical:'document-dataset-by-period',administrative:'active-master-only'}
      };
    }
  });
})();
