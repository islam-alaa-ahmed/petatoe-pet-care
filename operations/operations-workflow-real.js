/*
 * PETATOE v6.4.49 — Operations Real Workflow Extraction
 * ------------------------------------------------------
 * Controlled Migration layer for pure workflow/session rendering helpers.
 * No router, navigation, or storage behavior is changed here.
 */
(function initPETATOEOperationsWorkflowReal(window){
  'use strict';
  if(window.PETATOEOperationsWorkflowReal && window.PETATOEOperationsWorkflowReal.version === 'v6.4.49-OPX-REAL') return;

  function fallbackEsc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function dep(deps, name, fallback){ return deps && typeof deps[name] === 'function' ? deps[name] : fallback; }

  function vehicleDetailsCell(label, value, wide, deps){
    var esc = dep(deps, 'esc', fallbackEsc);
    return '<td ' + (wide ? 'colspan="2"' : '') + '><small>' + esc(label) + '</small><b>' + esc((value === 0 || value) ? value : '-') + '</b></td>';
  }

  function renderVehicleSessionDetailsTable(row, deps){
    var esc = dep(deps, 'esc', fallbackEsc);
    var money = dep(deps, 'money', function(n){ return String(Number(n || 0)) + ' SAR'; });
    var normalizeStatus = dep(deps, 'normalizeStatus', function(s){ return String(s || 'مجدول'); });
    var calcFinancials = dep(deps, 'calcFinancials', function(x){ return x || {}; });
    row = calcFinancials(row || {});
    var petInfo = [row.animalType, row.breed, row.size].filter(Boolean).join(' - ') || '-';
    var crewInfo = [row.groomer, row.driver, row.vehicle].filter(Boolean).join(' | ') || '-';
    var currentStatus = normalizeStatus(row.status || 'مجدول');
    return '<div class="vehicle-ops-session-table-card">'
      + '<div class="vehicle-ops-session-table-title"><span></span><h4>تفاصيل الجلسة</h4><small>عرض منظم لبيانات العميل والحيوان والتشغيل والمرجع</small></div>'
      + '<div class="vehicle-ops-details-table-wrap"><table class="vehicle-ops-details-table"><tbody>'
      + '<tr class="vehicle-ops-details-section"><th colspan="6"><span>👤</span> معلومات العميل</th></tr>'
      + '<tr>' + vehicleDetailsCell('الاسم', row.client || '-', false, deps) + vehicleDetailsCell('رقم الجوال', row.phone || '-', false, deps) + vehicleDetailsCell('العنوان', row.address || 'بدون عنوان', true, deps) + '</tr>'
      + '<tr class="vehicle-ops-details-section"><th colspan="6"><span>🐾</span> معلومات الحيوان</th></tr>'
      + '<tr>' + vehicleDetailsCell('اسم الحيوان', row.petName || '-', false, deps) + vehicleDetailsCell('النوع / السلالة / الحجم', petInfo, true, deps) + vehicleDetailsCell('العدد', (row.petCount || 1) + ' حيوان', false, deps) + '</tr>'
      + '<tr class="vehicle-ops-details-section"><th colspan="6"><span>🛠️</span> معلومات التشغيل</th></tr>'
      + '<tr>' + vehicleDetailsCell('الخدمة', row.service || '-', false, deps) + vehicleDetailsCell('الجرومر / السائق / السيارة', crewInfo, true, deps) + vehicleDetailsCell('الحالة الحالية', currentStatus, false, deps) + '</tr>'
      + '<tr class="vehicle-ops-details-section"><th colspan="6"><span>📋</span> معلومات الطلب</th></tr>'
      + '<tr>' + vehicleDetailsCell('رقم الطلب', row.id || '-', false, deps) + vehicleDetailsCell('قيمة الجلسة', money(row.totalAmount || 0), false, deps) + vehicleDetailsCell('موعد الجلسة', [row.date, row.start, row.end].filter(Boolean).join(' | ') || '-', false, deps) + '</tr>'
      + '<tr class="vehicle-ops-details-section"><th colspan="6"><span>📝</span> ملاحظات</th></tr>'
      + '<tr><td colspan="6" class="vehicle-ops-details-notes"><b>' + esc(row.sessionExecutionNotes || row.notes || 'لا يوجد ملاحظات') + '</b></td></tr>'
      + '</tbody></table></div></div>';
  }

  function vehicleOpsPaymentStageStatuses(status, deps){
    var normalizeStatus = dep(deps, 'normalizeStatus', function(s){ return String(s || ''); });
    var st = normalizeStatus(status);
    return st === 'تمت الجلسة' || st === 'تم التحصيل';
  }

  function renderVehicleFinalSummary(row, deps){
    var esc = dep(deps, 'esc', fallbackEsc);
    var money = dep(deps, 'money', function(n){ return String(Number(n || 0)) + ' SAR'; });
    var normalizeStatus = dep(deps, 'normalizeStatus', function(s){ return String(s || 'مجدول'); });
    var calcFinancials = dep(deps, 'calcFinancials', function(x){ return x || {}; });
    var fmtAuditDate = dep(deps, 'fmtAuditDate', function(v){ return String(v || '-'); });
    var fmtAuditTime = dep(deps, 'fmtAuditTime', function(){ return ''; });
    var paymentAttachmentLabel = dep(deps, 'vehicleOpsPaymentAttachmentLabel', function(){ return ''; });
    row = calcFinancials(row || {});
    var st = normalizeStatus(row.status);
    var att = paymentAttachmentLabel(row);
    var confirmed = st === 'مؤكد' || row.isConfirmed;
    return '<div class="vehicle-ops-stage-card vehicle-ops-final-summary ' + (confirmed ? 'confirmed' : '') + '">'
      + '<div class="vehicle-ops-stage-title"><span>' + (confirmed ? '🛡️' : '🔒') + '</span><div><h4>' + (confirmed ? 'جلسة مؤكدة' : 'ملخص الجلسة النهائي') + '</h4><p>' + (confirmed ? 'تم اعتماد الجلسة نهائيًا ولا يمكن تعديلها إلا بصلاحية.' : 'تم إغلاق الجلسة، ويظهر هنا ملخص التحصيل والتنفيذ.') + '</p></div></div>'
      + '<div class="vehicle-ops-final-grid">'
      + '<span><small>الحالة</small><b>' + esc(st) + '</b></span>'
      + '<span><small>قيمة الجلسة</small><b>' + money(row.totalAmount || 0) + '</b></span>'
      + '<span><small>المحصل</small><b>' + money(row.paidAmount || 0) + '</b></span>'
      + '<span><small>المتبقي</small><b>' + money(row.remainingAmount || 0) + '</b></span>'
      + '<span><small>طريقة الدفع</small><b>' + esc(row.paymentMethod || '-') + '</b></span>'
      + '<span><small>مرجع المعاملة</small><b>' + esc(row.collectionReference || '-') + '</b></span>'
      + '<span><small>تم التأكيد بواسطة</small><b>' + esc(row.confirmedBy || '-') + '</b></span>'
      + '<span><small>وقت التأكيد</small><b>' + esc(row.confirmedAt ? fmtAuditDate(row.confirmedAt) + ' - ' + fmtAuditTime(row.confirmedAt) : '-') + '</b></span>'
      + '</div>'
      + (att ? '<div class="vehicle-ops-final-attachment"><b>صورة إثبات الدفع</b><div class="vehicle-ops-attachment-preview stage"><img src="' + esc((row.paymentAttachment && row.paymentAttachment.data) || '') + '" alt="إثبات الدفع"/><span>' + esc(att) + '</span></div></div>' : '')
      + '</div>';
  }

  window.PETATOEOperationsWorkflowReal = {
    version:'v6.4.49-OPX-REAL',
    mode:'controlled-migration-pure-workflow-render-helpers',
    vehicleDetailsCell:vehicleDetailsCell,
    renderVehicleSessionDetailsTable:renderVehicleSessionDetailsTable,
    vehicleOpsPaymentStageStatuses:vehicleOpsPaymentStageStatuses,
    renderVehicleFinalSummary:renderVehicleFinalSummary
  };
})(window);
