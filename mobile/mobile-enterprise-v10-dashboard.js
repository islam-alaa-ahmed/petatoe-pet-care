/* PETATOE Mobile Enterprise UI v10 — M2 Native Dashboard */
(function () {
  'use strict';

  var PHONE_QUERY = '(max-width: 760px)';
  var dashboard = null;
  var filters = null;
  var trigger = null;
  var countBadge = null;

  function isPhone() { return window.matchMedia(PHONE_QUERY).matches; }
  function t(key, fallback) {
    try {
      if (typeof window.petT === 'function') return window.petT(key, fallback);
      if (window.PETATOEI18N && typeof window.PETATOEI18N.t === 'function') return window.PETATOEI18N.t(key, fallback);
    } catch (_) {}
    return fallback;
  }

  function removeLegacyMobileDashboardControls() {
    document.querySelectorAll('.pet-v10-dashboard-toolbar, .pet-v10-dashboard-filter-backdrop').forEach(function (node) {
      node.remove();
    });
    document.body.classList.remove('pet-v10-dashboard-filter-open');
  }

  function configureMobileDashboardFilters() {
    dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    filters = dashboard.querySelector(':scope > .filters');
    if (!filters) return;

    var yearSelect = document.getElementById('fYear');
    var payrollAccess = dashboard.querySelector(':scope > .payroll-home-access');
    var ytdBanner = document.getElementById('ytdBanner');
    if (!yearSelect || !payrollAccess) return;

    removeLegacyMobileDashboardControls();

    var yearControl = dashboard.querySelector(':scope > .pet-v10-dashboard-year-control');
    if (!yearControl) {
      yearControl = document.createElement('div');
      yearControl.className = 'pet-v10-dashboard-year-control';
      var label = document.createElement('label');
      label.setAttribute('for', 'fYear');
      label.setAttribute('data-i18n', 'smart.year');
      label.textContent = t('smart.year', 'Year');
      yearControl.appendChild(label);
      if (ytdBanner) dashboard.insertBefore(yearControl, ytdBanner);
      else payrollAccess.insertAdjacentElement('afterend', yearControl);
    }
    yearControl.appendChild(yearSelect);
    dashboard.dataset.petV10DashboardReady = '1';
  }

  function restoreDesktopDashboardFilters() {
    dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    filters = dashboard.querySelector(':scope > .filters');
    var yearSelect = document.getElementById('fYear');
    var yearControl = dashboard.querySelector(':scope > .pet-v10-dashboard-year-control');
    if (filters && yearSelect && yearSelect.parentElement !== filters) filters.insertBefore(yearSelect, filters.firstChild);
    if (yearControl) yearControl.remove();
    dashboard.removeAttribute('data-pet-v10-dashboard-ready');
    removeLegacyMobileDashboardControls();
  }

  function tuneChartInstance(id, instance) {
    if (!instance || !instance.options) return;
    var options = instance.options;
    options.maintainAspectRatio = false;
    options.responsive = true;
    options.animation = options.animation || {};
    options.animation.duration = 280;
    options.layout = options.layout || {};
    options.layout.padding = id === 'servicesChart' || id === 'clientsChart'
      ? { top: 4, right: 8, bottom: 2, left: 0 }
      : { top: 6, right: 4, bottom: 2, left: 2 };

    options.plugins = options.plugins || {};
    options.plugins.legend = options.plugins.legend || {};
    options.plugins.legend.labels = Object.assign({}, options.plugins.legend.labels || {}, {
      boxWidth: 10,
      boxHeight: 10,
      padding: 9,
      font: { size: 9 }
    });

    options.scales = options.scales || {};
    Object.keys(options.scales).forEach(function (axisKey) {
      var axis = options.scales[axisKey] || {};
      axis.ticks = Object.assign({}, axis.ticks || {}, {
        autoSkip: true,
        maxTicksLimit: axisKey === 'x' ? 6 : 7,
        maxRotation: 0,
        minRotation: 0,
        font: { size: 9 }
      });
      axis.grid = Object.assign({}, axis.grid || {}, { drawBorder: false });
      options.scales[axisKey] = axis;
    });

    try { instance.resize(); instance.update('none'); } catch (_) {}
  }

  function tuneDashboardCharts() {
    if (!isPhone()) return;
    var ids = ['monthlyChart', 'servicesChart', 'clientsChart', 'payChart'];
    ids.forEach(function (id) {
      try {
        if (typeof charts !== 'undefined' && charts && charts[id]) tuneChartInstance(id, charts[id]);
        else if (window.Chart && typeof window.Chart.getChart === 'function') tuneChartInstance(id, window.Chart.getChart(id));
      } catch (_) {}
    });
  }

  function boot() {
    if (!isPhone()) return;
    document.body.classList.add('pet-v10-mobile');
    configureMobileDashboardFilters();
    window.setTimeout(tuneDashboardCharts, 100);
    window.setTimeout(tuneDashboardCharts, 700);
    window.setTimeout(tuneDashboardCharts, 1800);

    document.addEventListener('petatoe:records-changed', function () {
      if (isPhone()) window.requestAnimationFrame(tuneDashboardCharts);
    });
    document.addEventListener('petatoe:tabchange', function (event) {
      var tab = event && event.detail && event.detail.tabId;
      if (isPhone() && tab === 'dashboard') window.setTimeout(tuneDashboardCharts, 60);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.addEventListener('resize', function () {
    if (isPhone()) { document.body.classList.add('pet-v10-mobile'); configureMobileDashboardFilters(); tuneDashboardCharts(); }
    else { document.body.classList.remove('pet-v10-mobile', 'pet-v10-dashboard-filter-open'); restoreDesktopDashboardFilters(); }
  }, { passive: true });
})();
