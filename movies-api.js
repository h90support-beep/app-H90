/* ================================================================
   H90 — Movies API v7.1 (Direct + Encrypted + Image Proxy)
   ✅ USER/PASS من security.js (مشفّرين)
   ✅ API مباشر من السيرفر (بدون Worker)
   ✅ Token للفيديو عبر Worker
   ✅ 20 تصنيف كامل
   ✅ [جديد] Image Proxy لحل مشكلة عدم ظهور الصور
   ✅ [جديد] Fallback متعدد للصور
   ================================================================ */

'use strict';

const MoviesAPI = (function () {

  /* ================================================================
     ⚙️ الإعدادات
     ================================================================ */
  const CONFIG = {
    WORKER_URL: 'https://idjdhdhdhhdueugxbsksigckdhsg.dairalzor33.workers.dev',
    XTREAM_HOST: 'http://vip2.sharkhost.xyz',
    MIN_YEAR: 2000,
    MIN_RATING: 6.5,
    CACHE_HOURS: 24,
    MAX_CACHE_MOVIES: 3000,
    TIMEOUT_MS: 120000,
    TOKEN_TTL: 14400
  };

  /* ================================================================
     🖼️ إعدادات Image Proxy
     ================================================================ */
  const IMG_PROXY = {
    // ✅ Worker Proxy (الأفضل — يتطلب إضافة endpoint في Worker)
    WORKER: CONFIG.WORKER_URL + '/proxy/image?url=',

    // ✅ weserv.nl (مجاني — لا يحتاج تعديل Worker)
    WESERV: 'https://images.weserv.nl/?url=',

    // ✅ statically.io (Fallback ثاني)
    STATICALLY: 'https://cdn.statically.io/img/',

    // ✅ تفعيل/تعطيل
    ENABLED: true,

    // ✅ أي نوع نستخدم؟ ('worker' | 'weserv' | 'statically')
    // ⚠️ غيّر هذا إلى 'weserv' إذا لم تُعدّل الـ Worker بعد
    TYPE: 'weserv',

    // ✅ الحجم الافتراضي للصور
    DEFAULT_WIDTH: 300,

    // ✅ إضافة referrer policy (يمنع السيرفر من رفض الطلب)
    REFERRER: 'no-referrer'
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
     🏷️ التصنيفات
     ================================================================ */
  const CATEGORIES = {
    '254': { name: '2026', icon: 'calendar' },
    '98':  { name: '2024-2026 UHD', icon: 'diamond' },
    '122': { name: 'TOP IMDB', icon: 'star' },
    '192': { name: 'English 4K', icon: 'monitor' },
    '256': { name: 'Marvel', icon: 'lightning' },
    '255': { name: 'DC', icon: 'lightning' },
    '241': { name: 'Horror', icon: 'alert' },
    '248': { name: 'Thriller', icon: 'target' },
    '242': { name: 'Drama', icon: 'film' },
    '246': { name: 'Crime', icon: 'alert' },
    '243': { name: 'Adventure', icon: 'shuffle' },
    '251': { name: 'Comedy', icon: 'film' },
    '247': { name: 'Romance', icon: 'star' },
    '245': { name: 'War', icon: 'target' },
    '171': { name: 'Documentary', icon: 'info' },
    '186': { name: 'KIDS', icon: 'play' },
    '213': { name: 'Anime', icon: 'film' },
    '159': { name: 'KIDS 2', icon: 'play' },
    '168': { name: 'Arabic', icon: 'film' },
    '227': { name: 'WWE PPV', icon: 'target' }
  };

  /* ================================================================
     🔑 مفاتيح Cache
     ================================================================ */
  const CACHE_KEYS = {
    ALL_MOVIES: 'h90_movies_all_v71',
    TIMESTAMP: 'h90_movies_timestamp_v71'
  };

  /* ================================================================
     🛠️ أدوات
     ================================================================ */
  function log(...args) {
    console.log('%c🎬 [Movies]', 'color:#00e5ff;font-weight:900;', ...args);
  }

  function warn(...args) {
    console.warn('%c⚠️ [Movies]', 'color:#ffb300;font-weight:900;', ...args);
  }

  function error(...args) {
    console.error('%c❌ [Movies]', 'color:#ff2d55;font-weight:900;', ...args);
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
      .replace(/\s*\d+[Kk]\b/g, '')
      .replace(/\s*(4K|UHD|FHD|HD|SD|HEVC|H\.?265|H\.?264|REMUX|BLURAY|BRRip|WEB-?DL|WEBRip|HDTV|DVDRip|XviD|DivX)\b/gi, '')
      .replace(/\s*\.(?=\s|$)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanImageUrl(url) {
    if (!url) return '';
    if (url.includes('_big.jpg') && url.length < 60) return '';
    return url.replace(/\\/g, '');
  }

  /* ================================================================
     🖼️ [جديد] Image Proxy — حل مشكلة الصور
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

    // ✅ الحجم
    const width = size || IMG_PROXY.DEFAULT_WIDTH;
    const sizeParam = '&w=' + width;

    if (IMG_PROXY.ENABLED) {
      switch (IMG_PROXY.TYPE) {
        case 'worker':
          // ✅ Worker Proxy
          return IMG_PROXY.WORKER + encodeURIComponent(url) + sizeParam;

        case 'weserv':
          // ✅ weserv.nl (يحتاج إزالة http://)
          return IMG_PROXY.WESERV + encodeURIComponent(url.replace(/^https?:\/\//, '')) + sizeParam;

        case 'statically':
          // ✅ statically.io
          return IMG_PROXY.STATICALLY + url.replace(/^https?:\/\//, '') + '?w=' + width;

        default:
          return url;
      }
    }

    return url;
  }

  /**
   * تحويل جميع روابط الصور في قائمة الأفلام
   */
  function proxyMovieImages(movies) {
    if (!Array.isArray(movies)) return movies;
    return movies.map(function (movie) {
      if (movie.poster) {
        movie.poster = proxyImage(movie.poster, 300);
      }
      return movie;
    });
  }

  /**
   * الحصول على رابط بديل للصورة (Fallback)
   */
  function getFallbackImageUrl(url) {
    if (!url) return '';

    // ✅ إذا كان الرابط يستخدم weserv، جرب statically
    if (url.includes('weserv.nl')) {
      const original = decodeURIComponent(url.split('url=')[1].split('&')[0]);
      return IMG_PROXY.STATICALLY + original + '?w=300';
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
    const timeoutMsFinal = timeoutMs || CONFIG.TIMEOUT_MS;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMsFinal);

    try {
      log('🌐 Fetching:', url.substring(0, 120) + '...');

      const res = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        mode: 'cors'
      });

      clearTimeout(timeoutId);

      log('✅ Response:', res.status);

      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        error('استجابة غير JSON:', text.substring(0, 100));
        throw new Error('استجابة API غير صالحة: ' + text.substring(0, 30));
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
          ext: ext || 'mkv'
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
     🎬 توليد رابط البث (عبر Worker Token)
     ================================================================ */
  async function buildStreamUrl(streamId, ext) {
    const tokenData = await requestToken('movie', streamId, ext || 'mkv');

    if (!tokenData || !tokenData.url) {
      warn('فشل Token — استخدام رابط مباشر');

      const creds = getCredentials();
      return CONFIG.XTREAM_HOST + '/movie/' +
        encodeURIComponent(creds.u) + '/' +
        encodeURIComponent(creds.p) + '/' +
        streamId + '.' + (ext || 'mkv');
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
      const raw = localStorage.getItem(CACHE_KEYS.ALL_MOVIES);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeCache(movies) {
    const maxMovies = CONFIG.MAX_CACHE_MOVIES || 3000;
    const toCache = movies.length > maxMovies ? movies.slice(0, maxMovies) : movies;

    try {
      localStorage.setItem(CACHE_KEYS.ALL_MOVIES, JSON.stringify(toCache));
      localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      log('✅ Cache:', toCache.length);
    } catch (e) {
      warn('فشل Cache');
      try {
        localStorage.removeItem(CACHE_KEYS.ALL_MOVIES);
        const smaller = movies.slice(0, 1000);
        localStorage.setItem(CACHE_KEYS.ALL_MOVIES, JSON.stringify(smaller));
        localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());
      } catch (e2) {}
    }
  }

  function clearCache() {
    try {
      localStorage.removeItem(CACHE_KEYS.ALL_MOVIES);
      localStorage.removeItem(CACHE_KEYS.TIMESTAMP);
      log('🗑️ تم مسح Cache');
      return true;
    } catch (e) { return false; }
  }

  /* ================================================================
     🎯 فلترة
     ================================================================ */
  function shouldIncludeMovie(movie) {
    if (!movie || !movie.name) return false;
    if (movie.is_adult === '1' || movie.is_adult === 1) return false;

    const year = extractYear(movie.name);
    if (year > 0 && year < CONFIG.MIN_YEAR) return false;

    const rating = parseRating(movie.rating);
    if (rating < CONFIG.MIN_RATING) return false;

    return true;
  }

  function normalizeMovie(raw) {
    const year = extractYear(raw.name);
    const rating = parseRating(raw.rating);
    const cleanTitle = cleanName(raw.name);

    /* ✅ [جديد] استخدام proxyImage */
    const rawPoster = cleanImageUrl(raw.stream_icon);
    const proxiedPoster = proxyImage(rawPoster, 300);

    return {
      id: raw.stream_id,
      name: raw.name,
      title: cleanTitle || raw.name,
      year: year,
      rating: rating,
      rating5: raw.rating_5based || 0,
      poster: proxiedPoster,       // ✅ الرابط بعد Proxy
      originalPoster: rawPoster,   // ✅ الرابط الأصلي (للـ Fallback)
      categoryId: String(raw.category_id || ''),
      categoryName: CATEGORIES[raw.category_id] ? CATEGORIES[raw.category_id].name : 'أفلام',
      extension: raw.container_extension || 'mkv',
      addedAt: parseInt(raw.added || '0', 10)
    };
  }

  /* ================================================================
     📡 جلب الأفلام — مباشر من السيرفر
     ================================================================ */
  async function fetchAllMoviesFromApi() {
    log('📡 جلب الأفلام من السيرفر...');
    const url = buildApiUrl('get_vod_streams');

    const raw = await httpGet(url, CONFIG.TIMEOUT_MS);

    if (!Array.isArray(raw)) {
      throw new Error('استجابة API غير صالحة');
    }

    log('📥 تم جلب', raw.length, 'فيلم');

    const filtered = [];
    for (const item of raw) {
      if (shouldIncludeMovie(item)) {
        filtered.push(normalizeMovie(item));
      }
    }

    log('✅ بعد الفلترة:', filtered.length);
    return filtered;
  }

  /* ================================================================
     📦 التحميل
     ================================================================ */
  let _loadingPromise = null;

  async function loadMovies(forceReload) {
    if (_loadingPromise) return _loadingPromise;

    if (!forceReload && isCacheValid()) {
      const cached = readCache();
      if (cached && cached.length > 0) {
        log('💾 من Cache:', cached.length);
        return cached;
      }
    }

    _loadingPromise = (async () => {
      try {
        const movies = await fetchAllMoviesFromApi();
        writeCache(movies);
        return movies;
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
     📊 فلاتر
     ================================================================ */
  function filterByCategory(movies, categoryId) {
    if (!categoryId) return movies;
    return movies.filter(m => String(m.categoryId) === String(categoryId));
  }

  function getTrending(movies, limit) {
    return [...movies].sort((a, b) => {
      const scoreA = a.rating * 10 + (a.year >= 2023 ? 20 : a.year >= 2020 ? 10 : 0);
      const scoreB = b.rating * 10 + (b.year >= 2023 ? 20 : b.year >= 2020 ? 10 : 0);
      return scoreB - scoreA;
    }).slice(0, limit || 20);
  }

  function getTopRated(movies, limit) {
    return [...movies].sort((a, b) => b.rating - a.rating).slice(0, limit || 20);
  }

  function getRecentlyAdded(movies, limit) {
    return [...movies].sort((a, b) => b.addedAt - a.addedAt).slice(0, limit || 20);
  }

  function getNewReleases(movies, limit) {
    return [...movies]
      .filter(m => m.year >= 2024)
      .sort((a, b) => b.year - a.year || b.rating - a.rating)
      .slice(0, limit || 20);
  }

  function search(movies, query, limit) {
    if (!query || query.trim().length < 2) return [];
    const q = query.trim().toLowerCase();
    return movies
      .filter(m => m.title.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit || 50);
  }

  function paginate(movies, page, pageSize) {
    const start = (page - 1) * (pageSize || 30);
    const end = start + (pageSize || 30);
    return {
      items: movies.slice(start, end),
      total: movies.length,
      totalPages: Math.ceil(movies.length / (pageSize || 30)),
      hasMore: end < movies.length
    };
  }

  /* ================================================================
     🧪 اختبار
     ================================================================ */
  async function testConnection() {
    console.log('%c🧪 [Movies] اختبار...', 'color:#00e5ff;font-weight:900;');

    const results = { version: '7.1' };

    /* 1. security.js */
    try {
      if (window.__H90_SEC__) {
        const c = window.__H90_SEC__.c();
        results.security = { ok: true, hasUser: !!c.u, hasPass: !!c.p };
        console.log('✅ security.js يعمل');
      }
    } catch (e) {
      results.security = { ok: false };
    }

    /* 2. API مباشر */
    try {
      const url = buildApiUrl('get_vod_streams');
      const res = await fetch(url, { cache: 'no-store', mode: 'cors' });
      const data = await res.json();
      results.api = { ok: true, count: data.length };
      console.log('✅ API يعمل — عدد الأفلام:', data.length);
    } catch (e) {
      results.api = { ok: false, error: e.message };
      console.error('❌ API فشل:', e.message);
    }

    /* 3. Token */
    try {
      const tokenData = await requestToken('movie', 542910, 'mkv');
      if (tokenData && tokenData.url) {
        results.token = { ok: true };
        console.log('✅ Token يعمل');
      }
    } catch (e) {
      results.token = { ok: false };
    }

    /* 4. Image Proxy */
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
    loadMovies, clearCache, isCacheValid,
    getTrending, getTopRated, getRecentlyAdded, getNewReleases,
    filterByCategory, search, paginate,
    extractYear, cleanName, buildStreamUrl, getCredentials,
    CATEGORIES, CONFIG,

    /* ✅ [جديد] Image Proxy */
    proxyImage,
    proxyMovieImages,
    getFallbackImageUrl,
    IMG_PROXY,

    testConnection,
    getStatus: function () {
      return {
        version: '7.1',
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

window.MoviesAPI = MoviesAPI;

console.log('%c🎬 H90 — Movies API v7.1 (Direct + Encrypted + Image Proxy) Loaded',
  'background:linear-gradient(135deg,#00e5ff,#ffb300);color:#fff;padding:5px 12px;border-radius:8px;font-weight:900;font-size:11px;');