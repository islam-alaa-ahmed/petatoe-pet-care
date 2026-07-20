/* PETATOE PWA Enterprise Manager — Phase PWA-1 */
(function () {
  'use strict';

  const state = { deferredPrompt: null, refreshing: false };
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

  function showUpdate(registration) {
    if (document.getElementById('petatoePwaUpdate')) return;
    const bar = document.createElement('div');
    bar.id = 'petatoePwaUpdate';
    bar.className = 'petatoe-pwa-update';
    bar.innerHTML = `<span>${text('يتوفر إصدار جديد من PETATOE', 'A new PETATOE version is available')}</span><button type="button">${text('تحديث الآن', 'Update now')}</button>`;
    bar.querySelector('button').addEventListener('click', () => {
      const worker = registration.waiting;
      if (worker) worker.postMessage({ type: 'SKIP_WAITING' });
    });
    document.body.appendChild(bar);
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    try {
      const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
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
        window.location.reload();
      });
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
