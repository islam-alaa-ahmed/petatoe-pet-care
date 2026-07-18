(function(){
  'use strict';

  /**
   * PETATOE Operations Appointments Boundary
   *
   * Phase OPS-13: Appointments Internal API bridge.
   * This module now prefers the internal appointments implementation exposed
   * by appointments-core.js and falls back to the legacy public API.
   * This keeps the old onclick/window API stable while preparing real logic extraction.
   */
  if(window.PETATOEOperationsAppointments) return;


  var LEGACY_STATUS_MAP = {'تم':'تمت الجلسة'};

  function normalizeStatusValue(status){
    status = String(status || 'مجدول').trim();
    return LEGACY_STATUS_MAP[status] || status || 'مجدول';
  }

  function textBlob(row){
    row = row || {};
    return [
      row.client,
      row.phone,
      row.animalType,
      row.breed,
      row.size,
      row.petName,
      row.service,
      row.groomer,
      row.driver,
      row.vehicle,
      row.paymentMethod,
      row.address,
      row.notes,
      row.status
    ].join(' ').toLowerCase();
  }

  function matchesFilters(row, filters){
    row = row || {};
    filters = filters || {};
    var q = String(filters.q || '').toLowerCase();
    var status = filters.status;
    var animal = filters.animal;
    var groomer = filters.groomer;
    var driver = filters.driver;
    var vehicle = filters.vehicle;
    var payment = filters.payment;
    var from = filters.from;
    var to = filters.to;
    var d = String(row.date || '');

    return (!q || textBlob(row).indexOf(q) > -1)
      && (!status || status === 'all' || normalizeStatusValue(row.status) === normalizeStatusValue(status))
      && (!animal || animal === 'all' || row.animalType === animal)
      && (!groomer || groomer === 'all' || row.groomer === groomer)
      && (!driver || driver === 'all' || row.driver === driver)
      && (!vehicle || vehicle === 'all' || row.vehicle === vehicle)
      && (!payment || payment === 'all' || row.paymentMethod === payment)
      && (!from || d >= from)
      && (!to || d <= to);
  }

  function sortByAppointmentDateTime(a, b){
    return String((a && a.date) || '').localeCompare(String((b && b.date) || ''))
      || String((a && a.start) || '').localeCompare(String((b && b.start) || ''));
  }

  function filterRows(rows, filters){
    return (Array.isArray(rows) ? rows : [])
      .filter(function(row){ return matchesFilters(row, filters); })
      .sort(sortByAppointmentDateTime);
  }


  function adapter(){
    var api = internal();
    return api && api.actionsAdapter ? api.actionsAdapter : null;
  }


  function renderAdapter(){
    var api = internal();
    return api && api.renderAdapter ? api.renderAdapter : null;
  }

  function callRender(method, args){
    var r = renderAdapter();
    if(r && typeof r[method] === 'function'){
      return r[method].apply(r, args || []);
    }
    return callTarget(method, args || []);
  }

  window.PETATOEOperationsAppointmentsRender = {
    version: 'OPS-16-appointments-render-boundary',
    render: function(){ return callRender('render', arguments); },
    renderAppointmentsCurrent: function(){ return callRender('renderAppointmentsCurrent', arguments); },
    renderTable: function(){ return callRender('renderTable', arguments); },
    renderKpis: function(rows){ return callRender('renderKpis', [rows]); },
    renderDynamicFilters: function(){ return callRender('renderDynamicFilters', arguments); },
    renderCalendar: function(){ return callRender('renderCalendar', arguments); },
    renderDispatch: function(){ return callRender('renderDispatch', arguments); },
    renderTodayTimeline: function(){ return callRender('renderTodayTimeline', arguments); },
    renderAlerts: function(){ return callRender('renderAlerts', arguments); },
    renderDailyOperations: function(){ return callRender('renderDailyOperations', arguments); },
    renderReports: function(){ return callRender('renderReports', arguments); },
    renderMasterData: function(){ return callRender('renderMasterData', arguments); },
    renderCustomersPets: function(){ return callRender('renderCustomersPets', arguments); }
  };

  function actionSaveAppointment(){
    var a = adapter();
    if(!a) return callTarget('saveAppointment', []);
    var r = a.collect();
    if(!r.client){ alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('اكتب اسم العميل'):'اكتب اسم العميل'); return; }
    if(!r.date){ alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('اختر تاريخ الموعد'):'اختر تاريخ الموعد'); return; }
    var rows = a.read();
    var profile = a.findCustomerProfile();
    if(profile){
      r.customerId = profile.key;
      if(!r.phone && profile.phone) r.phone = profile.phone;
      if(!r.address && profile.address) r.address = profile.address;
    }
    var conflicts = a.findConflicts(r, rows);
    if(conflicts.length){
      var conflictPrefix=(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('⚠️ يوجد تعارض في الموعد:\n'):'⚠️ يوجد تعارض في الموعد:\n'); alert(conflictPrefix + conflicts.map(function(c){
        return '- ' + c.reason + ' مع ' + ((c.row && c.row.client) || 'عميل') + ' من ' + ((c.row && c.row.start) || '?') + ' إلى ' + ((c.row && c.row.end) || '?');
      }).join('\n'));
      return;
    }

    var idx = rows.findIndex(function(x){ return String(x.id) === String(r.id); });
    if(idx > -1){
      var oldRow = Object.assign({}, rows[idx]);
      rows[idx] = Object.assign({}, rows[idx], r);
      a.pushExecutionLog(rows[idx], 'edit', {
        oldStatus: a.normalizeStatus(oldRow.status),
        status: a.normalizeStatus(rows[idx].status),
        changes: a.summarizeAppointmentChanges(oldRow, rows[idx])
      });
    }else{
      rows.unshift(r);
      a.pushExecutionLog(rows[0], 'create', {
        status: a.normalizeStatus(rows[0].status),
        notes: 'تم إنشاء الموعد من إدارة المواعيد'
      });
    }
    if(typeof a.upsertMasterCustomer === 'function'){
      a.upsertMasterCustomer({
        code: r.customerId || (typeof a.customerKey === 'function' ? a.customerKey(r) : ''),
        name: r.client,
        phone: r.phone,
        address: r.address
      });
    }
    a.write(rows);
    a.clearForm();
    a.setTab('log');
    a.toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم حفظ الموعد'):'تم حفظ الموعد');
  }

  function actionEdit(id){
    var a = adapter();
    if(!a) return callTarget('edit', [id]);
    var r = a.read().find(function(x){ return String(x.id) === String(id); });
    if(!r) return;
    a.fill(r);
    a.setTab('add');
  }

  function actionRemove(id){
    var a = adapter();
    if(!a) return callTarget('remove', [id]);
    if(!confirm(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('حذف الموعد؟'):'حذف الموعد؟')) return;
    a.write(a.read().filter(function(x){ return String(x.id) !== String(id); }));
    a.render();
    a.toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم حذف الموعد'):'تم حذف الموعد');
  }

  function actionChangeStatus(id, status){
    var a = adapter();
    if(!a) return callTarget('changeStatus', [id, status]);
    var rows = a.read();
    rows.forEach(function(x){
      if(String(x.id) === String(id)) x.status = a.normalizeStatus(status);
    });
    a.write(rows);
    a.render();
    a.toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تم تحديث حالة الموعد'):'تم تحديث حالة الموعد');
  }

  window.PETATOEOperationsAppointmentsActions = {
    version: 'OPS-15-appointments-actions-extraction',
    saveAppointment: actionSaveAppointment,
    edit: actionEdit,
    remove: actionRemove,
    changeStatus: actionChangeStatus
  };

  var APPOINTMENTS_METHODS = [
    'setTab',
    'clearForm',
    'saveAppointment',
    'render',
    'edit',
    'remove',
    'changeStatus',
    'resetFilters',
    'setQuickRange',
    'setCalendarView',
    'applyCustomerSuggestion',
    'refreshPetSuggestions',
    'applyPetSuggestion',
    'newCustomer',
    'refreshBreedOptions',
    'addMasterItem',
    'addBreed',
    'removeMasterItem',
    'editMasterItem',
    'resetMasterData',
    'setDispatchDateToday',
    'setDailyOpsDateToday',
    'printDailyOperations',
    'selectCustomerProfile'
  ];

  function internal(){
    return window.PETATOEOperationsAppointmentsInternal || null;
  }

  function legacy(){
    return window.__PETATOEAppointmentsLegacyEngine || null;
  }

  function target(){
    return internal() || legacy();
  }

  function callTarget(method, args){
    var api = target();
    if(!api || typeof api[method] !== 'function') return undefined;
    return api[method].apply(api, args || []);
  }

  var api = {
    version: 'OPS-16-appointments-render-boundary',
    methods: APPOINTMENTS_METHODS.slice(),
    get internalApi(){ return internal(); },
    get legacyApi(){ return legacy(); },
    call: function(method){
      return callTarget(method, Array.prototype.slice.call(arguments, 1));
    },
    normalizeStatusValue: normalizeStatusValue,
    matchesFilters: matchesFilters,
    filterRows: filterRows
  };

  APPOINTMENTS_METHODS.forEach(function(method){
    api[method] = function(){
      return callTarget(method, arguments);
    };
  });

  api.saveAppointment = actionSaveAppointment;
  api.edit = actionEdit;
  api.remove = actionRemove;
  api.changeStatus = actionChangeStatus;
  api.actionsApi = window.PETATOEOperationsAppointmentsActions;
  api.renderApi = window.PETATOEOperationsAppointmentsRender;
  api.render = window.PETATOEOperationsAppointmentsRender.render;

  window.PETATOEOperationsAppointments = api;
})();
