/*
 * PETATOE Blocking Scripts Deep Optimization v6.5.2
 * Purpose: Controlled lazy-loading real pilot for low-risk audit helper scripts.
 * Scope: SAFE. Removes only read-only audit helpers from initial blocking load and loads them after window load/idle. Does not mutate Router / Storage / Permissions.
 */
(function () {
  'use strict';

  var VERSION = 'v6.5.2';
  var registry = window.PETATOELazyLoadingEnterprise || {};
  var loaded = Object.create(null);
  var loading = Object.create(null);
  var prefetchInserted = Object.create(null);
  var events = [];


  var BOOT_DEFER_PHASE1_SCRIPTS = [
    { src: 'router/router-controller-shadow-safe.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/module-registry-shadow.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/module-ownership-shadow.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/reports-shadow-ownership-validation.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/payroll-shadow-ownership-validation.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/warehouse-shadow-ownership-validation.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/treasury-shadow-ownership-validation.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/operations-shadow-ownership-validation.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/router-adapter-shadow.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/lazy-loading-pilot-safe.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/lazy-loading-readiness-gate.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/full-shadow-system-audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/router-ownership-audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/router-adapter-shadow-layer.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/router-stability-validation.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/dashboard-route-ownership-pilot.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'router/router-finalization-audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'components/lazy-loading-pilot.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'warehouses/warehouse-shadow-audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'warehouses/warehouse-consolidated-facade-probe.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'enterprise/enterprise-final-baseline-audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'children-expenses/children-expenses-controlled-migration.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'children-expenses/children-expenses-final-stability-audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'settings/audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'operations/operations-history-shadow.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'operations/operations-controlled-migration.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'operations/operations-final-stability-audit.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'operations/operations-shadow-harness.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'operations/operations-performance-optimizer.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'diagnostics/runtime-hardening.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
    { src: 'performance/lazy-loading-enterprise.js', mode: 'defer-script-tag', reason: 'non-critical audit/shadow/diagnostic helper moved out of blocking parser path' },
  ];
  var BOOT_DEFER_PHASE2_SCRIPTS = [
    { src: 'inline-extracted/datalist-alert-guard.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'inline-extracted/settings-menu-dedupe.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'inline-extracted/settings-collapsed-default.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'inline-extracted/payroll-visibility-guard.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/filters-finalization.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/runtime-ui-stabilization.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/liquid-glass-ui.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/phase6f-safe-inline-cleanup.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'inline-extracted/contract-candidates-full-export.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/colors.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/theme-engine.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/theme-manager.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/dark-mode.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/light-mode.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/cards.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/forms.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' },
    { src: 'components/theme/tables.js', mode: 'defer-script-tag', reason: 'Phase 2 low-risk late UI/theme/helper moved out of blocking parser path' }
  ];




  var BOOT_DEFER_PHASE3_SCRIPTS = [
    { src: 'payroll/payroll-read-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; payroll-core remains blocking' },
    { src: 'payroll/payroll-computed-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; payroll-core remains blocking' },
    { src: 'payroll/payroll-view-model-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; payroll-core remains blocking' },
    { src: 'payroll/payroll-render-bridge.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; payroll-core remains blocking' },
    { src: 'payroll/payroll-event-bridge.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; payroll-core remains blocking' },
    { src: 'payroll/payroll-parallel-validation.js', mode: 'defer-script-tag', reason: 'Phase 3 validation helper moved out of blocking parser path' },
    { src: 'treasury/treasury-read-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; treasury-core remains blocking' },
    { src: 'treasury/treasury-computed-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; treasury-core remains blocking' },
    { src: 'treasury/treasury-view-model-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; treasury-core remains blocking' },
    { src: 'treasury/treasury-render-bridge.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; treasury-core remains blocking' },
    { src: 'treasury/treasury-event-bridge.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; treasury-core remains blocking' },
    { src: 'treasury/treasury-parallel-validation.js', mode: 'defer-script-tag', reason: 'Phase 3 validation helper moved out of blocking parser path' },
    { src: 'warehouses/warehouse-read-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; warehouse-core remains blocking' },
    { src: 'warehouses/warehouse-computed-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; warehouse-core remains blocking' },
    { src: 'warehouses/warehouse-view-model-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; warehouse-core remains blocking' },
    { src: 'warehouses/warehouse-render-snapshot-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 snapshot facade moved out of blocking parser path' },
    { src: 'warehouses/warehouse-render-bridge.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; warehouse-core remains blocking' },
    { src: 'warehouses/warehouse-event-bridge.js', mode: 'defer-script-tag', reason: 'Phase 3 facade/bridge layer moved out of blocking parser path; warehouse-core remains blocking' },
    { src: 'warehouses/warehouse-parallel-validation.js', mode: 'defer-script-tag', reason: 'Phase 3 validation helper moved out of blocking parser path' },
    { src: 'children-expenses/children-expenses-facade.js', mode: 'defer-script-tag', reason: 'Phase 3 facade layer moved out of blocking parser path; children legacy/core remains blocking' },
    { src: 'performance/finance-performance-optimizer.js', mode: 'defer-script-tag', reason: 'Phase 3 optimizer helper moved out of blocking parser path' }
  ];

  var REAL_PILOT_SCRIPTS = [
    { area: 'audit-helper', src: 'inline-extracted/export-audit-helper.js', priority: 'low', mode: 'real-lazy-after-load', reason: 'read-only export audit helper; not required for initial boot' },
    { area: 'audit-helper', src: 'inline-extracted/phase4-3-audit.js', priority: 'low', mode: 'real-lazy-after-load', reason: 'read-only QA helper; not required for initial boot' },
    { area: 'audit-helper', src: 'inline-extracted/phase4-4-audit.js', priority: 'low', mode: 'real-lazy-after-load', reason: 'read-only final audit helper; not required for initial boot' },
    { area: 'audit-helper', src: 'inline-extracted/phase5-prelaunch-audit.js', priority: 'low', mode: 'real-lazy-after-load', reason: 'read-only prelaunch audit helper; not required for initial boot' }
  ];
  var realPilotResults = [];

  var SMART_REPORTS_LAZY_SCRIPTS = [
    { area: 'smart-reports', src: 'inline-extracted/smart-reports-filters-audit-helper.js', priority: 'low', mode: 'smart-route-lazy', reason: 'read-only smart reports filter audit helper; safe to load on smart reports open/idle' },
    { area: 'smart-reports', src: 'smart/smart-reports-audit.js', priority: 'low', mode: 'smart-route-lazy', reason: 'smart reports audit surface; not required for initial application boot' },
    { area: 'smart-reports', src: 'smart/smart-reports-benchmark.js', priority: 'low', mode: 'smart-route-lazy', reason: 'benchmark utility; diagnostic-only and not required for initial boot' },
    { area: 'smart-reports', src: 'smart/smart-reports-hardening.js', priority: 'low', mode: 'smart-route-lazy', reason: 'hardening helper; loaded after smart reports route is requested' }
  ];
  var smartReportsLazyResults = [];
  var smartReportsLazyStarted = false;

  var ENTERPRISE_CANDIDATES = [
    { area: 'operations', src: 'operations/operations-legacy-engine.js', priority: 'high', mode: 'candidate-only', reason: 'largest legacy operational surface' },
    { area: 'smart-reports', src: 'smart/smart-reports-core.js', priority: 'high', mode: 'candidate-only', reason: 'heavy reports core; requires route-level guard before extraction' },
    { area: 'sales-invoice', src: 'sales/sales-invoice-report.js', priority: 'medium', mode: 'candidate-only', reason: 'large report renderer; export/report actions only' },
    { area: 'warehouse', src: 'warehouses/warehouse-core.js', priority: 'medium', mode: 'candidate-only', reason: 'warehouse module surface' },
    { area: 'payroll', src: 'payroll/payroll-core.js', priority: 'medium', mode: 'candidate-only', reason: 'payroll module surface' },
    { area: 'chart', src: 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js', priority: 'medium', mode: 'library-candidate', reason: 'large library used only where charts render' },
    { area: 'xlsx', src: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', priority: 'medium', mode: 'library-candidate', reason: 'large library used only during Excel export/import' }
  ];

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return String(Date.now()); }
  }

  function log(level, source, payload) {
    var event = { at: nowIso(), level: level || 'info', source: source || 'lazy-loading-enterprise', payload: payload || {} };
    events.push(event);
    if (events.length > 150) { events.shift(); }
    try {
      var d = window.PETATOEDiagnostics;
      if (d && typeof d[level] === 'function') { d[level](source || 'lazy-loading-enterprise', payload || {}); }
      else if (d && typeof d.info === 'function') { d.info(source || 'lazy-loading-enterprise', payload || {}); }
    } catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('performance/lazy-loading-enterprise.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }

  function normalizeSrc(src) {
    try {
      var a = document.createElement('a');
      a.href = src;
      return a.href;
    } catch (e) { return String(src || ''); }
  }

  function isScriptPresent(src) {
    var target = normalizeSrc(src);
    try {
      var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]'));
      return scripts.some(function (script) { return normalizeSrc(script.getAttribute('src') || script.src) === target; });
    } catch (e) { return false; }
  }

  function markExistingScripts() {
    try {
      Array.prototype.slice.call(document.querySelectorAll('script[src]')).forEach(function (script) {
        var src = script.getAttribute('src') || script.src || '';
        loaded[normalizeSrc(src)] = true;
      });
    } catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('performance/lazy-loading-enterprise.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
  }

  function insertPrefetch(src) {
    var normalized = normalizeSrc(src);
    if (!normalized || prefetchInserted[normalized] || isScriptPresent(src)) { return false; }
    try {
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'script';
      link.href = src;
      link.setAttribute('data-petatoe-lazy-prefetch', VERSION);
      document.head.appendChild(link);
      prefetchInserted[normalized] = true;
      return true;
    } catch (e) {
      log('warn', 'lazy-prefetch-failed', { src: src, message: e && e.message ? e.message : String(e) });
      return false;
    }
  }

  function safeIdle(callback) {
    try {
      if (typeof window.requestIdleCallback === 'function') {
        return window.requestIdleCallback(callback, { timeout: 2500 });
      }
    } catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('performance/lazy-loading-enterprise.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return window.setTimeout(callback, 900);
  }

  function warmupCandidates(options) {
    options = options || {};
    var mode = options.mode || 'same-origin-prefetch';
    var inserted = 0;
    ENTERPRISE_CANDIDATES.forEach(function (candidate) {
      var isRemote = /^https?:\/\//i.test(candidate.src || '');
      if (mode === 'same-origin-prefetch' && isRemote) { return; }
      if (insertPrefetch(candidate.src)) { inserted++; }
    });
    log('info', 'lazy-warmup-candidates', { mode: mode, inserted: inserted });
    return inserted;
  }

  function ensureScript(src, options) {
    options = options || {};
    var normalized = normalizeSrc(src);
    markExistingScripts();
    if (loaded[normalized] || isScriptPresent(src)) {
      loaded[normalized] = true;
      return Promise.resolve({ src: src, status: 'already-loaded' });
    }
    if (loading[normalized]) { return loading[normalized]; }
    loading[normalized] = new Promise(function (resolve, reject) {
      try {
        var script = document.createElement('script');
        script.src = src;
        script.async = options.async !== false;
        script.defer = !!options.defer;
        script.setAttribute('data-petatoe-lazy-loaded', VERSION);
        script.onload = function () {
          loaded[normalized] = true;
          delete loading[normalized];
          log('info', 'lazy-script-loaded', { src: src });
          resolve({ src: src, status: 'loaded' });
        };
        script.onerror = function () {
          delete loading[normalized];
          var error = new Error('Failed to lazy load script: ' + src);
          log('error', 'lazy-script-failed', { src: src });
          reject(error);
        };
        (document.head || document.documentElement).appendChild(script);
      } catch (e) {
        delete loading[normalized];
        log('error', 'lazy-script-exception', { src: src, message: e && e.message ? e.message : String(e) });
        reject(e);
      }
    });
    return loading[normalized];
  }



  function runRealPilot(options) {
    options = options || {};
    var list = options.scripts || REAL_PILOT_SCRIPTS;
    var sequential = Promise.resolve();
    list.forEach(function (item) {
      sequential = sequential.then(function () {
        return ensureScript(item.src, { async: true }).then(function (result) {
          realPilotResults.push({ src: item.src, status: result.status || 'loaded', area: item.area, at: nowIso() });
          return result;
        }).catch(function (err) {
          var payload = { src: item.src, area: item.area, message: err && err.message ? err.message : String(err) };
          realPilotResults.push({ src: item.src, status: 'failed', area: item.area, at: nowIso(), message: payload.message });
          log('warn', 'lazy-real-pilot-script-failed', payload);
          return payload;
        });
      });
    });
    return sequential.then(function () {
      log('info', 'lazy-real-pilot-complete', { requested: list.length, results: realPilotResults.slice(-list.length) });
      return realPilotResults.slice();
    });
  }


  function runSmartReportsLazy(options) {
    options = options || {};
    if (smartReportsLazyStarted && !options.force) {
      return Promise.resolve(smartReportsLazyResults.slice());
    }
    smartReportsLazyStarted = true;
    var list = options.scripts || SMART_REPORTS_LAZY_SCRIPTS;
    var sequential = Promise.resolve();
    list.forEach(function (item) {
      sequential = sequential.then(function () {
        return ensureScript(item.src, { async: true }).then(function (result) {
          smartReportsLazyResults.push({ src: item.src, status: result.status || 'loaded', area: item.area, at: nowIso() });
          return result;
        }).catch(function (err) {
          var payload = { src: item.src, area: item.area, message: err && err.message ? err.message : String(err) };
          smartReportsLazyResults.push({ src: item.src, status: 'failed', area: item.area, at: nowIso(), message: payload.message });
          log('warn', 'smart-reports-lazy-script-failed', payload);
          return payload;
        });
      });
    });
    return sequential.then(function () {
      log('info', 'smart-reports-lazy-complete', { requested: list.length, results: smartReportsLazyResults.slice(-list.length) });
      return smartReportsLazyResults.slice();
    });
  }

  function scheduleSmartReportsLazy(reason) {
    try {
      safeIdle(function () { runSmartReportsLazy({ reason: reason || 'idle' }); });
      return true;
    } catch (e) {
      log('warn', 'smart-reports-lazy-schedule-failed', { reason: reason || 'unknown', message: e && e.message ? e.message : String(e) });
      return false;
    }
  }

  function bindSmartReportsTriggers() {
    try {
      document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || !target.closest) { return; }
        var smartTarget = target.closest('[data-tab="smart"], #smartReportsScreen, #smart');
        var clickable = target.closest('[onclick]');
        var inlineAction = clickable ? String(clickable.getAttribute('onclick') || '') : '';
        if (smartTarget || inlineAction.indexOf('smart') !== -1) {
          scheduleSmartReportsLazy('smart-user-interaction');
        }
      }, true);
    } catch (e) {
      log('warn', 'smart-reports-lazy-trigger-bind-failed', { message: e && e.message ? e.message : String(e) });
    }
  }

  function getSnapshot() {
    markExistingScripts();
    var present = ENTERPRISE_CANDIDATES.map(function (candidate) {
      var exists = isScriptPresent(candidate.src);
      var prefetched = !!prefetchInserted[normalizeSrc(candidate.src)];
      return Object.assign({}, candidate, {
        presentInInitialLoad: exists,
        prefetched: prefetched,
        extractionStatus: exists ? 'loaded-by-baseline' : (prefetched ? 'prefetched-not-executed' : 'not-loaded')
      });
    });
    var initialLoaded = present.filter(function (item) { return item.presentInInitialLoad; }).length;
    var prefetched = present.filter(function (item) { return item.prefetched; }).length;
    var pilotPresent = REAL_PILOT_SCRIPTS.map(function (candidate) {
      return Object.assign({}, candidate, {
        presentInInitialLoad: false,
        loadedAfterBoot: !!loaded[normalizeSrc(candidate.src)] || isScriptPresent(candidate.src),
        latestStatus: (realPilotResults.filter(function (r) { return r.src === candidate.src; }).slice(-1)[0] || {}).status || 'pending-after-load'
      });
    });
    var smartPresent = SMART_REPORTS_LAZY_SCRIPTS.map(function (candidate) {
      return Object.assign({}, candidate, {
        presentInInitialLoad: false,
        loadedOnSmartRoute: !!loaded[normalizeSrc(candidate.src)] || isScriptPresent(candidate.src),
        latestStatus: (smartReportsLazyResults.filter(function (r) { return r.src === candidate.src; }).slice(-1)[0] || {}).status || (smartReportsLazyStarted ? 'pending-smart-route' : 'waiting-for-smart-route')
      });
    });
    return {
      version: VERSION,
      enabled: true,
      mode: 'blocking-scripts-deep-optimization-phase3',
      safeMode: true,
      initialCandidateCount: present.length,
      candidatesStillInInitialLoad: initialLoaded,
      prefetchedCandidates: prefetched,
      realPilotScriptCount: REAL_PILOT_SCRIPTS.length,
      realPilotLoadedCount: pilotPresent.filter(function (item) { return item.loadedAfterBoot; }).length,
      realPilotScripts: pilotPresent,
      smartReportsLazyScriptCount: SMART_REPORTS_LAZY_SCRIPTS.length,
      smartReportsLazyLoadedCount: smartPresent.filter(function (item) { return item.loadedOnSmartRoute; }).length,
      smartReportsLazyStarted: smartReportsLazyStarted,
      smartReportsLazyScripts: smartPresent,
      bootDeferPhase1ScriptCount: BOOT_DEFER_PHASE1_SCRIPTS.length,
      bootDeferPhase1Scripts: BOOT_DEFER_PHASE1_SCRIPTS.slice(),
      bootDeferPhase2ScriptCount: BOOT_DEFER_PHASE2_SCRIPTS.length,
      bootDeferPhase2Scripts: BOOT_DEFER_PHASE2_SCRIPTS.slice(),
      bootDeferPhase3ScriptCount: BOOT_DEFER_PHASE3_SCRIPTS.length,
      bootDeferPhase3Scripts: BOOT_DEFER_PHASE3_SCRIPTS.slice(),
      initialBlockingScriptsReducedBy: REAL_PILOT_SCRIPTS.length + SMART_REPORTS_LAZY_SCRIPTS.length + BOOT_DEFER_PHASE1_SCRIPTS.length + BOOT_DEFER_PHASE2_SCRIPTS.length + BOOT_DEFER_PHASE3_SCRIPTS.length,
      dynamicLoadedCount: Object.keys(loaded).length,
      pendingLoads: Object.keys(loading).length,
      candidates: present,
      events: events.slice(-30),
      recommendation: 'v6.5.2 Phase 3: تم توسيع defer ليشمل طبقات facade/bridge منخفضة المخاطر مع إبقاء ملفات core الأساسية blocking وبدون تغيير Router / Storage / Permissions.'
    };
  }

  registry.version = VERSION;
  registry.ensureScript = ensureScript;
  registry.warmupCandidates = warmupCandidates;
  registry.runRealPilot = runRealPilot;
  registry.runSmartReportsLazy = runSmartReportsLazy;
  registry.scheduleSmartReportsLazy = scheduleSmartReportsLazy;
  registry.getSnapshot = getSnapshot;
  registry.getCandidates = function () { return ENTERPRISE_CANDIDATES.slice(); };
  registry.getRealPilotScripts = function () { return REAL_PILOT_SCRIPTS.slice(); };
  registry.getSmartReportsLazyScripts = function () { return SMART_REPORTS_LAZY_SCRIPTS.slice(); };
  registry.ping = function () { return { ok: true, version: VERSION, snapshot: getSnapshot() }; };

  window.PETATOELazyLoadingEnterprise = registry;

  markExistingScripts();
  bindSmartReportsTriggers();
  if (document.readyState === 'complete') {
    safeIdle(function () { warmupCandidates({ mode: 'same-origin-prefetch' }); });
    safeIdle(function () { runRealPilot(); });
    safeIdle(function () { scheduleSmartReportsLazy('post-load-idle-safety'); });
  } else {
    window.addEventListener('load', function () {
      safeIdle(function () { warmupCandidates({ mode: 'same-origin-prefetch' }); });
      safeIdle(function () { runRealPilot(); });
      safeIdle(function () { scheduleSmartReportsLazy('post-load-idle-safety'); });
    }, { once: true });
  }

  log('info', 'lazy-loading-enterprise-ready', { version: VERSION, candidates: ENTERPRISE_CANDIDATES.length, smartReportsLazy: SMART_REPORTS_LAZY_SCRIPTS.length });
})();
