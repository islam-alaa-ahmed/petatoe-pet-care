/* PETATOE v3.9.1 — Repository layer over PETATOEStorage.
   Non-breaking preparation layer. Existing screens can migrate gradually. */
(function(window){
  'use strict';
  // PETATOE v6.1.70 Phase 4-A: Repository layer is a singleton over PETATOEStorage.
  if(window.PETATOERepositories && window.PETATOERepositories.__ready){ return; }
  var S=window.PETATOEStorage;
  if(!S){console.warn('PETATOERepositories: PETATOEStorage not loaded');return;}

  function arrayRepo(name){
    return {
      key:S.key(name),
      table:S.tableFor(name),
      all:function(){var a=S.readJSON(name,[]);return Array.isArray(a)?a:[];},
      saveAll:function(rows){return S.writeJSON(name,Array.isArray(rows)?rows:[]);},
      allAsync:function(){return S.apiReadJSON(name,[]).then(function(a){return Array.isArray(a)?a:[];});},
      saveAllAsync:function(rows){return S.apiWriteJSON(name,Array.isArray(rows)?rows:[]);},
      findById:function(id){return this.all().find(function(x){return String(x&&x.id)===String(id);})||null;},
      upsert:function(row){
        var rows=this.all();
        var id=row&&row.id;
        var done=false;
        rows=rows.map(function(x){if(String(x&&x.id)===String(id)){done=true;return Object.assign({},x,row);}return x;});
        if(!done)rows.push(row);
        this.saveAll(rows);
        return row;
      },
      remove:function(id){var rows=this.all().filter(function(x){return String(x&&x.id)!==String(id);});this.saveAll(rows);return rows;}
    };
  }
  function objectRepo(name){
    return {
      key:S.key(name),
      table:S.tableFor(name),
      get:function(){var v=S.readJSON(name,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{};},
      save:function(obj){return S.writeJSON(name,obj&&typeof obj==='object'?obj:{});},
      getAsync:function(){return S.apiReadJSON(name,{}).then(function(v){return v&&typeof v==='object'&&!Array.isArray(v)?v:{}});},
      saveAsync:function(obj){return S.apiWriteJSON(name,obj&&typeof obj==='object'?obj:{});},
      patch:function(partial){var cur=this.get();Object.assign(cur,partial||{});this.save(cur);return cur;}
    };
  }

  window.PETATOERepositories={
    version:'3.9.1',
    Users:arrayRepo('users'),
    SalesRecords:arrayRepo('records'),
    AuditLogs:arrayRepo('auditLog'),
    TreasuryTransactions:arrayRepo('treasuryTransactions'),
    WarehouseItems:arrayRepo('warehouseItems'),
    WarehouseTransactions:arrayRepo('warehouseTransactions'),
    UserPermissions:objectRepo('userCrudPermissions'),
    RoleMatrix:objectRepo('roleMatrix'),
    Settings:objectRepo('settings'),
    MonthlyTargets:objectRepo('monthlyTargets'),
    Fleet:objectRepo('fleet'),
    Commissions:objectRepo('commissions'),
    CommissionSnapshots:objectRepo('commissionSnapshots'),
    raw:function(){return S;},
    __ready:true
  };
})(window);
