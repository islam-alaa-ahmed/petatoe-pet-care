/* PETATOE v3.8.153 - Real Audit Split
   Audit Trail module extracted from settings.js.
   Keeps audit storage, rendering and export/clear actions isolated under window.PETATOEAudit. */
(function(){
  'use strict';

  var AUDIT_KEY = 'petatoe_logs_v2';
  var CURRENT_KEY = 'petatoe_current_user_v108';
  var USERS_KEY = 'petatoe_users_v108';

  function esc(s){
    return String(s==null?'':s).replace(/[&<>'\"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c];
    });
  }

  function ID(){return window.PETATOEIdentityStore||null}
  function read(k,d){var ids=ID(); if(k===USERS_KEY&&ids&&ids.usersSync)return ids.usersSync(); return d;}

  function write(k,v){var ids=ID(); if(k===AUDIT_KEY&&Array.isArray(v)&&ids&&ids.appendAudit){if(v[0])ids.appendAudit(v[0]);}}

  function users(){
    var u=read(USERS_KEY,[]);
    return Array.isArray(u)?u:[];
  }

  function currentUser(){
    var list=users();
    var id=String(window.PETATOE_CURRENT_USER_REF||'');
    if(!id)return {id:'',username:'Guest',fullName:'Guest',role:'guest'};
    return list.find(function(u){return u.id===id;})||{id:id,username:id,fullName:id,role:'unknown'};
  }

  function recordsCount(){
    try{
      var fb=(window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync)?window.PETATOEDataSource.getRecordsSync():[];
      return Array.isArray(fb)?fb.length:0;
    }catch(e){return 0;}
  }

  function getLogs(){
    var ids=ID(); var logs=ids&&ids._cache&&Array.isArray(ids._cache.audit)?ids._cache.audit:[];
    return Array.isArray(logs)?logs:[];
  }

  function log(action,details,level){
    var u=currentUser();
    var arr=getLogs();
    arr.unshift({
      time:new Date().toISOString(),
      user:u.username||u.fullName||'Guest',
      role:u.role||'guest',
      action:action||'-',
      details:details||'',
      level:level||'info',
      count:recordsCount()
    });
    write(AUDIT_KEY,arr.slice(0,700));
  }

  function clearLogs(){
    var ids=ID(); if(ids&&ids._cache)ids._cache.audit=[];
    log('Audit Trail Reset','Audit log cleared','warn');
  }

  function download(data,name){
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
    var a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
  }

  function exportLogs(){
    download({type:'PETATOE_AUDIT_TRAIL',createdAt:new Date().toISOString(),audit:getLogs()},'PETATOE_audit_trail.json');
  }

  function renderAuditBody(){
    var logRows=getLogs().slice(0,200).map(function(x){
      return '<tr><td>'+esc(new Date(x.time).toLocaleString('ar-EG'))+'</td><td>'+esc(x.user||x.role||'Admin')+'</td><td>'+esc(x.action||'-')+'</td><td>'+esc(x.details||'')+'</td></tr>';
    }).join('')||'<tr><td colspan="4">لا يوجد سجل نشاط</td></tr>';

    return '<div class="pet-v110-card pet-v110-audit-only"><h3>📄 السجل النظامي</h3><p>يعرض سجل النشاط فقط بدون إظهار العمليات الحساسة أو مصفوفة الأدوار والصلاحيات.</p><div class="pet-v110-actions"><button class="pet-v110-btn blue" data-v110-action="export-audit">تصدير السجل</button><button class="pet-v110-btn danger" data-v110-action="clear-audit">مسح السجل</button></div><div class="pet-v110-table"><table><thead><tr><th>التاريخ</th><th>المستخدم</th><th>العملية</th><th>التفاصيل</th></tr></thead><tbody>'+logRows+'</tbody></table></div></div>';
  }

  window.PETATOEAudit={
    AUDIT_KEY:AUDIT_KEY,
    log:log,
    getLogs:getLogs,
    clearLogs:clearLogs,
    exportLogs:exportLogs,
    renderAuditBody:renderAuditBody
  };

  // Phase 2: public audit buttons are owned by settings.js only.
})();
