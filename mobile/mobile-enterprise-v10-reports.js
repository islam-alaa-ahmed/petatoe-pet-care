/* PETATOE Mobile Enterprise UI v10 — M3 Reports & Data Tables */
(function () {
  'use strict';

  var PHONE_QUERY = '(max-width: 760px)';
  var mq = window.matchMedia(PHONE_QUERY);
  var observer = null;
  var scheduled = false;

  function isPhone() {
    return mq.matches;
  }

  function markAll(selector, className, root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(selector).forEach(function (node) {
      node.classList.add(className);
    });
  }

  function enhanceTables(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var selectors = [
      '#sales .table-wrap',
      '#vans .table-wrap',
      '#services .table-wrap',
      '#smartReportsArea .table-wrap',
      '#smartReportsArea .appointments-report-table-wrap',
      '#smartReportsArea .children-expenses-table-wrap'
    ];

    scope.querySelectorAll(selectors.join(',')).forEach(function (wrap) {
      wrap.classList.add('petatoe-v10-table-viewport');
      var table = wrap.querySelector('table');
      if (!table) return;
      var columns = table.querySelectorAll('thead th').length;
      if (columns >= 4) wrap.classList.add('petatoe-v10-sticky-first');
    });

    scope.querySelectorAll('#smartReportsArea table.customer-yoy-table').forEach(function (table) {
      var parent = table.parentElement;
      if (parent && parent !== scope) {
        parent.classList.add('petatoe-v10-table-viewport', 'petatoe-v10-sticky-first');
      }
    });
  }

  function enhance(root) {
    if (!isPhone()) return;
    document.body.classList.add('petatoe-v10-reports-ready');

    markAll('#sales, #vans, #services, #smartReportsScreen', 'petatoe-v10-report-surface', root);
    markAll('#sales .card, #vans .card, #services .card, #smartReportsArea .card, #smartReportsArea .smart-panel, #smartReportsArea .customer-yoy-panel, #smartReportsArea .appointments-report-table-card', 'petatoe-v10-report-card', root);
    markAll('#sales .chart, #vans .chart, #services .chart, #smartReportsArea .chart, #smartReportsArea .new-cust-chart, #smartReportsArea .inactive-cust-chart, #smartReportsArea .inactive-lost-trend-chart', 'petatoe-v10-report-chart', root);
    markAll('#sales .year-strip, #vans .year-strip, #smartReportsArea .year-strip, #smartReportsArea .smart-overview-card-year-list, #smartReportsArea .customer-analysis-tabs, #smartReportsArea .advanced-tax-actions, #smartReportsArea .customer-yoy-tax-actions, #smartReportsArea .inactive-sort-actions, #smartReportsArea .heatmap-control-row', 'petatoe-v10-report-rail', root);
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
      document.body.classList.remove('petatoe-v10-reports-ready');
    }
  }

  function boot() {
    handleViewportChange();
    document.addEventListener('click', function (event) {
      if (!isPhone()) return;
      if (event.target.closest('[data-tab], .nav-item, .subnav-item, .smart-tab, .customer-analysis-tab')) {
        window.setTimeout(function () { scheduleEnhance(document); }, 40);
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
