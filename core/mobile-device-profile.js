/** PETATOE Phase P7.1 — stable phone ownership across orientation changes. */
(function(){
  'use strict';
  if(window.PETATOEDeviceProfile) return;

  var PHONE_LAYOUT_QUERY = '(max-width: 760px), (max-height: 600px) and (hover: none) and (pointer: coarse)';
  var mobileUa = false;
  try {
    mobileUa = !!(navigator.userAgentData && navigator.userAgentData.mobile) || /iPhone|iPod|Android.+Mobile|Mobile Safari/i.test(navigator.userAgent || '');
  } catch (_) {}

  function screenShortEdge(){
    try { return Math.min(Number(screen.width)||9999, Number(screen.height)||9999); }
    catch (_) { return 9999; }
  }
  function touchPhone(){
    var touch = Number(navigator.maxTouchPoints || 0) > 0;
    return touch && screenShortEdge() <= 600;
  }
  function standalone(){
    try { return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches; }
    catch (_) { return false; }
  }

  // Ownership is deliberately based on the physical device profile, not the
  // current viewport width, so rotating a phone never activates desktop UI.
  var mobileDevice = !!(mobileUa || touchPhone() || (standalone() && screenShortEdge() <= 700));

  function applyClasses(){
    var html=document.documentElement;
    if(!html) return;
    html.classList.toggle('petatoe-mobile-device', mobileDevice);
    html.classList.toggle('petatoe-desktop-device', !mobileDevice);
    html.dataset.petatoeDevice = mobileDevice ? 'mobile' : 'desktop';
    html.dataset.petatoeOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  }
  function notify(){
    applyClasses();
    try { window.dispatchEvent(new CustomEvent('petatoe:device-profile-change',{detail:{mobile:mobileDevice,orientation:document.documentElement.dataset.petatoeOrientation}})); } catch (_) {}
  }

  window.PETATOEDeviceProfile = Object.freeze({
    query: PHONE_LAYOUT_QUERY,
    isMobileDevice: function(){ return mobileDevice; },
    isDesktopDevice: function(){ return !mobileDevice; },
    isLandscape: function(){ return window.innerWidth > window.innerHeight; },
    refresh: notify
  });

  applyClasses();
  window.addEventListener('orientationchange', function(){ window.setTimeout(notify, 40); }, {passive:true});
  window.addEventListener('resize', function(){ window.requestAnimationFrame(applyClasses); }, {passive:true});
})();
