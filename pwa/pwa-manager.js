/* PETATOE PWA Enterprise Manager — V10-P1 Update Engine */
(function () {
  'use strict';

  const CHECK_INTERVAL_MS = 5 * 60 * 1000;
  const MIN_CHECK_GAP_MS = 20 * 1000;
  const state = {
    deferredPrompt: null,
    refreshing: false,
    registration: null,
    lastCheckAt: 0,
    updateTimer: null
  };
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const lang = () => (document.documentElement.lang || localStorage.getItem('petatoe_language') || 'ar').toLowerCase().startsWith('en') ? 'en' : 'ar';
  const text = (ar, en) => lang() === 'en' ? en : ar;

  function createUi() {
    if (document.getElementById('petatoePwaInstallButton')) return;

    const installButton = document.createElement('button');
    installButton.id = 'petatoePwaInstallButton';
    installButton.className = 'petatoe-pwa-install-button';
    installButton.type = 'button';
    installButton.hidden = true;
    installButton.innerHTML = '<span aria-hidden="true">↧</span><strong></strong>';
    installButton.querySelector('strong').textContent = text('تثبيت التطبيق', 'Install App');
    installButton.addEventListener('click', handleInstallClick);
    document.body.appendChild(installButton);

    const overlay = document.createElement('div');
    overlay.id = 'petatoePwaGuide';
    overlay.className = 'petatoe-pwa-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <section class="petatoe-pwa-card" role="dialog" aria-modal="true" aria-labelledby="petatoePwaTitle">
        <button class="petatoe-pwa-close" type="button" aria-label="${text('إغلاق', 'Close')}">×</button>
        <img src="./assets/icons/apple-touch-icon.png" alt="PETATOE" width="72" height="72">
        <h2 id="petatoePwaTitle">${text('ثبّت PETATOE على الآيفون', 'Install PETATOE on iPhone')}</h2>
        <ol>
          <li>${text('اضغط زر المشاركة في Safari.', 'Tap the Share button in Safari.')}</li>
          <li>${text('اختر إضافة إلى الشاشة الرئيسية.', 'Choose Add to Home Screen.')}</li>
          <li>${text('اضغط إضافة.', 'Tap Add.')}</li>
        </ol>
        <button class="petatoe-pwa-primary" type="button">${text('فهمت', 'Got it')}</button>
      </section>`;
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('.petatoe-pwa-close') || event.target.closest('.petatoe-pwa-primary')) overlay.hidden = true;
    });
    document.body.appendChild(overlay);
  }

  async function handleInstallClick() {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      await state.deferredPrompt.userChoice;
      state.deferredPrompt = null;
      document.getElementById('petatoePwaInstallButton').hidden = true;
      return;
    }
    if (isIos && !isStandalone) document.getElementById('petatoePwaGuide').hidden = false;
  }

  function removeUpdateBar() {
    const current = document.getElementById('petatoePwaUpdate');
    if (current) current.remove();
  }

  function showUpdate(registration) {
    state.registration = registration || state.registration;
    if (document.getElementById('petatoePwaUpdate')) return;
    const bar = document.createElement('div');
    bar.id = 'petatoePwaUpdate';
    bar.className = 'petatoe-pwa-update';
    bar.setAttribute('role', 'status');
    bar.innerHTML = `<span>${text('يتوفر إصدار جديد من PETATOE', 'A new PETATOE version is available')}</span><button type="button">${text('تحديث الآن', 'Update now')}</button>`;
    bar.querySelector('button').addEventListener('click', () => applyWaitingUpdate());
    document.body.appendChild(bar);
  }

  function reloadWithCacheBust(version) {
    const url = new URL(window.location.href);
    url.searchParams.set('_pwa', version || String(Date.now()));
    window.location.replace(url.toString());
  }

  function applyWaitingUpdate() {
    const registration = state.registration;
    if (!registration || !registration.waiting) {
      requestUpdateCheck(true);
      return;
    }
    const button = document.querySelector('#petatoePwaUpdate button');
    if (button) {
      button.disabled = true;
      button.textContent = text('جارٍ التحديث…', 'Updating…');
    }
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }

  async function requestUpdateCheck(force) {
    const registration = state.registration;
    if (!registration) return;
    const now = Date.now();
    if (!force && now - state.lastCheckAt < MIN_CHECK_GAP_MS) return;
    state.lastCheckAt = now;
    try {
      await registration.update();
      if (registration.waiting) showUpdate(registration);
    } catch (error) {
      if (navigator.onLine) console.warn('[PETATOE PWA] Update check failed:', error);
    }
  }

  function watchRegistration(registration) {
    state.registration = registration;
    if (registration.waiting) showUpdate(registration);

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(registration);
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (state.refreshing) return;
      state.refreshing = true;
      removeUpdateBar();
      reloadWithCacheBust(Date.now());
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data || {};
      if (data.type === 'PETATOE_SW_ACTIVATED' && navigator.serviceWorker.controller) {
        if (!state.refreshing && registration.waiting) showUpdate(registration);
      }
    });

    window.addEventListener('online', () => requestUpdateCheck(true));
    window.addEventListener('focus', () => requestUpdateCheck(false));
    window.addEventListener('pageshow', () => requestUpdateCheck(false));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestUpdateCheck(false);
    });

    state.updateTimer = window.setInterval(() => requestUpdateCheck(false), CHECK_INTERVAL_MS);
    requestUpdateCheck(true);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', {
        scope: './',
        updateViaCache: 'none'
      });
      watchRegistration(registration);
    } catch (error) {
      console.warn('[PETATOE PWA] Service Worker registration failed:', error);
    }
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.deferredPrompt = event;
    const button = document.getElementById('petatoePwaInstallButton');
    if (button) button.hidden = false;
  });

  window.addEventListener('appinstalled', () => {
    const button = document.getElementById('petatoePwaInstallButton');
    if (button) button.hidden = true;
  });

  document.addEventListener('DOMContentLoaded', () => {
    createUi();
    if (isIos && !isStandalone) document.getElementById('petatoePwaInstallButton').hidden = false;
    registerServiceWorker();
  });
})();
