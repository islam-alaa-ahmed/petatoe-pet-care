(function(){
  'use strict';

  /**
   * PETATOE Operations Payments Module
   *
   * Phase OPS-24: Payments actions extraction.
   * The executable payment actions now live here while appointments-core.js
   * delegates to this module with a guarded fallback to the legacy logic.
   * UI, storage keys, validation messages, and business rules are preserved.
   */
  if(window.PETATOEOperationsPayments && window.PETATOEOperationsPayments.version === 'OPS-24-payments-actions-extraction') return;

  var PAYMENT_METHODS = [
    'handlePaymentAttachment',
    'validateVehicleCollection',
    'vehicleOpsInputPaid',
    'vehicleOpsInputPayment',
    'vehicleOpsPaymentAttachmentLabel',
    'vehiclePaymentOptions',
    'renderVehiclePaymentPanel',
    'renderVehicleFinalSummary',
    'saveVehicleSessionById',
    'saveVehicleSessionByIndex'
  ];

  function context(){ return window.PETATOEOperationsContext || null; }
  function internal(){ return window.PETATOEOperationsPaymentsInternal || null; }
  function paymentAdapter(){
    var internalApi = internal();
    return internalApi && internalApi.paymentAdapter ? internalApi.paymentAdapter : null;
  }
  function legacy(){ return window.__PETATOEAppointmentsLegacyEngine || null; }

  function call(obj, method, args){
    if(obj && typeof obj[method] === 'function') return obj[method].apply(obj, args || []);
    return undefined;
  }

  function callPayment(method, args){
    if(actions && typeof actions[method] === 'function') return actions[method].apply(actions, args || []);
    var adapter = paymentAdapter();
    if(adapter && typeof adapter[method] === 'function') return call(adapter, method, args);
    var internalApi = internal();
    if(internalApi && typeof internalApi[method] === 'function') return call(internalApi, method, args);
    return call(legacy(), method, args);
  }

  function toast(message){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.toast === 'function') return adapter.toast(message);
    var ctx = context();
    if(ctx && typeof ctx.toast === 'function') return ctx.toast(message);
    if(typeof window.toast === 'function') return window.toast(message);
  }

  function byId(id){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.byId === 'function') return adapter.byId(id);
    var ctx = context();
    return ctx && typeof ctx.byId === 'function' ? ctx.byId(id) : document.getElementById(id);
  }

  function val(id){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.val === 'function') return adapter.val(id);
    var ctx = context();
    return ctx && typeof ctx.valueOf === 'function' ? ctx.valueOf(id, '') : ((byId(id) || {}).value || '');
  }

  function calcFinancials(row){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.calcFinancials === 'function') return adapter.calcFinancials(row);
    var ctx = context();
    if(ctx && typeof ctx.calcFinancials === 'function') return ctx.calcFinancials(row);
    return row || {};
  }

  function normalizeStatus(status){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.normalizeStatus === 'function') return adapter.normalizeStatus(status);
    return String(status || 'مجدول').trim() || 'مجدول';
  }

  function rows(){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.vehicleOpsRows === 'function') return adapter.vehicleOpsRows() || [];
    return [];
  }

  function updateVehicleRow(id, mutator){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.updateVehicleRow === 'function') return adapter.updateVehicleRow(id, mutator);
  }

  function pushExecutionLog(row, action, extra){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.pushExecutionLog === 'function') return adapter.pushExecutionLog(row, action, extra || {});
  }

  function currentUserId(){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.currentUserId === 'function') return adapter.currentUserId();
    return '';
  }

  function isLocked(row){
    var adapter = paymentAdapter();
    return !!(adapter && typeof adapter.vehicleOpsIsLocked === 'function' && adapter.vehicleOpsIsLocked(row));
  }

  function selectNextAfter(id){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.vehicleOpsSelectNextAfter === 'function') return adapter.vehicleOpsSelectNextAfter(id);
  }

  function renderVehicleOperations(){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.renderVehicleOperations === 'function') return adapter.renderVehicleOperations();
  }

  function attachmentLabel(row){
    var adapter = paymentAdapter();
    if(adapter && typeof adapter.vehicleOpsPaymentAttachmentLabel === 'function') return adapter.vehicleOpsPaymentAttachmentLabel(row);
    var a = row && (row.paymentAttachment || row.collectionAttachment);
    if(a && a.name) return a.name;
    return row && row.paymentAttachmentName ? row.paymentAttachmentName : '';
  }

  function inputPaid(id, row){
    var raw = val('vehicleOpsPaid_' + id);
    if(raw === '') return Number((row && row.paidAmount) || 0);
    var n = Number(String(raw).replace(/,/g, ''));
    return isFinite(n) ? n : 0;
  }

  function inputPayment(id, row){
    return val('vehicleOpsPayment_' + id) || ((row && row.paymentMethod) || '');
  }

  function validateCollection(row, id, requireFull){
    var paid = inputPaid(id, row);
    var method = inputPayment(id, row);
    var financials = calcFinancials(Object.assign({}, row, {paidAmount: paid, paymentMethod: method}));
    if(paid < 0) return {ok:false, msg:'المبلغ المحصل لا يمكن أن يكون أقل من صفر'};
    if(Number(financials.totalAmount || 0) > 0 && paid > Number(financials.totalAmount || 0)) return {ok:false, msg:'المبلغ المحصل لا يمكن أن يكون أكبر من قيمة الجلسة'};
    if(requireFull){
      if(paid <= 0) return {ok:false, msg:'لا يمكن تنفيذ تم التحصيل بدون إدخال مبلغ محصل'};
      if(!method) return {ok:false, msg:'لا يمكن تنفيذ تم التحصيل بدون اختيار طريقة السداد'};
      if(Number(financials.totalAmount || 0) > 0 && Number(financials.remainingAmount || 0) > 0) return {ok:false, msg:'لا يمكن اعتبار الجلسة محصلة بالكامل قبل سداد كامل قيمة الجلسة'};
    }
    return {ok:true, paid:paid, method:method, financials:financials};
  }

  function handlePaymentAttachment(id, input){
    var file = input && input.files && input.files[0];
    if(!file) return;
    if(!/^image\//.test(file.type || '')){ toast('يمكن إرفاق صورة فقط لإثبات الدفع'); input.value = ''; return; }
    if(file.size > 1024 * 1024 * 2){ toast('حجم الصورة كبير. الحد الأقصى 2MB'); input.value = ''; return; }
    var reader = new FileReader();
    reader.onload = function(){
      updateVehicleRow(id, function(row){
        var oldName = attachmentLabel(row) || '-';
        row.paymentAttachment = {name:file.name, type:file.type, size:file.size, data:String(reader.result || ''), updatedAt:new Date().toISOString(), updatedBy:currentUserId()};
        row.paymentAttachmentName = file.name;
        row.updatedAt = new Date().toISOString();
        pushExecutionLog(row, 'collection', {oldStatus:normalizeStatus(row.status), status:normalizeStatus(row.status), paymentAttachmentName:file.name, notes:'تم إضافة/تغيير صورة إثبات الدفع. السابق: ' + oldName});
      });
      toast('تم إرفاق صورة إثبات الدفع');
    };
    reader.onerror = function(){ toast('تعذر قراءة صورة إثبات الدفع'); };
    reader.readAsDataURL(file);
  }

  function saveVehicleSessionById(id){
    var row = rows().find(function(item){ return String(item.id) === String(id); });
    if(!row) return;
    if(isLocked(row)){ toast('هذه الجلسة مؤكدة ولا يمكن تعديلها بدون صلاحية تعديل جلسة مؤكدة'); return; }

    var hasPaymentInputs = !!byId('vehicleOpsPaid_' + id);
    var paid = hasPaymentInputs ? Number(String(val('vehicleOpsPaid_' + id) || 0).replace(/,/g, '')) : Number((row && row.paidAmount) || 0);
    var method = hasPaymentInputs ? val('vehicleOpsPayment_' + id) : (row.paymentMethod || '');
    var notes = val('vehicleOpsNotes_' + id);
    var collection = hasPaymentInputs ? val('vehicleOpsCollection_' + id) : (row.collectionStatus || 'غير محصل');
    var ref = hasPaymentInputs ? val('vehicleOpsRef_' + id) : (row.collectionReference || '');
    var base = calcFinancials(Object.assign({}, row, {paidAmount:paid, paymentMethod:method}));

    if(paid < 0){ toast('المبلغ المحصل لا يمكن أن يكون أقل من صفر'); return; }
    if(Number(base.totalAmount || 0) > 0 && paid > Number(base.totalAmount || 0)){ toast('المبلغ المحصل لا يمكن أن يكون أكبر من قيمة الجلسة'); return; }
    if(paid > 0 && !method){ toast('اختر طريقة السداد قبل حفظ التحصيل'); return; }

    var shouldMoveNext = false;
    updateVehicleRow(row.id, function(x){
      var oldStatus = normalizeStatus(x.status);
      x.paidAmount = paid;
      x.paymentMethod = method || x.paymentMethod || '';
      x.collectionStatus = collection || x.collectionStatus || 'غير محصل';
      x.collectionReference = ref || x.collectionReference || '';
      x.sessionExecutionNotes = notes;
      x.notes = notes;
      var financials = calcFinancials(x);
      Object.assign(x, financials);
      if(Number(financials.remainingAmount || 0) <= 0 && Number(financials.totalAmount || 0) > 0 && paid > 0){
        x.collectionStatus = 'محصل بالكامل';
        if(normalizeStatus(x.status) === 'تمت الجلسة'){ x.status = 'تم التحصيل'; shouldMoveNext = true; }
      }
      else if(Number(financials.paidAmount || 0) > 0){ x.collectionStatus = 'محصل جزئي'; }
      else { x.collectionStatus = 'غير محصل'; }
      x.updatedAt = new Date().toISOString();
      pushExecutionLog(x, 'collection', {oldStatus:oldStatus, status:normalizeStatus(x.status), paidAmount:x.paidAmount, paymentMethod:x.paymentMethod, collectionStatus:x.collectionStatus, collectionReference:x.collectionReference});
    });
    if(shouldMoveNext){ selectNextAfter(row.id); renderVehicleOperations(); }
    toast('تم حفظ بيانات الجلسة والتحصيل');
  }

  function saveVehicleSessionByIndex(index){
    var row = rows()[Number(index)];
    if(row) return saveVehicleSessionById(row.id);
  }

  var actions = {
    version: 'OPS-24-payments-actions-extraction',
    handlePaymentAttachment: handlePaymentAttachment,
    saveVehicleSessionById: saveVehicleSessionById,
    saveVehicleSessionByIndex: saveVehicleSessionByIndex,
    validateVehicleCollection: validateCollection,
    vehicleOpsInputPaid: inputPaid,
    vehicleOpsInputPayment: inputPayment,
    vehicleOpsPaymentAttachmentLabel: attachmentLabel
  };

  var api = {
    version: 'OPS-24-payments-actions-extraction',
    methods: PAYMENT_METHODS.slice(),
    get internalApi(){ return internal(); },
    get adapter(){ return paymentAdapter(); },
    get legacyApi(){ return legacy(); },
    get actions(){ return actions; },
    call: function(method){
      return callPayment(method, Array.prototype.slice.call(arguments, 1));
    }
  };

  PAYMENT_METHODS.forEach(function(method){
    api[method] = function(){
      return callPayment(method, arguments);
    };
  });

  window.PETATOEOperationsPaymentsActions = actions;
  window.PETATOEOperationsPayments = api;
})();
