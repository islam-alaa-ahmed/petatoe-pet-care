/* PETATOE v10 Native Wrapper — N3 safe native update coordinator.
   It never downloads or executes application code. It checks a signed-host
   metadata file and directs the user to App Store/TestFlight when a newer
   native build is available. Keychain sessions remain untouched. */
(function (window, document) {
  'use strict';

  var PLUGIN_NAME = 'PetatoeNativeUpdate';
  var MANIFEST_URL = 'https://islam-alaa-ahmed.github.io/petatoe-pet-care/native-release.json';
  var CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
  var checking = false;
  var lastCheck = 0;

  function isNativeIOS() {
    try {
      return !!(window.Capacitor &&
        typeof window.Capacitor.isNativePlatform === 'function' &&
        window.Capacitor.isNativePlatform() &&
        String(window.Capacitor.getPlatform && window.Capacitor.getPlatform()) === 'ios');
    } catch (_) { return false; }
  }

  function plugin() {
    if (!window.Capacitor) return null;
    if (window.Capacitor.Plugins && window.Capacitor.Plugins[PLUGIN_NAME]) {
      return window.Capacitor.Plugins[PLUGIN_NAME];
    }
    if (typeof window.Capacitor.registerPlugin === 'function') {
      try { return window.Capacitor.registerPlugin(PLUGIN_NAME); } catch (_) { return null; }
    }
    return null;
  }

  function parseVersion(value) {
    return String(value || '0').split('.').map(function (part) {
      var number = parseInt(part.replace(/[^0-9].*$/, ''), 10);
      return Number.isFinite(number) ? number : 0;
    });
  }

  function compareVersions(left, right) {
    var a = parseVersion(left);
    var b = parseVersion(right);
    var length = Math.max(a.length, b.length);
    for (var i = 0; i < length; i += 1) {
      var av = a[i] || 0;
      var bv = b[i] || 0;
      if (av > bv) return 1;
      if (av < bv) return -1;
    }
    return 0;
  }

  function validHttpsUrl(value) {
    try {
      var url = new URL(String(value || ''));
      if (url.protocol !== 'https:') return '';
      var allowed = ['apps.apple.com', 'testflight.apple.com', 'github.com'];
      return allowed.indexOf(url.hostname.toLowerCase()) >= 0 ? url.href : '';
    } catch (_) { return ''; }
  }

  function localized(ar, en) {
    return document.documentElement.lang === 'en' ? en : ar;
  }

  function removePrompt() {
    var old = document.getElementById('petatoe-native-update-prompt');
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function showPrompt(options) {
    removePrompt();
    var blocking = !!options.blocking;
    var root = document.createElement('section');
    root.id = 'petatoe-native-update-prompt';
    root.setAttribute('role', blocking ? 'alertdialog' : 'status');
    root.setAttribute('aria-modal', blocking ? 'true' : 'false');
    root.innerHTML = '' +
      '<div class="petatoe-native-update-card">' +
      '<strong>' + localized('يتوفر تحديث جديد لـ PETATOE', 'A PETATOE update is available') + '</strong>' +
      '<p>' + (blocking
        ? localized('يلزم تثبيت الإصدار الجديد للمتابعة بأمان.', 'The new version is required to continue securely.')
        : localized('ثبّت الإصدار الجديد للحصول على أحدث التحسينات.', 'Install the new version to get the latest improvements.')) + '</p>' +
      '<div class="petatoe-native-update-actions">' +
      '<button type="button" data-native-update="open">' + localized('تحديث الآن', 'Update now') + '</button>' +
      (blocking ? '' : '<button type="button" data-native-update="later">' + localized('لاحقًا', 'Later') + '</button>') +
      '</div></div>';
    root.querySelector('[data-native-update="open"]').addEventListener('click', function () {
      var native = plugin();
      if (native && typeof native.openUpdateURL === 'function') {
        native.openUpdateURL({ url: options.updateUrl }).catch(function () {});
      }
    });
    var later = root.querySelector('[data-native-update="later"]');
    if (later) later.addEventListener('click', removePrompt);
    document.body.appendChild(root);
  }

  function installStyle() {
    if (document.getElementById('petatoe-native-update-style')) return;
    var style = document.createElement('style');
    style.id = 'petatoe-native-update-style';
    style.textContent = '#petatoe-native-update-prompt{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;padding:20px;background:rgba(0,0,0,.42);backdrop-filter:blur(12px)}#petatoe-native-update-prompt[role="status"]{pointer-events:none;align-items:flex-start;background:transparent;padding-top:max(20px,env(safe-area-inset-top))}#petatoe-native-update-prompt .petatoe-native-update-card{pointer-events:auto;width:min(560px,100%);padding:20px;border-radius:24px;background:#101722;color:#fff;box-shadow:0 18px 60px rgba(0,0,0,.4);font-family:inherit}#petatoe-native-update-prompt strong{display:block;font-size:18px;margin-bottom:8px}#petatoe-native-update-prompt p{margin:0 0 16px;line-height:1.6;color:#d7deea}#petatoe-native-update-prompt .petatoe-native-update-actions{display:flex;gap:10px}#petatoe-native-update-prompt button{min-height:46px;flex:1;border:0;border-radius:14px;padding:0 16px;font:inherit;font-weight:700}#petatoe-native-update-prompt button:first-child{background:#1697ff;color:#fff}#petatoe-native-update-prompt button:last-child{background:#273244;color:#fff}';
    document.head.appendChild(style);
  }

  async function fetchManifest() {
    var response = await fetch(MANIFEST_URL + '?ts=' + Date.now(), {
      cache: 'no-store',
      credentials: 'omit',
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error('UPDATE_MANIFEST_HTTP_' + response.status);
    var data = await response.json();
    if (!data || data.schemaVersion !== 1 || data.platform !== 'ios') {
      throw new Error('UPDATE_MANIFEST_INVALID');
    }
    return data;
  }

  async function checkForUpdate(force) {
    if (!isNativeIOS() || checking) return { checked: false };
    if (!force && Date.now() - lastCheck < CHECK_INTERVAL_MS) return { checked: false, throttled: true };
    checking = true;
    lastCheck = Date.now();
    try {
      var native = plugin();
      if (!native || typeof native.getAppInfo !== 'function') return { checked: false };
      var info = await native.getAppInfo();
      var manifest = await fetchManifest();
      var latest = String(manifest.latestVersion || '0.0.0');
      var minimum = String(manifest.minimumSupportedVersion || '0.0.0');
      var updateUrl = validHttpsUrl(manifest.updateUrl);
      var blocking = compareVersions(info.version, minimum) < 0;
      var available = compareVersions(info.version, latest) < 0;
      if ((blocking || available) && updateUrl) {
        showPrompt({ blocking: blocking, updateUrl: updateUrl });
      }
      try {
        document.dispatchEvent(new CustomEvent('petatoe:native-update-check', {
          detail: { currentVersion: info.version, latestVersion: latest, minimumSupportedVersion: minimum, available: available, blocking: blocking }
        }));
      } catch (_) {}
      return { checked: true, available: available, blocking: blocking };
    } catch (error) {
      console.info('[PETATOE Native Update] Update check skipped.', error);
      return { checked: false, error: String(error && error.message || error) };
    } finally { checking = false; }
  }

  if (!isNativeIOS()) return;
  installStyle();
  window.PETATOENativeUpdate = { checkForUpdate: checkForUpdate, compareVersions: compareVersions };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { checkForUpdate(true); }, { once: true });
  } else {
    checkForUpdate(true);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) checkForUpdate(false);
  });
})(window, document);
