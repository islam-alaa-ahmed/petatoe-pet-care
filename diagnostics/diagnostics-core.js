/*
 * PETATOE Diagnostics Core
 * Version: v6.5.5_EXTERNAL_SCRIPT_ERRORS_CDN_HARDENING
 * Purpose: Safe, passive runtime diagnostics foundation.
 * Scope: No router, storage, permissions, or data mutation.
 */
(function () {
  'use strict';

  var MAX_EVENTS = 120;
  var DIAGNOSTICS_VERSION = 'v6.5.5';
  var diagnostics = window.PETATOEDiagnostics || {};
  var runtimeEvents = diagnostics._events || [];
  var startedAt = diagnostics.startedAt || new Date().toISOString();

  function normalizeError(input) {
    if (!input) {
      return { name: 'UnknownError', message: 'No error details available' };
    }

    if (input instanceof Error) {
      return {
        name: input.name || 'Error',
        message: input.message || '',
        stack: input.stack || ''
      };
    }

    if (typeof input === 'object') {
      return {
        name: input.name || input.type || 'RuntimeEvent',
        message: input.message || String(input.reason || input.detail || ''),
        stack: input.stack || ''
      };
    }

    return { name: 'RuntimeMessage', message: String(input) };
  }

  function isExternalScriptErrorPayload(payload) {
    try {
      payload = payload || {};
      var message = String(payload.message || '').trim();
      var filename = String(payload.filename || '').trim();
      if (message === 'Script error.' || message === 'Script error') { return true; }
      if (!filename && (payload.lineno || 0) === 0 && (payload.colno || 0) === 0 && message) { return true; }
      if (/^https?:\/\//i.test(filename) && window.location && filename.indexOf(window.location.origin) !== 0) { return true; }
    } catch (e) {
      if (window.console && typeof window.console.warn === 'function') { window.console.warn('[PETATOE Diagnostics] external script classification failed', e); }
    }
    return false;
  }


  function getExternalLibraryHint(filename) {
    filename = String(filename || '').toLowerCase();
    if (filename.indexOf('xlsx') !== -1) { return 'XLSX'; }
    if (filename.indexOf('chart') !== -1) { return 'Chart.js'; }
    if (filename.indexOf('cdnjs') !== -1) { return 'CDNJS'; }
    if (/^https?:\/\//i.test(filename)) { return 'External CDN'; }
    return 'Cross-Origin';
  }

  function safeCaptureSilentCatch(source, error, meta) {
    try {
      if (diagnostics && typeof diagnostics.captureSilentCatch === 'function') {
        return diagnostics.captureSilentCatch(source || 'silent-catch', error || new Error('silent catch without error object'), meta || {});
      }
    } catch (captureError) {
      if (window.console && typeof window.console.warn === 'function') {
        window.console.warn('[PETATOE Diagnostics] captureSilentCatch failed', captureError);
      }
    }
    return null;
  }

  function pushEvent(level, source, payload) {
    var event = {
      id: 'diag-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      level: level || 'info',
      source: source || 'runtime',
      timestamp: new Date().toISOString(),
      url: window.location ? window.location.href : '',
      payload: payload || {}
    };

    runtimeEvents.push(event);

    if (runtimeEvents.length > MAX_EVENTS) {
      runtimeEvents.splice(0, runtimeEvents.length - MAX_EVENTS);
    }

    return event;
  }

  function getHealthSnapshot() {
    var scripts = document ? document.querySelectorAll('script[src]').length : 0;
    var stylesheets = document ? document.querySelectorAll('link[rel="stylesheet"]').length : 0;

    return {
      status: 'active',
      version: DIAGNOSTICS_VERSION,
      startedAt: startedAt,
      checkedAt: new Date().toISOString(),
      runtimeEvents: runtimeEvents.length,
      errorEvents: runtimeEvents.filter(function (item) { return item.level === 'error'; }).length,
      internalErrorEvents: runtimeEvents.filter(function (item) { return item.level === 'error' && !(item.payload && item.payload.externalScriptError); }).length,
      externalScriptErrors: runtimeEvents.filter(function (item) { return item.level === 'error' && item.payload && item.payload.externalScriptError; }).length,
      warningEvents: runtimeEvents.filter(function (item) { return item.level === 'warn'; }).length,
      scripts: scripts,
      stylesheets: stylesheets,
      userAgent: navigator ? navigator.userAgent : ''
    };
  }

  diagnostics.startedAt = startedAt;
  diagnostics._events = runtimeEvents;
  diagnostics.log = function (source, payload) { return pushEvent('info', source, payload); };
  diagnostics.info = diagnostics.log;
  diagnostics.warn = function (source, payload) { return pushEvent('warn', source, payload); };
  diagnostics.error = function (source, payload) { return pushEvent('error', source, payload); };
  diagnostics.getEvents = function () { return runtimeEvents.slice(); };
  diagnostics.getErrors = function () {
    return runtimeEvents.filter(function (item) { return item.level === 'error'; });
  };
  diagnostics.clear = function () {
    runtimeEvents.splice(0, runtimeEvents.length);
    return true;
  };

  diagnostics.captureSilentCatch = function (source, error, meta) {
    var normalized = normalizeError(error);
    return pushEvent('warn', source || 'silent-catch', {
      type: 'silent-catch',
      name: normalized.name,
      message: normalized.message,
      stack: normalized.stack || '',
      meta: meta || {}
    });
  };

  window.PETATOECaptureSilentCatch = safeCaptureSilentCatch;

  diagnostics.captureException = function (source, error, meta) {
    var normalized = normalizeError(error);
    return pushEvent('error', source || 'runtime-exception', {
      type: 'runtime-exception',
      name: normalized.name,
      message: normalized.message,
      stack: normalized.stack || '',
      meta: meta || {}
    });
  };

  diagnostics.captureWarning = function (source, message, meta) {
    return pushEvent('warn', source || 'runtime-warning', {
      type: 'runtime-warning',
      message: String(message == null ? '' : message),
      meta: meta || {}
    });
  };
  diagnostics.getHealthSnapshot = getHealthSnapshot;
  diagnostics.ping = function () {
    return {
      ok: true,
      version: DIAGNOSTICS_VERSION,
      timestamp: new Date().toISOString()
    };
  };

  window.PETATOEDiagnostics = diagnostics;

  if (!window.__PETATOE_DIAGNOSTICS_ERROR_HANDLER__) {
    window.__PETATOE_DIAGNOSTICS_ERROR_HANDLER__ = true;
    window.addEventListener('error', function (event) {
      var normalized = normalizeError(event.error || event.message || event);
      var payload = {
        name: normalized.name,
        message: normalized.message,
        stack: normalized.stack,
        filename: event.filename || '',
        lineno: event.lineno || 0,
        colno: event.colno || 0
      };
      payload.externalScriptError = isExternalScriptErrorPayload(payload);
      if (payload.externalScriptError) {
        payload.type = 'external-script-error';
        payload.libraryHint = getExternalLibraryHint(payload.filename);
        payload.cdnHardeningActive = !!window.PETATOECDNHardening;
      }
      pushEvent('error', 'window.error', payload);
    });
  }

  if (!window.__PETATOE_DIAGNOSTICS_REJECTION_HANDLER__) {
    window.__PETATOE_DIAGNOSTICS_REJECTION_HANDLER__ = true;
    window.addEventListener('unhandledrejection', function (event) {
      var normalized = normalizeError(event.reason || event);
      pushEvent('error', 'unhandledrejection', {
        name: normalized.name,
        message: normalized.message,
        stack: normalized.stack
      });
    });
  }

  pushEvent('info', 'diagnostics-core', {
    message: 'Diagnostics core initialized',
    version: DIAGNOSTICS_VERSION
  });
}());
