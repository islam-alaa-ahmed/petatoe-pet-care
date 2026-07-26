/* PETATOE v10.0.25 — Critical Dashboard Boot Ownership
   Keeps the home dashboard startup independent from the demand-loaded Smart Reports bundle. */
(function () {
  'use strict';

  if (window.__PETATOE_DASHBOARD_CRITICAL_BOOT__) return;
  window.__PETATOE_DASHBOARD_CRITICAL_BOOT__ = true;

  var startedAt = (window.performance && performance.now) ? performance.now() : Date.now();

  function mark(name) {
    try { if (window.performance && performance.mark) performance.mark(name); } catch (_) {}
  }

  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (_) {}
  }

  function hideLegacyLoader() {
    var loader = document.getElementById('petatoeLoader');
    if (loader) window.setTimeout(function () { loader.classList.add('hidden'); }, 650);
  }

  async function bootDashboard() {
    mark('petatoe-dashboard-boot-start');
    emit('petatoe:dashboard-boot-start', { startedAt: startedAt });

    try {
      if (typeof initPetImage === 'function') initPetImage();
      if (typeof buildForm === 'function') buildForm();

      var loaded = typeof loadRecords === 'function' ? await loadRecords() : [];
      records = Array.isArray(loaded) ? loaded : [];
      records.forEach(function (row) {
        row.date = parseDate(row.date);
        row.month = normalizeMonth(row.month, row.date);
      });

      if (typeof populateFilters === 'function') populateFilters();
      var year = document.getElementById('fYear');
      if (year && typeof getDashboardDefaultYear === 'function') year.value = getDashboardDefaultYear();

      if (records.length || window.__PETATOE_SALES_SOURCE_STATUS__) {
        if (typeof renderDashboardAll === 'function') renderDashboardAll();
        if (typeof renderDeep === 'function') renderDeep();
      }

      var finishedAt = (window.performance && performance.now) ? performance.now() : Date.now();
      mark('petatoe-dashboard-first-render');
      emit('petatoe:dashboard-first-render', {
        duration: Math.max(0, Math.round(finishedAt - startedAt)),
        records: records.length
      });
    } catch (error) {
      emit('petatoe:dashboard-boot-error', { error: String(error && error.message || error) });
      if (window.console && console.error) console.error('[PETATOE Dashboard Critical Boot]', error);
    } finally {
      hideLegacyLoader();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDashboard, { once: true });
  } else {
    bootDashboard();
  }
})();
