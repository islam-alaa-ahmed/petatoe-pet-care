/* PETATOE Mobile Enterprise UI v10 — M4 Operations & Management Screens */
(function () {
  'use strict';

  var PHONE_QUERY = '(max-width: 760px)';
  var mq = window.matchMedia(PHONE_QUERY);
  var observer = null;
  var scheduled = false;

  var SURFACES = [
    '#appointments', '#vehicleOperations', '#vehicleOperationsReports', '#operationKpis',
    '#customer360', '#obligations', '#treasury', '#warehouses',
    '#payroll', '#salarySlip', '#commissionStatement', '#childrenExpenses',
    '#settings', '#logs', '#entry', '#import', '#records'
  ];

  function isPhone() {
    return mq.matches;
  }

  function addClass(selector, className, root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(selector).forEach(function (node) {
      node.classList.add(className);
    });
  }

  function enhanceTables(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var surfaceSelector = SURFACES.join(',');
    scope.querySelectorAll(surfaceSelector).forEach(function (surface) {
      surface.querySelectorAll('.table-wrap, .wh-table, .children-expenses-table-wrap, .appointments-report-table-wrap, table').forEach(function (node) {
        var wrap = node.tagName === 'TABLE' ? node.parentElement : node;
        if (!wrap || !wrap.querySelector || !wrap.querySelector('table')) return;
        wrap.classList.add('petatoe-v10-management-table');
        var table = wrap.querySelector('table');
        if (table && table.querySelectorAll('thead th').length >= 4) {
          wrap.classList.add('petatoe-v10-management-table-wide');
        }
      });
    });
  }

  function enhanceForms(root) {
    addClass(SURFACES.map(function (s) { return s + ' .form'; }).join(','), 'petatoe-v10-management-form', root);
    addClass(SURFACES.map(function (s) { return s + ' .filters'; }).join(','), 'petatoe-v10-management-filters', root);
    addClass(SURFACES.map(function (s) { return s + ' .wh-filter'; }).join(','), 'petatoe-v10-management-filters', root);
    addClass(SURFACES.map(function (s) { return s + ' .appointments-calendar-controls'; }).join(','), 'petatoe-v10-management-filters', root);
  }

  function enhanceRails(root) {
    var railSelectors = [
      '#appointments .appointments-tabs',
      '#vehicleOperations .appointments-actions',
      '#vehicleOperationsReports .appointments-actions',
      '#operationKpis .appointments-actions',
      '#warehouses .wh-tabs',
      '#childrenExpenses .children-expenses-tabs',
      '#payroll .payroll-tabs',
      '#settings .settings-tabs',
      '#settings .settings-subtabs'
    ];
    addClass(railSelectors.join(','), 'petatoe-v10-management-rail', root);
  }

  function enhance(root) {
    if (!isPhone()) return;
    document.body.classList.add('petatoe-v10-management-ready');
    addClass(SURFACES.join(','), 'petatoe-v10-management-surface', root);
    addClass(SURFACES.map(function (s) { return s + ' .card'; }).join(','), 'petatoe-v10-management-card', root);
    addClass(SURFACES.map(function (s) { return s + ' .appointments-card'; }).join(','), 'petatoe-v10-management-card', root);
    addClass(SURFACES.map(function (s) { return s + ' .wh-card'; }).join(','), 'petatoe-v10-management-card', root);
    addClass(SURFACES.map(function (s) { return s + ' .children-expenses-card'; }).join(','), 'petatoe-v10-management-card', root);
    enhanceForms(root);
    enhanceRails(root);
    enhanceTables(root);
  }

  function scheduleEnhance(root) {
    if (!isPhone() || scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      enhance(root || document);
    });
  }

  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver(function (records) {
      if (!isPhone()) return;
      var relevant = records.some(function (record) {
        return record.addedNodes && record.addedNodes.length;
      });
      if (relevant) scheduleEnhance(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function handleViewportChange() {
    if (isPhone()) {
      scheduleEnhance(document);
      startObserver();
    } else {
      document.body.classList.remove('petatoe-v10-management-ready');
    }
  }

  function boot() {
    handleViewportChange();
    document.addEventListener('click', function (event) {
      if (!isPhone()) return;
      if (event.target.closest('[data-tab], [data-wh-tab], [data-children-expenses-tab], .nav-item, .subnav-item, .settings-tab, .payroll-tab')) {
        window.setTimeout(function () { scheduleEnhance(document); }, 50);
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  if (typeof mq.addEventListener === 'function') mq.addEventListener('change', handleViewportChange);
  else if (typeof mq.addListener === 'function') mq.addListener(handleViewportChange);
})();
