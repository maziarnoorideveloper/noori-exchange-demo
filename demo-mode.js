/**
 * Noori Exchange — DEMO MODE overlay
 * Adds a watermark and auto-resets demo data periodically so the portfolio
 * demo can't be permanently altered by a visitor. Remove this file entirely
 * (and its <script>/<link> includes) when deploying the real production site.
 */
(function () {
  const RESET_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
  const STORAGE_RESET_FLAG = 'noori_demo_last_reset';

  function injectWatermarkStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .demo-watermark-layer{
        position: fixed; inset: 0; z-index: 9998; pointer-events: none;
        overflow: hidden; display: flex; flex-wrap: wrap; align-content: space-around;
        justify-content: space-around; opacity: 0.07;
      }
      .demo-watermark-layer span{
        font-family: 'Space Grotesk', sans-serif; font-weight: 800; font-size: 28px;
        color: #E3B94D; transform: rotate(-28deg); white-space: nowrap; letter-spacing: 2px;
        margin: 30px 40px;
      }
      .demo-banner{
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        background: linear-gradient(90deg, #E3B94D, #C77B8A);
        color: #160A1E; text-align: center; font-weight: 700; font-size: 12.5px;
        padding: 7px 12px; font-family: 'Space Grotesk', 'Vazirmatn', sans-serif;
        box-shadow: 0 4px 14px -4px rgba(0,0,0,.4);
      }
      .demo-banner strong{ text-decoration: underline; }
      body.has-demo-banner{ padding-top: 34px !important; }
      .demo-reset-toast{
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%) translateY(20px);
        background: #16A34A; color: #fff; padding: 10px 20px; border-radius: 999px;
        font-size: 12.5px; font-weight: 600; z-index: 10000; opacity: 0;
        transition: opacity .3s, transform .3s; font-family: 'Vazirmatn', sans-serif;
        box-shadow: 0 10px 24px -8px rgba(0,0,0,.5);
      }
      .demo-reset-toast.show{ opacity: 1; transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(style);
  }

  function injectWatermark() {
    const layer = document.createElement('div');
    layer.className = 'demo-watermark-layer';
    for (let i = 0; i < 24; i++) {
      const span = document.createElement('span');
      span.textContent = 'DEMO · NOORI EXCHANGE PORTFOLIO';
      layer.appendChild(span);
    }
    document.body.appendChild(layer);
  }

  function injectBanner(message) {
    const banner = document.createElement('div');
    banner.className = 'demo-banner';
    banner.innerHTML = message;
    document.body.prepend(banner);
    document.body.classList.add('has-demo-banner');
  }

  function showResetToast() {
    const toast = document.createElement('div');
    toast.className = 'demo-reset-toast';
    toast.textContent = '🔄 Demo data reset to defaults';
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function forceReset() {
    try {
      localStorage.removeItem('noori_exchange_rates_v1');
      localStorage.removeItem('noori_exchange_events_v1');
      if (window.NooriData) window.NooriData.seedIfEmpty();
      localStorage.setItem(STORAGE_RESET_FLAG, Date.now().toString());
    } catch (e) { console.error('Demo reset failed', e); }
  }

  function scheduleAutoReset(onReset) {
    const last = parseInt(localStorage.getItem(STORAGE_RESET_FLAG) || '0', 10);
    const elapsed = Date.now() - last;
    const remaining = Math.max(0, RESET_INTERVAL_MS - elapsed);

    if (!last) {
      localStorage.setItem(STORAGE_RESET_FLAG, Date.now().toString());
    }

    setTimeout(function tick() {
      forceReset();
      if (typeof onReset === 'function') onReset();
      setTimeout(tick, RESET_INTERVAL_MS);
    }, remaining || RESET_INTERVAL_MS);
  }

  window.NooriDemo = {
    init(options) {
      options = options || {};
      injectWatermarkStyles();
      injectWatermark();
      if (options.bannerHtml) injectBanner(options.bannerHtml);
      scheduleAutoReset(function () {
        showResetToast();
        if (typeof options.onReset === 'function') options.onReset();
      });
    },
    forceReset
  };
})();
