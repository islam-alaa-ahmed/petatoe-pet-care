(function(){
  'use strict';

  /**
   * PETATOE Operations Status Module
   *
   * Phase OPS-23: History render extraction bridge.
   * The status-facing workflow actions and render helpers now live behind this module while
   * using the golden internal adapters for validation, storage, history,
   * rendering, permissions, and financial rules.
   */
  if(window.PETATOEOperationsStatus && window.PETATOEOperationsStatus.version === 'OPS-23-history-render-bridge') return;

  var STATUS_METHODS = [
    'setVehicleStatusById',
    'setVehicleStatusByIndex',
    'nextVehicleStatusById',
    'nextVehicleStatusByIndex'
  ];

  function internal(){
    return window.PETATOEOperationsStatusInternal || null;
  }

  function vehiclesInternal(){
    return window.PETATOEOperationsVehiclesInternal || null;
  }

  function statusAdapter(){
    var internalApi = internal();
    return internalApi && internalApi.statusAdapter ? internalApi.statusAdapter : null;
  }

  function vehicleAdapter(){
    var v = vehiclesInternal();
    return v && v.vehicleAdapter ? v.vehicleAdapter : null;
  }

  function legacy(){
    return window.__PETATOEAppointmentsLegacyEngine || null;
  }

  function toast(message){
    var v = vehicleAdapter();
    if(v && typeof v.toast === 'function') return v.toast(message);
    if(typeof window.toast === 'function') return window.toast(message);
    if(typeof window.toastSafe === 'function') return window.toastSafe(message);
  }

  function call(obj, method, args){
    if(obj && typeof obj[method] === 'function') return obj[method].apply(obj, args || []);
  }

  function findVehicleRowById(id){
    var v = vehicleAdapter();
    var rows = v && typeof v.vehicleOpsRows === 'function' ? v.vehicleOpsRows() : [];
    return (rows || []).find(function(x){ return String(x.id) === String(id); }) || null;
  }

  function setVehicleStatusById(id, status){
    var s = statusAdapter();
    var v = vehicleAdapter();
    if(!s || !v || typeof v.updateVehicleRow !== 'function'){
      return call(legacy(), 'setVehicleStatusById', arguments);
    }

    status = call(s, 'normalizeStatus', [status]) || status;
    var row = findVehicleRowById(id);
    if(!row) return;

    var check = call(s, 'validateVehicleStatusTransition', [row, status, id]);
    if(!check || !check.ok){
      toast((check && check.msg) || 'لا يمكن تغيير الحالة بهذا التسلسل');
      return;
    }
    if(check.same){
      toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('الحالة الحالية مختارة بالفعل'):'الحالة الحالية مختارة بالفعل');
      return;
    }

    v.updateVehicleRow(id, function(x){
      var oldStatus = call(s, 'normalizeStatus', [x.status]) || x.status;
      if(status === 'تم التحصيل'){
        var vc = call(v, 'validateVehicleCollection', [x, id, true]);
        x.paidAmount = vc.paid;
        x.paymentMethod = vc.method;
        x.collectionStatus = 'محصل بالكامل';
        x.remainingAmount = 0;
      }
      x.status = status;
      x.updatedAt = new Date().toISOString();
      call(v, 'pushExecutionLog', [x, 'status', {
        oldStatus: oldStatus,
        status: status,
        reason: check.reason || '',
        notes: check.backward ? 'تراجع حالة الطلب بسبب موثق' : ''
      }]);
    });

    toast(check.backward ? 'تم التراجع للحالة السابقة وتسجيل السبب' : 'تم تحديث حالة الجلسة');
  }

  function setVehicleStatusByIndex(idx, status){
    var v = vehicleAdapter();
    var rows = v && typeof v.vehicleOpsRows === 'function' ? v.vehicleOpsRows() : [];
    var row = rows[Number(idx)];
    if(row) return setVehicleStatusById(row.id, status);
    return call(legacy(), 'setVehicleStatusByIndex', arguments);
  }

  function nextVehicleStatusById(id){
    var s = statusAdapter();
    var row = findVehicleRowById(id);
    if(!s || !row) return call(legacy(), 'nextVehicleStatusById', arguments);
    var current = call(s, 'normalizeStatus', [row.status]) || row.status;
    var next = call(s, 'nextStatus', [row.status]) || current;
    if(next !== current) return setVehicleStatusById(id, next);
  }

  function nextVehicleStatusByIndex(idx){
    var v = vehicleAdapter();
    var rows = v && typeof v.vehicleOpsRows === 'function' ? v.vehicleOpsRows() : [];
    var row = rows[Number(idx)];
    if(row) return nextVehicleStatusById(row.id);
    return call(legacy(), 'nextVehicleStatusByIndex', arguments);
  }



  var STATUS_STEPS = [
    ['في الطريق','بدء التحرك','🚐'],
    ['وصل العميل','وصلنا','📍'],
    ['بدأت الجلسة','بدء الجلسة','✂️'],
    ['تمت الجلسة','إنهاء الجلسة','🧼'],
    ['تم التحصيل','تم التحصيل','💳'],
    ['مغلق','مغلقة','🔒'],
    ['مؤكد','مؤكدة','🛡️']
  ];

  var STATUS_ORDER = ['مجدول','في الطريق','وصل العميل','بدأت الجلسة','تمت الجلسة','تم التحصيل','مغلق','مؤكد'];

  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];
    });
  }

  function normalizeStatus(status){
    var s = statusAdapter();
    return call(s, 'normalizeStatus', [status]) || String(status || 'مجدول');
  }

  function isLocked(row){
    var s = statusAdapter();
    return !!call(s, 'vehicleOpsIsLocked', [row]);
  }

  function auditActionLabel(action){
    return {create:'إنشاء الموعد',edit:'تعديل بيانات الموعد',status:'تغيير حالة الطلب',close:'إغلاق الجلسة',reopen:'إعادة فتح الجلسة',confirm:'تأكيد الجلسة',collection:'تحديث التحصيل والدفع',select:'اختيار الطلب للتشغيل',delete:'حذف الموعد'}[action]||action||'تحديث';
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

  function money(n){
    n = Number(n || 0);
    return n.toLocaleString('ar-SA', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' SAR';
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

  function vehicleStageTime(row, status, fallback){
    var logs = Array.isArray(row && row.executionLog) ? row.executionLog : [];
    for(var i = logs.length - 1; i >= 0; i--){
      var x = logs[i] || {};
      if(x.status && normalizeStatus(x.status) === normalizeStatus(status) && x.at){
        var d = new Date(x.at);
        if(!isNaN(d.getTime())) return d.toLocaleTimeString('ar-SA', {hour:'2-digit', minute:'2-digit'});
      }
    }
    return fallback || '--:--';
  }

  function vehicleStageDone(row, status){
    var current = normalizeStatus(row && row.status);
    var target = normalizeStatus(status);
    if(current === 'غير مكتملة') current = 'تمت الجلسة';
    return STATUS_ORDER.indexOf(current) >= STATUS_ORDER.indexOf(target) && STATUS_ORDER.indexOf(target) > -1;
  }

  function vehicleStatusButtons(id, row){
    var locked = isLocked(row);
    var disabled = locked ? ' disabled title="الجلسة مؤكدة ومقفلة"' : '';
    return STATUS_STEPS.map(function(x){
      var active = normalizeStatus(row && row.status) === x[0];
      var done = vehicleStageDone(row, x[0]);
      return '<button class="vehicle-ops-step ' + (active ? 'active ' : '') + (done ? 'done ' : '') + (locked ? 'locked' : '') + '" type="button" ' + disabled + ' data-op-click="setVehicleStatusById" data-op-arg1="' + esc(id) + '" data-op-arg2="' + esc(x[0]) + '"><span>' + x[2] + '</span><b>' + esc(x[1]) + '</b><small>' + esc(vehicleStageTime(row, x[0], '')) + '</small></button>';
    }).join('');
  }

  function vehicleProgressBar(row){
    return '<div class="vehicle-ops-progress vehicle-ops-progress-bottom">' + STATUS_STEPS.map(function(x, idx){
      var done = vehicleStageDone(row, x[0]);
      var active = normalizeStatus(row && row.status) === x[0];
      var fallback = idx === 0 ? ((row && row.start) || '--:--') : (idx === 3 ? ((row && row.end) || '--:--') : '--:--');
      return '<div class="vehicle-ops-progress-step ' + (done ? 'done ' : '') + (active ? 'active' : '') + '"><span class="vehicle-ops-progress-num">' + (idx + 1) + '</span><div><b>' + esc(x[1]) + '</b><small>' + esc(vehicleStageTime(row, x[0], fallback)) + '</small></div></div>';
    }).join('<i></i>') + '</div>';
  }

  function renderSessionHistory(row){
    if(window.PETATOEOperationsHistoryRender && typeof window.PETATOEOperationsHistoryRender.renderSessionHistory === 'function' && !renderSessionHistory._opsHistoryDelegating){
      renderSessionHistory._opsHistoryDelegating = true;
      try{ return window.PETATOEOperationsHistoryRender.renderSessionHistory(row); }
      finally{ renderSessionHistory._opsHistoryDelegating = false; }
    }
    var hist = Array.isArray(row && row.sessionHistory) ? row.sessionHistory : [];
    if(!hist.length && Array.isArray(row && row.executionLog)){
      hist = row.executionLog.map(function(x){
        return {at:x.at, date:fmtAuditDate(x.at), time:fmtAuditTime(x.at), userName:x.userName || x.userId || 'النظام', userRole:x.userRole || '', actionLabel:auditActionLabel(x.action), oldStatus:x.oldStatus || '', newStatus:x.status || '', details:historyDetails(x.action, x)};
      });
    }
    var rows = hist.slice().reverse().map(function(h, i){
      return '<div class="vehicle-ops-history-item"><span class="history-index">' + (hist.length - i) + '</span><div><b>' + esc(h.actionLabel || auditActionLabel(h.action)) + '</b><small>' + esc((h.date || fmtAuditDate(h.at)) + ' - ' + (h.time || fmtAuditTime(h.at))) + ' | ' + esc(h.userName || '-') + ' | ' + esc(h.userRole || '-') + '</small>' + (h.oldStatus || h.newStatus ? '<p>الحالة: ' + esc(h.oldStatus || '-') + ' ← ' + esc(h.newStatus || '-') + '</p>' : '') + (h.details ? '<p>' + esc(h.details) + '</p>' : '') + (h.notes ? '<em>' + esc(h.notes) + '</em>' : '') + '</div></div>';
    }).join('');
    return '<div class="vehicle-ops-history-panel"><div class="vehicle-ops-history-head"><h4>📜 سجل حالة الطلب</h4><span>' + hist.length + ' حدث</span></div><div class="vehicle-ops-history-list">' + (rows || '<div class="appointments-empty">لا يوجد سجل حالة لهذا الطلب بعد</div>') + '</div></div>';
  }

  var renderApi = {
    vehicleStageTime: vehicleStageTime,
    vehicleStageDone: vehicleStageDone,
    vehicleStatusButtons: vehicleStatusButtons,
    vehicleProgressBar: vehicleProgressBar,
    renderSessionHistory: renderSessionHistory
  };

  var actionsApi = {
    setVehicleStatusById: setVehicleStatusById,
    setVehicleStatusByIndex: setVehicleStatusByIndex,
    nextVehicleStatusById: nextVehicleStatusById,
    nextVehicleStatusByIndex: nextVehicleStatusByIndex
  };

  function legacyTarget(method){
    var internalApi = internal();
    if(internalApi && typeof internalApi[method] === 'function') return internalApi;
    var legacyApi = legacy();
    if(legacyApi && typeof legacyApi[method] === 'function') return legacyApi;
    return null;
  }

  function callStatus(method, args){
    if(actionsApi && typeof actionsApi[method] === 'function'){
      return actionsApi[method].apply(actionsApi, args || []);
    }
    var api = legacyTarget(method);
    if(!api) return undefined;
    return api[method].apply(api, args || []);
  }

  var api = {
    version: 'OPS-23-history-render-bridge',
    methods: STATUS_METHODS.slice(),
    get internalApi(){ return internal(); },
    get adapter(){ return statusAdapter(); },
    get vehicleAdapter(){ return vehicleAdapter(); },
    get actionsApi(){ return actionsApi; },
    get renderApi(){ return renderApi; },
    get legacyApi(){ return legacy(); },
    call: function(method){
      return callStatus(method, Array.prototype.slice.call(arguments, 1));
    }
  };

  STATUS_METHODS.forEach(function(method){
    api[method] = function(){
      return callStatus(method, arguments);
    };
  });

  window.PETATOEOperationsStatusActions = actionsApi;
  window.PETATOEOperationsStatusRender = renderApi;
  window.PETATOEOperationsStatus = api;
})();
