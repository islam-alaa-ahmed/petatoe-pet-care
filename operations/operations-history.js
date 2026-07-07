(function(){
  'use strict';

  /**
   * PETATOE Operations History Internal API
   *
   * OPS-17: isolates session/status history helpers behind a dedicated
   * operations module while preserving the existing storage keys, UI,
   * public APIs, and business rules.
   */
  if(window.PETATOEOperationsHistory && window.PETATOEOperationsHistory.version === 'OPS-18-history-render-extraction') return;

  function storage(){ return window.PETATOEOperationsStorage || null; }
  function legacy(){ return window.__PETATOEAppointmentsLegacyEngine || null; }

  function esc(x){
    return String(x == null ? '' : x).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
    });
  }

  function money(n){
    n = Number(n || 0);
    return 'SAR ' + n.toLocaleString('en-US', {maximumFractionDigits: 0});
  }

  function appointments(){
    var api = storage();
    if(api && typeof api.readAppointments === 'function'){
      return api.readAppointments();
    }
    return [];
  }

  function normalizeId(id){ return String(id == null ? '' : id); }

  function findAppointment(id){
    var target = normalizeId(id);
    if(!target) return null;
    var rows = appointments();
    for(var i = 0; i < rows.length; i++){
      if(normalizeId(rows[i] && rows[i].id) === target) return rows[i];
    }
    return null;
  }

  function currentUserId(){
    var sources=[
      function(){return window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function'?window.PETATOEAuth.currentUser():null},
      function(){return window.__PETATOE_SETTINGS_API__&&typeof window.__PETATOE_SETTINGS_API__.currentUser==='function'?window.__PETATOE_SETTINGS_API__.currentUser():null},
      function(){return window.petCurrentUser&&typeof window.petCurrentUser==='function'?window.petCurrentUser():null}
    ];
    for(var i=0;i<sources.length;i++){
      try{
        var u=sources[i]()||{};
        var id=String(u.id||u.userId||u.uid||u.supabase_id||u.username||u.email||'');
        if(id)return id;
      }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-history.js",e);}
    }
    return '';
  }

  function currentUserInfo(){
    var id = currentUserId(), u = null;
    try{
      if(window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.currentUser === 'function'){
        u = window.__PETATOE_SETTINGS_API__.currentUser();
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-history.js",e);}
    try{
      if(!u && window.petCurrentUser && typeof window.petCurrentUser === 'function') u = window.petCurrentUser();
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-history.js",e);}
    try{
      if(!u && window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.users === 'function'){
        u = (window.__PETATOE_SETTINGS_API__.users() || []).find(function(x){
          return String(x.id) === String(id) || String(x.username) === String(id);
        });
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-history.js",e);}
    u = u || {id:id, username:id, fullName:id, role:'unknown'};
    return {
      id:String(u.id || id || ''),
      name:String(u.fullName || u.name || u.username || id || 'مستخدم'),
      role:String(u.role || u.job || 'unknown')
    };
  }

  function auditActionLabel(action){
    return {
      create:'إنشاء الموعد',
      edit:'تعديل بيانات الموعد',
      status:'تغيير حالة الطلب',
      close:'إغلاق الجلسة',
      reopen:'إعادة فتح الجلسة',
      confirm:'تأكيد الجلسة',
      collection:'تحديث التحصيل والدفع',
      select:'اختيار الطلب للتشغيل',
      delete:'حذف الموعد',
      rollback:'تراجع حالة الطلب'
    }[action] || action || 'تحديث';
  }

  function fmtAuditDate(iso){
    var d = new Date(iso || Date.now());
    if(isNaN(d.getTime())) d = new Date();
    return d.toLocaleDateString('ar-SA', {year:'numeric', month:'2-digit', day:'2-digit'});
  }

  function fmtAuditTime(iso){
    var d = new Date(iso || Date.now());
    if(isNaN(d.getTime())) d = new Date();
    return d.toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
  }

  function historyDetails(action, extra){
    extra = extra || {};
    var parts = [];
    if(extra.oldStatus || extra.status) parts.push('الحالة: ' + (extra.oldStatus || '-') + ' ← ' + (extra.status || '-'));
    if(extra.paymentMethod) parts.push('طريقة الدفع: ' + extra.paymentMethod);
    if(extra.paidAmount != null) parts.push('المحصل: ' + money(Number(extra.paidAmount || 0)));
    if(extra.collectionStatus) parts.push('حالة التحصيل: ' + extra.collectionStatus);
    if(extra.collectionReference) parts.push('مرجع المعاملة: ' + extra.collectionReference);
    if(extra.paymentAttachmentName) parts.push('صورة إثبات الدفع: ' + extra.paymentAttachmentName);
    if(extra.reason) parts.push('السبب: ' + extra.reason);
    if(extra.validation) parts.push('تنبيه تحقق: ' + extra.validation);
    if(extra.changes && extra.changes.length) parts.push('تعديلات: ' + extra.changes.join('، '));
    return parts.join(' | ');
  }

  function pushExecutionLog(row, action, extra){
    if(!row) return row;
    var now = new Date().toISOString();
    var user = currentUserInfo();
    extra = extra || {};
    row.executionLog = Array.isArray(row.executionLog) ? row.executionLog : [];
    row.executionLog.push(Object.assign({
      at:now,
      action:action || 'update',
      userId:user.id,
      userName:user.name,
      userRole:user.role
    }, extra));
    if(row.executionLog.length > 60) row.executionLog = row.executionLog.slice(row.executionLog.length - 60);

    row.sessionHistory = Array.isArray(row.sessionHistory) ? row.sessionHistory : [];
    row.sessionHistory.push({
      id:'HIST-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      at:now,
      date:fmtAuditDate(now),
      time:fmtAuditTime(now),
      userId:user.id,
      userName:user.name,
      userRole:user.role,
      action:action || 'update',
      actionLabel:auditActionLabel(action),
      oldStatus:extra.oldStatus || '',
      newStatus:extra.status || '',
      details:historyDetails(action, extra),
      notes:extra.reason || extra.notes || '',
      immutable:true
    });
    return row;
  }

  function historyOf(idOrRow){
    var row = (typeof idOrRow === 'object' && idOrRow) ? idOrRow : findAppointment(idOrRow);
    var history = row && Array.isArray(row.sessionHistory) ? row.sessionHistory : [];
    return history.slice();
  }

  function latest(idOrRow){
    var history = historyOf(idOrRow);
    return history.length ? history[history.length - 1] : null;
  }

  function countByAction(idOrRow, actions){
    actions = actions || [];
    var wanted = Array.isArray(actions) ? actions : [actions];
    var hist = historyOf(idOrRow);
    return hist.filter(function(x){
      return wanted.indexOf(String((x && x.action) || '')) > -1 || wanted.indexOf(String((x && x.actionLabel) || '')) > -1;
    }).length;
  }

  function hasAction(idOrRow, actions){ return countByAction(idOrRow, actions) > 0; }

  function renderSessionHistory(row){
    var hist = Array.isArray(row && row.sessionHistory) ? row.sessionHistory : [];
    if(!hist.length && Array.isArray(row && row.executionLog)){
      hist = row.executionLog.map(function(x){
        return {
          at:x.at,
          date:fmtAuditDate(x.at),
          time:fmtAuditTime(x.at),
          userName:x.userName || x.userId || 'النظام',
          userRole:x.userRole || '',
          actionLabel:auditActionLabel(x.action),
          oldStatus:x.oldStatus || '',
          newStatus:x.status || '',
          details:historyDetails(x.action, x),
          notes:x.reason || x.notes || ''
        };
      });
    }
    var rows = hist.slice().reverse().map(function(h, i){
      return '<div class="vehicle-ops-history-item"><span class="history-index">' + (hist.length - i) + '</span><div><b>' + esc(h.actionLabel || auditActionLabel(h.action)) + '</b><small>' + esc((h.date || fmtAuditDate(h.at)) + ' - ' + (h.time || fmtAuditTime(h.at))) + ' | ' + esc(h.userName || '-') + ' | ' + esc(h.userRole || '-') + '</small>' + (h.oldStatus || h.newStatus ? '<p>الحالة: ' + esc(h.oldStatus || '-') + ' ← ' + esc(h.newStatus || '-') + '</p>' : '') + (h.details ? '<p>' + esc(h.details) + '</p>' : '') + (h.notes ? '<em>' + esc(h.notes) + '</em>' : '') + '</div></div>';
    }).join('');
    return '<div class="vehicle-ops-history-panel"><div class="vehicle-ops-history-head"><h4>📜 سجل حالة الطلب</h4><span>' + hist.length + ' حدث</span></div><div class="vehicle-ops-history-list">' + (rows || '<div class="appointments-empty">لا يوجد سجل حالة لهذا الطلب بعد</div>') + '</div></div>';
  }

  var renderApi = {
    renderSessionHistory: renderSessionHistory
  };

  var api = {
    version:'OPS-18-history-render-extraction',
    mode:'history-render-extraction-with-legacy-fallback',
    get legacyApi(){ return legacy(); },
    get storageApi(){ return storage(); },
    appointments:appointments,
    findAppointment:findAppointment,
    currentUserId:currentUserId,
    currentUserInfo:currentUserInfo,
    auditActionLabel:auditActionLabel,
    fmtAuditDate:fmtAuditDate,
    fmtAuditTime:fmtAuditTime,
    historyDetails:historyDetails,
    pushExecutionLog:pushExecutionLog,
    historyOf:historyOf,
    latest:latest,
    countByAction:countByAction,
    hasAction:hasAction,
    renderSessionHistory:renderSessionHistory,
    renderApi:renderApi,
    esc:esc
  };

  window.PETATOEOperationsHistory = api;
  window.PETATOEOperationsHistoryInternal = api;
  window.PETATOEOperationsHistoryRender = renderApi;
})();
