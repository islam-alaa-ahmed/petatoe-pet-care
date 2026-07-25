/* PETATOE Mobile Enterprise UI v10 — P7.3 Independent Mobile Dashboard */
(function () {
  'use strict';

  var PHONE_QUERY = '(max-width: 760px), (max-height: 600px) and (hover: none) and (pointer: coarse)';
  var dashboard = null;
  var originalParent = null;
  var originalNextSibling = null;
  var mobileHost = null;
  var originalRenderDashboardCharts = null;
  var chartOverrideInstalled = false;

  function isPhone() {
    return window.PETATOEDeviceProfile
      ? window.PETATOEDeviceProfile.isMobileDevice()
      : window.matchMedia(PHONE_QUERY).matches;
  }

  function t(key, fallback) {
    try {
      if (typeof window.petT === 'function') return window.petT(key, fallback);
      if (window.PETATOEI18N && typeof window.PETATOEI18N.t === 'function') return window.PETATOEI18N.t(key, fallback);
    } catch (_) {}
    return fallback;
  }

  function ensureMobileDashboardHost() {
    var root = document.getElementById('petV10MobileRoot');
    if (!root) return null;
    mobileHost = document.getElementById('petV10MobileDashboardHost');
    if (!mobileHost) {
      mobileHost = document.createElement('main');
      mobileHost.id = 'petV10MobileDashboardHost';
      mobileHost.className = 'pet-v10-mobile-dashboard-host';
      mobileHost.setAttribute('data-pet-mobile-presentation', 'dashboard');
      root.appendChild(mobileHost);
    }
    return mobileHost;
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
    var filters = dashboard.querySelector(':scope > .filters');
    var yearSelect = document.getElementById('fYear');
    var payrollAccess = dashboard.querySelector(':scope > .payroll-home-access');
    var ytdBanner = document.getElementById('ytdBanner');
    if (!filters || !yearSelect || !payrollAccess) return;

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
    var filters = dashboard.querySelector(':scope > .filters');
    var yearSelect = document.getElementById('fYear');
    var yearControl = dashboard.querySelector(':scope > .pet-v10-dashboard-year-control');
    if (filters && yearSelect && yearSelect.parentElement !== filters) filters.insertBefore(yearSelect, filters.firstChild);
    if (yearControl) yearControl.remove();
    dashboard.removeAttribute('data-pet-v10-dashboard-ready');
    removeLegacyMobileDashboardControls();
  }

  function destroyDashboardCharts() {
    ['monthlyChart', 'servicesChart', 'clientsChart', 'payChart'].forEach(function (id) {
      try {
        if (window.Chart && typeof window.Chart.getChart === 'function') {
          var instance = window.Chart.getChart(id);
          if (instance) instance.destroy();
        }
      } catch (_) {}
    });
  }

  function installLightweightChartGuard() {
    if (chartOverrideInstalled || typeof window.renderDashboardCharts !== 'function') return;
    originalRenderDashboardCharts = window.renderDashboardCharts;
    window.renderDashboardCharts = function (data) {
      if (isPhone()) {
        destroyDashboardCharts();
        return;
      }
      return originalRenderDashboardCharts.call(this, data);
    };
    chartOverrideInstalled = true;
  }

  function mountIndependentMobileDashboard() {
    dashboard = document.getElementById('dashboard');
    var host = ensureMobileDashboardHost();
    if (!dashboard || !host) return;

    if (!originalParent) {
      originalParent = dashboard.parentNode;
      originalNextSibling = dashboard.nextSibling;
    }
    if (dashboard.parentNode !== host) host.appendChild(dashboard);
    dashboard.classList.add('pet-v10-independent-dashboard');
    dashboard.setAttribute('data-pet-mobile-dashboard', 'independent');
    configureMobileDashboardFilters();
    installLightweightChartGuard();
    destroyDashboardCharts();
  }

  function restoreDesktopDashboard() {
    dashboard = document.getElementById('dashboard');
    if (!dashboard || !originalParent) return;
    if (dashboard.parentNode !== originalParent) {
      if (originalNextSibling && originalNextSibling.parentNode === originalParent) originalParent.insertBefore(dashboard, originalNextSibling);
      else originalParent.appendChild(dashboard);
    }
    dashboard.classList.remove('pet-v10-independent-dashboard');
    dashboard.removeAttribute('data-pet-mobile-dashboard');
    restoreDesktopDashboardFilters();
  }

  function syncOwnership() {
    if (isPhone()) {
      document.body.classList.add('pet-v10-mobile', 'pet-v10-independent-dashboard-active');
      mountIndependentMobileDashboard();
    } else {
      document.body.classList.remove('pet-v10-mobile', 'pet-v10-independent-dashboard-active', 'pet-v10-dashboard-filter-open');
      restoreDesktopDashboard();
    }
  }

  function boot() {
    syncOwnership();
    document.addEventListener('petatoe:tabchange', function (event) {
      var tab = event && event.detail && event.detail.tabId;
      if (isPhone() && tab === 'dashboard') window.requestAnimationFrame(mountIndependentMobileDashboard);
    });
    document.addEventListener('petatoe:records-changed', function () {
      if (isPhone()) window.requestAnimationFrame(function () {
        installLightweightChartGuard();
        destroyDashboardCharts();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.addEventListener('resize', syncOwnership, { passive: true });
  window.addEventListener('orientationchange', function () { window.setTimeout(syncOwnership, 80); }, { passive: true });
})();
