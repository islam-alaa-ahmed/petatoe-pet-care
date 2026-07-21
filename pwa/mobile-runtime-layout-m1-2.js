/* PETATOE v9.4.24 — Hotfix M1.2
   Mobile-only fixed-header offset coordinator. No business/data logic. */
(function () {
  'use strict';

  var MOBILE_QUERY = '(max-width: 760px)';
  var root = document.documentElement;
  var header = null;
  var observer = null;
  var frame = 0;

  function isMobile() {
    return window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
  }

  function measure() {
    frame = 0;
    if (!isMobile()) {
      root.style.removeProperty('--pet-mobile-header-height');
      root.style.removeProperty('--pet-mobile-content-offset');
      return;
    }

    header = header || document.querySelector('.topbar');
    if (!header) return;

    var rect = header.getBoundingClientRect();
    var height = Math.max(0, Math.ceil(rect.height));
    var gap = 12;
    root.style.setProperty('--pet-mobile-header-height', height + 'px');
    root.style.setProperty('--pet-mobile-content-offset', (height + gap) + 'px');
  }

  function scheduleMeasure() {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(measure);
  }

  function init() {
    header = document.querySelector('.topbar');
    scheduleMeasure();

    if (header && window.ResizeObserver) {
      observer = new ResizeObserver(scheduleMeasure);
      observer.observe(header);
    }

    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('orientationchange', scheduleMeasure, { passive: true });
    window.addEventListener('pageshow', scheduleMeasure, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleMeasure, { passive: true });
    }

    document.addEventListener('petatoe:languagechange', scheduleMeasure);
    document.addEventListener('petatoe:authchange', scheduleMeasure);
    setTimeout(scheduleMeasure, 250);
    setTimeout(scheduleMeasure, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
