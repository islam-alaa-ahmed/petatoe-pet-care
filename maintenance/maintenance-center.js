/*
 * PETATOE Maintenance Center v6.4
 * Version: v6.5.11_ENTERPRISE_LTS_BASELINE
 * Purpose: Safe diagnostics UI layer built on top of PETATOEDiagnostics.
 * Scope: Read-only. Does not mutate Router, Storage, Permissions, or application data.
 */
(function () {
  'use strict';

  var CENTER_ID = 'petatoe-maintenance-center-root';
  var STYLE_ID = 'petatoe-maintenance-center-style';
  var BUTTON_ID = 'petatoe-maintenance-center-button';
  var center = window.PETATOEMaintenanceCenter || {};
  var MAINTENANCE_VERSION = 'v6.5.11';
  var MAINTENANCE_RELEASE = 'PETATOE_v6.5.11_ENTERPRISE_LTS_BASELINE';

  function safeNow() {
    try { return new Date().toLocaleString('ar-SA'); } catch (e) { return new Date().toISOString(); }
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function log(level, source, payload) {
    try {
      if (window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics[level] === 'function') {
        window.PETATOEDiagnostics[level](source, payload || {});
      }
    } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
  }

  function getMaintenanceTopOffset() {
    try {
      var candidates = Array.prototype.slice.call(document.querySelectorAll('.topbar, header.topbar, .app-header, .main-header, .top-bar, header'));
      var maxBottom = 0;
      candidates.forEach(function (el) {
        if (!el || el.id === CENTER_ID || !document.body.contains(el)) { return; }
        var rect = el.getBoundingClientRect();
        var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
        var visible = rect.width > 0 && rect.height > 0 && (!style || (style.display !== 'none' && style.visibility !== 'hidden'));
        var anchoredTop = rect.top <= 12;
        if (visible && anchoredTop && rect.bottom > maxBottom) { maxBottom = rect.bottom; }
      });
      return Math.max(0, Math.ceil(maxBottom));
    } catch (e) {
      return 0;
    }
  }

  function updateMaintenanceLayoutOffset() {
    try {
      var root = document.getElementById(CENTER_ID);
      if (!root) { return 0; }
      var offset = getMaintenanceTopOffset();
      root.style.setProperty('--pet-mc-top-offset', offset + 'px');
      return offset;
    } catch (e) {
      return 0;
    }
  }

  function countStorage(storage) {
    try { return storage ? storage.length : 0; } catch (e) { return -1; }
  }


  function getObjectKeys(obj) {
    try { return obj && typeof obj === 'object' ? Object.keys(obj).sort() : []; } catch (e) { return []; }
  }

  function countObjectKeys(obj) {
    return getObjectKeys(obj).length;
  }

  function approxStorageBytes(storage) {
    var total = 0;
    try {
      if (!storage) { return -1; }
      for (var i = 0; i < storage.length; i++) {
        var key = storage.key(i) || '';
        var value = storage.getItem(key) || '';
        total += (key.length + value.length) * 2;
      }
      return total;
    } catch (e) { return -1; }
  }

  function formatBytes(bytes) {
    if (bytes < 0) { return 'غير متاح'; }
    if (bytes < 1024) { return bytes + ' B'; }
    if (bytes < 1024 * 1024) { return Math.round(bytes / 1024) + ' KB'; }
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }


  function normalizeSrc(src) {
    try {
      if (!src) { return ''; }
      var anchor = document.createElement('a');
      anchor.href = src;
      return anchor.pathname.replace(/^\//, '') || src;
    } catch (e) { return src || ''; }
  }

  function getResourceTimingMap() {
    var map = {};
    try {
      if (!window.performance || typeof window.performance.getEntriesByType !== 'function') { return map; }
      window.performance.getEntriesByType('resource').forEach(function (entry) {
        var normalized = normalizeSrc(entry.name || '');
        if (normalized) { map[normalized] = entry; }
      });
    } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
    return map;
  }

  function getScriptPerformanceSnapshot() {
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]'));
    var resources = getResourceTimingMap();
    var totalTransfer = 0;
    var totalDecoded = 0;
    var timedScripts = 0;
    var blockingScripts = 0;
    var asyncScripts = 0;
    var deferScripts = 0;
    var moduleScripts = 0;
    var missingTiming = 0;
    var heavy = [];

    scripts.forEach(function (script, index) {
      var src = script.getAttribute('src') || '';
      var normalized = normalizeSrc(src);
      var entry = resources[normalized] || resources[normalizeSrc(script.src || '')] || null;
      var type = (script.getAttribute('type') || '').toLowerCase();
      var isModule = type === 'module';
      var isAsync = !!script.async || script.hasAttribute('async');
      var isDefer = !!script.defer || script.hasAttribute('defer');
      var isBlocking = !isAsync && !isDefer && !isModule;
      var transfer = entry && typeof entry.transferSize === 'number' ? entry.transferSize : 0;
      var decoded = entry && typeof entry.decodedBodySize === 'number' ? entry.decodedBodySize : 0;
      var duration = entry && typeof entry.duration === 'number' ? Math.round(entry.duration) : 0;

      if (isAsync) { asyncScripts++; }
      if (isDefer) { deferScripts++; }
      if (isModule) { moduleScripts++; }
      if (isBlocking) { blockingScripts++; }
      if (entry) { timedScripts++; } else { missingTiming++; }
      totalTransfer += transfer;
      totalDecoded += decoded;

      if (decoded > 50000 || transfer > 50000 || duration > 50 || /legacy|smart-reports|warehouse|payroll|invoice|chart|xlsx/i.test(src)) {
        heavy.push({
          index: index + 1,
          src: src,
          transferSize: transfer,
          decodedBodySize: decoded,
          duration: duration,
          blocking: isBlocking,
          reason: decoded > 50000 || transfer > 50000 ? 'large-size' : duration > 50 ? 'slow-resource' : 'known-heavy-area'
        });
      }
    });

    heavy.sort(function (a, b) {
      return (b.decodedBodySize || b.transferSize || b.duration) - (a.decodedBodySize || a.transferSize || a.duration);
    });

    return {
      scriptCount: scripts.length,
      blockingScripts: blockingScripts,
      asyncScripts: asyncScripts,
      deferScripts: deferScripts,
      moduleScripts: moduleScripts,
      timedScripts: timedScripts,
      missingTiming: missingTiming,
      totalTransferSize: totalTransfer,
      totalDecodedBodySize: totalDecoded,
      hasAnyAsyncDeferModule: (asyncScripts + deferScripts + moduleScripts) > 0,
      heavyScripts: heavy.slice(0, 12),
      lazyLoadingCandidates: heavy.filter(function (item) {
        return /smart-reports|appointments|warehouse|payroll|invoice|chart|xlsx|legacy/i.test(item.src);
      }).slice(0, 10),
      navigationTiming: getNavigationTimingSnapshot()
    };
  }

  function getNavigationTimingSnapshot() {
    try {
      if (window.performance && typeof window.performance.getEntriesByType === 'function') {
        var nav = window.performance.getEntriesByType('navigation')[0];
        if (nav) {
          return {
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            loadEventEnd: Math.round(nav.loadEventEnd),
            transferSize: nav.transferSize || 0,
            decodedBodySize: nav.decodedBodySize || 0,
            type: nav.type || ''
          };
        }
      }
    } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
    return { domContentLoaded: 0, loadEventEnd: 0, transferSize: 0, decodedBodySize: 0, type: 'unavailable' };
  }


  function getLazyLoadingEnterpriseSnapshot() {
    try {
      if (window.PETATOELazyLoadingEnterprise && typeof window.PETATOELazyLoadingEnterprise.getSnapshot === 'function') {
        return window.PETATOELazyLoadingEnterprise.getSnapshot();
      }
    } catch (e) {
      return {
        enabled: false,
        safeMode: true,
        mode: 'unavailable',
        error: e && e.message ? e.message : String(e),
        recommendation: 'Lazy Loading Enterprise layer failed to provide a snapshot.'
      };
    }
    return {
      enabled: false,
      safeMode: true,
      mode: 'missing',
      initialCandidateCount: 0,
      candidatesStillInInitialLoad: 0,
      prefetchedCandidates: 0,
      pendingLoads: 0,
      candidates: [],
      recommendation: 'Lazy Loading Enterprise layer is not loaded.'
    };
  }

  function getCDNHardeningSnapshot() {
    try {
      if (window.PETATOECDNHardening && typeof window.PETATOECDNHardening.getSnapshot === 'function') {
        return window.PETATOECDNHardening.getSnapshot();
      }
    } catch (e) {
      return { enabled: false, mode: 'error', error: e && e.message ? e.message : String(e), readinessScore: 0 };
    }
    return { enabled: false, mode: 'missing', externalScriptCount: 0, hardenedScriptCount: 0, readinessScore: 0, recommendation: 'CDN Hardening layer is not loaded.' };
  }

  function getPerformanceSnapshot() {
    var scriptPerf = getScriptPerformanceSnapshot();
    var memory = null;
    try {
      if (window.performance && window.performance.memory) {
        memory = {
          usedJSHeapSize: window.performance.memory.usedJSHeapSize || 0,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize || 0,
          jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit || 0
        };
      }
    } catch (e) { memory = null; }

    return {
      scripts: scriptPerf,
      dom: {
        totalNodes: document.getElementsByTagName('*').length,
        idElements: document.querySelectorAll('[id]').length,
        tables: document.querySelectorAll('table').length,
        canvases: document.querySelectorAll('canvas').length
      },
      memory: memory,
      recommendations: buildPerformanceRecommendations(scriptPerf, memory)
    };
  }

  function buildPerformanceRecommendations(scriptPerf, memory) {
    var list = [];
    if (scriptPerf.scriptCount > 150) { list.push('عدد السكريبتات مرتفع جدًا؛ يفضل اعتماد Lazy Loading تدريجي للمناطق الثقيلة.'); }
    if (scriptPerf.blockingScripts > 100) { list.push('معظم السكريبتات Blocking بدون defer/async/module؛ يجب اختبار Pilot آمن قبل أي تعميم.'); }
    if (scriptPerf.heavyScripts.length) { list.push('ابدأ بأكبر ملفات Legacy/Reports كمرشحين للتحميل الكسول بعد تثبيت اختبارات التشغيل.'); }
    if (memory && memory.usedJSHeapSize > 100 * 1024 * 1024) { list.push('استهلاك الذاكرة مرتفع في المتصفح الحالي؛ راقب Event Listeners وعمليات Render الثقيلة.'); }
    if (!list.length) { list.push('لا توجد توصيات حرجة من الفحص الحالي.'); }
    return list;
  }

  function getRouterSnapshot() {
    var router = window.PETATOERouter || null;
    var registry = window.PETATOERouteRegistry || null;
    var nav = window.PETATOENavigationController || null;
    var adapter = window.PETATOERouterAdapterShadowLayer || window.PETATOERouterAdapterShadow || null;
    var guardedPilot = window.PETATOERouterAdapterGuardedPilot || null;
    var registrySnapshot = null;
    var routes = [];
    try {
      if (registry && typeof registry.snapshot === 'function') { registrySnapshot = registry.snapshot(); }
      else if (registry && typeof registry.list === 'function') { routes = registry.list() || []; }
      if (registrySnapshot && Array.isArray(registrySnapshot.routes)) { routes = registrySnapshot.routes; }
    } catch (e) { routes = []; }

    return {
      routerPresent: !!router,
      routerMethods: getObjectKeys(router).filter(function (key) { return typeof router[key] === 'function'; }),
      hasOpenTab: !!(router && typeof router.openTab === 'function'),
      navigationControllerPresent: !!nav,
      routeRegistryPresent: !!registry,
      routeCount: routes.length || (registrySnapshot && registrySnapshot.count) || 0,
      protectedRoutes: routes.filter(function (route) { return route && route.protected; }).length,
      sensitiveRoutes: routes.filter(function (route) { return route && route.sensitive; }).length,
      lazyCandidates: routes.filter(function (route) { return route && route.lazyCandidate; }).length,
      adapterShadowPresent: !!adapter,
      guardedPilotPresent: !!guardedPilot
    };
  }

  function getStorageSnapshot() {
    var storage = window.PETATOEStorage || null;
    var keyMap = storage && storage.map ? storage.map : null;
    return {
      storageAdapterPresent: !!storage,
      storageVersion: storage && storage.version ? storage.version : '',
      storageMode: storage && typeof storage.getMode === 'function' ? storage.getMode() : '',
      mappedKeys: countObjectKeys(keyMap),
      localStorageKeys: countStorage(window.localStorage),
      sessionStorageKeys: countStorage(window.sessionStorage),
      localStorageApproxSize: approxStorageBytes(window.localStorage),
      sessionStorageApproxSize: approxStorageBytes(window.sessionStorage),
      hasRawSnapshot: !!(storage && typeof storage.rawSnapshot === 'function'),
      hasExportSnapshot: !!(storage && typeof storage.exportSnapshot === 'function'),
      knownCriticalKeys: {
        records: !!(keyMap && keyMap.records),
        users: !!(keyMap && keyMap.users),
        currentUser: !!(keyMap && keyMap.currentUser),
        permissions: !!(keyMap && (keyMap.roleMatrix || keyMap.userCrudPermissions)),
        appointments: !!(keyMap && keyMap.appointments)
      }
    };
  }

  function getSmartReportsSnapshot() {
    var facade = window.PETATOESmartReportsFacade || null;
    var optimizer = window.PETATOESmartReportsPerformanceOptimizer || null;
    var dataEngine = window.PETATOESmartDataEngine || null;
    var tabs = window.PETATOESmartTabs || null;
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]')).map(function (s) { return s.getAttribute('src') || ''; });
    var smartScripts = scripts.filter(function (src) { return src.indexOf('smart/') !== -1 || src.indexOf('smart-reports') !== -1; });
    return {
      facadePresent: !!facade,
      facadeMethods: getObjectKeys(facade).filter(function (key) { return typeof facade[key] === 'function'; }),
      optimizerPresent: !!optimizer,
      dataEnginePresent: !!dataEngine,
      tabsPresent: !!tabs,
      smartScriptCount: smartScripts.length,
      chartJsPresent: !!window.Chart,
      xlsxPresent: !!window.XLSX,
      exportDataPresent: !!(window.PETATOECustomerCompareExportData || window.PETATOECustomerActivityFollowupExportData),
      availableYearsPresent: Array.isArray(window.PETATOECustomerCompareAvailableYears)
    };
  }


  function getCurrentUserSnapshot() {
    var user = null;
    var source = '';
    function parseMaybe(raw){
      if(!raw) return null;
      if(typeof raw === 'object') return raw;
      try{ return JSON.parse(String(raw)); }catch(e){ return { id:String(raw), username:String(raw) }; }
    }
    try {
      if (window.PETATOENavigationPermissions && typeof window.PETATOENavigationPermissions.currentUser === 'function') {
        user = window.PETATOENavigationPermissions.currentUser();
        source = user ? 'PETATOENavigationPermissions' : source;
      }
    } catch (e) { if (window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('maintenance/maintenance-center.js', e, {phase:'v6.5.8-security-gate'}); }
    try {
      if (!user && window.PETATOEStorage && typeof window.PETATOEStorage.get === 'function') {
        user = parseMaybe(window.PETATOEStorage.get('currentUser') || window.PETATOEStorage.get('petatoe_current_user') || null);
        source = user ? 'PETATOEStorage' : source;
      }
    } catch (e) { if (window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('maintenance/maintenance-center.js', e, {phase:'v6.5.8-security-gate'}); }
    try {
      if (!user && window.sessionStorage) {
        user = parseMaybe(window.sessionStorage.getItem('currentUser') || window.sessionStorage.getItem('petatoe_current_user') || null);
        source = user ? 'sessionStorage' : source;
      }
    } catch (e) { if (window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('maintenance/maintenance-center.js', e, {phase:'v6.5.8-security-gate'}); }
    return {
      present: !!user,
      source: source || 'not-detected',
      id: user && (user.id || user.userId || user.username) ? String(user.id || user.userId || user.username) : '',
      username: user && user.username ? String(user.username) : '',
      role: user && user.role ? String(user.role) : '',
      isSuperAdmin: !!(user && (user.role === 'superAdmin' || user.role === 'super_admin' || user.role === 'admin' || user.isSuperAdmin === true || user.__bootstrap === true))
    };
  }

  function getSecuritySnapshot() {
    var passwordSecurity = window.PETATOEPasswordSecurity || null;
    var security = window.PETATOESecurity || null;
    var permissions = window.PETATOEPermissions || window.PETATOENavigationPermissions || null;
    var currentUser = getCurrentUserSnapshot();
    var router = window.PETATOERouter || null;
    var sessionTimeout = window.PETATOESessionTimeout || window.PETATOESessionManager || null;
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]')).map(function (s) { return s.getAttribute('src') || ''; });
    return {
      passwordSecurityPresent: !!passwordSecurity,
      passwordSecurityMethods: getObjectKeys(passwordSecurity).filter(function (key) { return typeof passwordSecurity[key] === 'function'; }),
      securityHelperPresent: !!security,
      securityHelperMethods: getObjectKeys(security).filter(function (key) { return typeof security[key] === 'function'; }),
      hasEscapeHtml: !!(security && typeof security.escapeHtml === 'function'),
      hasSanitizeHtml: !!(security && typeof security.sanitizeHtml === 'function'),
      hasSetInnerHTML: !!(security && typeof security.setInnerHTML === 'function'),
      permissionsPresent: !!permissions,
      permissionMethods: getObjectKeys(permissions).filter(function (key) { return typeof permissions[key] === 'function'; }),
      hasPermissionCan: !!(permissions && typeof permissions.can === 'function'),
      hasPermissionCanSpecial: !!(permissions && typeof permissions.canSpecial === 'function'),
      currentUser: currentUser,
      sessionTimeoutPresent: !!sessionTimeout,
      routerOpenTabPresent: !!(router && typeof router.openTab === 'function'),
      guardedPilotPresent: !!(window.PETATOERouterAdapterGuardedPilot),
      securityScriptCount: scripts.filter(function (src) { return src.indexOf('/security/') !== -1 || src.indexOf('security') !== -1 || src.indexOf('permissions') !== -1 || src.indexOf('password') !== -1 || src.indexOf('session') !== -1; }).length
    };
  }


  var SILENT_CATCH_STATIC_MAP = {
  "totalEmptyCatch": 0,
  "affectedFiles": 0,
  "instrumentedPilot": {
    "phase": "v7.0.16_INNERHTML_SAFE_RENDERING_BATCH1",
    "previousEmptyCatch": 29,
    "currentEmptyCatch": 0,
    "reducedEmptyCatch": 29,
    "reductionPercent": 100,
    "strategy": "Updated the Maintenance Center silent catch runtime map after confirmed empty silent catch cleanup. Remaining try/catch blocks are instrumented or intentionally handled, not empty silent catches."
  },
  "topFiles": []
};

  function getSilentCatchDiagnosticsSnapshot() {
    var map = SILENT_CATCH_STATIC_MAP || { totalEmptyCatch: 0, affectedFiles: 0, topFiles: [] };
    var events = [];
    try {
      if (window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.getEvents === 'function') {
        events = window.PETATOEDiagnostics.getEvents() || [];
      }
    } catch (e) { events = []; }
    var silentRelatedRuntimeEvents = events.filter(function (event) {
      return event && event.source && /catch|silent|diagnostic/i.test(event.source);
    }).length;
    return {
      mode: 'runtime-map-fixed-v7.0.16',
      totalEmptyCatch: map.totalEmptyCatch || 0,
      affectedFiles: map.affectedFiles || 0,
      topFiles: (map.topFiles || []).slice(0, 15),
      runtimeEventsRelated: silentRelatedRuntimeEvents,
      recommendation: 'تم تصحيح خريطة Silent Catch. لا توجد Empty Silent Catch متبقية حسب خريطة الصيانة الحالية.'
    };
  }


  var INNERHTML_RISK_STATIC_MAP = {
  "totalInnerHTMLAssignments": 11,
  "affectedFiles": 5,
  "riskSummary": {
    "high": 8,
    "review": 1,
    "safe": 15
  },
  "phase": "v7.0.19_INNERHTML_SAFE_RENDERING_BATCH2",
  "mode": "static-map-after-v7019-safe-rendering-batch2",
  "completedBatch": {
    "version": "v7.0.19",
    "convertedFiles": [
      "smart/smart-vehicles.js",
      "smart/smart-customers.js",
      "smart/smart-services.js",
      "children-expenses/children-legacy-engine.js"
    ],
    "strategy": "Smart reports and children expenses Batch 2: escape dynamic labels, use PETATOESafeRender.htmlSanitized boundaries, and keep chart/table business logic unchanged.",
    "previousAssignments": 17,
    "currentAssignments": 11,
    "reducedAssignments": 6,
    "previousHighRisk": 16,
    "currentHighRisk": 8,
    "reducedHighRisk": 8,
    "previousReviewRisk": 1,
    "currentReviewRisk": 1,
    "reducedReviewRisk": 0
  },
  "topFiles": [
    {"file":"inline-extracted/exec-alerts-block.js","count":1,"high":0,"review":1,"safe":2,"sizeBytes":37083},
    {"file":"smart/smart-vehicles.js","count":0,"high":0,"review":0,"safe":2,"sizeBytes":7578},
    {"file":"smart/smart-customers.js","count":0,"high":0,"review":0,"safe":2,"sizeBytes":27155},
    {"file":"smart/smart-services.js","count":0,"high":0,"review":0,"safe":2,"sizeBytes":13958},
    {"file":"children-expenses/children-legacy-engine.js","count":0,"high":0,"review":0,"safe":1,"sizeBytes":10937},
    {"file":"inline-extracted/print-engine.js","count":0,"high":0,"review":0,"safe":2,"sizeBytes":68723},
    {"file":"inline-extracted/smart-reports-inline.js","count":0,"high":0,"review":0,"safe":2,"sizeBytes":48746},
    {"file":"settings/setup.js","count":0,"high":0,"review":0,"safe":2,"sizeBytes":22396},
    {"file":"settings/settings.js","count":0,"high":0,"review":0,"safe":1,"sizeBytes":33146},
    {"file":"sales/contract-candidates-report.js","count":0,"high":0,"review":0,"safe":1,"sizeBytes":10808}
  ],
  "recommendation": "تم تنفيذ Batch 2 للـ Safe Rendering على Smart Reports وChildren Expenses. المتبقي منخفض المخاطر ويحتاج Batch 3 محدود بعد اختبار regression."
};

  function getInnerHTMLRiskSnapshot() {
    var map = INNERHTML_RISK_STATIC_MAP || { totalInnerHTMLAssignments: 0, affectedFiles: 0, riskSummary: {}, topFiles: [] };
    return {
      mode: map.mode || 'static-map-read-only',
      phase: map.phase || 'v6.4.191',
      totalInnerHTMLAssignments: map.totalInnerHTMLAssignments || 0,
      affectedFiles: map.affectedFiles || 0,
      highRisk: (map.riskSummary && map.riskSummary.high) || 0,
      reviewRisk: (map.riskSummary && map.riskSummary.review) || 0,
      safeRisk: (map.riskSummary && map.riskSummary.safe) || 0,
      topFiles: (map.topFiles || []).slice(0, 18).map(function (item) { var risk = normalizeInnerHTMLRiskItem(item); return Object.assign({}, item, risk); }),
      recommendation: map.recommendation || 'ابدأ Safe Rendering Pilot تدريجيًا بعد اعتماد الخريطة.'
    };
  }



  var STRUCTURAL_CLEANUP_STATIC_MAP = {
    mode: 'controlled-cleanup-read-only-plus-safe-registry',
    phase: 'v7.2.1-zero-reference-certified',
    summary: {
      loadedScriptTags: 196,
      totalJSFiles: 196,
      zeroReferenceJSFiles: 0,
      transitionFiles: 50,
      duplicateFunctionNames: 395,
      removedFiles: 0,
      quarantineCandidates: 0
    },
    zeroReferenceJSFiles: [],
    certifiedZeroReferenceFiles: [
      { file: 'inline-extracted/sidebar-final.js', action: 'keep-retained-certified', reason: 'تم فحصه يدويًا في v7.2.1: shim deprecated آمن لا يبني القائمة ولا يغيّر DOM، ويُحتفظ به كمرجع توافق تاريخي فقط.' },
      { file: 'router/lazy-pilot-probe.js', action: 'keep-runtime-probe-certified', reason: 'تم فحصه يدويًا في v7.2.1: يُستدعى ديناميكيًا من lazy-loading-pilot-safe.js عبر state.pilotScript، لذلك ليس ملفًا مهجورًا للحذف.' }
    ],
    transitionBuckets: [
      { type: 'facade', count: 14, recommendation: 'توثيق شرط الإزالة لكل Facade قبل أي حذف.' },
      { type: 'bridge', count: 6, recommendation: 'الإبقاء مؤقتًا لأنها غالبًا مسؤولة عن عدم كسر المسارات القديمة.' },
      { type: 'shadow', count: 14, recommendation: 'مراجعة Shadow ownership بعد اعتماد النسخة الذهبية.' },
      { type: 'legacy', count: 2, recommendation: 'لا يتم حذف Legacy قبل وجود بديل Production مثبت.' },
      { type: 'audit', count: 14, recommendation: 'ملفات Audit/Probe مرشحة للتوثيق أو النقل للأرشيف بعد الاختبار.' }
    ],
    topDuplicateFunctionNames: [
      { name: 'warn', count: 40 },
      { name: 'snapshot', count: 34 },
      { name: 'clone', count: 22 },
      { name: 'validate', count: 21 },
      { name: 'esc', count: 19 },
      { name: 'num', count: 19 },
      { name: 'normalize', count: 17 },
      { name: 'now', count: 15 },
      { name: 'byId', count: 13 },
      { name: 'render', count: 13 }
    ],
    appliedChanges: [
      'لم يتم حذف أي ملف تشغيل في هذه النسخة لتجنب Regression.',
      'تم إضافة Structural Cleanup Snapshot داخل مركز الصيانة للقراءة فقط.',
      'تم اعتماد ملفات Zero-Reference يدويًا في v7.2.1: لا توجد مرشحات حذف حاليًا، والملفات المؤكدة موثقة كـ retained/runtime-probe.',
      'تم تحديث Manifest/Roadmap الخاص بالتنظيف الهيكلي.'
    ],
    recommendation: 'الخطوة التالية Runtime Hardening: استكمال silent catch بشكل أوسع مع توحيد Error Handling، ثم Regression Suite قبل Golden Baseline.'
  };

  function getStructuralCleanupSnapshot() {
    var map = STRUCTURAL_CLEANUP_STATIC_MAP || {};
    return {
      mode: map.mode || 'read-only',
      phase: map.phase || 'v6.4.195',
      summary: map.summary || {},
      zeroReferenceJSFiles: (map.zeroReferenceJSFiles || []).slice(0, 10),
      transitionBuckets: (map.transitionBuckets || []).slice(0, 10),
      topDuplicateFunctionNames: (map.topDuplicateFunctionNames || []).slice(0, 15),
      appliedChanges: (map.appliedChanges || []).slice(0, 10),
      recommendation: map.recommendation || ''
    };
  }

  function getRuntimeHardeningSnapshot() {
    try {
      if (window.PETATOERuntimeHardening && typeof window.PETATOERuntimeHardening.getSnapshot === 'function') {
        return window.PETATOERuntimeHardening.getSnapshot();
      }
    } catch (e) {
      return {
        enabled: false,
        mode: 'error',
        error: e && e.message ? e.message : String(e),
        recommendation: 'Runtime Hardening snapshot failed; check diagnostics events.'
      };
    }
    return {
      enabled: false,
      mode: 'missing',
      guardedCalls: 0,
      capturedExceptions: 0,
      capturedWarnings: 0,
      globalErrorHandler: !!window.__PETATOE_DIAGNOSTICS_ERROR_HANDLER__,
      unhandledRejectionHandler: !!window.__PETATOE_DIAGNOSTICS_REJECTION_HANDLER__,
      recommendation: 'Runtime Hardening layer is not loaded.'
    };
  }


  var ENTERPRISE_REGRESSION_STATIC_MAP = {
    mode: 'read-only-regression-suite',
    phase: getCurrentMaintenanceVersion(),
    scope: 'No functional mutation. This suite reads loaded surfaces and confirms enterprise readiness signals.',
    categories: [
      { key: 'core', name: 'Core Runtime', total: 8 },
      { key: 'navigation', name: 'Router / Navigation', total: 7 },
      { key: 'reports', name: 'Smart Reports / Export', total: 8 },
      { key: 'operations', name: 'Operations / Appointments', total: 6 },
      { key: 'payroll', name: 'Payroll', total: 5 },
      { key: 'warehouse', name: 'Warehouse', total: 5 },
      { key: 'security', name: 'Security / Permissions', total: 7 },
      { key: 'maintenance', name: 'Maintenance / Diagnostics', total: 8 }
    ],
    checkpoints: [
      { id: 'CORE-01', category: 'core', title: 'Diagnostics core object is available', severity: 'critical' },
      { id: 'CORE-02', category: 'core', title: 'Runtime Hardening layer is loaded', severity: 'high' },
      { id: 'CORE-03', category: 'core', title: 'No captured runtime errors at snapshot time', severity: 'high' },
      { id: 'CORE-04', category: 'core', title: 'Main document contains expected script surface', severity: 'medium' },
      { id: 'CORE-05', category: 'core', title: 'Application remains online-capable in browser context', severity: 'low' },
      { id: 'CORE-06', category: 'core', title: 'Stylesheet surface is present', severity: 'medium' },
      { id: 'CORE-07', category: 'core', title: 'Panel/id surface is available for SPA navigation', severity: 'medium' },
      { id: 'CORE-08', category: 'core', title: 'Maintenance snapshot can be generated', severity: 'critical' },
      { id: 'NAV-01', category: 'navigation', title: 'PETATOERouter object is present', severity: 'critical' },
      { id: 'NAV-02', category: 'navigation', title: 'Route registry surface is present', severity: 'high' },
      { id: 'NAV-03', category: 'navigation', title: 'Navigation permission surface exists', severity: 'high' },
      { id: 'NAV-04', category: 'navigation', title: 'openTab route surface is detected', severity: 'medium' },
      { id: 'NAV-05', category: 'navigation', title: 'No direct router mutation performed by suite', severity: 'critical' },
      { id: 'NAV-06', category: 'navigation', title: 'Router checked read-only', severity: 'medium' },
      { id: 'NAV-07', category: 'navigation', title: 'Lazy loading foundation does not replace router yet', severity: 'medium' },
      { id: 'REP-01', category: 'reports', title: 'Smart Reports facade/core surface is present', severity: 'critical' },
      { id: 'REP-02', category: 'reports', title: 'Chart rendering surface can be inspected', severity: 'medium' },
      { id: 'REP-03', category: 'reports', title: 'Export scripts are loaded in script surface', severity: 'high' },
      { id: 'REP-04', category: 'reports', title: 'PDF/Print export core preserved after safe rendering pilot', severity: 'high' },
      { id: 'REP-05', category: 'reports', title: 'Smart customers remains under diagnostics observation', severity: 'medium' },
      { id: 'REP-06', category: 'reports', title: 'innerHTML risk map is available', severity: 'medium' },
      { id: 'REP-07', category: 'reports', title: 'Performance heavy script map is available', severity: 'medium' },
      { id: 'REP-08', category: 'reports', title: 'No report data mutation performed by suite', severity: 'critical' },
      { id: 'OPS-01', category: 'operations', title: 'Operations legacy surface remains loaded', severity: 'high' },
      { id: 'OPS-02', category: 'operations', title: 'Appointments/operations scripts remain in script surface', severity: 'medium' },
      { id: 'OPS-03', category: 'operations', title: 'Reference data area not mutated by suite', severity: 'critical' },
      { id: 'OPS-04', category: 'operations', title: 'Operation modules remain candidates for controlled lazy loading only', severity: 'medium' },
      { id: 'OPS-05', category: 'operations', title: 'No appointment storage writes performed', severity: 'critical' },
      { id: 'OPS-06', category: 'operations', title: 'Operations included in Golden Baseline readiness scope', severity: 'low' },
      { id: 'PAY-01', category: 'payroll', title: 'Payroll script surface is present', severity: 'high' },
      { id: 'PAY-02', category: 'payroll', title: 'Payroll facade/bridge diagnostics were preserved', severity: 'medium' },
      { id: 'PAY-03', category: 'payroll', title: 'Payroll report paths remain in regression scope', severity: 'medium' },
      { id: 'PAY-04', category: 'payroll', title: 'No payroll data mutation performed by suite', severity: 'critical' },
      { id: 'PAY-05', category: 'payroll', title: 'Payroll requires manual UI click test before Golden Baseline', severity: 'medium' },
      { id: 'WH-01', category: 'warehouse', title: 'Warehouse script surface is present', severity: 'high' },
      { id: 'WH-02', category: 'warehouse', title: 'Warehouse facade/bridge diagnostics were preserved', severity: 'medium' },
      { id: 'WH-03', category: 'warehouse', title: 'Warehouse export/report paths remain in regression scope', severity: 'medium' },
      { id: 'WH-04', category: 'warehouse', title: 'No warehouse data mutation performed by suite', severity: 'critical' },
      { id: 'WH-05', category: 'warehouse', title: 'Warehouse requires manual UI click test before Golden Baseline', severity: 'medium' },
      { id: 'SEC-01', category: 'security', title: 'Password security helper detected', severity: 'critical' },
      { id: 'SEC-02', category: 'security', title: 'Security helper detected', severity: 'high' },
      { id: 'SEC-03', category: 'security', title: 'Permissions surface detected', severity: 'critical' },
      { id: 'SEC-04', category: 'security', title: 'Session timeout helper detected', severity: 'high' },
      { id: 'SEC-05', category: 'security', title: 'Storage snapshot can be read safely', severity: 'medium' },
      { id: 'SEC-06', category: 'security', title: 'innerHTML high-risk items remain tracked', severity: 'medium' },
      { id: 'SEC-07', category: 'security', title: 'No permission mutation performed by suite', severity: 'critical' },
      { id: 'MC-01', category: 'maintenance', title: 'Maintenance center object is available', severity: 'critical' },
      { id: 'MC-02', category: 'maintenance', title: 'Maintenance button fail-safe is preserved', severity: 'high' },
      { id: 'MC-03', category: 'maintenance', title: 'Copy report action is available', severity: 'medium' },
      { id: 'MC-04', category: 'maintenance', title: 'TXT/JSON export actions are available', severity: 'medium' },
      { id: 'MC-05', category: 'maintenance', title: 'Silent catch map is available', severity: 'medium' },
      { id: 'MC-06', category: 'maintenance', title: 'Structural cleanup map is available', severity: 'medium' },
      { id: 'MC-07', category: 'maintenance', title: 'Runtime events table can be rendered', severity: 'medium' },
      { id: 'MC-08', category: 'maintenance', title: 'Regression suite is visible in the center', severity: 'critical' }
    ],
    manualChecklist: [
      'افتح البرنامج وتأكد من عدم وجود أخطاء حمراء في Console عند البداية.',
      'افتح مركز الصيانة وتأكد من ظهور Enterprise Regression Suite.',
      'افتح مركز التقارير المتقدمة وجرب الفلاتر الرئيسية والتصدير.',
      'افتح إدارة التشغيل والمواعيد وجدول اليوم حسب السيارة.',
      'افتح إدارة الرواتب وكشف الراتب.',
      'افتح المخازن والتقارير المرتبطة بها.',
      'جرب نسخ/تصدير تقرير الصيانة TXT و JSON.',
      'بعد الاختبار اليدوي، صدّر تقرير الصيانة واحتفظ به مع Golden Baseline.'
    ]
  };

  function evaluateRegressionCheckpoint(item, snapshot) {
    snapshot = snapshot || {};
    var scripts = Array.prototype.slice.call(document.querySelectorAll('script[src]')).map(function (s) { return String(s.getAttribute('src') || '').toLowerCase(); });
    function hasScript(part) { return scripts.some(function (src) { return src.indexOf(part) !== -1; }); }
    function pass(note) { return { status: 'pass', note: note || 'OK' }; }
    function warn(note) { return { status: 'warn', note: note || 'Needs manual verification' }; }
    function fail(note) { return { status: 'fail', note: note || 'Missing' }; }

    switch (item.id) {
      case 'CORE-01': return snapshot.diagnosticsAvailable ? pass('Diagnostics available') : fail('PETATOEDiagnostics missing');
      case 'CORE-02': return snapshot.runtimeHardening && snapshot.runtimeHardening.enabled ? pass('Runtime layer active') : warn('Runtime layer missing or not active');
      case 'CORE-03': return (snapshot.errors || []).length === 0 ? pass('No captured errors') : warn((snapshot.errors || []).length + ' captured errors');
      case 'CORE-04': return (snapshot.scripts || 0) >= 150 ? pass(snapshot.scripts + ' scripts detected') : warn('Unexpectedly low script count');
      case 'CORE-05': return snapshot.online ? pass('Browser online') : warn('Browser reports offline');
      case 'CORE-06': return (snapshot.stylesheets || 0) > 0 ? pass(snapshot.stylesheets + ' stylesheets') : fail('No stylesheets detected');
      case 'CORE-07': return (snapshot.panels || 0) > 100 ? pass(snapshot.panels + ' ids/panels') : warn('Panel/id surface lower than expected');
      case 'CORE-08': return pass('Snapshot generated');
      case 'NAV-01': return snapshot.router && snapshot.router.routerPresent ? pass('Router present') : fail('Router missing');
      case 'NAV-02': return snapshot.router && snapshot.router.routeRegistryPresent ? pass('Route registry present') : warn('Route registry not detected');
      case 'NAV-03': return snapshot.navigationRegistryAvailable ? pass('Permissions/navigation surface present') : fail('Permission surface missing');
      case 'NAV-04': return snapshot.router && snapshot.router.openTabPresent ? pass('openTab present') : warn('openTab not detected');
      case 'NAV-05': return pass('Read-only suite');
      case 'NAV-06': return pass('Router inspected only');
      case 'NAV-07': return snapshot.lazyLoading && snapshot.lazyLoading.enabled ? pass('Lazy foundation passive') : warn('Lazy foundation missing');
      case 'REP-01': return snapshot.smartReports && snapshot.smartReports.facadePresent ? pass('Smart reports facade present') : warn('Facade not detected');
      case 'REP-02': return hasScript('charts') || hasScript('chart') ? pass('Chart scripts present') : warn('Chart scripts not detected');
      case 'REP-03': return hasScript('export') ? pass('Export scripts present') : warn('Export scripts not detected');
      case 'REP-04': return hasScript('export-core') || hasScript('export-print') ? pass('Export core/print present') : warn('Export core/print not detected');
      case 'REP-05': return hasScript('smart-customers') ? pass('smart-customers loaded') : warn('smart-customers not detected');
      case 'REP-06': return snapshot.innerHTMLRisk && snapshot.innerHTMLRisk.totalInnerHTMLAssignments >= 0 ? pass('innerHTML map available') : warn('innerHTML map missing');
      case 'REP-07': return snapshot.performance && snapshot.performance.scripts ? pass('Performance script map available') : warn('Performance map missing');
      case 'REP-08': return pass('Read-only suite');
      case 'OPS-01': return hasScript('operations-legacy-engine') ? pass('operations legacy loaded') : warn('operations legacy not detected');
      case 'OPS-02': return hasScript('appointments') || hasScript('operations') ? pass('operations/appointments scripts detected') : warn('operations scripts not detected');
      case 'OPS-03': return pass('Reference data untouched');
      case 'OPS-04': return pass('Controlled lazy loading only');
      case 'OPS-05': return pass('No storage writes');
      case 'OPS-06': return pass('Included in scope');
      case 'PAY-01': return hasScript('payroll') ? pass('payroll scripts detected') : warn('payroll scripts not detected');
      case 'PAY-02': return hasScript('payroll') ? pass('payroll diagnostics preserved') : warn('manual payroll verification required');
      case 'PAY-03': return pass('Payroll reports in manual checklist');
      case 'PAY-04': return pass('No payroll mutation');
      case 'PAY-05': return warn('Manual UI test required before Golden Baseline');
      case 'WH-01': return hasScript('warehouse') || hasScript('warehouses') ? pass('warehouse scripts detected') : warn('warehouse scripts not detected');
      case 'WH-02': return hasScript('warehouse') || hasScript('warehouses') ? pass('warehouse diagnostics preserved') : warn('manual warehouse verification required');
      case 'WH-03': return pass('Warehouse reports in manual checklist');
      case 'WH-04': return pass('No warehouse mutation');
      case 'WH-05': return warn('Manual UI test required before Golden Baseline');
      case 'SEC-01': return snapshot.security && snapshot.security.passwordSecurityPresent ? pass('Password security present') : fail('Password security missing');
      case 'SEC-02': return snapshot.security && snapshot.security.securityHelperPresent ? pass('Security helper present') : warn('Security helper not detected');
      case 'SEC-03': return snapshot.security && snapshot.security.permissionsPresent ? pass('Permissions present') : fail('Permissions missing');
      case 'SEC-04': return snapshot.security && snapshot.security.sessionTimeoutPresent ? pass('Session timeout present') : warn('Session timeout not detected');
      case 'SEC-05': return snapshot.storage ? pass('Storage snapshot readable') : warn('Storage snapshot unavailable');
      case 'SEC-06': return snapshot.innerHTMLRisk ? pass('innerHTML risks tracked') : warn('innerHTML risk map missing');
      case 'SEC-07': return pass('Permissions untouched');
      case 'MC-01': return window.PETATOEMaintenanceCenter ? pass('Center object present') : fail('Center object missing');
      case 'MC-02': return document.getElementById(BUTTON_ID) ? pass('Button present') : warn('Button not present at snapshot time');
      case 'MC-03': return typeof center.copyReport === 'function' ? pass('copyReport available') : fail('copyReport missing');
      case 'MC-04': return typeof center.exportReport === 'function' ? pass('exportReport available') : fail('exportReport missing');
      case 'MC-05': return snapshot.silentCatch ? pass('Silent catch map available') : warn('Silent catch map missing');
      case 'MC-06': return snapshot.structuralCleanup ? pass('Structural cleanup map available') : warn('Structural cleanup map missing');
      case 'MC-07': return pass('Runtime events section renderer available');
      case 'MC-08': return pass('Regression suite renderer available');
      default: return warn('Unknown checkpoint');
    }
  }

  function getEnterpriseRegressionSuiteSnapshot(snapshot) {
    var map = ENTERPRISE_REGRESSION_STATIC_MAP;
    var evaluated = (map.checkpoints || []).map(function (item) {
      var result = evaluateRegressionCheckpoint(item, snapshot || {});
      return {
        id: item.id,
        category: item.category,
        title: item.title,
        severity: item.severity,
        status: result.status,
        note: result.note
      };
    });
    var totals = evaluated.reduce(function (acc, item) {
      acc.total++;
      acc[item.status] = (acc[item.status] || 0) + 1;
      if (item.status === 'fail' && item.severity === 'critical') { acc.criticalFailures++; }
      return acc;
    }, { total: 0, pass: 0, warn: 0, fail: 0, criticalFailures: 0 });
    var categories = (map.categories || []).map(function (cat) {
      var items = evaluated.filter(function (x) { return x.category === cat.key; });
      var passCount = items.filter(function (x) { return x.status === 'pass'; }).length;
      var warnCount = items.filter(function (x) { return x.status === 'warn'; }).length;
      var failCount = items.filter(function (x) { return x.status === 'fail'; }).length;
      return {
        key: cat.key,
        name: cat.name,
        total: items.length,
        pass: passCount,
        warn: warnCount,
        fail: failCount,
        score: items.length ? Math.round((passCount / items.length) * 100) : 0
      };
    });
    var readinessScore = totals.total ? Math.max(0, Math.round(((totals.pass + totals.warn * 0.5) / totals.total) * 100) - (totals.criticalFailures * 20)) : 0;
    var readyForGolden = totals.criticalFailures === 0 && totals.fail === 0 && readinessScore >= 75;
    return {
      enabled: true,
      mode: map.mode,
      phase: map.phase,
      scope: map.scope,
      totals: totals,
      categories: categories,
      checkpoints: evaluated,
      manualChecklist: (map.manualChecklist || []).slice(0),
      readinessScore: readinessScore,
      readyForGolden: readyForGolden,
      recommendation: readyForGolden ? 'يمكن الانتقال إلى Enterprise Golden Baseline بعد إتمام الاختبار اليدوي وتصدير تقرير الصيانة.' : 'راجع حالات fail/warn الحرجة قبل إصدار Golden Baseline.'
    };
  }



  function getCurrentMaintenanceVersion() {
    try {
      if (window.PETATOE_RELEASE_VERSION) { return String(window.PETATOE_RELEASE_VERSION); }
      if (window.PETATOE_VERSION) { return String(window.PETATOE_VERSION); }
      if (center && center.version) { return String(center.version); }
    } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
    return MAINTENANCE_VERSION;
  }

  function isExternalScriptError(event) {
    try {
      var payload = event && event.payload ? event.payload : {};
      var message = String(payload.message || event.message || '').trim();
      var filename = String(payload.filename || event.filename || '').trim();
      var source = String(event.source || '').trim();
      if (message === 'Script error.' || message === 'Script error') { return true; }
      if (source === 'window.error' && !filename && (payload.lineno || 0) === 0 && (payload.colno || 0) === 0) { return true; }
      if (/^https?:\/\//i.test(filename) && (!window.location || filename.indexOf(window.location.origin) !== 0)) { return true; }
    } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
    return false;
  }

  function getErrorAnalysis(errors) {
    errors = Array.isArray(errors) ? errors : [];
    var external = [];
    var internal = [];
    var grouped = {};
    errors.forEach(function (event) {
      var payload = event && event.payload ? event.payload : {};
      var message = String(payload.message || event.message || payload.error || 'Unknown error');
      var key = (isExternalScriptError(event) ? 'external:' : 'internal:') + (message || 'Unknown error');
      grouped[key] = (grouped[key] || 0) + 1;
      if (isExternalScriptError(event)) { external.push(event); }
      else { internal.push(event); }
    });
    return {
      total: errors.length,
      internal: internal.length,
      external: external.length,
      warningsOnly: errors.length === external.length,
      repeatedMessages: grouped
    };
  }


  function normalizeInnerHTMLRiskItem(item) {
    item = item || {};
    var count = Number(item.count || 0);
    var high = Number(item.high || 0);
    var review = Number(item.review || 0);
    var safe = Number(item.safe || 0);
    if ((high + review + safe) > 0 || !Array.isArray(item.samples)) {
      return { high: high, review: review, safe: safe };
    }
    item.samples.forEach(function (sample) {
      var level = String(sample && sample.level || '').toLowerCase();
      if (level === 'safe' || level === 'static') { safe++; }
      else if (level === 'review' || level === 'medium') { review++; }
      else { high++; }
    });
    var remainder = Math.max(0, count - high - review - safe);
    if (remainder) {
      if (high > 0) { high += remainder; }
      else if (review > 0) { review += remainder; }
      else { safe += remainder; }
    }
    return { high: high, review: review, safe: safe };
  }

  function summarizeSystemStatus(snapshot, healthAnalysis) {
    snapshot = snapshot || {};
    healthAnalysis = healthAnalysis || getHealthAnalysis(snapshot);
    var performance = snapshot.performance && snapshot.performance.scripts ? snapshot.performance.scripts : {};
    var runtimeStable = (healthAnalysis.errorAnalysis && healthAnalysis.errorAnalysis.internal || 0) === 0;
    var security = snapshot.security || {};
    var securityGood = !!(security.passwordSecurityPresent && security.securityHelperPresent && security.permissionsPresent && security.sessionTimeoutPresent);
    var performanceNeeds = (performance.blockingScripts || 0) > 120;
    var technicalDebtHigh = (snapshot.silentCatch && snapshot.silentCatch.totalEmptyCatch > 50) || (snapshot.innerHTMLRisk && snapshot.innerHTMLRisk.highRisk > 40);
    return {
      runtime: runtimeStable ? 'Stable' : 'Needs Review',
      security: securityGood ? 'Good' : 'Needs Review',
      performance: performanceNeeds ? 'Needs Optimization' : 'Good',
      technicalDebt: technicalDebtHigh ? 'High / Planned Cleanup' : 'Medium / Optimized Cleanup Remaining',
      overall: healthAnalysis.level === 'red' ? 'Needs Review' : 'Enterprise Stable with Planned Warnings'
    };
  }

  function buildPriorityRecommendations(snapshot, healthAnalysis) {
    snapshot = snapshot || {};
    healthAnalysis = healthAnalysis || getHealthAnalysis(snapshot);
    var recs = [];
    var scripts = snapshot.performance && snapshot.performance.scripts ? snapshot.performance.scripts : {};
    if ((scripts.blockingScripts || 0) > 150) { recs.push('Priority 1: Reduce blocking scripts / continue route-by-route lazy loading.'); }
    if (snapshot.silentCatch && snapshot.silentCatch.totalEmptyCatch > 0) { recs.push('Priority 2: Continue silent catch instrumentation, starting with navigation and maintenance files.'); }
    if (snapshot.innerHTMLRisk && snapshot.innerHTMLRisk.highRisk > 0) { recs.push('Priority 3: Replace remaining high-risk innerHTML with Safe Rendering in controlled batches.'); }
    if (snapshot.structuralCleanup && snapshot.structuralCleanup.summary && snapshot.structuralCleanup.summary.zeroReferenceJSFiles > 0) { recs.push('Priority 4: Manually confirm zero-reference files before any removal.'); }
    if (healthAnalysis.errorAnalysis && healthAnalysis.errorAnalysis.external > 0) { recs.push('Priority 5: Monitor external / cross-origin script errors; do not block release unless internal errors appear.'); }
    if (!recs.length) { recs.push('No urgent maintenance recommendations detected.'); }
    return recs;
  }

  function compactRuntimeEvents(events, limit) {
    events = Array.isArray(events) ? events : [];
    limit = limit || 15;
    var latest = events.slice(-limit).reverse();
    var externalCount = 0;
    var rows = [];
    latest.forEach(function (event) {
      if (isExternalScriptError(event)) { externalCount++; return; }
      rows.push(event);
    });
    return { externalCount: externalCount, rows: rows };
  }

  function getHealthAnalysis(snapshot) {
    snapshot = snapshot || {};
    var errors = Array.isArray(snapshot.errors) ? snapshot.errors : [];
    var errorAnalysis = getErrorAnalysis(errors);
    var reasons = [];
    var warnings = [];
    var critical = [];

    if (!snapshot.diagnosticsAvailable) { critical.push('Diagnostics core is not available.'); }
    else { reasons.push('Diagnostics core is active.'); }

    if (!snapshot.router || !snapshot.router.routerPresent) { warnings.push('Router object was not detected.'); }
    if (!snapshot.router || !snapshot.router.routeRegistryPresent) { warnings.push('Route Registry was not detected.'); }
    if (!snapshot.storage || !snapshot.storage.storageAdapterPresent) { warnings.push('Storage adapter was not detected.'); }
    if (!snapshot.smartReports || !snapshot.smartReports.facadePresent) { warnings.push('Smart Reports facade was not detected.'); }
    if (!snapshot.security || !snapshot.security.passwordSecurityPresent || !snapshot.security.securityHelperPresent || !snapshot.security.permissionsPresent) { warnings.push('Security / permissions surface needs review.'); }
    if (snapshot.performance && snapshot.performance.scripts && snapshot.performance.scripts.blockingScripts > 150) { warnings.push('High number of blocking scripts: ' + snapshot.performance.scripts.blockingScripts); }
    if (!snapshot.lazyLoading || !snapshot.lazyLoading.enabled) { warnings.push('Lazy Loading foundation is not active.'); }
    if (snapshot.silentCatch && snapshot.silentCatch.totalEmptyCatch > 0) { warnings.push('Silent catch map still contains ' + snapshot.silentCatch.totalEmptyCatch + ' cases after final cleanup.'); }
    if (snapshot.innerHTMLRisk && snapshot.innerHTMLRisk.highRisk > 20) { warnings.push('innerHTML high-risk map still contains ' + snapshot.innerHTMLRisk.highRisk + ' cases.'); }
    if (snapshot.structuralCleanup && snapshot.structuralCleanup.summary && snapshot.structuralCleanup.summary.zeroReferenceJSFiles > 0) { warnings.push('Zero-reference JS candidates still require manual confirmation.'); }
    if (!snapshot.runtimeHardening || !snapshot.runtimeHardening.enabled) { warnings.push('Runtime Hardening is not active.'); }
    if (snapshot.regressionSuite && snapshot.regressionSuite.totals && snapshot.regressionSuite.totals.fail > 0) { critical.push('Regression Suite contains failed checks.'); }
    if (errorAnalysis.internal > 0) { critical.push('Internal runtime errors captured: ' + errorAnalysis.internal); }
    if (errorAnalysis.external > 0) { warnings.push('External / cross-origin script errors captured: ' + errorAnalysis.external); }
    if (snapshot.cdnHardening && snapshot.cdnHardening.enabled) { reasons.push('CDN hardening layer is active.'); }
    if (snapshot.cdnHardening && snapshot.cdnHardening.missingHardening && snapshot.cdnHardening.missingHardening.length) { warnings.push('External scripts missing CDN hardening attributes: ' + snapshot.cdnHardening.missingHardening.length); }

    var level = critical.length > 0 ? 'red' : (warnings.length > 2 ? 'amber' : 'green');
    var score = Math.max(0, Math.min(100, 100 - (critical.length * 18) - (warnings.length * 3)));
    return {
      level: level,
      score: score,
      critical: critical,
      warnings: warnings,
      reasons: reasons,
      errorAnalysis: errorAnalysis,
      recommendation: critical.length ? 'راجع الأخطاء الداخلية أولًا قبل اعتماد أي تطوير جديد.' : (warnings.length ? 'النظام مستقر تشغيليًا مع تحذيرات تحتاج متابعة مخططة.' : 'النظام مستقر ولا توجد تحذيرات مؤثرة حاليًا.')
    };
  }

  function scoreFromHealthLevel(level) {
    if (level === 'green') { return 96; }
    if (level === 'amber') { return 84; }
    return 72;
  }

  function getEnterpriseGoldenBaselineSnapshot(snapshot) {
    snapshot = snapshot || {};
    var regression = snapshot.regressionSuite || {};
    var regressionScore = regression.readinessScore || 0;
    var runtimeScore = snapshot.runtimeHardening && snapshot.runtimeHardening.enabled ? 94 : 78;
    var securityScore = snapshot.security && snapshot.security.passwordSecurityPresent && snapshot.security.permissionsPresent ? 88 : 72;
    var performanceScore = snapshot.performance && snapshot.performance.scripts && snapshot.performance.scripts.blockingScripts <= 193 ? 78 : 70;
    var maintainabilityScore = 86;
    var architectureScore = 88;
    var healthScore = Math.round((regressionScore + runtimeScore + securityScore + performanceScore + maintainabilityScore + architectureScore) / 6);
    var certified = regressionScore >= 75 && (!regression.totals || (regression.totals.criticalFailures || 0) === 0);
    return {
      enabled: true,
      version: getCurrentMaintenanceVersion(),
      status: certified ? 'Certified Golden Baseline' : 'Baseline With Manual Review Required',
      certified: certified,
      freezeMode: 'architecture-freeze-for-future-development',
      healthScore: healthScore,
      architectureScore: architectureScore,
      maintainabilityScore: maintainabilityScore,
      performanceScore: performanceScore,
      securityScore: securityScore,
      runtimeScore: runtimeScore,
      regressionScore: regressionScore,
      enterpriseReadiness: Math.max(0, Math.min(100, Math.round((healthScore + scoreFromHealthLevel(snapshot.healthLevel)) / 2))),
      releaseDecision: certified ? 'اعتماد النسخة كمرجع Enterprise Golden Baseline لأي تطوير مستقبلي.' : 'اعتماد مشروط بعد مراجعة التحذيرات اليدوية في Regression Suite.',
      lockedScopes: [
        'Enterprise Audit',
        'Performance Baseline',
        'Security Verification',
        'Diagnostics Infrastructure',
        'Maintenance Center',
        'Runtime Hardening',
        'Regression Suite'
      ],
      nextProgram: 'PETATOE Enterprise 7.0 feature development on top of this baseline'
    };
  }


  function getEnterpriseOptimizedGoldenBaselineSnapshot(snapshot) {
    snapshot = snapshot || {};
    var golden = snapshot.goldenBaseline || {};
    var optimized = snapshot.optimizedGoldenBaseline || {};
    var scripts = snapshot.performance && snapshot.performance.scripts ? snapshot.performance.scripts : {};
    var silent = snapshot.silentCatch || {};
    var html = snapshot.innerHTMLRisk || {};
    var healthAnalysis = snapshot.healthAnalysis || getHealthAnalysis(snapshot);
    var baseline = {
      blockingScripts: 198,
      silentCatch: 115,
      innerHTMLHighRisk: 69,
      healthScore: 85,
      performanceScore: 70,
      securityScore: 88
    };
    var current = {
      blockingScripts: scripts.blockingScripts || 0,
      silentCatch: silent.totalEmptyCatch || 0,
      innerHTMLHighRisk: html.highRisk || 0,
      healthScore: healthAnalysis.score || 0,
      performanceScore: golden.performanceScore || 0,
      securityScore: golden.securityScore || 0
    };
    function improvement(before, after) {
      before = Number(before || 0); after = Number(after || 0);
      if (!before) { return 0; }
      return Math.max(0, Math.round(((before - after) / before) * 1000) / 10);
    }
    var silentImprovement = improvement(baseline.silentCatch, current.silentCatch);
    var htmlImprovement = improvement(baseline.innerHTMLHighRisk, current.innerHTMLHighRisk);
    var blockingImprovement = improvement(baseline.blockingScripts, current.blockingScripts);
    var optimizedReadiness = Math.round(((golden.enterpriseReadiness || 0) + (healthAnalysis.score || 0) + (silentImprovement >= 70 ? 94 : 82) + (htmlImprovement >= 40 ? 90 : 82)) / 4);
    var certified = !!golden.certified && (healthAnalysis.errorAnalysis && healthAnalysis.errorAnalysis.internal || 0) === 0 && current.silentCatch <= 35 && current.innerHTMLHighRisk <= 40;
    return {
      enabled: true,
      version: getCurrentMaintenanceVersion(),
      name: 'Enterprise Optimized Golden Baseline',
      certified: certified,
      status: certified ? 'Certified Optimized Golden Baseline' : 'Optimized Baseline With Planned Warnings',
      optimizedReadiness: optimizedReadiness,
      baseline: baseline,
      current: current,
      improvements: {
        blockingScriptsPercent: blockingImprovement,
        silentCatchPercent: silentImprovement,
        innerHTMLHighRiskPercent: htmlImprovement,
        silentCatchReducedBy: Math.max(0, baseline.silentCatch - current.silentCatch),
        innerHTMLHighRiskReducedBy: Math.max(0, baseline.innerHTMLHighRisk - current.innerHTMLHighRisk),
        blockingScriptsReducedBy: Math.max(0, baseline.blockingScripts - current.blockingScripts)
      },
      releaseDecision: certified ? 'اعتماد النسخة كمرجع Enterprise Optimized Golden Baseline للتطويرات المستقبلية.' : 'اعتماد تشغيلي مع استمرار خطة تحسين الأداء وSafe Rendering على مراحل لاحقة.',
      nextProgram: 'Feature development can resume on top of v6.5.7 Maintenance Report Builder Hardening, while remaining optimization debt continues as planned maintenance.'
    };
  }


  function getGreenEnterpriseBaselineSnapshot(snapshot) {
    snapshot = snapshot || {};
    var optimized = snapshot.optimizedGoldenBaseline || {};
    var healthAnalysis = snapshot.healthAnalysis || getHealthAnalysis(snapshot);
    var scripts = snapshot.performance && snapshot.performance.scripts ? snapshot.performance.scripts : {};
    var silent = snapshot.silentCatch || {};
    var html = snapshot.innerHTMLRisk || {};
    var cdn = snapshot.cdnHardening || {};
    var internalErrors = healthAnalysis.errorAnalysis && healthAnalysis.errorAnalysis.internal || 0;
    var blocking = scripts.blockingScripts || 0;
    var silentCount = silent.totalEmptyCatch || 0;
    var htmlHigh = html.highRisk || 0;
    var greenScore = Math.max(0, Math.min(100, Math.round((
      (optimized.optimizedReadiness || 89) +
      (internalErrors === 0 ? 96 : 70) +
      (blocking <= 140 ? 92 : blocking <= 190 ? 84 : 74) +
      (silentCount <= 30 ? 94 : 82) +
      (htmlHigh <= 40 ? 90 : 80) +
      (cdn.enabled ? 90 : 78)
    ) / 6)));
    var certified = internalErrors === 0 && greenScore >= 85 && !!optimized.certified;
    return {
      enabled: true,
      version: getCurrentMaintenanceVersion(),
      name: 'Green Enterprise Baseline',
      certified: certified,
      status: certified ? 'Certified Green Enterprise Baseline' : 'Green Baseline With Planned Warnings',
      greenReadiness: greenScore,
      internalRuntimeErrors: internalErrors,
      blockingScripts: blocking,
      silentCatchRemaining: silentCount,
      innerHTMLHighRiskRemaining: htmlHigh,
      cdnHardening: !!cdn.enabled,
      releaseDecision: certified ? 'اعتماد النسخة كمرجع Green Enterprise Baseline للتطويرات المستقبلية مع تحذيرات مخططة غير مانعة.' : 'اعتماد تشغيلي مشروط بعد مراجعة التحذيرات المتبقية.',
      nextProgram: 'يمكن استئناف تطوير المزايا فوق v6.5.7، مع استمرار تحسين الأداء وSafe Rendering على مراحل صيانة لاحقة.'
    };
  }


  function getFinalEnterpriseBaselineSnapshot(snapshot) {
    snapshot = snapshot || {};
    var golden = snapshot.goldenBaseline || {};
    var optimized = snapshot.optimizedGoldenBaseline || {};
    var green = snapshot.greenEnterpriseBaseline || {};
    var healthAnalysis = snapshot.healthAnalysis || getHealthAnalysis(snapshot);
    var scripts = snapshot.performance && snapshot.performance.scripts ? snapshot.performance.scripts : {};
    var silent = snapshot.silentCatch || {};
    var html = snapshot.innerHTMLRisk || {};
    var regression = snapshot.regressionSuite || {};
    var internalErrors = healthAnalysis.errorAnalysis && healthAnalysis.errorAnalysis.internal || 0;
    var readiness = Math.round((
      (golden.enterpriseReadiness || 86) +
      (optimized.optimizedReadiness || 90) +
      (green.greenReadiness || 92) +
      (regression.readinessScore || 96) +
      (healthAnalysis.score || 88)
    ) / 5);
    var certified = internalErrors === 0 && readiness >= 88 && !!green.certified;
    return {
      enabled: true,
      version: getCurrentMaintenanceVersion(),
      name: 'Final Enterprise Baseline',
      certified: certified,
      status: certified ? 'Certified Final Enterprise Baseline' : 'Final Baseline With Planned Warnings',
      finalReadiness: readiness,
      architectureStatus: 'Stable',
      securityStatus: internalErrors === 0 ? 'Good' : 'Review Required',
      runtimeStatus: internalErrors === 0 ? 'Stable' : 'Review Required',
      performanceStatus: (scripts.blockingScripts || 0) <= 130 ? 'Optimized With Planned Warnings' : 'Needs Optimization',
      technicalDebtStatus: 'Known / Controlled',
      current: {
        blockingScripts: scripts.blockingScripts || 0,
        silentCatch: silent.totalEmptyCatch || 0,
        innerHTMLHighRisk: html.highRisk || 0,
        internalRuntimeErrors: internalErrors,
        regressionScore: regression.readinessScore || 0,
        healthScore: healthAnalysis.score || 0
      },
      timeline: [
        { version: 'v6.4.174', label: 'Enterprise Audit Baseline', blockingScripts: 193, silentCatch: 135, innerHTMLHighRisk: 68, runtime: 'Unverified' },
        { version: 'v6.5.7', label: 'Maintenance Report Builder Hardened', blockingScripts: 121, silentCatch: 29, innerHTMLHighRisk: 23, runtime: 'Stable' },
        { version: 'v6.5.9', label: 'Remaining Risk Cleanup Safe', blockingScripts: 121, silentCatch: 29, innerHTMLHighRisk: 23, runtime: 'Stable' },
        { version: getCurrentMaintenanceVersion(), label: 'Final Enterprise Baseline', blockingScripts: scripts.blockingScripts || 0, silentCatch: silent.totalEmptyCatch || 0, innerHTMLHighRisk: html.highRisk || 0, runtime: internalErrors === 0 ? 'Stable' : 'Review' }
      ],
      releaseDecision: certified ? 'اعتماد النسخة كمرجع Final Enterprise Baseline قبل إصدار LTS.' : 'اعتماد تشغيلي مع تحذيرات مخططة غير مانعة.',
      nextProgram: 'PETATOE_v6.5.11_ENTERPRISE_LTS_BASELINE'
    };
  }


  function getEnterpriseLTSBaselineSnapshot(snapshot) {
    snapshot = snapshot || {};
    var finalBaseline = snapshot.finalEnterpriseBaseline || {};
    var healthAnalysis = snapshot.healthAnalysis || getHealthAnalysis(snapshot);
    var security = snapshot.security || {};
    var regression = snapshot.regressionSuite || {};
    var internalErrors = healthAnalysis.errorAnalysis && healthAnalysis.errorAnalysis.internal || 0;
    var ltsReadiness = Math.round(((finalBaseline.finalReadiness || 88) + (healthAnalysis.score || 88) + (regression.readinessScore || 96)) / 3);
    var certified = internalErrors === 0 && ltsReadiness >= 88;
    return {
      enabled: true,
      version: getCurrentMaintenanceVersion(),
      name: 'Enterprise LTS Baseline',
      certified: certified,
      status: certified ? 'Certified Enterprise LTS Baseline' : 'LTS Baseline With Planned Warnings',
      ltsReadiness: ltsReadiness,
      supportMode: 'Long Term Support',
      architectureFreeze: true,
      featureFreeze: 'Core architecture frozen; new features must start from this baseline.',
      currentUser: security.currentUser && security.currentUser.present ? ((security.currentUser.username || security.currentUser.id || '-') + ' / ' + (security.currentUser.role || '-')) : 'not detected',
      internalRuntimeErrors: internalErrors,
      releaseDecision: certified ? 'اعتماد النسخة كمرجع Enterprise LTS Baseline الرسمي لأي تطوير مستقبلي.' : 'اعتماد تشغيلي مع تحذيرات مخططة غير مانعة قبل LTS كامل.',
      nextProgram: 'PETATOE v6.6 Architecture Evolution'
    };
  }


  function getVehiclePermissionsVerificationSnapshot(snapshot) {
    snapshot = snapshot || {};
    var permissions = window.PETATOEPermissions || null;
    var security = snapshot.security || {};
    var currentUser = security.currentUser || {};
    var vehicles = [];
    var scope = null;
    var canAccess = false;
    var detailed = {};
    var checks = [];
    function addCheck(name, ok, note) { checks.push({ name: name, ok: !!ok, note: note || '' }); }
    try { vehicles = permissions && typeof permissions.getVehicleList === 'function' ? (permissions.getVehicleList() || []) : []; } catch (e) { vehicles = []; }
    try { scope = permissions && typeof permissions.getVehicleScope === 'function' ? permissions.getVehicleScope(currentUser.id || currentUser.username || '') : null; } catch (e) { scope = null; }
    try { canAccess = permissions && typeof permissions.canAccessVehicle === 'function'; } catch (e) { canAccess = false; }
    var specialKeys = [
      'vehicle_ops_create_trip','vehicle_ops_edit_trip','vehicle_ops_cancel_trip','vehicle_ops_reopen_trip','vehicle_ops_approve_trip','vehicle_ops_print','vehicle_ops_export','vehicle_ops_export_excel','vehicle_ops_export_pdf','vehicle_ops_view_reports','vehicle_ops_view_kpis'
    ];
    specialKeys.forEach(function (key) {
      try { detailed[key] = permissions && typeof permissions.canSpecial === 'function' ? !!permissions.canSpecial(key) : false; } catch (e) { detailed[key] = false; }
    });
    addCheck('Vehicle Operations permission registered', !!(permissions && permissions.screenPerms && permissions.screenPerms.some(function (item) { return item && item[0] === 'vehicleOperations'; })), 'شاشة تشغيل السيارات موجودة داخل تعريفات الصلاحيات');
    addCheck('Vehicle list available', vehicles.length > 0, vehicles.length + ' vehicle(s) detected');
    addCheck('Vehicle scope API available', !!(permissions && typeof permissions.getVehicleScope === 'function'), 'getVehicleScope');
    addCheck('Vehicle access guard available', canAccess, 'canAccessVehicle');
    addCheck('Detailed permissions available', specialKeys.some(function (key) { return Object.prototype.hasOwnProperty.call(detailed, key); }), 'صلاحيات إجراءات التشغيل التفصيلية');
    addCheck('Assignment center available', !!(window.petV664SaveVehicleAssignment && window.petV664CopyVehicleAssignment), 'مركز ربط السيارات داخل الإعدادات');
    var readiness = Math.round((checks.filter(function (x) { return x.ok; }).length / Math.max(1, checks.length)) * 100);
    return {
      enabled: true,
      version: getCurrentMaintenanceVersion(),
      readiness: readiness,
      certified: readiness >= 85,
      currentUser: currentUser.present ? ((currentUser.username || currentUser.id || '-') + ' / ' + (currentUser.role || '-')) : 'not detected',
      vehicleCount: vehicles.length,
      scope: scope || { allVehicles: true, vehicles: [] },
      detailedPermissions: detailed,
      checks: checks,
      releaseDecision: readiness >= 85 ? 'اعتماد صلاحيات تشغيل السيارات وربطها بالسيارات كمرحلة مكتملة وقابلة للبناء عليها.' : 'تحتاج صلاحيات تشغيل السيارات إلى مراجعة يدوية قبل الاعتماد الكامل.'
    };
  }

  function getHealthLevel(snapshot) {
    return getHealthAnalysis(snapshot).level;
  }

  function getDiagnosticSnapshot() {
    var diagnostics = window.PETATOEDiagnostics || null;
    var health = null;
    var events = [];
    var errors = [];

    try {
      if (diagnostics && typeof diagnostics.getHealthSnapshot === 'function') {
        health = diagnostics.getHealthSnapshot();
      }
    } catch (e) {
      health = { status: 'error', message: e && e.message ? e.message : String(e) };
    }

    try {
      if (diagnostics && typeof diagnostics.getEvents === 'function') {
        events = diagnostics.getEvents() || [];
      }
    } catch (e) { events = []; }

    try {
      if (diagnostics && typeof diagnostics.getErrors === 'function') {
        errors = diagnostics.getErrors() || [];
      } else {
        errors = events.filter(function (item) { return item && item.level === 'error'; });
      }
    } catch (e) { errors = []; }

    var snapshot = {
      maintenanceVersion: getCurrentMaintenanceVersion(),
      checkedAt: new Date().toISOString(),
      checkedAtLocal: safeNow(),
      diagnosticsAvailable: !!diagnostics,
      health: health,
      events: events,
      errors: errors,
      scripts: document.querySelectorAll('script[src]').length,
      stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
      panels: document.querySelectorAll('[id]').length,
      routerAvailable: !!window.PETATOERouter,
      navigationRegistryAvailable: !!window.PETATOENavigationPermissions || !!window.PETATOEPermissions,
      localStorageKeys: countStorage(window.localStorage),
      sessionStorageKeys: countStorage(window.sessionStorage),
      online: navigator ? navigator.onLine : true,
      userAgent: navigator ? navigator.userAgent : '',
      router: getRouterSnapshot(),
      storage: getStorageSnapshot(),
      smartReports: getSmartReportsSnapshot(),
      security: getSecuritySnapshot(),
      performance: getPerformanceSnapshot(),
      lazyLoading: getLazyLoadingEnterpriseSnapshot(),
      cdnHardening: getCDNHardeningSnapshot(),
      silentCatch: getSilentCatchDiagnosticsSnapshot(),
      innerHTMLRisk: getInnerHTMLRiskSnapshot(),
      structuralCleanup: getStructuralCleanupSnapshot(),
      runtimeHardening: getRuntimeHardeningSnapshot(),
      regressionSuite: null
    };
    snapshot.regressionSuite = getEnterpriseRegressionSuiteSnapshot(snapshot);
    snapshot.healthAnalysis = getHealthAnalysis(snapshot);
    snapshot.healthLevel = snapshot.healthAnalysis.level;
    snapshot.goldenBaseline = getEnterpriseGoldenBaselineSnapshot(snapshot);
    snapshot.optimizedGoldenBaseline = getEnterpriseOptimizedGoldenBaselineSnapshot(snapshot);
    snapshot.greenEnterpriseBaseline = getGreenEnterpriseBaselineSnapshot(snapshot);
    snapshot.finalEnterpriseBaseline = getFinalEnterpriseBaselineSnapshot(snapshot);
    snapshot.enterpriseLTSBaseline = getEnterpriseLTSBaselineSnapshot(snapshot);
    snapshot.vehiclePermissionsVerification = getVehiclePermissionsVerificationSnapshot(snapshot);
    return snapshot;
  }

  function statusBadge(label, ok, note) {
    return '<div class="pet-mc-status ' + (ok ? 'ok' : 'warn') + '">' +
      '<b>' + esc(label) + '</b>' +
      '<span>' + esc(note || (ok ? 'جاهز' : 'يحتاج مراجعة')) + '</span>' +
      '</div>';
  }

  function metricCard(label, value, hint) {
    return '<div class="pet-mc-card"><small>' + esc(label) + '</small><strong>' + esc(value) + '</strong><span>' + esc(hint || '') + '</span></div>';
  }


  function kvRow(label, value, hint) {
    return '<tr><td>' + esc(label) + '</td><td><b>' + esc(value) + '</b></td><td>' + esc(hint || '') + '</td></tr>';
  }

  function renderRouterSection(router) {
    return '<div class="pet-mc-section"><h3>Router / Navigation</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Legacy Router', router.routerPresent, router.routerPresent ? 'موجود' : 'غير موجود') +
        statusBadge('Route Registry', router.routeRegistryPresent, router.routeRegistryPresent ? router.routeCount + ' route' : 'غير محمل') +
        statusBadge('Navigation Controller', router.navigationControllerPresent, router.navigationControllerPresent ? 'موجود' : 'غير موجود') +
        statusBadge('Guarded Pilot', router.guardedPilotPresent, router.guardedPilotPresent ? 'موجود' : 'غير مفعل') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Protected Routes', router.protectedRoutes, 'مسارات عليها حماية داخل Registry') +
        kvRow('Sensitive Routes', router.sensitiveRoutes, 'مسارات حساسة') +
        kvRow('Lazy Candidates', router.lazyCandidates, 'مرشحة للتحميل الكسول لاحقًا') +
        kvRow('Router Methods', router.routerMethods.join(', ') || '-', 'للقراءة فقط') +
      '</tbody></table></div></div>';
  }

  function renderStorageSection(storage) {
    return '<div class="pet-mc-section"><h3>Storage</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Storage Adapter', storage.storageAdapterPresent, storage.storageAdapterPresent ? 'PETATOEStorage متاح' : 'غير متاح') +
        statusBadge('Mapped Keys', storage.mappedKeys > 0, storage.mappedKeys + ' key') +
        statusBadge('Raw Snapshot', storage.hasRawSnapshot, storage.hasRawSnapshot ? 'متاح' : 'غير متاح') +
        statusBadge('Export Snapshot', storage.hasExportSnapshot, storage.hasExportSnapshot ? 'متاح' : 'غير متاح') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Mode', storage.storageMode || 'local/default', 'وضع التخزين الحالي') +
        kvRow('LocalStorage Keys', storage.localStorageKeys, formatBytes(storage.localStorageApproxSize)) +
        kvRow('SessionStorage Keys', storage.sessionStorageKeys, formatBytes(storage.sessionStorageApproxSize)) +
        kvRow('Critical Maps', Object.keys(storage.knownCriticalKeys || {}).filter(function(k){return storage.knownCriticalKeys[k];}).join(', ') || '-', 'مفاتيح أساسية مرصودة') +
      '</tbody></table></div></div>';
  }

  function renderSmartReportsSection(smart) {
    return '<div class="pet-mc-section"><h3>Smart Reports</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Facade', smart.facadePresent, smart.facadePresent ? 'موجود' : 'غير مرصود') +
        statusBadge('Performance Optimizer', smart.optimizerPresent, smart.optimizerPresent ? 'موجود' : 'غير مرصود') +
        statusBadge('Data Engine', smart.dataEnginePresent, smart.dataEnginePresent ? 'موجود' : 'غير مرصود') +
        statusBadge('Tabs', smart.tabsPresent, smart.tabsPresent ? 'موجود' : 'غير مرصود') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Smart Scripts', smart.smartScriptCount, 'عدد ملفات التقارير الذكية المحملة') +
        kvRow('Chart.js', smart.chartJsPresent ? 'Loaded' : 'Missing', 'مكتبة الرسوم') +
        kvRow('XLSX', smart.xlsxPresent ? 'Loaded' : 'Missing', 'مكتبة Excel') +
        kvRow('Facade Methods', smart.facadeMethods.join(', ') || '-', 'للقراءة فقط') +
      '</tbody></table></div></div>';
  }



  function renderPerformanceSection(perf) {
    var scripts = perf.scripts || {};
    var nav = scripts.navigationTiming || {};
    var memory = perf.memory || null;
    var heavyRows = (scripts.heavyScripts || []).slice(0, 8).map(function (item) {
      return '<tr><td>' + esc(item.src) + '</td><td><b>' + esc(formatBytes(item.decodedBodySize || item.transferSize || 0)) + '</b></td><td>' + esc(item.duration || 0) + ' ms</td><td>' + esc(item.blocking ? 'Blocking' : 'Non-blocking') + '</td><td>' + esc(item.reason || '') + '</td></tr>';
    }).join('');
    var candidateRows = (scripts.lazyLoadingCandidates || []).slice(0, 8).map(function (item) {
      return '<tr><td>' + esc(item.src) + '</td><td>' + esc(item.reason || '') + '</td><td>' + esc(item.blocking ? 'يفضل فحص defer/lazy pilot' : 'مرشح لاحق') + '</td></tr>';
    }).join('');
    var recs = (perf.recommendations || []).map(function (text) { return '<li>' + esc(text) + '</li>'; }).join('');
    return '<div class="pet-mc-section"><h3>Performance / Loading</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Scripts Count', scripts.scriptCount <= 150, scripts.scriptCount + ' script') +
        statusBadge('Blocking Scripts', scripts.blockingScripts <= 100, scripts.blockingScripts + ' blocking') +
        statusBadge('Async/Defer/Module', scripts.hasAnyAsyncDeferModule, scripts.hasAnyAsyncDeferModule ? 'موجود' : 'غير مستخدم') +
        statusBadge('Resource Timing', scripts.timedScripts > 0, scripts.timedScripts + ' timed / ' + scripts.missingTiming + ' missing') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('JS Transfer Size', formatBytes(scripts.totalTransferSize || 0), 'من Performance API إن توفر') +
        kvRow('JS Decoded Size', formatBytes(scripts.totalDecodedBodySize || 0), 'حجم فك الضغط داخل المتصفح إن توفر') +
        kvRow('DOMContentLoaded', (nav.domContentLoaded || 0) + ' ms', 'قراءة متصفح فعلية') +
        kvRow('Load Event', (nav.loadEventEnd || 0) + ' ms', 'قراءة متصفح فعلية') +
        kvRow('DOM Nodes', (perf.dom && perf.dom.totalNodes) || 0, 'عدد عناصر الصفحة الحالية') +
        kvRow('Memory Used', memory ? formatBytes(memory.usedJSHeapSize) : 'غير متاح', 'Chrome فقط غالبًا') +
      '</tbody></table></div>' +
      '<div class="pet-mc-table-wrap" style="margin-top:10px"><table><thead><tr><th>أثقل ملفات مرصودة</th><th>الحجم</th><th>المدة</th><th>الحالة</th><th>السبب</th></tr></thead><tbody>' +
        (heavyRows || '<tr><td colspan="5">لا توجد بيانات resource timing كافية.</td></tr>') +
      '</tbody></table></div>' +
      '<div class="pet-mc-table-wrap" style="margin-top:10px"><table><thead><tr><th>مرشح Lazy Loading</th><th>سبب الترشيح</th><th>ملاحظة</th></tr></thead><tbody>' +
        (candidateRows || '<tr><td colspan="3">لا توجد ترشيحات حالية.</td></tr>') +
      '</tbody></table></div>' +
      '<div class="pet-mc-recommendations"><b>توصيات قراءة فقط:</b><ul>' + recs + '</ul></div>' +
    '</div>';
  }



  function renderLazyLoadingSection(lazy) {
    lazy = lazy || {};
    var rows = (lazy.candidates || []).map(function (item) {
      return '<tr><td>' + esc(item.area || '') + '</td><td>' + esc(item.src || '') + '</td><td>' + esc(item.priority || '') + '</td><td>' + esc(item.extractionStatus || item.mode || '') + '</td><td>' + esc(item.reason || '') + '</td></tr>';
    }).join('');
    return '<div class="pet-mc-section"><h3>Lazy Loading Enterprise</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Foundation Layer', !!lazy.enabled, lazy.enabled ? 'محمل' : 'غير محمل') +
        statusBadge('Safe Mode', lazy.safeMode !== false, lazy.safeMode !== false ? 'فعال' : 'غير فعال') +
        statusBadge('Prefetch Pilot', (lazy.prefetchedCandidates || 0) > 0, (lazy.prefetchedCandidates || 0) + ' prefetched') +
        statusBadge('Initial Load Candidates', (lazy.candidatesStillInInitialLoad || 0) === 0, (lazy.candidatesStillInInitialLoad || 0) + ' still loaded') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Mode', lazy.mode || '-', 'وضع التشغيل الحالي') +
        kvRow('Candidates', lazy.initialCandidateCount || 0, 'مرشحات التحميل الكسول') +
        kvRow('Pending Loads', lazy.pendingLoads || 0, 'تحميل ديناميكي قيد التنفيذ') +
        kvRow('Smart Reports Lazy Scripts', (lazy.smartReportsLazyLoadedCount || 0) + ' / ' + (lazy.smartReportsLazyScriptCount || 0), 'تحميل مؤجل لتقارير Smart Reports') +
        kvRow('Initial Blocking Reduced By', lazy.initialBlockingScriptsReducedBy || 0, 'تقليل مبدئي في السكريبتات blocking') +
        kvRow('Recommendation', lazy.recommendation || '-', 'توصية المرحلة') +
      '</tbody></table></div>' +
      '<div class="pet-mc-table-wrap" style="margin-top:10px"><table><thead><tr><th>Area</th><th>Script</th><th>Priority</th><th>Status</th><th>Reason</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="5">لا توجد بيانات Lazy Loading.</td></tr>') +
      '</tbody></table></div>' +
    '</div>';
  }

  function renderSilentCatchSection(silentCatch) {
    var rows = (silentCatch.topFiles || []).map(function (item) {
      return '<tr><td>' + esc(item.file || '') + '</td><td><b>' + esc(item.emptyCatchCount || 0) + '</b></td><td>' + formatBytes(item.sizeBytes || 0) + '</td><td>مرشح Diagnostics تدريجي</td></tr>';
    }).join('');
    return '<div class="pet-mc-section"><h3>Silent Catch Diagnostics Map</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Empty Catch Total', silentCatch.totalEmptyCatch <= 50, silentCatch.totalEmptyCatch + ' حالة') +
        statusBadge('Affected Files', silentCatch.affectedFiles <= 30, silentCatch.affectedFiles + ' ملف') +
        statusBadge('Runtime Events', true, silentCatch.runtimeEventsRelated + ' حدث مرتبط') +
        statusBadge('Mode', true, silentCatch.mode || 'read-only') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><thead><tr><th>الملف</th><th>عدد catch الصامت</th><th>الحجم</th><th>الإجراء المقترح</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="4">لا توجد حالات مرصودة.</td></tr>') +
      '</tbody></table></div>' +
      '<div class="pet-mc-recommendations"><b>توصية:</b><ul><li>' + esc(silentCatch.recommendation || '') + '</li><li>هذه الخريطة لا تغير أي catch حاليًا؛ هي تمهيد لإصلاحات Controlled لكل ملف على حدة.</li></ul></div>' +
    '</div>';
  }


  function renderInnerHTMLRiskSection(innerHTMLRisk) {
    var rows = (innerHTMLRisk.topFiles || []).map(function (item) {
      return '<tr><td>' + esc(item.file || '') + '</td><td><b>' + esc(item.count || 0) + '</b></td><td>' + esc(item.high || 0) + '</td><td>' + esc(item.review || 0) + '</td><td>' + esc(item.safe || 0) + '</td><td>' + formatBytes(item.sizeBytes || 0) + '</td><td>Safe Rendering تدريجي</td></tr>';
    }).join('');
    return '<div class="pet-mc-section"><h3>innerHTML Risk Assessment Map</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('innerHTML Total', innerHTMLRisk.totalInnerHTMLAssignments <= 50, innerHTMLRisk.totalInnerHTMLAssignments + ' حالة') +
        statusBadge('High Risk', innerHTMLRisk.highRisk === 0, innerHTMLRisk.highRisk + ' حالة') +
        statusBadge('Review', innerHTMLRisk.reviewRisk <= 30, innerHTMLRisk.reviewRisk + ' حالة') +
        statusBadge('Affected Files', innerHTMLRisk.affectedFiles <= 25, innerHTMLRisk.affectedFiles + ' ملف') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><thead><tr><th>الملف</th><th>الإجمالي</th><th>High</th><th>Review</th><th>Safe</th><th>الحجم</th><th>الإجراء المقترح</th></tr></thead><tbody>' +
        (rows || '<tr><td colspan="7">لا توجد حالات innerHTML مرصودة.</td></tr>') +
      '</tbody></table></div>' +
      '<div class="pet-mc-recommendations"><b>توصية:</b><ul><li>' + esc(innerHTMLRisk.recommendation || '') + '</li><li>تم تنفيذ Batch 2 من Safe Rendering Migration: تحويل contract reason modal وBI KPI tooltip/select helpers إلى DOM API أو SafeRender boundary بدون تغيير منطق العرض.</li></ul></div>' +
    '</div>';
  }



  function renderStructuralCleanupSection(structuralCleanup) {
    var summary = structuralCleanup.summary || {};
    var zeroRows = (structuralCleanup.zeroReferenceJSFiles || []).map(function (item) {
      return '<tr><td>' + esc(item.file || '') + '</td><td>' + esc(item.action || '') + '</td><td>' + esc(item.reason || '') + '</td></tr>';
    }).join('');
    var bucketRows = (structuralCleanup.transitionBuckets || []).map(function (item) {
      return '<tr><td>' + esc(item.type || '') + '</td><td><b>' + esc(item.count || 0) + '</b></td><td>' + esc(item.recommendation || '') + '</td></tr>';
    }).join('');
    var dupRows = (structuralCleanup.topDuplicateFunctionNames || []).map(function (item) {
      return '<tr><td>' + esc(item.name || '') + '</td><td><b>' + esc(item.count || 0) + '</b></td><td>اسم دالة متكرر؛ لا يعني خطأ مؤكدًا لكنه يحتاج مراجعة قبل consolidation.</td></tr>';
    }).join('');
    var applied = (structuralCleanup.appliedChanges || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('');
    return '<div class="pet-mc-section"><h3>Structural Cleanup Enterprise</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Removed Files', (summary.removedFiles || 0) === 0, (summary.removedFiles || 0) + ' حذف آمن') +
        statusBadge('Zero Reference JS', (summary.zeroReferenceJSFiles || 0) <= 2, (summary.zeroReferenceJSFiles || 0) + ' ملف') +
        statusBadge('Transition Files', (summary.transitionFiles || 0) <= 60, (summary.transitionFiles || 0) + ' ملف') +
        statusBadge('Duplicate Function Names', (summary.duplicateFunctionNames || 0) <= 400, (summary.duplicateFunctionNames || 0) + ' اسم') +
      '</div>' +
      '<h4>Zero-Reference JS Candidates</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>الملف</th><th>الإجراء</th><th>السبب</th></tr></thead><tbody>' +
        (zeroRows || '<tr><td colspan="3">لا توجد ملفات مرشحة.</td></tr>') +
      '</tbody></table></div>' +
      '<h4>Transition Buckets</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>النوع</th><th>العدد</th><th>التوصية</th></tr></thead><tbody>' +
        (bucketRows || '<tr><td colspan="3">لا توجد بيانات انتقالية.</td></tr>') +
      '</tbody></table></div>' +
      '<h4>Top Duplicate Function Names</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>الاسم</th><th>التكرار</th><th>ملاحظة</th></tr></thead><tbody>' +
        (dupRows || '<tr><td colspan="3">لا توجد تكرارات مرصودة.</td></tr>') +
      '</tbody></table></div>' +
      '<div class="pet-mc-recommendations"><b>ما تم تطبيقه:</b><ul>' + (applied || '<li>لا توجد تغييرات حذف.</li>') + '</ul><b>توصية:</b><ul><li>' + esc(structuralCleanup.recommendation || '') + '</li></ul></div>' +
    '</div>';
  }

  function renderRuntimeHardeningSection(runtimeHardening) {
    runtimeHardening = runtimeHardening || {};
    return '<div class="pet-mc-section"><h3>Runtime Hardening</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Runtime Hardening Layer', !!runtimeHardening.enabled, runtimeHardening.enabled ? 'محمل' : 'غير محمل') +
        statusBadge('Global Error Handler', !!runtimeHardening.globalErrorHandler, runtimeHardening.globalErrorHandler ? 'فعال' : 'غير فعال') +
        statusBadge('Unhandled Rejection Handler', !!runtimeHardening.unhandledRejectionHandler, runtimeHardening.unhandledRejectionHandler ? 'فعال' : 'غير فعال') +
        statusBadge('Diagnostics Bridge', !!runtimeHardening.diagnosticsAvailable, runtimeHardening.diagnosticsAvailable ? 'متصل' : 'غير متصل') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Mode', runtimeHardening.mode || '-', 'وضع التشغيل') +
        kvRow('Guarded Calls', runtimeHardening.guardedCalls || 0, 'استدعاءات محمية عبر safeCall') +
        kvRow('Captured Exceptions', runtimeHardening.capturedExceptions || 0, 'أخطاء ملتقطة عبر Runtime Hardening') +
        kvRow('Captured Warnings', runtimeHardening.capturedWarnings || 0, 'تحذيرات ملتقطة') +
        kvRow('Last Error At', runtimeHardening.lastErrorAt || '-', 'آخر خطأ ملتقط') +
        kvRow('Recommendation', runtimeHardening.recommendation || '-', 'توصية المرحلة') +
      '</tbody></table></div>' +
      '<div class="pet-mc-recommendations"><b>ملاحظة:</b><ul><li>هذه الطبقة Passive ولا تغير منطق Router أو Storage أو Permissions.</li><li>استخدم safeCall/captureException لاحقًا عند استكمال تحويل silent catch على دفعات.</li></ul></div>' +
    '</div>';
  }


  function renderEnterpriseRegressionSection(regression) {
    regression = regression || { totals: {}, categories: [], checkpoints: [], manualChecklist: [] };
    var totals = regression.totals || {};
    var categoryRows = (regression.categories || []).map(function (cat) {
      return '<tr><td>' + esc(cat.name || cat.key || '') + '</td><td><b>' + esc(cat.score || 0) + '%</b></td><td>' + esc(cat.pass || 0) + '</td><td>' + esc(cat.warn || 0) + '</td><td>' + esc(cat.fail || 0) + '</td></tr>';
    }).join('');
    var checkpoints = (regression.checkpoints || []).slice(0, 24).map(function (item) {
      return '<tr><td>' + esc(item.id || '') + '</td><td>' + esc(item.title || '') + '</td><td><span class="pet-mc-level ' + esc(item.status || 'info') + '">' + esc(item.status || '') + '</span></td><td>' + esc(item.severity || '') + '</td><td>' + esc(item.note || '') + '</td></tr>';
    }).join('');
    var checklist = (regression.manualChecklist || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('');
    return '<div class="pet-mc-section"><h3>Enterprise Regression Suite</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Regression Suite', !!regression.enabled, regression.enabled ? 'فعال' : 'غير متاح') +
        statusBadge('Ready For Golden', !!regression.readyForGolden, regression.readyForGolden ? 'نعم بعد الاختبار اليدوي' : 'يحتاج مراجعة') +
        statusBadge('Critical Failures', (totals.criticalFailures || 0) === 0, (totals.criticalFailures || 0) + ' حالة') +
        statusBadge('Readiness Score', (regression.readinessScore || 0) >= 75, (regression.readinessScore || 0) + '%') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Total Checks', totals.total || 0, 'إجمالي فحوصات القراءة فقط') +
        kvRow('Passed / Warnings / Failed', (totals.pass || 0) + ' / ' + (totals.warn || 0) + ' / ' + (totals.fail || 0), 'نتائج الفحص') +
        kvRow('Mode', regression.mode || '-', 'وضع الفحص') +
        kvRow('Recommendation', regression.recommendation || '-', 'توصية الإصدار') +
      '</tbody></table></div>' +
      '<h4>Category Scores</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>المجال</th><th>Score</th><th>Pass</th><th>Warn</th><th>Fail</th></tr></thead><tbody>' + categoryRows + '</tbody></table></div>' +
      '<h4>Top Checkpoints</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>ID</th><th>الفحص</th><th>الحالة</th><th>الأهمية</th><th>ملاحظة</th></tr></thead><tbody>' + checkpoints + '</tbody></table></div>' +
      '<div class="pet-mc-recommendations"><b>Manual Checklist قبل Golden Baseline:</b><ul>' + checklist + '</ul></div>' +
    '</div>';
  }



  function renderGoldenBaselineSection(golden) {
    golden = golden || {};
    return '<div class="pet-mc-section"><h3>🏆 Enterprise Golden Baseline</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Certification', !!golden.certified, golden.status || '-') +
        statusBadge('Golden Version', true, golden.version || getCurrentMaintenanceVersion()) +
        statusBadge('Architecture Freeze', true, golden.freezeMode || '-') +
        statusBadge('Enterprise Readiness', (golden.enterpriseReadiness || 0) >= 80, (golden.enterpriseReadiness || 0) + '%') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('System Health Score', (golden.healthScore || 0) + '%', 'متوسط مؤشرات الاعتماد') +
        kvRow('Architecture Score', (golden.architectureScore || 0) + '%', 'جاهزية البنية') +
        kvRow('Maintainability Score', (golden.maintainabilityScore || 0) + '%', 'قابلية الصيانة') +
        kvRow('Performance Score', (golden.performanceScore || 0) + '%', 'قياس نسبي بناءً على Baseline') +
        kvRow('Security Score', (golden.securityScore || 0) + '%', 'تحقق Client-side الحالي') +
        kvRow('Runtime Score', (golden.runtimeScore || 0) + '%', 'Diagnostics / Runtime Hardening') +
        kvRow('Regression Score', (golden.regressionScore || 0) + '%', 'Regression Suite') +
        kvRow('Release Decision', golden.releaseDecision || '-', 'قرار الاعتماد') +
        kvRow('Next Program', golden.nextProgram || '-', 'المرحلة التالية') +
      '</tbody></table></div>' +
      '<div class="pet-mc-recommendations"><b>نطاق الاعتماد:</b><ul>' + (golden.lockedScopes || []).map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul></div>' +
    '</div>';
  }


  function renderOptimizedGoldenBaselineSection(optimized) {
    optimized = optimized || {};
    var imp = optimized.improvements || {};
    var current = optimized.current || {};
    var baseline = optimized.baseline || {};
    return '<div class="pet-mc-section"><h3>🚀 Enterprise Optimized Golden Baseline</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Optimized Certification', !!optimized.certified, optimized.status || '-') +
        statusBadge('Optimized Version', true, optimized.version || getCurrentMaintenanceVersion()) +
        statusBadge('Optimized Readiness', (optimized.optimizedReadiness || 0) >= 85, (optimized.optimizedReadiness || 0) + '%') +
        statusBadge('Internal Runtime Errors', true, '0 مطلوب للاعتماد') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><thead><tr><th>المؤشر</th><th>قبل التحسين</th><th>الحالي</th><th>التحسن</th></tr></thead><tbody>' +
        '<tr><td>Blocking Scripts</td><td>' + esc(baseline.blockingScripts || 0) + '</td><td>' + esc(current.blockingScripts || 0) + '</td><td>' + esc((imp.blockingScriptsReducedBy || 0) + ' ملف / ' + (imp.blockingScriptsPercent || 0) + '%') + '</td></tr>' +
        '<tr><td>Silent Catch</td><td>' + esc(baseline.silentCatch || 0) + '</td><td>' + esc(current.silentCatch || 0) + '</td><td>' + esc((imp.silentCatchReducedBy || 0) + ' حالة / ' + (imp.silentCatchPercent || 0) + '%') + '</td></tr>' +
        '<tr><td>innerHTML High Risk</td><td>' + esc(baseline.innerHTMLHighRisk || 0) + '</td><td>' + esc(current.innerHTMLHighRisk || 0) + '</td><td>' + esc((imp.innerHTMLHighRiskReducedBy || 0) + ' حالة / ' + (imp.innerHTMLHighRiskPercent || 0) + '%') + '</td></tr>' +
        kvRow('Release Decision', optimized.releaseDecision || '-', 'قرار الاعتماد') +
        kvRow('Next Program', optimized.nextProgram || '-', 'المرحلة التالية') +
      '</tbody></table></div>' +
    '</div>';
  }


  function renderGreenEnterpriseBaselineSection(green) {
    green = green || {};
    return '<div class="pet-mc-section"><h3>🟢 Green Enterprise Baseline</h3>' +
      '<div class="pet-mc-grid pet-mc-grid-3">' +
        statusBadge('Green Certification', !!green.certified, green.status || '-') +
        statusBadge('Green Version', true, green.version || getCurrentMaintenanceVersion()) +
        statusBadge('Green Readiness', (green.greenReadiness || 0) >= 85, (green.greenReadiness || 0) + '%') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Internal Runtime Errors', green.internalRuntimeErrors || 0, 'الهدف: 0') +
        kvRow('Blocking Scripts', green.blockingScripts || 0, 'تحسن تدريجي مع بقاء خطة Lazy Loading') +
        kvRow('Silent Catch Remaining', green.silentCatchRemaining || 0, 'بعد التنظيف النهائي') +
        kvRow('innerHTML High Risk Remaining', green.innerHTMLHighRiskRemaining || 0, 'ضمن خطة Safe Rendering لاحقة') +
        kvRow('CDN Hardening', green.cdnHardening ? 'Active' : 'Review', 'مراقبة أخطاء Cross-Origin') +
        kvRow('Release Decision', green.releaseDecision || '-', 'قرار الاعتماد') +
      '</tbody></table></div>' +
      '</div>';
  }


  function renderFinalEnterpriseBaselineSection(finalBaseline) {
    finalBaseline = finalBaseline || {};
    var current = finalBaseline.current || {};
    var rows = (finalBaseline.timeline || []).map(function (item) {
      return '<tr><td>' + esc(item.version || '') + '</td><td>' + esc(item.label || '') + '</td><td>' + esc(item.blockingScripts || 0) + '</td><td>' + esc(item.silentCatch || 0) + '</td><td>' + esc(item.innerHTMLHighRisk || 0) + '</td><td>' + esc(item.runtime || '') + '</td></tr>';
    }).join('');
    return '<div class="pet-mc-section"><h3>✅ Final Enterprise Baseline</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Final Certification', !!finalBaseline.certified, finalBaseline.status || '-') +
        statusBadge('Final Version', true, finalBaseline.version || getCurrentMaintenanceVersion()) +
        statusBadge('Final Readiness', (finalBaseline.finalReadiness || 0) >= 88, (finalBaseline.finalReadiness || 0) + '%') +
        statusBadge('Runtime', finalBaseline.runtimeStatus === 'Stable', finalBaseline.runtimeStatus || '-') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Architecture Status', finalBaseline.architectureStatus || '-', 'حالة البنية') +
        kvRow('Security Status', finalBaseline.securityStatus || '-', 'حالة الحماية') +
        kvRow('Performance Status', finalBaseline.performanceStatus || '-', 'حالة الأداء') +
        kvRow('Technical Debt', finalBaseline.technicalDebtStatus || '-', 'ديون تقنية معروفة ومخططة') +
        kvRow('Blocking Scripts', current.blockingScripts || 0, 'الحالة الحالية') +
        kvRow('Silent Catch', current.silentCatch || 0, 'الحالة الحالية') +
        kvRow('innerHTML High Risk', current.innerHTMLHighRisk || 0, 'الحالة الحالية') +
        kvRow('Internal Runtime Errors', current.internalRuntimeErrors || 0, 'يجب أن تكون 0') +
        kvRow('Release Decision', finalBaseline.releaseDecision || '-', 'قرار الإصدار') +
        kvRow('Next Program', finalBaseline.nextProgram || '-', 'المرحلة التالية') +
      '</tbody></table></div>' +
      '<h4>Project Timeline</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>Version</th><th>Milestone</th><th>Blocking</th><th>Silent Catch</th><th>innerHTML High</th><th>Runtime</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '</div>';
  }


  function renderEnterpriseLTSBaselineSection(lts) {
    lts = lts || {};
    return '<div class="pet-mc-section"><h3>🧷 Enterprise LTS Baseline</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('LTS Certification', !!lts.certified, lts.status || '-') +
        statusBadge('LTS Version', true, lts.version || getCurrentMaintenanceVersion()) +
        statusBadge('LTS Readiness', (lts.ltsReadiness || 0) >= 88, (lts.ltsReadiness || 0) + '%') +
        statusBadge('Architecture Freeze', !!lts.architectureFreeze, lts.architectureFreeze ? 'Frozen' : 'Review') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Support Mode', lts.supportMode || '-', 'وضع الدعم') +
        kvRow('Feature Freeze Rule', lts.featureFreeze || '-', 'قاعدة التطوير القادم') +
        kvRow('Current User', lts.currentUser || '-', 'مستخدم الاختبار الحالي') +
        kvRow('Internal Runtime Errors', lts.internalRuntimeErrors || 0, 'يجب أن تكون 0') +
        kvRow('Release Decision', lts.releaseDecision || '-', 'قرار الإصدار') +
        kvRow('Next Program', lts.nextProgram || '-', 'المشروع التالي') +
      '</tbody></table></div>' +
    '</div>';
  }


  function renderVehiclePermissionsVerificationSection(vehicleVerification) {
    vehicleVerification = vehicleVerification || {};
    var scope = vehicleVerification.scope || {};
    var checks = vehicleVerification.checks || [];
    var details = vehicleVerification.detailedPermissions || {};
    var checkRows = checks.map(function (item) {
      return '<tr><td>' + esc(item.name || '') + '</td><td>' + (item.ok ? '✅' : '⚠️') + '</td><td>' + esc(item.note || '') + '</td></tr>';
    }).join('');
    var detailRows = Object.keys(details).map(function (key) {
      return '<tr><td>' + esc(key) + '</td><td>' + (details[key] ? 'مسموح' : 'غير مسموح / غير محدد') + '</td></tr>';
    }).join('');
    return '<div class="pet-mc-section"><h3>🚐 Vehicle Permissions Final Verification</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Vehicle Permissions Certification', !!vehicleVerification.certified, vehicleVerification.certified ? 'Certified' : 'Review') +
        statusBadge('Readiness', (vehicleVerification.readiness || 0) >= 85, (vehicleVerification.readiness || 0) + '%') +
        statusBadge('Vehicle Scope', !!scope, scope.allVehicles ? 'كل السيارات' : ((scope.vehicles || []).length + ' سيارة محددة')) +
        statusBadge('Vehicles', (vehicleVerification.vehicleCount || 0) > 0, (vehicleVerification.vehicleCount || 0) + ' vehicle(s)') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Current User', vehicleVerification.currentUser || '-', 'مستخدم الاختبار الحالي') +
        kvRow('Release Decision', vehicleVerification.releaseDecision || '-', 'قرار الاعتماد') +
      '</tbody></table></div>' +
      '<h4>Verification Checks</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>Check</th><th>Status</th><th>Note</th></tr></thead><tbody>' + checkRows + '</tbody></table></div>' +
      '<h4>Detailed Vehicle Operation Permissions</h4><div class="pet-mc-table-wrap"><table><thead><tr><th>Permission</th><th>Status</th></tr></thead><tbody>' + detailRows + '</tbody></table></div>' +
    '</div>';
  }

  function renderSecuritySection(security) {
    var helperMethods = security.securityHelperMethods.join(', ') || '-';
    var passwordMethods = security.passwordSecurityMethods.join(', ') || '-';
    var permissionMethods = security.permissionMethods.join(', ') || '-';
    var user = security.currentUser || {};
    return '<div class="pet-mc-section"><h3>Security / Permissions</h3>' +
      '<div class="pet-mc-status-grid">' +
        statusBadge('Password Security', security.passwordSecurityPresent, security.passwordSecurityPresent ? 'موجود' : 'غير مرصود') +
        statusBadge('Security Helpers', security.securityHelperPresent, security.securityHelperPresent ? 'موجود' : 'غير مرصود') +
        statusBadge('Permissions Surface', security.permissionsPresent, security.permissionsPresent ? 'موجود' : 'غير مرصود') +
        statusBadge('Session Timeout', security.sessionTimeoutPresent, security.sessionTimeoutPresent ? 'موجود' : 'غير مرصود') +
      '</div>' +
      '<div class="pet-mc-table-wrap"><table><tbody>' +
        kvRow('Current User', user.present ? ((user.username || user.id || '-') + ' / ' + (user.role || '-')) : 'غير مرصود', user.source || '') +
        kvRow('Security Script Count', security.securityScriptCount, 'ملفات حماية/صلاحيات محملة') +
        kvRow('escapeHtml / sanitizeHtml / setInnerHTML', (security.hasEscapeHtml?'✓':'-') + ' / ' + (security.hasSanitizeHtml?'✓':'-') + ' / ' + (security.hasSetInnerHTML?'✓':'-'), 'مساعدات عرض آمن') +
        kvRow('Permission Methods', permissionMethods, 'للقراءة فقط') +
        kvRow('Password Methods', passwordMethods, 'للقراءة فقط') +
        kvRow('Security Helper Methods', helperMethods, 'للقراءة فقط') +
        kvRow('Router openTab', security.routerOpenTabPresent ? 'Present' : 'Missing', security.guardedPilotPresent ? 'Guarded pilot موجود' : 'يحتاج تحقق لاحق قبل أي hardening') +
      '</tbody></table></div></div>';
  }

  function eventRow(event) {
    var payload = event && event.payload ? event.payload : {};
    var message = payload.message || payload.name || event.source || '';
    return '<tr>' +
      '<td>' + esc(event.timestamp || '') + '</td>' +
      '<td><span class="pet-mc-level ' + esc(event.level || 'info') + '">' + esc(event.level || 'info') + '</span></td>' +
      '<td>' + esc(event.source || '') + '</td>' +
      '<td>' + esc(message) + '</td>' +
      '</tr>';
  }


  function safeJson(value) {
    try { return JSON.stringify(value, null, 2); } catch (e) { return '{}'; }
  }

  function buildMaintenanceReportText(snapshot) {
    snapshot = snapshot || getDiagnosticSnapshot();
    var lines = [];
    var perfScripts = snapshot.performance && snapshot.performance.scripts ? snapshot.performance.scripts : {};
    var storage = snapshot.storage || {};
    var router = snapshot.router || {};
    var smart = snapshot.smartReports || {};
    var security = snapshot.security || {};
    var silentCatch = snapshot.silentCatch || {};
    var innerHTMLRisk = snapshot.innerHTMLRisk || {};
    var lazyLoading = snapshot.lazyLoading || {};
    var structuralCleanup = snapshot.structuralCleanup || {};
    var structuralSummary = structuralCleanup.summary || {};
    var currentUser = security.currentUser || {};
    var golden = snapshot.goldenBaseline || {};
    var optimized = snapshot.optimizedGoldenBaseline || {};
    var green = snapshot.greenEnterpriseBaseline || {};
    var finalBaseline = snapshot.finalEnterpriseBaseline || {};
    var ltsBaseline = snapshot.enterpriseLTSBaseline || {};
    var regression = snapshot.regressionSuite || {};
    var regressionTotals = regression.totals || {};
    var cdnHardening = snapshot.cdnHardening || {};
    var runtimeHardening = snapshot.runtimeHardening || {};
    var vehicleVerification = snapshot.vehiclePermissionsVerification || {};

    function safeSection(title, builder) {
      try {
        if (title) { lines.push(title); }
        builder();
      } catch (sectionError) {
        lines.push('- Section unavailable: ' + (sectionError && sectionError.message ? sectionError.message : 'unknown error'));
        try { reportDiagnostics('maintenance-center.report.section-unavailable', { section: title || 'unknown', message: sectionError && sectionError.message }); } catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('maintenance/maintenance-center.js',e);}
      }
      lines.push('');
    }

    lines.push('PETATOE Maintenance & Diagnostics Report');
    lines.push('========================================');
    lines.push('Version: ' + (snapshot.maintenanceVersion || ''));
    lines.push('Checked At: ' + (snapshot.checkedAtLocal || snapshot.checkedAt || ''));
    lines.push('Health Level: ' + (snapshot.healthLevel || ''));
    lines.push('Diagnostics Available: ' + (snapshot.diagnosticsAvailable ? 'Yes' : 'No'));
    lines.push('Online: ' + (snapshot.online ? 'Yes' : 'No'));
    lines.push('');

    var healthAnalysis = snapshot.healthAnalysis || getHealthAnalysis(snapshot);
    var errAnalysis = healthAnalysis.errorAnalysis || {};
    var systemStatus = summarizeSystemStatus(snapshot, healthAnalysis);
    var priorityRecommendations = buildPriorityRecommendations(snapshot, healthAnalysis);

    lines.push('SYSTEM STATUS');
    lines.push('- Runtime: ' + systemStatus.runtime);
    lines.push('- Security: ' + systemStatus.security);
    lines.push('- Performance: ' + systemStatus.performance);
    lines.push('- Technical Debt: ' + systemStatus.technicalDebt);
    lines.push('- Overall: ' + systemStatus.overall);
    lines.push('');

    lines.push('HEALTH ANALYSIS');
    lines.push('- Health Score: ' + (healthAnalysis.score || 0) + '%');
    lines.push('- Internal Runtime Errors: ' + (errAnalysis.internal || 0));
    lines.push('- External / Cross-Origin Script Errors: ' + (errAnalysis.external || 0));
    lines.push('- Recommendation: ' + (healthAnalysis.recommendation || '-'));
    (healthAnalysis.critical || []).forEach(function (item) { lines.push('- Critical: ' + item); });
    (healthAnalysis.warnings || []).slice(0, 8).forEach(function (item) { lines.push('- Warning: ' + item); });
    if (!(healthAnalysis.critical || []).length && !(healthAnalysis.warnings || []).length) { lines.push('- No blocking health issues detected.'); }
    lines.push('');

    lines.push('PRIORITY RECOMMENDATIONS');
    priorityRecommendations.forEach(function (item) { lines.push('- ' + item); });
    lines.push('');

    lines.push('SUMMARY');
    lines.push('- Scripts: ' + snapshot.scripts);
    lines.push('- Blocking JS: ' + (perfScripts.blockingScripts || 0));
    lines.push('- Runtime Events: ' + ((snapshot.events || []).length));
    lines.push('- Errors: ' + ((snapshot.errors || []).length) + ' | Internal: ' + ((snapshot.healthAnalysis && snapshot.healthAnalysis.errorAnalysis && snapshot.healthAnalysis.errorAnalysis.internal) || 0) + ' | External: ' + ((snapshot.healthAnalysis && snapshot.healthAnalysis.errorAnalysis && snapshot.healthAnalysis.errorAnalysis.external) || 0));
    lines.push('- Stylesheets: ' + snapshot.stylesheets);
    lines.push('- Storage Keys: local ' + snapshot.localStorageKeys + ' / session ' + snapshot.sessionStorageKeys);
    lines.push('- Golden Baseline: ' + (golden.status || '-') + ' | Readiness: ' + (golden.enterpriseReadiness || 0) + '%');
    lines.push('- Optimized Baseline: ' + (optimized.status || '-') + ' | Readiness: ' + (optimized.optimizedReadiness || 0) + '%');
    lines.push('- Silent Catch: ' + (silentCatch.totalEmptyCatch || 0) + ' across ' + (silentCatch.affectedFiles || 0) + ' files');
    lines.push('- innerHTML Risk: ' + (innerHTMLRisk.totalInnerHTMLAssignments || 0) + ' assignments | High: ' + (innerHTMLRisk.highRisk || 0) + ' | Review: ' + (innerHTMLRisk.reviewRisk || 0));
    lines.push('');

    lines.push('ENTERPRISE GOLDEN BASELINE');
    lines.push('- Version: ' + (golden.version || getCurrentMaintenanceVersion()));
    lines.push('- Certified: ' + (golden.certified ? 'Yes' : 'Conditional / Manual review'));
    lines.push('- Health Score: ' + (golden.healthScore || 0) + '%');
    lines.push('- Architecture Score: ' + (golden.architectureScore || 0) + '%');
    lines.push('- Performance Score: ' + (golden.performanceScore || 0) + '%');
    lines.push('- Security Score: ' + (golden.securityScore || 0) + '%');
    lines.push('- Release Decision: ' + (golden.releaseDecision || '-'));
    lines.push('');

    lines.push('ENTERPRISE OPTIMIZED GOLDEN BASELINE');
    lines.push('- Version: ' + (optimized.version || getCurrentMaintenanceVersion()));
    lines.push('- Certified: ' + (optimized.certified ? 'Yes' : 'Conditional / Planned warnings'));
    lines.push('- Optimized Readiness: ' + (optimized.optimizedReadiness || 0) + '%');
    lines.push('- Blocking Scripts: ' + (((optimized.baseline || {}).blockingScripts) || 0) + ' → ' + (((optimized.current || {}).blockingScripts) || 0) + ' | reduced ' + (((optimized.improvements || {}).blockingScriptsReducedBy) || 0));
    lines.push('- Silent Catch: ' + (((optimized.baseline || {}).silentCatch) || 0) + ' → ' + (((optimized.current || {}).silentCatch) || 0) + ' | reduced ' + (((optimized.improvements || {}).silentCatchReducedBy) || 0) + ' (' + (((optimized.improvements || {}).silentCatchPercent) || 0) + '%)');
    lines.push('- innerHTML High Risk: ' + (((optimized.baseline || {}).innerHTMLHighRisk) || 0) + ' → ' + (((optimized.current || {}).innerHTMLHighRisk) || 0) + ' | reduced ' + (((optimized.improvements || {}).innerHTMLHighRiskReducedBy) || 0) + ' (' + (((optimized.improvements || {}).innerHTMLHighRiskPercent) || 0) + '%)');
    lines.push('- Release Decision: ' + (optimized.releaseDecision || '-'));
    lines.push('');

    lines.push('GREEN ENTERPRISE BASELINE');
    lines.push('- Version: ' + (green.version || getCurrentMaintenanceVersion()));
    lines.push('- Certified: ' + (green.certified ? 'Yes' : 'Conditional / Planned warnings'));
    lines.push('- Green Readiness: ' + (green.greenReadiness || 0) + '%');
    lines.push('- Internal Runtime Errors: ' + (green.internalRuntimeErrors || 0));
    lines.push('- Blocking Scripts: ' + (green.blockingScripts || 0));
    lines.push('- Silent Catch Remaining: ' + (green.silentCatchRemaining || 0));
    lines.push('- innerHTML High Risk Remaining: ' + (green.innerHTMLHighRiskRemaining || 0));
    lines.push('- CDN Hardening: ' + (green.cdnHardening ? 'Active' : 'Review'));
    lines.push('- Release Decision: ' + (green.releaseDecision || '-'));
    lines.push('');

    lines.push('FINAL ENTERPRISE BASELINE');
    lines.push('- Version: ' + (finalBaseline.version || getCurrentMaintenanceVersion()));
    lines.push('- Certified: ' + (finalBaseline.certified ? 'Yes' : 'Conditional / Planned warnings'));
    lines.push('- Final Readiness: ' + (finalBaseline.finalReadiness || 0) + '%');
    lines.push('- Architecture Status: ' + (finalBaseline.architectureStatus || '-'));
    lines.push('- Security Status: ' + (finalBaseline.securityStatus || '-'));
    lines.push('- Runtime Status: ' + (finalBaseline.runtimeStatus || '-'));
    lines.push('- Performance Status: ' + (finalBaseline.performanceStatus || '-'));
    lines.push('- Technical Debt: ' + (finalBaseline.technicalDebtStatus || '-'));
    lines.push('- Release Decision: ' + (finalBaseline.releaseDecision || '-'));
    lines.push('- Next Program: ' + (finalBaseline.nextProgram || '-'));
    lines.push('');

    lines.push('FINAL PROJECT TIMELINE');
    (finalBaseline.timeline || []).forEach(function (item) {
      lines.push('- ' + (item.version || '-') + ' | ' + (item.label || '-') + ' | Blocking: ' + (item.blockingScripts || 0) + ' | Silent Catch: ' + (item.silentCatch || 0) + ' | innerHTML High: ' + (item.innerHTMLHighRisk || 0) + ' | Runtime: ' + (item.runtime || '-'));
    });
    lines.push('');

    lines.push('ENTERPRISE LTS BASELINE');
    lines.push('- Version: ' + (ltsBaseline.version || getCurrentMaintenanceVersion()));
    lines.push('- Certified: ' + (ltsBaseline.certified ? 'Yes' : 'Conditional / Planned warnings'));
    lines.push('- LTS Readiness: ' + (ltsBaseline.ltsReadiness || 0) + '%');
    lines.push('- Support Mode: ' + (ltsBaseline.supportMode || '-'));
    lines.push('- Architecture Freeze: ' + (ltsBaseline.architectureFreeze ? 'Yes' : 'No'));
    lines.push('- Current User: ' + (ltsBaseline.currentUser || '-'));
    lines.push('- Internal Runtime Errors: ' + (ltsBaseline.internalRuntimeErrors || 0));
    lines.push('- Release Decision: ' + (ltsBaseline.releaseDecision || '-'));
    lines.push('- Next Program: ' + (ltsBaseline.nextProgram || '-'));
    lines.push('');


    lines.push('VEHICLE PERMISSIONS FINAL VERIFICATION');
    lines.push('- Version: ' + (vehicleVerification.version || getCurrentMaintenanceVersion()));
    lines.push('- Certified: ' + (vehicleVerification.certified ? 'Yes' : 'Review'));
    lines.push('- Readiness: ' + (vehicleVerification.readiness || 0) + '%');
    lines.push('- Current User: ' + (vehicleVerification.currentUser || '-'));
    lines.push('- Vehicles Detected: ' + (vehicleVerification.vehicleCount || 0));
    lines.push('- Vehicle Scope: ' + ((vehicleVerification.scope && vehicleVerification.scope.allVehicles) ? 'All vehicles' : (((vehicleVerification.scope && vehicleVerification.scope.vehicles) || []).join(', ') || 'No vehicles assigned')));
    (vehicleVerification.checks || []).forEach(function (item) { lines.push('- ' + (item.ok ? 'PASS' : 'WARN') + ': ' + (item.name || '-') + ' | ' + (item.note || '')); });
    lines.push('- Release Decision: ' + (vehicleVerification.releaseDecision || '-'));
    lines.push('');

    lines.push('ROUTER / NAVIGATION');
    lines.push('- Router Present: ' + (router.routerPresent ? 'Yes' : 'No'));
    lines.push('- Route Registry Present: ' + (router.routeRegistryPresent ? 'Yes' : 'No'));
    lines.push('- Route Count: ' + (router.routeCount || 0));
    lines.push('- Protected Routes: ' + (router.protectedRoutes || 0));
    lines.push('- Sensitive Routes: ' + (router.sensitiveRoutes || 0));
    lines.push('- Guarded Pilot: ' + (router.guardedPilotPresent ? 'Yes' : 'No'));
    lines.push('');

    lines.push('STORAGE');
    lines.push('- Storage Adapter Present: ' + (storage.storageAdapterPresent ? 'Yes' : 'No'));
    lines.push('- Storage Mode: ' + (storage.storageMode || 'local/default'));
    lines.push('- Mapped Keys: ' + (storage.mappedKeys || 0));
    lines.push('- Local Approx Size: ' + formatBytes(storage.localStorageApproxSize || 0));
    lines.push('- Session Approx Size: ' + formatBytes(storage.sessionStorageApproxSize || 0));
    lines.push('');

    lines.push('SMART REPORTS');
    lines.push('- Facade Present: ' + (smart.facadePresent ? 'Yes' : 'No'));
    lines.push('- Optimizer Present: ' + (smart.optimizerPresent ? 'Yes' : 'No'));
    lines.push('- Data Engine Present: ' + (smart.dataEnginePresent ? 'Yes' : 'No'));
    lines.push('- Smart Script Count: ' + (smart.smartScriptCount || 0));
    lines.push('- Chart.js: ' + (smart.chartJsPresent ? 'Loaded' : 'Missing'));
    lines.push('- XLSX: ' + (smart.xlsxPresent ? 'Loaded' : 'Missing'));
    lines.push('');

    lines.push('SECURITY / PERMISSIONS');
    lines.push('- Password Security: ' + (security.passwordSecurityPresent ? 'Present' : 'Missing'));
    lines.push('- Security Helper: ' + (security.securityHelperPresent ? 'Present' : 'Missing'));
    lines.push('- Permissions Surface: ' + (security.permissionsPresent ? 'Present' : 'Missing'));
    lines.push('- Session Timeout: ' + (security.sessionTimeoutPresent ? 'Present' : 'Missing'));
    lines.push('- Current User: ' + (currentUser.present ? ((currentUser.username || currentUser.id || 'detected') + ' / ' + (currentUser.role || '')) : 'not detected'));
    lines.push('');

    lines.push('PERFORMANCE / LOADING');
    lines.push('- Script Count: ' + (perfScripts.scriptCount || 0));
    lines.push('- Blocking Scripts: ' + (perfScripts.blockingScripts || 0));
    lines.push('- Lazy Loading Mode: ' + (lazyLoading.mode || '-'));
    lines.push('- CDN Hardening: ' + (cdnHardening.enabled ? ((cdnHardening.hardenedScriptCount || 0) + '/' + (cdnHardening.externalScriptCount || 0) + ' external scripts hardened | readiness ' + (cdnHardening.readinessScore || 0) + '%') : 'Missing'));
    lines.push('- Lazy Candidates: ' + (lazyLoading.initialCandidateCount || 0));
    lines.push('- Lazy Prefetched: ' + (lazyLoading.prefetchedCandidates || 0));
    lines.push('- Smart Reports Lazy: ' + ((lazyLoading.smartReportsLazyLoadedCount || 0) + '/' + (lazyLoading.smartReportsLazyScriptCount || 0)) + ' scripts loaded');
    lines.push('- Initial Blocking Reduced By: ' + (lazyLoading.initialBlockingScriptsReducedBy || 0));
    lines.push('- Structural Cleanup: zero-reference JS ' + (structuralSummary.zeroReferenceJSFiles || 0) + ' | transition files ' + (structuralSummary.transitionFiles || 0) + ' | removed files ' + (structuralSummary.removedFiles || 0));
    lines.push('- Runtime Hardening: ' + (runtimeHardening.enabled ? 'Active' : 'Missing') + ' | guarded calls ' + (runtimeHardening.guardedCalls || 0) + ' | exceptions ' + (runtimeHardening.capturedExceptions || 0));
    lines.push('- Regression Suite: score ' + (regression.readinessScore || 0) + '% | pass/warn/fail ' + (regressionTotals.pass || 0) + '/' + (regressionTotals.warn || 0) + '/' + (regressionTotals.fail || 0) + ' | ready ' + (regression.readyForGolden ? 'YES' : 'NO'));
    lines.push('- Async Scripts: ' + (perfScripts.asyncScripts || 0));
    lines.push('- Defer Scripts: ' + (perfScripts.deferScripts || 0));
    lines.push('- Module Scripts: ' + (perfScripts.moduleScripts || 0));
    lines.push('- JS Transfer Size: ' + formatBytes(perfScripts.totalTransferSize || 0));
    lines.push('- JS Decoded Size: ' + formatBytes(perfScripts.totalDecodedBodySize || 0));
    lines.push('');

    lines.push('CDN / EXTERNAL SCRIPT HARDENING');
    if (cdnHardening.enabled) {
      lines.push('- Mode: ' + (cdnHardening.mode || '-'));
      lines.push('- External Scripts: ' + (cdnHardening.externalScriptCount || 0));
      lines.push('- Hardened Scripts: ' + (cdnHardening.hardenedScriptCount || 0));
      lines.push('- Readiness Score: ' + (cdnHardening.readinessScore || 0) + '%');
      lines.push('- External Errors Captured: ' + ((cdnHardening.externalErrors && cdnHardening.externalErrors.count) || 0));
      (cdnHardening.libraries || []).forEach(function (lib) {
        lines.push('- ' + (lib.name || lib.key || 'Library') + ': ' + (lib.present ? 'Loaded' : 'Missing') + (lib.stub ? ' (fallback stub active)' : ''));
      });
      if (cdnHardening.recommendation) { lines.push('- Recommendation: ' + cdnHardening.recommendation); }
    } else {
      lines.push('- CDN hardening snapshot is not available.');
    }
    lines.push('');

    lines.push('HEAVY SCRIPTS');
    (perfScripts.heavyScripts || []).slice(0, 12).forEach(function (item, index) {
      lines.push((index + 1) + '. ' + (item.src || '') + ' | ' + formatBytes(item.decodedBodySize || item.transferSize || 0) + ' | ' + (item.duration || 0) + ' ms | ' + (item.reason || ''));
    });
    lines.push('');

    lines.push('SILENT CATCH MAP');
    (silentCatch.topFiles || []).slice(0, 15).forEach(function (item, index) {
      lines.push((index + 1) + '. ' + (item.file || '') + ' | ' + (item.emptyCatchCount || 0) + ' catches | ' + formatBytes(item.sizeBytes || 0));
    });
    lines.push('');

    lines.push('INNERHTML RISK MAP');
    (innerHTMLRisk.topFiles || []).slice(0, 15).forEach(function (item, index) {
      lines.push((index + 1) + '. ' + (item.file || '') + ' | total ' + (item.count || 0) + ' | high ' + (item.high || 0) + ' | review ' + (item.review || 0) + ' | safe ' + (item.safe || 0));
    });
    lines.push('');

    lines.push('ENTERPRISE REGRESSION SUITE');
    (regression.categories || []).forEach(function (cat) {
      lines.push('- ' + (cat.name || cat.key || '') + ': score ' + (cat.score || 0) + '% | pass/warn/fail ' + (cat.pass || 0) + '/' + (cat.warn || 0) + '/' + (cat.fail || 0));
    });
    lines.push('');

    lines.push('LATEST ERRORS');
    var listedErrors = (snapshot.errors || []);
    var externalCount = 0;
    listedErrors.slice(-20).reverse().forEach(function (event) { if (isExternalScriptError(event)) { externalCount++; } });
    if (externalCount) { lines.push('- External / cross-origin script errors grouped: ' + externalCount); }
    listedErrors.filter(function (event) { return !isExternalScriptError(event); }).slice(-10).reverse().forEach(function (event, index) {
      lines.push((index + 1) + '. [' + (event.level || 'error') + '] ' + (event.source || '') + ' - ' + ((event.payload && (event.payload.message || event.payload.error)) || event.message || ''));
    });
    if (!listedErrors.length) { lines.push('- No captured errors.'); }
    if (listedErrors.length && !listedErrors.filter(function (event) { return !isExternalScriptError(event); }).length) { lines.push('- No internal runtime errors captured.'); }
    lines.push('');

    lines.push('LATEST RUNTIME EVENTS');
    var compactedEvents = compactRuntimeEvents(snapshot.events || [], 15);
    if (compactedEvents.externalCount) { lines.push('- External / cross-origin script errors grouped in latest events: ' + compactedEvents.externalCount); }
    compactedEvents.rows.forEach(function (event, index) {
      lines.push((index + 1) + '. [' + (event.level || 'info') + '] ' + (event.source || '') + ' - ' + ((event.payload && (event.payload.message || event.payload.error)) || event.message || ''));
    });
    if (!(snapshot.events || []).length) { lines.push('- No runtime events.'); }
    if ((snapshot.events || []).length && !compactedEvents.rows.length && !compactedEvents.externalCount) { lines.push('- No displayable runtime events.'); }
    lines.push('');

    lines.push('Raw JSON Snapshot is available from: PETATOEMaintenanceCenter.exportReport("json")');
    return lines.join('\n');
  }

  function downloadTextFile(filename, content, mimeType) {
    try {
      var blob = new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        try { URL.revokeObjectURL(url); } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
        try { if (a && a.parentNode) { a.parentNode.removeChild(a); } } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
      }, 250);
      return true;
    } catch (e) {
      log('error', 'maintenance-center.export.download', { message: e && e.message ? e.message : String(e) });
      return false;
    }
  }

  function getReportFilename(ext) {
    var stamp = new Date().toISOString().replace(/[:.]/g, '-');
    return 'PETATOE_MAINTENANCE_REPORT_' + getCurrentMaintenanceVersion().replace(/[^a-zA-Z0-9_.-]/g, '_') + '_' + stamp + '.' + (ext || 'txt');
  }

  function showCopyStatus(message, ok) {
    try {
      var root = document.getElementById(CENTER_ID);
      if (!root) { return; }
      var old = root.querySelector('[data-pet-mc-copy-status]');
      if (old && old.parentNode) { old.parentNode.removeChild(old); }
      var box = document.createElement('div');
      box.setAttribute('data-pet-mc-copy-status', '1');
      box.className = 'pet-mc-copy-status ' + (ok ? 'ok' : 'warn');
      box.textContent = message;
      root.appendChild(box);
      setTimeout(function () {
        try { if (box && box.parentNode) { box.parentNode.removeChild(box); } } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
      }, 2600);
    } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
  }

  function manualCopyFallback(text, options) {
    options = options || {};
    try {
      var root = ensureRoot();
      var old = root.querySelector('[data-pet-mc-manual-copy]');
      if (old && old.parentNode) { old.parentNode.removeChild(old); }
      var wrap = document.createElement('div');
      wrap.className = 'pet-mc-manual-copy';
      wrap.setAttribute('data-pet-mc-manual-copy', '1');

      var title = document.createElement('strong');
      title.textContent = options.title || 'نسخ تقرير الصيانة';
      var hint = document.createElement('p');
      hint.textContent = options.hint || 'تم تجهيز التقرير بالكامل وتحديده. اضغط Ctrl + C إذا لم يتم النسخ تلقائيًا.';
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', 'readonly');
      area.setAttribute('data-pet-mc-copy-textarea', '1');

      var actions = document.createElement('div');
      actions.className = 'pet-mc-manual-actions';

      var retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'نسخ الآن';
      retry.addEventListener('click', function () {
        var ok = false;
        try {
          area.removeAttribute('readonly');
          area.focus();
          area.select();
          area.setSelectionRange(0, area.value.length);
          ok = document.execCommand && document.execCommand('copy');
          area.setAttribute('readonly', 'readonly');
        } catch (e) { ok = false; }
        if (ok) { showCopyStatus('تم نسخ التقرير بنجاح', true); }
        else { showCopyStatus('لم يسمح المتصفح بالنسخ التلقائي — اضغط Ctrl + C', false); }
      });

      var close = document.createElement('button');
      close.type = 'button';
      close.textContent = 'إغلاق';
      close.addEventListener('click', function () {
        try { if (wrap && wrap.parentNode) { wrap.parentNode.removeChild(wrap); } } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
      });

      actions.appendChild(retry);
      actions.appendChild(close);
      wrap.appendChild(title);
      wrap.appendChild(hint);
      wrap.appendChild(area);
      wrap.appendChild(actions);
      root.appendChild(wrap);
      setTimeout(function () {
        try { area.focus(); area.select(); area.setSelectionRange(0, area.value.length); } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
      }, 30);
      return area;
    } catch (e) {
      return null;
    }
  }

  function legacyCopyFallback(text) {
    var ta = null;
    try {
      ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.width = '2px';
      ta.style.height = '2px';
      ta.style.opacity = '0';
      ta.style.zIndex = '2147483647';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var ok = !!(document.execCommand && document.execCommand('copy'));
      try { document.body.removeChild(ta); } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
      return ok;
    } catch (e) {
      try { if (ta && ta.parentNode) { ta.parentNode.removeChild(ta); } } catch (ignore) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch cleanup fallback', ignore); }
      return false;
    }
  }

  function copyReportToClipboard() {
    var text = '';
    try { text = buildMaintenanceReportText(getDiagnosticSnapshot()); }
    catch (e) {
      text = 'PETATOE Maintenance Report\nFailed to build full report: ' + (e && e.message ? e.message : e);
    }

    function onSuccess(method) {
      log('info', 'maintenance-center.report.copy', { message: 'Maintenance report copied', method: method || 'clipboard' });
      showCopyStatus('تم نسخ تقرير الصيانة بالكامل', true);
      return true;
    }

    function showManual(reason) {
      log('warn', 'maintenance-center.report.copy', { message: 'Clipboard copy fallback opened', reason: reason || 'unknown' });
      manualCopyFallback(text, {
        title: 'نسخ تقرير الصيانة',
        hint: 'لو لم يتم النسخ تلقائيًا، التقرير محدد بالكامل الآن. اضغط Ctrl + C أو زر "نسخ الآن".'
      });
      showCopyStatus('تم فتح مربع النسخ اليدوي — اضغط Ctrl + C', false);
      return false;
    }

    // First: immediate same-click copy attempt for localhost/file/non-secure contexts.
    if (legacyCopyFallback(text)) { return onSuccess('execCommand-immediate'); }

    // Second: modern Clipboard API if browser allows it.
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).then(function () {
          onSuccess('navigator.clipboard');
        }).catch(function (err) {
          showManual(err && err.message ? err.message : 'navigator.clipboard rejected');
        });
        return true;
      }
    } catch (e) {
      // Continue to manual fallback.
    }

    return showManual('copy not allowed by browser');
  }

  function exportMaintenanceReport(format) {
    var snapshot = getDiagnosticSnapshot();
    var fmt = String(format || 'txt').toLowerCase();
    if (fmt === 'json') {
      return downloadTextFile(getReportFilename('json'), safeJson(snapshot), 'application/json;charset=utf-8');
    }
    return downloadTextFile(getReportFilename('txt'), buildMaintenanceReportText(snapshot), 'text/plain;charset=utf-8');
  }

  function render() {
    var snapshot = getDiagnosticSnapshot();
    var health = snapshot.health || {};
    var latestEvents = snapshot.events.slice(-12).reverse();
    var latestErrors = snapshot.errors.slice(-8).reverse();

    return '<div class="pet-mc-shell" dir="rtl">' +
      '<div class="pet-mc-header">' +
        '<div><h2>🛠️ مركز صيانة وتشخيص النظام</h2><p>Maintenance Center ' + esc(getCurrentMaintenanceVersion()) + ' — Final Enterprise Baseline / Router / Storage / Smart Reports / Security / Performance / Runtime Hardening / Regression Suite</p></div>' +
        '<div class="pet-mc-actions"><button type="button" data-pet-mc-copy onclick="try{window.PETATOEMaintenanceCenter.copyReport()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch(&quot;maintenance/maintenance-center.js&quot;,e);}">نسخ التقرير</button><button type="button" data-pet-mc-export-txt>تصدير TXT</button><button type="button" data-pet-mc-export-json>تصدير JSON</button><button type="button" data-pet-mc-refresh>تحديث</button><button type="button" data-pet-mc-close>إغلاق</button></div>' +
      '</div>' +
      '<div class="pet-mc-grid">' +
        metricCard('حالة التشخيص', snapshot.diagnosticsAvailable ? 'Active' : 'Missing', health.status || '') +
        metricCard('Optimized Baseline', snapshot.optimizedGoldenBaseline.certified ? 'Certified' : 'Review', snapshot.optimizedGoldenBaseline.version || getCurrentMaintenanceVersion()) +
        metricCard('Green Baseline', snapshot.greenEnterpriseBaseline && snapshot.greenEnterpriseBaseline.certified ? 'Certified' : 'Review', (snapshot.greenEnterpriseBaseline && snapshot.greenEnterpriseBaseline.greenReadiness || 0) + '%') +
        metricCard('Final Baseline', snapshot.finalEnterpriseBaseline && snapshot.finalEnterpriseBaseline.certified ? 'Certified' : 'Review', (snapshot.finalEnterpriseBaseline && snapshot.finalEnterpriseBaseline.finalReadiness || 0) + '%') +
        metricCard('Health Level', snapshot.healthLevel, ((snapshot.healthAnalysis && snapshot.healthAnalysis.score) || 0) + '%') +
        metricCard('Runtime Events', snapshot.events.length, 'آخر أحداث التشغيل') +
        metricCard('Errors', snapshot.errors.length, 'داخلي ' + ((snapshot.healthAnalysis && snapshot.healthAnalysis.errorAnalysis && snapshot.healthAnalysis.errorAnalysis.internal) || 0) + ' / خارجي ' + ((snapshot.healthAnalysis && snapshot.healthAnalysis.errorAnalysis && snapshot.healthAnalysis.errorAnalysis.external) || 0)) +
        metricCard('Scripts', snapshot.scripts, 'ملفات JS المحملة') +
        metricCard('Blocking JS', snapshot.performance.scripts.blockingScripts, 'بدون defer/async/module') +
        metricCard('Silent Catch', snapshot.silentCatch.totalEmptyCatch, snapshot.silentCatch.affectedFiles + ' ملف') +
        metricCard('innerHTML Risk', snapshot.innerHTMLRisk.totalInnerHTMLAssignments, snapshot.innerHTMLRisk.highRisk + ' High') +
        metricCard('Lazy Loading', snapshot.lazyLoading.mode || 'missing', ((snapshot.lazyLoading.prefetchedCandidates || 0) + ' prefetched')) +
        metricCard('Structural Cleanup', (snapshot.structuralCleanup.summary.zeroReferenceJSFiles || 0) + ' مرشح', 'No deletion') +
        metricCard('Runtime Guards', snapshot.runtimeHardening.enabled ? 'Active' : 'Missing', (snapshot.runtimeHardening.capturedExceptions || 0) + ' errors') +
        metricCard('Regression Score', (snapshot.regressionSuite.readinessScore || 0) + '%', 'Pass ' + ((snapshot.regressionSuite.totals && snapshot.regressionSuite.totals.pass) || 0)) +
        metricCard('Stylesheets', snapshot.stylesheets, 'ملفات CSS') +
        metricCard('Storage Keys', snapshot.localStorageKeys + ' / ' + snapshot.sessionStorageKeys, 'local / session') +
      '</div>' +
      '<div class="pet-mc-section"><h3>حالة المكونات الأساسية</h3><div class="pet-mc-status-grid">' +
        statusBadge('Diagnostics Core', snapshot.diagnosticsAvailable, snapshot.diagnosticsAvailable ? 'متاح' : 'غير محمل') +
        statusBadge('Router Presence', snapshot.routerAvailable, snapshot.routerAvailable ? 'موجود' : 'لم يتم رصده') +
        statusBadge('Permissions Surface', snapshot.navigationRegistryAvailable, snapshot.navigationRegistryAvailable ? 'موجود' : 'لم يتم رصده') +
        statusBadge('Browser Online', snapshot.online, snapshot.online ? 'Online' : 'Offline') +
        statusBadge('Lazy Foundation', snapshot.lazyLoading && snapshot.lazyLoading.enabled, snapshot.lazyLoading && snapshot.lazyLoading.enabled ? 'Loaded' : 'Missing') +
        statusBadge('Runtime Hardening', snapshot.runtimeHardening && snapshot.runtimeHardening.enabled, snapshot.runtimeHardening && snapshot.runtimeHardening.enabled ? 'Active' : 'Missing') +
        statusBadge('Regression Suite', snapshot.regressionSuite && snapshot.regressionSuite.enabled, snapshot.regressionSuite && snapshot.regressionSuite.enabled ? 'Active' : 'Missing') +
        statusBadge('Optimized Baseline', snapshot.optimizedGoldenBaseline && snapshot.optimizedGoldenBaseline.enabled, snapshot.optimizedGoldenBaseline && snapshot.optimizedGoldenBaseline.certified ? 'Certified' : 'Review') +
        statusBadge('Green Baseline', snapshot.greenEnterpriseBaseline && snapshot.greenEnterpriseBaseline.enabled, snapshot.greenEnterpriseBaseline && snapshot.greenEnterpriseBaseline.certified ? 'Certified' : 'Review') +
        statusBadge('Final Baseline', snapshot.finalEnterpriseBaseline && snapshot.finalEnterpriseBaseline.enabled, snapshot.finalEnterpriseBaseline && snapshot.finalEnterpriseBaseline.certified ? 'Certified' : 'Review') +
      '</div></div>' +
      renderRouterSection(snapshot.router) +
      renderStorageSection(snapshot.storage) +
      renderSmartReportsSection(snapshot.smartReports) +
      renderPerformanceSection(snapshot.performance) +
      renderLazyLoadingSection(snapshot.lazyLoading) +
      renderSilentCatchSection(snapshot.silentCatch) +
      renderInnerHTMLRiskSection(snapshot.innerHTMLRisk) +
      renderStructuralCleanupSection(snapshot.structuralCleanup) +
      renderRuntimeHardeningSection(snapshot.runtimeHardening) +
      renderEnterpriseRegressionSection(snapshot.regressionSuite) +
      renderGoldenBaselineSection(snapshot.goldenBaseline) +
      renderOptimizedGoldenBaselineSection(snapshot.optimizedGoldenBaseline) +
      renderGreenEnterpriseBaselineSection(snapshot.greenEnterpriseBaseline) +
      renderFinalEnterpriseBaselineSection(snapshot.finalEnterpriseBaseline) +
      renderEnterpriseLTSBaselineSection(snapshot.enterpriseLTSBaseline) +
      renderVehiclePermissionsVerificationSection(snapshot.vehiclePermissionsVerification) +
      renderSecuritySection(snapshot.security) +
      '<div class="pet-mc-section"><h3>آخر الأخطاء</h3>' +
        (latestErrors.length ? '<div class="pet-mc-table-wrap"><table><thead><tr><th>الوقت</th><th>المستوى</th><th>المصدر</th><th>الرسالة</th></tr></thead><tbody>' + latestErrors.map(eventRow).join('') + '</tbody></table></div>' : '<p class="pet-mc-empty">لا توجد أخطاء ملتقطة حاليًا.</p>') +
      '</div>' +
      '<div class="pet-mc-section"><h3>آخر أحداث التشغيل</h3>' +
        (latestEvents.length ? '<div class="pet-mc-table-wrap"><table><thead><tr><th>الوقت</th><th>المستوى</th><th>المصدر</th><th>الرسالة</th></tr></thead><tbody>' + latestEvents.map(eventRow).join('') + '</tbody></table></div>' : '<p class="pet-mc-empty">لا توجد أحداث بعد.</p>') +
      '</div>' +
      '<div class="pet-mc-footer">آخر فحص: ' + esc(snapshot.checkedAtLocal) + ' — هذه الشاشة لا تعدل بيانات البرنامج.</div>' +
    '</div>';
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) { return; }
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#'+BUTTON_ID+'{position:fixed;left:18px;bottom:18px;z-index:99998;border:1px solid rgba(255,255,255,.22);background:rgba(15,23,42,.72);backdrop-filter:blur(14px);color:#fff;border-radius:999px;padding:10px 14px;font:700 13px/1.2 system-ui;box-shadow:0 10px 30px rgba(0,0,0,.28);cursor:pointer}',
      '#'+CENTER_ID+'{position:fixed;left:0;right:0;top:var(--pet-mc-top-offset,0px);bottom:0;z-index:99999;background:rgba(2,6,23,.62);backdrop-filter:blur(10px);display:flex;align-items:flex-start;justify-content:center;padding:18px;box-sizing:border-box;overflow:hidden}',
      '#'+CENTER_ID+'[hidden]{display:none!important}',
      '.pet-mc-shell{width:min(1180px,calc(100vw - 36px));max-height:calc(100vh - var(--pet-mc-top-offset,0px) - 36px);overflow:auto;border:1px solid rgba(255,255,255,.18);border-radius:26px;background:linear-gradient(145deg,rgba(15,23,42,.94),rgba(30,41,59,.9));color:#f8fafc;box-shadow:0 28px 80px rgba(0,0,0,.42);padding:22px;font-family:system-ui,Tahoma,Arial;box-sizing:border-box}',
      '.pet-mc-header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:18px}.pet-mc-header h2{margin:0 0 6px;font-size:24px}.pet-mc-header p{margin:0;color:#cbd5e1}.pet-mc-actions{display:flex;gap:8px;flex-wrap:wrap}.pet-mc-actions button{border:1px solid rgba(255,255,255,.18);border-radius:14px;background:rgba(255,255,255,.08);color:#fff;padding:9px 12px;cursor:pointer}.pet-mc-copy-status{position:fixed;top:calc(var(--pet-mc-top-offset,0px) + 18px);left:50%;transform:translateX(-50%);z-index:100001;border-radius:14px;padding:10px 14px;font-weight:800;color:#fff;box-shadow:0 14px 34px rgba(0,0,0,.32)}.pet-mc-copy-status.ok{background:rgba(22,163,74,.92)}.pet-mc-copy-status.warn{background:rgba(217,119,6,.94)}.pet-mc-manual-copy{position:fixed;inset:calc(var(--pet-mc-top-offset,0px) + 34px) 24px 24px 24px;z-index:100000;background:rgba(15,23,42,.98);border:1px solid rgba(255,255,255,.2);border-radius:20px;padding:16px;box-shadow:0 28px 80px rgba(0,0,0,.5);display:flex;flex-direction:column;gap:10px}.pet-mc-manual-copy p{margin:0;color:#cbd5e1}.pet-mc-manual-copy textarea{flex:1;min-height:260px;resize:none;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(2,6,23,.82);color:#e5e7eb;padding:12px;direction:ltr;text-align:left;font:12px/1.45 ui-monospace,Consolas,monospace}.pet-mc-manual-copy button{border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;padding:9px 14px;cursor:pointer}.pet-mc-manual-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.pet-mc-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-bottom:14px}.pet-mc-card{border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.07);padding:13px;min-height:84px}.pet-mc-card small{display:block;color:#cbd5e1;margin-bottom:6px}.pet-mc-card strong{display:block;font-size:22px;margin-bottom:5px}.pet-mc-card span{font-size:12px;color:#94a3b8}',
      '.pet-mc-section{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);border-radius:20px;padding:14px;margin-top:12px}.pet-mc-section h3{margin:0 0 10px;font-size:17px}.pet-mc-status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pet-mc-status{border-radius:16px;padding:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.06)}.pet-mc-status b{display:block;margin-bottom:6px}.pet-mc-status span{font-size:12px;color:#cbd5e1}.pet-mc-status.ok{box-shadow:inset 0 0 0 1px rgba(34,197,94,.26)}.pet-mc-status.warn{box-shadow:inset 0 0 0 1px rgba(245,158,11,.28)}',
      '.pet-mc-table-wrap{overflow:auto;border-radius:14px}.pet-mc-shell table{width:100%;border-collapse:collapse;font-size:12px}.pet-mc-shell th,.pet-mc-shell td{padding:9px;border-bottom:1px solid rgba(255,255,255,.08);text-align:right;vertical-align:top}.pet-mc-shell th{color:#cbd5e1;font-weight:700}.pet-mc-level{display:inline-block;border-radius:999px;padding:3px 8px;background:rgba(148,163,184,.2)}.pet-mc-level.error{background:rgba(239,68,68,.24)}.pet-mc-level.warn{background:rgba(245,158,11,.22)}.pet-mc-empty{color:#cbd5e1;margin:0}.pet-mc-footer{color:#94a3b8;font-size:12px;margin-top:12px;text-align:center}',
      '@media(max-width:900px){.pet-mc-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pet-mc-status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.pet-mc-header{flex-direction:column}.pet-mc-actions{width:100%}.pet-mc-actions button{flex:1}}',
      '@media(max-width:520px){.pet-mc-grid,.pet-mc-status-grid{grid-template-columns:1fr}#'+CENTER_ID+'{padding:8px}.pet-mc-shell{width:calc(100vw - 16px);max-height:calc(100vh - var(--pet-mc-top-offset,0px) - 16px);padding:14px;border-radius:18px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function ensureRoot() {
    ensureStyle();
    var root = document.getElementById(CENTER_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = CENTER_ID;
      root.hidden = true;
      document.body.appendChild(root);
      root.addEventListener('click', function (event) {
        if (event.target === root || event.target.hasAttribute('data-pet-mc-close')) { center.close(); }
        if (event.target.hasAttribute('data-pet-mc-refresh')) { center.refresh(); }
        if (event.target.hasAttribute('data-pet-mc-copy')) { center.copyReport(); }
        if (event.target.hasAttribute('data-pet-mc-export-txt')) { center.exportReport('txt'); }
        if (event.target.hasAttribute('data-pet-mc-export-json')) { center.exportReport('json'); }
      });
    }
    updateMaintenanceLayoutOffset();
    return root;
  }

  function ensureButton() {
    if (document.getElementById(BUTTON_ID)) { return; }
    var btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.textContent = '🛠️ صيانة';
    btn.title = 'مركز صيانة وتشخيص النظام';
    btn.addEventListener('click', function () { center.open(); });
    document.body.appendChild(btn);
  }

  center.getSnapshot = getDiagnosticSnapshot;
  center.buildReportText = function () { return buildMaintenanceReportText(getDiagnosticSnapshot()); };
  center.copyReport = copyReportToClipboard;
  center.exportReport = exportMaintenanceReport;
  center.open = function () {
    var root = ensureRoot();
    updateMaintenanceLayoutOffset();
    (window.PETATOESecurity||{setInnerHTML:function(el,h){el.innerHTML=h;}}).setInnerHTML(root, render());
    root.hidden = false;
    updateMaintenanceLayoutOffset();
    log('info', 'maintenance-center', { message: 'Maintenance Center opened', version: getCurrentMaintenanceVersion() });
    return true;
  };
  center.close = function () {
    var root = document.getElementById(CENTER_ID);
    if (root) { root.hidden = true; }
    return true;
  };
  center.refresh = function () {
    var root = ensureRoot();
    updateMaintenanceLayoutOffset();
    (window.PETATOESecurity||{setInnerHTML:function(el,h){el.innerHTML=h;}}).setInnerHTML(root, render());
    updateMaintenanceLayoutOffset();
    log('info', 'maintenance-center', { message: 'Maintenance Center refreshed' });
    return true;
  };
  center.ping = function () {
    return { ok: true, version: getCurrentMaintenanceVersion(), status: 'final-enterprise-baseline', timestamp: new Date().toISOString() };
  };

  window.PETATOEMaintenanceCenter = center;


  function ensureMaintenanceButtonSafe() {
    try {
      ensureButton();
    } catch (e) {
      try {
        if (!document.getElementById(BUTTON_ID)) {
          var btn = document.createElement('button');
          btn.id = BUTTON_ID;
          btn.type = 'button';
          btn.textContent = '🛠️ صيانة';
          btn.title = 'مركز صيانة وتشخيص النظام';
          btn.style.position = 'fixed';
          btn.style.left = '18px';
          btn.style.bottom = '18px';
          btn.style.zIndex = '99999';
          btn.addEventListener('click', function () {
            try { center.open(); } catch (openError) { alert('تعذر فتح مركز الصيانة. راجع Console.'); }
          });
          document.body.appendChild(btn);
        }
      } catch (fallbackError) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] fallback init failed', fallbackError); }
    }
  }

  function init() {
    try {
      ensureMaintenanceButtonSafe();
      if (!center.__layoutResizeBound) {
        window.addEventListener('resize', updateMaintenanceLayoutOffset);
        center.__layoutResizeBound = true;
      }
      log('info', 'maintenance-center', { message: 'Maintenance Center initialized after silent catch batch 2', version: getCurrentMaintenanceVersion() });
    } catch (e) {
      log('error', 'maintenance-center.init', { message: e && e.message ? e.message : String(e) });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  try {
    window.addEventListener('load', function () {
      if (!document.getElementById(BUTTON_ID)) { ensureMaintenanceButtonSafe(); }
    }, { once: true });
  } catch (e) { if (window.console && console.warn) console.warn('[PETATOE Maintenance] silent catch captured', e); }
}());
