/*
 * PETATOE Runtime Hardening
 * Version: v6.5.5_EXTERNAL_SCRIPT_ERRORS_CDN_HARDENING
 * Purpose: Passive runtime guards and unified diagnostic capture helpers.
 * Scope: Safe add-on. Does not mutate Router, Storage, Permissions, or app data.
 */
(function () {
  'use strict';

  var VERSION = 'v6.5.5';
  var HARDENING_ID = '__PETATOE_RUNTIME_HARDENING_V196__';
  var diag = window.PETATOEDiagnostics || null;
  var stats = (window[HARDENING_ID] && window[HARDENING_ID].stats) || {
    initializedAt: new Date().toISOString(),
    guardedCalls: 0,
    capturedExceptions: 0,
    capturedWarnings: 0,
    lastErrorAt: '',
    lastWarningAt: ''
  };

  function normalizeError(error) {
    if (!error) {
      return { name: 'UnknownError', message: 'No error details available', stack: '' };
    }
    if (error instanceof Error) {
      return { name: error.name || 'Error', message: error.message || '', stack: error.stack || '' };
    }
    if (typeof error === 'object') {
      return {
        name: error.name || error.type || 'RuntimeEvent',
        message: error.message || String(error.reason || error.detail || ''),
        stack: error.stack || ''
      };
    }
    return { name: 'RuntimeMessage', message: String(error), stack: '' };
  }

  function emit(level, source, payload) {
    try {
      diag = window.PETATOEDiagnostics || diag;
      if (diag && typeof diag[level] === 'function') {
        diag[level](source || 'runtime-hardening', payload || {});
      }
    } catch (ignore) {
      /* diagnostics must never break application runtime */
    }
  }

  function captureException(source, error, meta) {
    var normalized = normalizeError(error);
    stats.capturedExceptions += 1;
    stats.lastErrorAt = new Date().toISOString();
    emit('error', source || 'runtime-hardening.exception', {
      type: 'runtime-exception',
      name: normalized.name,
      message: normalized.message,
      stack: normalized.stack || '',
      meta: meta || {}
    });
    return normalized;
  }

  function captureWarning(source, message, meta) {
    stats.capturedWarnings += 1;
    stats.lastWarningAt = new Date().toISOString();
    emit('warn', source || 'runtime-hardening.warning', {
      type: 'runtime-warning',
      message: String(message == null ? '' : message),
      meta: meta || {}
    });
    return true;
  }

  function safeCall(source, fn, fallback, meta) {
    stats.guardedCalls += 1;
    try {
      if (typeof fn !== 'function') { return fallback; }
      return fn();
    } catch (error) {
      captureException(source || 'runtime-hardening.safeCall', error, meta || {});
      return fallback;
    }
  }

  function wrapFunction(source, fn, fallback, meta) {
    if (typeof fn !== 'function') { return fn; }
    return function petatoeRuntimeGuardedFunction() {
      var args = arguments;
      return safeCall(source || fn.name || 'runtime-hardening.wrapper', function () {
        return fn.apply(this, args);
      }.bind(this), fallback, meta || { wrapped: true });
    };
  }

  function getSnapshot() {
    var events = [];
    var errors = [];
    try {
      diag = window.PETATOEDiagnostics || diag;
      if (diag && typeof diag.getEvents === 'function') { events = diag.getEvents() || []; }
      if (diag && typeof diag.getErrors === 'function') { errors = diag.getErrors() || []; }
    } catch(ignore){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('diagnostics/runtime-hardening.js',ignore,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('diagnostics/runtime-hardening.js',_petatoeSilentCatch);}}

    return {
      enabled: true,
      version: VERSION,
      mode: 'passive-safe-guards',
      initializedAt: stats.initializedAt,
      guardedCalls: stats.guardedCalls,
      capturedExceptions: stats.capturedExceptions,
      capturedWarnings: stats.capturedWarnings,
      lastErrorAt: stats.lastErrorAt,
      lastWarningAt: stats.lastWarningAt,
      diagnosticsAvailable: !!diag,
      diagnosticsEvents: events.length,
      diagnosticsErrors: errors.length,
      globalErrorHandler: !!window.__PETATOE_DIAGNOSTICS_ERROR_HANDLER__,
      unhandledRejectionHandler: !!window.__PETATOE_DIAGNOSTICS_REJECTION_HANDLER__,
      recommendation: 'Use PETATOERuntimeHardening.safeCall/captureException in controlled batches when replacing silent catch blocks.'
    };
  }

  window.PETATOERuntimeHardening = {
    version: VERSION,
    stats: stats,
    normalizeError: normalizeError,
    captureException: captureException,
    captureWarning: captureWarning,
    safeCall: safeCall,
    wrapFunction: wrapFunction,
    getSnapshot: getSnapshot,
    ping: function () {
      return { ok: true, version: VERSION, timestamp: new Date().toISOString() };
    }
  };

  window[HARDENING_ID] = window.PETATOERuntimeHardening;
  emit('info', 'runtime-hardening', { message: 'Runtime hardening layer initialized', version: VERSION, mode: 'passive-safe-guards' });
}());
