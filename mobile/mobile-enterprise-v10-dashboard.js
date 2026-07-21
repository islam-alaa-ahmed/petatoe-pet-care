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

  function icon() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/><circle cx="7" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>';
  }

  function activeFilterCount() {
    if (!filters) return 0;
    var count = 0;
    filters.querySelectorAll('select').forEach(function (select) {
      var value = String(select.value || '');
      if (value && value !== 'all') count += 1;
    });
    return count;
  }

  function updateTrigger() {
    if (!trigger || !countBadge) return;
    var count = activeFilterCount();
    countBadge.textContent = String(count);
    countBadge.hidden = count === 0;
    var label = trigger.querySelector('.pet-v10-dashboard-filter-label');
    if (label) label.textContent = t('dashboard.period', 'Period');
    trigger.setAttribute('aria-label', t('dashboard.period', 'Period'));
  }

  function closeFilters() {
    document.body.classList.remove('pet-v10-dashboard-filter-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function openFilters() {
    document.body.classList.add('pet-v10-dashboard-filter-open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function buildFilterSheet() {
    dashboard = document.getElementById('dashboard');
    if (!dashboard || dashboard.dataset.petV10DashboardReady === '1') return;
    filters = dashboard.querySelector(':scope > .filters');
    if (!filters) return;

    var toolbar = document.createElement('div');
    toolbar.className = 'pet-v10-dashboard-toolbar';

    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'pet-v10-dashboard-filter-trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = icon() + '<span class="pet-v10-dashboard-filter-label"></span><span class="pet-v10-dashboard-filter-count" hidden>0</span>';
    toolbar.appendChild(trigger);
    filters.parentNode.insertBefore(toolbar, filters);

    var backdrop = document.createElement('div');
    backdrop.className = 'pet-v10-dashboard-filter-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(backdrop);

    trigger.addEventListener('click', function () {
      if (document.body.classList.contains('pet-v10-dashboard-filter-open')) closeFilters();
      else openFilters();
    });
    backdrop.addEventListener('click', closeFilters);
    filters.addEventListener('change', updateTrigger);
    filters.addEventListener('click', function (event) {
      if (event.target.closest('[data-pet-action="dashboard-reset"]')) {
        window.setTimeout(function () { updateTrigger(); closeFilters(); }, 0);
      }
    });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeFilters(); });
    dashboard.dataset.petV10DashboardReady = '1';
    updateTrigger();
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
    buildFilterSheet();
    window.setTimeout(tuneDashboardCharts, 100);
    window.setTimeout(tuneDashboardCharts, 700);
    window.setTimeout(tuneDashboardCharts, 1800);

    if (dashboard) {
      var observer = new MutationObserver(function () { window.requestAnimationFrame(tuneDashboardCharts); });
      observer.observe(dashboard, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.addEventListener('resize', function () {
    if (isPhone()) { document.body.classList.add('pet-v10-mobile'); tuneDashboardCharts(); }
    else { document.body.classList.remove('pet-v10-mobile', 'pet-v10-dashboard-filter-open'); }
  }, { passive: true });
})();
