/* ================================================================
   H90 — Series API Module (series-api.js) v8.1
   ✅ يستخدم security.js (USER/PASS مشفّرين)
   ✅ API مباشر من السيرفر (بدون Worker للـ API)
   ✅ Token للفيديو عبر Worker
   ✅ 26 تصنيف كامل
   ✅ جلب الحلقات مع Token
   ✅ [جديد] Image Proxy لحل مشكلة الصور
   ✅ [جديد] Fallback متعدد للصور
   ================================================================ */

'use strict';

const SeriesAPI = (function () {

  /* ================================================================
     ⚙️ الإعدادات
     ================================================================ */
  const CONFIG = {
    WORKER_URL: 'https://idjdhdhdhhdueugxbsksigckdhsg.dairalzor33.workers.dev',
    XTREAM_HOST: 'http://vip2.sharkhost.xyz',
    MIN_YEAR: 2000,
    MIN_RATING: 6.5,
    CACHE_HOURS: 24,
    MAX_CACHE_SERIES: 800,
    TIMEOUT_MS: 120000,
    TOKEN_TTL: 14400
  };

  /* ================================================================
     🖼️ إعدادات Image Proxy — [جديد]
     ================================================================ */
  const IMG_PROXY = {
    // ✅ Worker Proxy (الأفضل — يتطلب endpoint في Worker)
    WORKER: CONFIG.WORKER_URL + '/proxy/image?url=',

    // ✅ weserv.nl (مجاني — لا يحتاج تعديل Worker)
    WESERV: 'https://images.weserv.nl/?url=',

    // ✅ statically.io (Fallback ثاني)
    STATICALLY: 'https://cdn.statically.io/img/',

    // ✅ تفعيل/تعطيل
    ENABLED: true,

    // ✅ أي نوع نستخدم؟ ('worker' | 'weserv' | 'statically')
    // ⚠️ اتركها 'weserv' حتى تُعدّل الـ Worker
    TYPE: 'weserv',

    // ✅ الحجم الافتراضي
    DEFAULT_WIDTH: 300
  };

  /* ================================================================
     🔐 بيانات الاشتراك من security.js
     ================================================================ */
  function getCredentials() {
    try {
      if (window.__H90_SEC__ && typeof window.__H90_SEC__.c === 'function') {
        return window.__H90_SEC__.c();
      }
    } catch (e) {
      console.warn('⚠️ security.js not available');
    }
    return { u: '', p: '' };
  }

  /* ================================================================
     🏷️ التصنيفات (26 تصنيف)
     ================================================================ */
  const CATEGORIES = {
    '224': { name: 'رمضان 2026', icon: 'calendar', color: '#ffb300', group: 'special' },
    '257': { name: 'Top 50', icon: 'star', color: '#ffb300', group: 'special' },
    '197': { name: 'Shahid', icon: 'tv', color: '#00e5ff', group: 'platform' },
    '212': { name: 'Netflix', icon: 'tv', color: '#e53935', group: 'platform' },
    '219': { name: 'Amazon', icon: 'tv', color: '#00e5ff', group: 'platform' },
    '221': { name: 'HBO', icon: 'tv', color: '#9c27b0', group: 'platform' },
    '218': { name: 'Apple TV+', icon: 'tv', color: '#ffffff', group: 'platform' },
    '220': { name: 'Disney+', icon: 'tv', color: '#0091ea', group: 'platform' },
    '232': { name: 'Hulu', icon: 'tv', color: '#00e676', group: 'platform' },
    '191': { name: 'وثائقي', icon: 'info', color: '#00e5ff', group: 'genre' },
    '202': { name: 'هندية', icon: 'film', color: '#ffb300', group: 'genre' },
    '190': { name: 'آسيوي', icon: 'film', color: '#e91e63', group: 'genre' },
    '196': { name: 'أنمي', icon: 'anime', color: '#e91e63', group: 'genre' },
    '223': { name: 'كرتون زمن الطيبين', icon: 'play', color: '#ffb300', group: 'kids' },
    '222': { name: 'كرتون مترجم', icon: 'play', color: '#00e5ff', group: 'kids' },
    '176': { name: 'كرتون مدبلج', icon: 'play', color: '#00e676', group: 'kids' },
    '187': { name: 'تركي مترجم', icon: 'film', color: '#e53935', group: 'turkish' },
    '188': { name: 'تركي مدبلج', icon: 'film', color: '#ff6b35', group: 'turkish' },
    '194': { name: 'برامج ومسابقات', icon: 'newspaper', color: '#9c27b0', group: 'show' },
    '174': { name: 'خليجي', icon: 'film', color: '#00b248', group: 'arabic' },
    '175': { name: 'مصري', icon: 'film', color: '#ffb300', group: 'arabic' },
    '173': { name: 'سوري', icon: 'film', color: '#e53935', group: 'arabic' },
    '189': { name: 'لبناني', icon: 'film', color: '#00e5ff', group: 'arabic' },
    '216': { name: 'المغرب وتونس', icon: 'film', color: '#00b248', group: 'arabic' },
    '215': { name: 'أردنية', icon: 'film', color: '#ff6b35', group: 'arabic' },
    '210': { name: 'بدوي وتاريخي', icon: 'film', color: '#ffb300', group: 'arabic' }
  };

  /* ================================================================
     🔑 مفاتيح Cache
     ================================================================ */
  const CACHE_KEYS = {
    ALL_SERIES: 'h90_series_all_v81',
    TIMESTAMP: 'h90_series_timestamp_v81',
    INFO_PREFIX: 'h90_series_info_v81_'
  };

  /* ================================================================
     🛠️ أدوات
     ================================================================ */
  function log(...args) {
    console.log('%c📺 [Series]', 'color:#00e5ff;font-weight:900;', ...args);
  }

  function warn(...args) {
    console.warn('%c⚠️ [Series]', 'color:#ffb300;font-weight:900;', ...args);
  }

  function error(...args) {
    console.error('%c❌ [Series]', 'color:#ff2d55;font-weight:900;', ...args);
  }

  function extractYear(name) {
    if (!name) return 0;
    const match = String(name).match(/\((\d{4})\)/);
    if (match) return parseInt(match[1], 10);
    return 0;
  }

  function parseRating(rating) {
    if (rating === null || rating === undefined || rating === '') return 0;
    const r = parseFloat(rating);
    return isNaN(r) ? 0 : r;
  }

  function cleanName(name) {
    if (!name) return '';
    return String(name)
      .replace(/\s*\(?\d{4}\)?/g, '')
      .replace(/\s*(4K|UHD|FHD|HD|SD|HEVC|H\.?265|H\.?264)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanImageUrl(url) {
    if (!url) return '';
    if (url.includes('_big.jpg') && url.length < 60) return '';
    return url.replace(/\\/g, '');
  }

  /* ================================================================
     🖼️ [جديد] Image Proxy
     ================================================================ */

  /**
   * تحويل رابط الصورة إلى رابط proxy
   * @param {string} url - الرابط الأصلي
   * @param {number} size - العرض المطلوب (افتراضي 300)
   * @returns {string} - رابط proxy
   */
  function proxyImage(url, size) {
    if (!url) return '';

    // ✅ الروابط المحلية أو data: لا تحتاج proxy
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('./')) {
      return url;
    }

    // ✅ إذا كان الرابط نسبي (بدون http)
    if (!url.startsWith('http')) {
      return url;
    }

    const width = size || IMG_PROXY.DEFAULT_WIDTH;
    const sizeParam = '&w=' + width;

    if (IMG_PROXY.ENABLED) {
      switch (IMG_PROXY.TYPE) {
        case 'worker':
          return IMG_PROXY.WORKER + encodeURIComponent(url) + sizeParam;

        case 'weserv':
          return IMG_PROXY.WESERV + encodeURIComponent(url.replace(/^https?:\/\//, '')) + sizeParam;

        case 'statically':
          return IMG_PROXY.STATICALLY + url.replace(/^https?:\/\//, '') + '?w=' + width;

        default:
          return url;
      }
    }

    return url;
  }

  /**
   * الحصول على رابط بديل للصورة (Fallback)
   */
  function getFallbackImageUrl(url) {
    if (!url) return '';

    // ✅ إذا كان الرابط يستخدم weserv، جرب statically
    if (url.includes('weserv.nl')) {
      try {
        const original = decodeURIComponent(url.split('url=')[1].split('&')[0]);
        return IMG_PROXY.STATICALLY + original + '?w=300';
      } catch (e) {
        return url;
      }
    }

    // ✅ إذا كان الرابط مباشر، جرب weserv
    if (url.startsWith('http')) {
      return IMG_PROXY.WESERV + encodeURIComponent(url.replace(/^https?:\/\//, '')) + '&w=300';
    }

    return url;
  }

  /* ================================================================
     🌐 HTTP
     ================================================================ */
  async function httpGet(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs || CONFIG.TIMEOUT_MS);

    try {
      log('🌐 Fetching:', url.substring(0, 120) + '...');

      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      log('✅ Response:', res.status);

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        error('استجابة غير JSON:', text.substring(0, 100));
        throw new Error('استجابة API غير صالحة');
      }

      return data;

    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') throw new Error('انتهت المهلة');
      throw e;
    }
  }

  /* ================================================================
     🎯 طلب Token من Worker (للفيديو فقط)
     ================================================================ */
  async function requestToken(type, id, ext) {
    log('🔐 طلب Token:', type, id, ext);

    try {
      const res = await fetch(CONFIG.WORKER_URL + '/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          id: id,
          ext: ext || 'mp4'
        })
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const data = await res.json();
      log('✅ Token مُولّد');
      return data;

    } catch (e) {
      error('فشل Token:', e.message);
      return null;
    }
  }

  /* ================================================================
     🔗 بناء روابط API — مباشر من السيرفر
     ================================================================ */
  function buildApiUrl(action, extra) {
    const creds = getCredentials();

    let url = CONFIG.XTREAM_HOST + '/player_api.php' +
      '?username=' + encodeURIComponent(creds.u) +
      '&password=' + encodeURIComponent(creds.p) +
      '&action=' + action;
    if (extra) url += extra;

    log('🔗 API URL:', url.substring(0, 100) + '...');
    return url;
  }

  /* ================================================================
     🎬 توليد رابط الحلقة (عبر Worker Token)
     ================================================================ */
  async function buildStreamUrl(episodeId, ext) {
    const tokenData = await requestToken('series', episodeId, ext || 'mp4');

    if (!tokenData || !tokenData.url) {
      warn('فشل Token — استخدام رابط مباشر');

      const creds = getCredentials();
      return CONFIG.XTREAM_HOST + '/series/' +
        encodeURIComponent(creds.u) + '/' +
        encodeURIComponent(creds.p) + '/' +
        episodeId + '.' + (ext || 'mp4');
    }

    return tokenData.url;
  }

  /* ================================================================
     💾 Cache
     ================================================================ */
  function isCacheValid() {
    try {
      const ts = parseInt(localStorage.getItem(CACHE_KEYS.TIMESTAMP) || '0', 10);
      if (!ts) return false;
      return ((Date.now() - ts) / (1000 * 60 * 60)) < CONFIG.CACHE_HOURS;
    } catch (e) { return false; }
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.ALL_SERIES);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeCache(series) {
    const maxSeries = CONFIG.MAX_CACHE_SERIES || 800;
    const toCache = series.length > maxSeries ? series.slice(0, maxSeries) : series;

    try {
      localStorage.setItem(CACHE_KEYS.ALL_SERIES, JSON.stringify(toCache));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      log('✅ Cache:', toCache.length);
    } catch (e) {
      warn('فشل Cache');
      try {
        localStorage.removeItem(CACHE_KEYS.ALL_SERIES);
        const smaller = series.slice(0, 300);
        localStorage.setItem(CACHE_KEYS.ALL_SERIES, JSON.stringify(smaller));
        localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      } catch (e2) {}
    }
  }

  function saveInfoCache(seriesId, info) {
    try {
      localStorage.setItem(CACHE_KEYS.INFO_PREFIX + seriesId, JSON.stringify({
        data: info,
        timestamp: Date.now()
      }));
    } catch (e) {
      warn('فشل Cache الحلقات');
    }
  }

  function readInfoCache(seriesId) {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.INFO_PREFIX + seriesId);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      const hoursPassed = (Date.now() - cached.timestamp) / (1000 * 60 * 60);
      if (hoursPassed > CONFIG.CACHE_HOURS) return null;
      return cached.data;
    } catch (e) { return null; }
  }

  function clearCache() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === CACHE_KEYS.ALL_SERIES ||
                    key === CACHE_KEYS.TIMESTAMP ||
                    key.startsWith(CACHE_KEYS.INFO_PREFIX))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      log('🗑️ تم مسح Cache');
      return true;
    } catch (e) { return false; }
  }

  /* ================================================================
     🎯 فلترة
     ================================================================ */
  function shouldIncludeSeries(s) {
    if (!s || !s.name) return false;
    if (s.is_adult === '1' || s.is_adult === 1) return false;
    const year = extractYear(s.name);
    if (year > 0 && year < CONFIG.MIN_YEAR) return false;
    return true;
  }

  /* ================================================================
     🎬 تحويل مسلسل — [معدّل مع Image Proxy]
     ================================================================ */
  function normalizeSeries(raw) {
    const year = extractYear(raw.name);
    const rating = parseRating(raw.rating);
    const cleanTitle = cleanName(raw.name);
    const catId = String(raw.category_id || '');

    /* ✅ [جديد] استخدام proxyImage للصور */
    const rawPoster = cleanImageUrl(raw.cover);
    const proxiedPoster = proxyImage(rawPoster, 300);

    const rawBackdrop = cleanImageUrl(
      raw.backdrop_path && raw.backdrop_path[0] ? raw.backdrop_path[0] : ''
    );
    const proxiedBackdrop = rawBackdrop ? proxyImage(rawBackdrop, 800) : '';

    return {
      id: raw.series_id,
      name: raw.name,
      title: cleanTitle || raw.name,
      year: year,
      rating: rating,
      rating5: raw.rating_5based || 0,
      poster: proxiedPoster,         // ✅ الرابط بعد Proxy
      originalPoster: rawPoster,     // ✅ الرابط الأصلي (للـ Fallback)
      categoryId: catId,
      categoryName: CATEGORIES[catId] ? CATEGORIES[catId].name : 'مسلسل',
      plot: raw.plot || '',
      cast: raw.cast || '',
      director: raw.director || '',
      genre: raw.genre || '',
      releaseDate: raw.releaseDate || '',
      lastModified: raw.last_modified || '',
      addedAt: parseInt(raw.last_modified || '0', 10) || Date.now(),
      episodeRunTime: raw.episode_run_time || '',
      backdrop: proxiedBackdrop,     // ✅ Backdrop بعد Proxy
      originalBackdrop: rawBackdrop, // ✅ Backdrop الأصلي
      youtubeTrailer: raw.youtube_trailer || ''
    };
  }

  /* ================================================================
     📡 جلب المسلسلات — مباشر من السيرفر
     ================================================================ */
  async function fetchAllSeriesFromApi() {
    log('📡 جلب المسلسلات من السيرفر...');
    const url = buildApiUrl('get_series');

    const raw = await httpGet(url, CONFIG.TIMEOUT_MS);

    if (!Array.isArray(raw)) {
      throw new Error('استجابة API غير صالحة');
    }

    log('📥 تم جلب', raw.length, 'مسلسل — جارٍ الفلترة...');

    const filtered = [];
    for (const item of raw) {
      if (shouldIncludeSeries(item)) {
        filtered.push(normalizeSeries(item));
      }
    }

    log('✅ بعد الفلترة:', filtered.length);
    return filtered;
  }

  /* ================================================================
     📦 التحميل الرئيسي
     ================================================================ */
  let _loadingPromise = null;

  async function loadSeries(forceReload) {
    if (_loadingPromise) {
      log('⏳ تحميل جارٍ');
      return _loadingPromise;
    }

    if (!forceReload && isCacheValid()) {
      const cached = readCache();
      if (cached && cached.length > 0) {
        log('💾 من Cache:', cached.length);
        return cached;
      }
    }

    _loadingPromise = (async () => {
      try {
        const series = await fetchAllSeriesFromApi();
        writeCache(series);
        return series;
      } catch (e) {
        error('فشل التحميل:', e.message);
        const cached = readCache();
        if (cached && cached.length > 0) {
          warn('🔄 من Cache القديم');
          return cached;
        }
        return [];
      } finally {
        _loadingPromise = null;
      }
    })();

    return _loadingPromise;
  }

  /* ================================================================
     📺 جلب معلومات مسلسل (الحلقات) — مباشر
     ================================================================ */
  async function getSeriesInfo(seriesId) {
    log('📥 جلب معلومات المسلسل:', seriesId);

    const cached = readInfoCache(seriesId);
    if (cached) {
      log('💾 من Cache الحلقات');
      return cached;
    }

    try {
      const url = buildApiUrl('get_series_info', '&series_id=' + seriesId);

      const data = await httpGet(url, 30000);

      if (!data) {
        warn('استجابة فارغة');
        return { episodes: {}, info: {}, seasons: [] };
      }

      const episodes = data.episodes || {};
      const info = data.info || {};

      const seasons = Object.keys(episodes).sort(function (a, b) {
        return parseInt(a) - parseInt(b);
      });

      log('✅ تم جلب', seasons.length, 'موسم');

      const result = { info, episodes, seasons };
      saveInfoCache(seriesId, result);
      return result;

    } catch (e) {
      error('فشل جلب معلومات المسلسل:', e.message);
      return { episodes: {}, info: {}, seasons: [], error: e.message };
    }
  }

  /* ================================================================
     📊 فلاتر
     ================================================================ */
  function filterByCategory(series, categoryId) {
    if (!categoryId) return series;
    return series.filter(s => String(s.categoryId) === String(categoryId));
  }

  function getTrending(series, limit) {
    return [...series].sort((a, b) => {
      const scoreA = a.rating * 10 + (a.year >= 2023 ? 20 : a.year >= 2020 ? 10 : 0);
      const scoreB = b.rating * 10 + (b.year >= 2023 ? 20 : b.year >= 2020 ? 10 : 0);
      return scoreB - scoreA;
    }).slice(0, limit || 20);
  }

  function getTopRated(series, limit) {
    return [...series]
      .filter(s => s.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit || 20);
  }

  function getRecentlyAdded(series, limit) {
    return [...series]
      .sort((a, b) => b.addedAt - a.addedAt)
      .slice(0, limit || 20);
  }

  function getNewReleases(series, limit) {
    return [...series]
      .filter(s => s.year >= 2023)
      .sort((a, b) => b.year - a.year || b.rating - a.rating)
      .slice(0, limit || 20);
  }

  function search(series, query, limit) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return series
      .filter(s => s.title.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit || 50);
  }

  /* ================================================================
     🎯 تصنيفات مميزة
     ================================================================ */
  function getFeaturedGroups(series) {
    return {
      ramadan: filterByCategory(series, '224'),
      top50: filterByCategory(series, '257'),
      netflix: filterByCategory(series, '212'),
      shahid: filterByCategory(series, '197'),
      amazon: filterByCategory(series, '219'),
      hbo: filterByCategory(series, '221'),
      apple: filterByCategory(series, '218'),
      disney: filterByCategory(series, '220'),
      hulu: filterByCategory(series, '232'),
      turkish: [
        ...filterByCategory(series, '187'),
        ...filterByCategory(series, '188')
      ],
      anime: filterByCategory(series, '196'),
      asian: filterByCategory(series, '190'),
      indian: filterByCategory(series, '202'),
      documentary: filterByCategory(series, '191'),
      kids: [
        ...filterByCategory(series, '223'),
        ...filterByCategory(series, '222'),
        ...filterByCategory(series, '176')
      ],
      tv: filterByCategory(series, '194'),
      gulf: filterByCategory(series, '174'),
      egypt: filterByCategory(series, '175'),
      syria: filterByCategory(series, '173'),
      lebanon: filterByCategory(series, '189'),
      morocco: filterByCategory(series, '216'),
      jordan: filterByCategory(series, '215'),
      history: filterByCategory(series, '210')
    };
  }

  /* ================================================================
     🧪 اختبار
     ================================================================ */
  async function testConnection() {
    console.log('%c🧪 [Series] اختبار...', 'color:#00e5ff;font-weight:900;');

    const results = { version: '8.1' };

    try {
      if (window.__H90_SEC__) {
        const c = window.__H90_SEC__.c();
        results.security = { ok: true, hasUser: !!c.u, hasPass: !!c.p };
        console.log('✅ security.js يعمل');
      }
    } catch (e) {
      results.security = { ok: false };
    }

    try {
      const url = buildApiUrl('get_series');
      const res = await fetch(url, { cache: 'no-store', mode: 'cors' });
      const data = await res.json();
      results.api = { ok: true, count: data.length };
      console.log('✅ API يعمل — عدد المسلسلات:', data.length);
    } catch (e) {
      results.api = { ok: false, error: e.message };
      console.error('❌ API فشل:', e.message);
    }

    try {
      const tokenData = await requestToken('series', 1523708, 'mp4');
      if (tokenData && tokenData.url) {
        results.token = { ok: true };
        console.log('✅ Token يعمل');
      }
    } catch (e) {
      results.token = { ok: false };
    }

    /* ✅ [جديد] اختبار Image Proxy */
    try {
      const testPoster = proxyImage('http://example.com/test.jpg', 300);
      results.imageProxy = { ok: true, type: IMG_PROXY.TYPE, sample: testPoster };
      console.log('✅ Image Proxy:', IMG_PROXY.TYPE);
    } catch (e) {
      results.imageProxy = { ok: false };
    }

    console.log('📊 النتيجة:', results);
    return results;
  }

  /* ================================================================
     🌐 API عام
     ================================================================ */
  return {
    loadSeries, clearCache, isCacheValid,
    getSeriesInfo,
    getTrending, getTopRated, getRecentlyAdded, getNewReleases,
    filterByCategory, getFeaturedGroups, search,
    extractYear, cleanName, buildStreamUrl, getCredentials,
    CATEGORIES, CONFIG,

    /* ✅ [جديد] Image Proxy */
    proxyImage,
    getFallbackImageUrl,
    IMG_PROXY,

    testConnection,
    getStatus: function () {
      return {
        version: '8.1',
        cacheValid: isCacheValid(),
        cacheSize: (readCache() || []).length,
        securityAvailable: !!window.__H90_SEC__,
        categoriesCount: Object.keys(CATEGORIES).length,
        proxyEnabled: IMG_PROXY.ENABLED,
        proxyType: IMG_PROXY.TYPE
      };
    }
  };

})();

window.SeriesAPI = SeriesAPI;

console.log('%c📺 H90 — Series API v8.1 (Direct + Encrypted + 26 Categories + Image Proxy) Loaded',
  'background:linear-gradient(135deg,#00e5ff,#9c27b0);color:#fff;padding:5px 12px;border-radius:8px;font-weight:900;font-size:11px;');