/** PETATOE v10.0.9 — Mobile Runtime Coordinator P2.2 */
(function () {
  'use strict';
  if (window.PETATOEMobileRuntimeCoordinator) return;

  var mq = window.matchMedia('(max-width: 760px)');
  var subscribers = [];
  var observer = null;
  var queuedRecords = [];
  var flushScheduled = false;
  var frame = window.requestAnimationFrame || function (callback) { return window.setTimeout(callback, 16); };

  function isPhone() { return mq.matches; }

  function flush() {
    flushScheduled = false;
    if (!isPhone() || !queuedRecords.length) { queuedRecords.length = 0; return; }
    var records = queuedRecords.splice(0, queuedRecords.length);
    subscribers.slice().forEach(function (subscriber) {
      try { subscriber(records); } catch (error) { console.warn('[PETATOE][MobileRuntime] subscriber failed', error); }
    });
  }

  function queue(records) {
    if (!isPhone() || !records || !records.length) return;
    Array.prototype.push.apply(queuedRecords, records);
    if (flushScheduled) return;
    flushScheduled = true;
    frame(flush);
  }

  function connect() {
    if (observer || !window.MutationObserver || !document.body) return;
    observer = new MutationObserver(queue);
    observer.observe(document.body, { subtree: true, childList: true });
  }

  function observeTarget(target, options) {
    if (!target || !window.MutationObserver) return;
    connect();
    if (!observer) return;
    try { observer.observe(target, options || { subtree: true, childList: true }); } catch (_error) {}
  }

  function subscribe(callback) {
    if (typeof callback !== 'function') return function () {};
    if (subscribers.indexOf(callback) === -1) subscribers.push(callback);
    connect();
    return function () {
      var index = subscribers.indexOf(callback);
      if (index !== -1) subscribers.splice(index, 1);
    };
  }

  function start() {
    if (!isPhone()) return;
    connect();
  }

  function stop() {
    if (observer) { observer.disconnect(); observer = null; }
    queuedRecords.length = 0;
    flushScheduled = false;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  if (mq.addEventListener) mq.addEventListener('change', function (event) { if (event.matches) start(); else stop(); });

  window.PETATOEMobileRuntimeCoordinator = {
    subscribe: subscribe,
    observeTarget: observeTarget,
    isPhone: isPhone,
    version: '10.0.9-mobile-runtime-consolidation-p2-2'
  };
})();
