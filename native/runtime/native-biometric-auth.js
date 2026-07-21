/* PETATOE v10 Native Wrapper — N2 Face ID runtime bridge.
   Runs only inside Capacitor. It never stores a password; it asks the native
   Keychain plugin to protect the existing PETATOE session with Face ID. */
(function (window, document) {
  'use strict';

  var AUTH_KEY = 'petatoe_auth_session_v668';
  var PLUGIN_NAME = 'PetatoeNativeAuth';
  var restoreStarted = false;
  var storing = false;

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

  function setPending(active) {
    try { document.documentElement.classList.toggle('pet-native-auth-pending', !!active); } catch (_) {}
  }

  function safeParse(value) {
    try {
      var parsed = JSON.parse(String(value || ''));
      return parsed && parsed.user && parsed.user.id ? parsed : null;
    } catch (_) { return null; }
  }

  function waitForAuth(timeoutMs) {
    return new Promise(function (resolve) {
      var started = Date.now();
      (function poll() {
        if (window.PETATOEAuth && window.PETATOEAuth.__ready) return resolve(window.PETATOEAuth);
        if (Date.now() - started >= timeoutMs) return resolve(null);
        setTimeout(poll, 40);
      })();
    });
  }

  async function storeCurrentSession() {
    if (storing || !isNativeIOS()) return false;
    var native = plugin();
    if (!native || typeof native.storeSession !== 'function') return false;
    var raw = '';
    try { raw = sessionStorage.getItem(AUTH_KEY) || ''; } catch (_) {}
    if (!safeParse(raw)) return false;
    storing = true;
    try {
      await native.storeSession({ session: raw });
      return true;
    } catch (error) {
      console.warn('[PETATOE Native Auth] Unable to store protected session.', error);
      return false;
    } finally { storing = false; }
  }

  async function clearNativeSession() {
    var native = plugin();
    if (!native || typeof native.clearSession !== 'function') return;
    try { await native.clearSession(); } catch (_) {}
  }

  async function restoreWithFaceID() {
    if (restoreStarted || !isNativeIOS()) return false;
    restoreStarted = true;
    var native = plugin();
    if (!native) return false;

    try {
      var availability = await native.isAvailable();
      if (!availability || !availability.available) return false;
      var state = await native.hasSession();
      if (!state || !state.hasSession) return false;

      setPending(true);
      var result = await native.loadSession({
        reason: document.documentElement.lang === 'en'
          ? 'Unlock PETATOE with Face ID'
          : 'افتح PETATOE باستخدام بصمة الوجه'
      });
      var payload = safeParse(result && result.session);
      if (!payload) {
        await clearNativeSession();
        return false;
      }

      sessionStorage.setItem(AUTH_KEY, JSON.stringify(payload));
      var auth = await waitForAuth(5000);
      if (auth && typeof auth.restore === 'function') {
        await auth.restore();
      }
      try {
        document.dispatchEvent(new CustomEvent('petatoe:native-biometric-unlocked', {
          detail: { user: payload.user, biometryType: availability.biometryType || 'faceID' }
        }));
      } catch (_) {}
      return true;
    } catch (error) {
      var code = String(error && (error.code || error.message) || '');
      if (code.indexOf('BIOMETRY_CHANGED') >= 0 || code.indexOf('ITEM_NOT_FOUND') >= 0) {
        await clearNativeSession();
      }
      console.info('[PETATOE Native Auth] Face ID unlock was not completed.', error);
      return false;
    } finally {
      setPending(false);
    }
  }

  function bindSessionLifecycle() {
    document.addEventListener('petatoe:userchanged', function (event) {
      var detail = event && event.detail || {};
      if (detail.user) {
        setTimeout(storeCurrentSession, 200);
      } else if (String(detail.source || '').indexOf('logout') >= 0) {
        clearNativeSession();
      }
    });
  }

  if (!isNativeIOS()) return;
  document.documentElement.classList.add('petatoe-native-ios');
  setPending(true);
  bindSessionLifecycle();
  window.PETATOENativeAuth = {
    isNativeIOS: isNativeIOS,
    restoreWithFaceID: restoreWithFaceID,
    storeCurrentSession: storeCurrentSession,
    clearSession: clearNativeSession
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreWithFaceID, { once: true });
  } else {
    restoreWithFaceID();
  }
})(window, document);
