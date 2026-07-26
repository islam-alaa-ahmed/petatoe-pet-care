(function(){
  'use strict';

  var MOBILE_QUERY = '(max-width: 760px), (max-height: 600px) and (hover: none) and (pointer: coarse)';
  var isMobile = false;
  try {
    isMobile = window.PETATOEDeviceProfile
      ? window.PETATOEDeviceProfile.isMobileDevice()
      : !!(window.matchMedia && window.matchMedia(MOBILE_QUERY).matches);
  } catch (_) {}

  function safeHref(href){
    href = String(href || '').trim();
    if(!href || /^(?:javascript|data):/i.test(href)) throw new Error('Unsafe stylesheet source');
    return href;
  }

  function writeLink(href, media, deferred){
    var requestedMedia = String(media || 'all');
    var link = document.createElement('link');
    var head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;

    link.rel = 'stylesheet';
    link.href = href;

    if(deferred){
      link.media = 'print';
      link.setAttribute('data-petatoe-mobile-deferred-css', '1');
      link.setAttribute('data-petatoe-final-media', requestedMedia);
      link.addEventListener('load', function onDeferredStylesheetLoad(){
        link.media = link.getAttribute('data-petatoe-final-media') || 'all';
        link.removeEventListener('load', onDeferredStylesheetLoad);
      });
    }else if(requestedMedia !== 'all'){
      link.media = requestedMedia;
    }

    head.appendChild(link);
  }

  function writeOrDefer(href, media){
    href = safeHref(href);
    writeLink(href, media || 'all', isMobile);
  }

  window.PETATOEMobileCriticalCssGate = Object.freeze({
    isMobile: isMobile,
    writeOrDefer: writeOrDefer
  });
})();
