/* PETATOE Mobile Enterprise UI v10 — M5 Experience, Accessibility & Performance */
(function () {
  'use strict';

  if (window.__PETATOE_MOBILE_V10_EXPERIENCE__) return;
  window.__PETATOE_MOBILE_V10_EXPERIENCE__ = true;

  var mq = window.matchMedia('(max-width: 760px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var revealObserver = null;
  var mutationObserver = null;
  var routeTimer = 0;
  var booted = false;
  var pull = { active: false, startY: 0, distance: 0, eligible: false };

  function isPhone() { return mq.matches; }
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function createChrome() {
    if (!document.querySelector('.pet-v10-pull-indicator')) {
      var pullIndicator = document.createElement('div');
      pullIndicator.className = 'pet-v10-pull-indicator';
      pullIndicator.setAttribute('aria-hidden', 'true');
      pullIndicator.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.34 5.66"/><path d="M20 4v7h-7"/></svg>';
      document.body.appendChild(pullIndicator);
    }
    if (!document.querySelector('.pet-v10-route-progress')) {
      var progress = document.createElement('div');
      progress.className = 'pet-v10-route-progress';
      progress.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progress);
    }
  }

  function routeStart() {
    if (!isPhone()) return;
    window.clearTimeout(routeTimer);
    document.body.classList.add('pet-v10-route-changing');
    var active = document.querySelector('.panel.active');
    if (active) active.setAttribute('aria-busy', 'true');
    routeTimer = window.setTimeout(routeEnd, 420);
  }

  function routeEnd() {
    document.body.classList.remove('pet-v10-route-changing');
    document.querySelectorAll('.panel[aria-busy="true"]').forEach(function (panel) {
      panel.removeAttribute('aria-busy');
    });
  }

  function isPullExcluded(target) {
    if (document.body.classList.contains('pet-v10-dashboard-filter-open') || document.body.classList.contains('pet-v10-drawer-open')) return true;
    return !!(target && target.closest && target.closest(
      'input, textarea, select, [contenteditable="true"], dialog, .modal, .pet-v10-drawer, ' +
      '.pet-v10-dashboard-filter-open, .petatoe-v10-table-viewport, .petatoe-v10-management-table, ' +
      '.pet-v10-report-rail, .pet-v10-management-rail, [data-no-pull-refresh]'
    ));
  }

  function pullReset() {
    pull.active = false;
    pull.eligible = false;
    pull.distance = 0;
    document.body.classList.remove('pet-v10-pulling');
    document.documentElement.style.removeProperty('--pet-v10-pull-offset');
    document.documentElement.style.removeProperty('--pet-v10-pull-rotation');
  }

  function onTouchStart(event) {
    if (!isPhone() || !isStandalone() || window.scrollY > 0 || event.touches.length !== 1) return;
    if (isPullExcluded(event.target)) return;
    pull.active = true;
    pull.eligible = true;
    pull.startY = event.touches[0].clientY;
    pull.distance = 0;
  }

  function onTouchMove(event) {
    if (!pull.active || !pull.eligible || event.touches.length !== 1) return;
    var raw = event.touches[0].clientY - pull.startY;
    if (raw <= 0 || window.scrollY > 0) { pullReset(); return; }
    pull.distance = Math.min(112, raw * .56);
    if (pull.distance < 7) return;
    document.body.classList.add('pet-v10-pulling');
    document.documentElement.style.setProperty('--pet-v10-pull-offset', Math.round(pull.distance - 22) + 'px');
    document.documentElement.style.setProperty('--pet-v10-pull-rotation', Math.round(pull.distance * 3.1) + 'deg');
    if (event.cancelable) event.preventDefault();
  }

  function onTouchEnd() {
    if (!pull.active) return;
    var shouldRefresh = pull.distance >= 72;
    if (!shouldRefresh) { pullReset(); return; }
    document.body.classList.add('pet-v10-refreshing', 'pet-v10-pulling');
    window.setTimeout(function () { window.location.reload(); }, 180);
  }

  function reveal(node) {
    if (!node || node.nodeType !== 1 || node.classList.contains('pet-v10-reveal-target')) return;
    node.classList.add('pet-v10-reveal-target');
    if (revealObserver) revealObserver.observe(node);
    else node.classList.add('pet-v10-in-view');
  }

  function scanRevealTargets(root) {
    if (!isPhone()) return;
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(
      '.panel.active .card, .panel.active .pet-v10-report-card, .panel.active .pet-v10-management-card, ' +
      '.panel.active .stat-card, .panel.active .kpi-card'
    ).forEach(reveal);
  }

  function setupRevealObserver() {
    if (revealObserver || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('pet-v10-in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '80px 0px', threshold: .01 });
  }

  function syncMotionPreference() {
    document.body.classList.toggle('pet-v10-motion-enabled', isPhone() && !reduceMotion.matches);
  }

  function enhanceAccessibility() {
    var drawer = document.querySelector('.pet-v10-drawer');
    if (drawer) {
      drawer.setAttribute('role', 'dialog');
      drawer.setAttribute('aria-modal', 'true');
    }
    document.querySelectorAll('.pet-v10-bottom-nav button, .pet-v10-header-actions button, .pet-v10-header-menu').forEach(function (button) {
      if (!button.hasAttribute('aria-disabled')) button.setAttribute('aria-disabled', String(button.disabled));
    });
  }

  function boot() {
    if (!isPhone() || booted) return;
    booted = true;
    document.body.classList.add('pet-v10-mobile');
    createChrome();
    setupRevealObserver();
    syncMotionPreference();
    enhanceAccessibility();
    scanRevealTargets(document);

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', pullReset, { passive: true });

    document.addEventListener('click', function (event) {
      if (!isPhone()) return;
      if (event.target.closest('[data-tab], .pet-v10-nav-btn, .pet-v10-drawer-item, .nav-item, .subnav-item')) routeStart();
    }, true);

    document.addEventListener('petatoe:tabchange', function () {
      window.requestAnimationFrame(function () {
        routeEnd();
        scanRevealTargets(document);
      });
    });

    mutationObserver = new MutationObserver(function (records) {
      if (!isPhone()) return;
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) scanRevealTargets(node);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  function viewportChange(event) {
    if (event.matches) {
      if (!document.body) return;
      boot();
    } else {
      pullReset();
      routeEnd();
      document.body.classList.remove('pet-v10-motion-enabled');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  if (mq.addEventListener) mq.addEventListener('change', viewportChange);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', syncMotionPreference);
})();
