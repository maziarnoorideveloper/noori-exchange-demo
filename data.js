/**
 * Noori Exchange — shared rates data layer
 * Uses localStorage so the admin panel and landing page (same browser) stay in sync.
 * Swap the functions below for real fetch() calls to your backend when ready — see
 * the "CONNECTING A REAL BACKEND" notes at the bottom of this file.
 */
(function (global) {
  const STORAGE_KEY = 'noori_exchange_rates_v1';
  const EVENTS_KEY = 'noori_exchange_events_v1';

  const CURRENCIES = [
    { code: 'GBP', nameEn: 'British Pound',  nameFa: 'پوند انگلیس', symbol: '£' },
    { code: 'USD', nameEn: 'US Dollar',      nameFa: 'دلار آمریکا', symbol: '$' },
    { code: 'EUR', nameEn: 'Euro',           nameFa: 'یورو',        symbol: '€' },
    { code: 'AED', nameEn: 'UAE Dirham',     nameFa: 'درهم امارات', symbol: 'د' },
    { code: 'CNY', nameEn: 'Chinese Yuan',   nameFa: 'یوان چین',    symbol: '¥' },
    { code: 'TRY', nameEn: 'Turkish Lira',   nameFa: 'لیر ترکیه',   symbol: 'L' }
  ];

  /** Format a Date object as YYYY-MM-DD using its LOCAL calendar date components
      (never toISOString, which converts to UTC first and silently shifts the date
      by a day in timezones ahead of UTC — this was a real bug in earlier versions). */
  function toLocalDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function todayKey() {
    return toLocalDateKey(new Date());
  }

  function loadAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Noori rates: failed to read storage', e);
      return {};
    }
  }

  function saveAll(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // notify other open tabs/windows on the same origin (landing page) instantly
      window.dispatchEvent(new CustomEvent('noori-rates-updated', { detail: data }));
    } catch (e) {
      console.error('Noori rates: failed to write storage', e);
    }
  }

  /** Get rates for a specific date (YYYY-MM-DD). Falls back to the nearest earlier date if missing. */
  function getRatesForDate(dateKey) {
    const all = loadAll();
    if (all[dateKey]) return all[dateKey];
    // fallback: find the most recent date at or before dateKey
    const keys = Object.keys(all).filter(k => k <= dateKey).sort();
    if (keys.length) return all[keys[keys.length - 1]];
    return null;
  }

  /** Get the latest available rates (today, or most recent entered day). */
  function getLatestRates() {
    const all = loadAll();
    const keys = Object.keys(all).sort();
    if (!keys.length) return null;
    return { date: keys[keys.length - 1], rates: all[keys[keys.length - 1]] };
  }

  /** Save/update rates for a given date. rates = { GBP: {buy, sell}, USD: {buy, sell}, ... } */
  function setRatesForDate(dateKey, rates) {
    const all = loadAll();
    all[dateKey] = Object.assign({}, all[dateKey], rates, { _updatedAt: new Date().toISOString() });
    saveAll(all);
  }

  function getAllDates() {
    return Object.keys(loadAll()).sort();
  }

  /* ---------------- Occasions / calendar events ---------------- */
  function loadEvents() {
    try {
      const raw = localStorage.getItem(EVENTS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveEvents(data) {
    try {
      localStorage.setItem(EVENTS_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('noori-events-updated', { detail: data }));
    } catch (e) { console.error('Noori events: failed to write storage', e); }
  }
  function setEventForDate(dateKey, event) {
    const all = loadEvents();
    if (event === null) { delete all[dateKey]; } else { all[dateKey] = event; }
    saveEvents(all);
  }
  function getEventForDate(dateKey) {
    return loadEvents()[dateKey] || null;
  }
  function getAllEvents() {
    return loadEvents();
  }

  /* ---------------- Seed demo data on first run ---------------- */
  function seedIfEmpty() {
    const all = loadAll();
    if (Object.keys(all).length > 0) return;
    const today = todayKey();
    const seed = {};
    seed[today] = {
      GBP: { buy: 136100, sell: 136450 },
      USD: { buy: 108200, sell: 108400 },
      EUR: { buy: 117600, sell: 117900 },
      AED: { buy: 29450, sell: 29600 },
      CNY: { buy: 14980, sell: 15050 },
      TRY: { buy: 3120, sell: 3160 },
      _updatedAt: new Date().toISOString()
    };
    // a few days of made-up history so the calendar has something to show
    for (let i = 1; i <= 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = toLocalDateKey(d);
      const drift = (Math.sin(i) * 800) | 0;
      seed[key] = {
        GBP: { buy: 136100 + drift, sell: 136450 + drift },
        USD: { buy: 108200 + drift, sell: 108400 + drift },
        EUR: { buy: 117600 + drift, sell: 117900 + drift },
        AED: { buy: 29450 + (drift / 4 | 0), sell: 29600 + (drift / 4 | 0) },
        CNY: { buy: 14980 + (drift / 8 | 0), sell: 15050 + (drift / 8 | 0) },
        TRY: { buy: 3120 + (drift / 20 | 0), sell: 3160 + (drift / 20 | 0) },
        _updatedAt: d.toISOString()
      };
    }
    saveAll(seed);

    const events = loadEvents();
    if (Object.keys(events).length === 0) {
      const ev = {};
      ev[today] = { nameEn: 'Sheikh Saduq Day', nameFa: 'روز شیخ صدوق', type: 'religious' };
      saveEvents(ev);
    }
  }

  global.NooriData = {
    CURRENCIES,
    todayKey,
    toLocalDateKey,
    getRatesForDate,
    getLatestRates,
    setRatesForDate,
    getAllDates,
    setEventForDate,
    getEventForDate,
    getAllEvents,
    seedIfEmpty
  };
})(window);

/**
 * ============================================================
 * CONNECTING A REAL BACKEND (read this when you're ready to go live)
 * ============================================================
 * Right now every function above reads/writes localStorage, which only
 * works on ONE browser/device — fine for testing, not for real customers.
 *
 * To go live, replace the body of these 4 functions with real API calls
 * to your own server (Node/PHP/Python — anything with a database):
 *
 *   getRatesForDate(dateKey)   -> GET  /api/rates?date=YYYY-MM-DD
 *   getLatestRates()           -> GET  /api/rates/latest
 *   setRatesForDate(date, r)   -> POST /api/rates   { date, rates }
 *   getAllDates()              -> GET  /api/rates/dates
 *
 * The admin panel (admin.html) and landing page (index.html) both only
 * talk to window.NooriData — so once you swap this file's internals to
 * call your real API instead of localStorage, nothing else needs to change.
 */
