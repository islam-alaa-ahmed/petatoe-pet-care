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

  function escapeAttribute(value){
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function writeLink(href, media, deferred){
    var requestedMedia = String(media || 'all');
    var html = '<link rel="stylesheet" href="' + escapeAttribute(href) + '"';
    if(deferred){
      html += ' media="print" data-petatoe-mobile-deferred-css="1" data-petatoe-final-media="' + escapeAttribute(requestedMedia) + '"';
      html += ' onload="this.media=this.dataset.petatoeFinalMedia||\'all\';this.removeAttribute(\'onload\')"';
    }else if(requestedMedia !== 'all'){
      html += ' media="' + escapeAttribute(requestedMedia) + '"';
    }
    html += '>';
    document.write(html);
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
