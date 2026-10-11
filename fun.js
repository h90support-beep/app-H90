/* ================================================================
   H90 — Entertainment Module (fun.js) v10.0
   ✅ يستخدم MoviesAPI + SeriesAPI (Encrypted + Worker)
   ✅ H90 Player Deep Link (محسّن)
   ✅ 26 تصنيف للمسلسلات
   ✅ Fallback للـ Browser
   ✅ أيقونات SVG فقط
   ✅ [جديد] Auto-scroll للصفوف (كل 5 ثوانٍ)
   ✅ [جديد] Hero Slider محسّن
   ================================================================ */

'use strict';

/* ================================================================
   0. الحالة
   ================================================================ */
let _mvAllMovies = [];
let _mvHeroSlideInterval = null;
let _mvHeroCurrentIndex = 0;
let _mvHeroItems = [];
let _mvDetailsCurrentMovie = null;
let _mvFavMovies = [];

let _srAllSeries = [];
let _srHeroSlideInterval = null;
let _srHeroCurrentIndex = 0;
let _srHeroItems = [];
let _srDetailsCurrentSeries = null;
let _srCurrentInfo = null;
let _srCurrentSeason = null;
let _srFavSeries = [];

/* ✅ [جديد] Auto-scroll للصفوف */
let _mvRowAutoScrollIntervals = [];
let _srRowAutoScrollIntervals = [];

const MV_FAV_KEY = 'h90_movies_favorites';
const SR_FAV_KEY = 'h90_series_favorites';

/* ================================================================
   1. أيقونات SVG
   ================================================================ */
const MV_ICONS = {
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#ff6b35;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  new: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#00e5ff;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#ffb300;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#e53935;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>',
  lightning: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#ffb300;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#0091ea;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  ghost: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#9c27b0;"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/></svg>',
  laugh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#ffb300;"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
  explosion: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#e53935;"><path d="M12 2l2 5 5-2-3 5 5 3-5 3 3 5-5-2-2 5-2-5-5 2 3-5-5-3 5-3-3-5 5 2z"/></svg>',
  theater: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#e53935;"><path d="M2 3h20v6a5 5 0 0 1-5 5h-1v3h2a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2h2v-3H7a5 5 0 0 1-5-5V3z"/><circle cx="8" cy="7" r="1" fill="currentColor"/><circle cx="16" cy="7" r="1" fill="currentColor"/><path d="M9 11c1 1 5 1 6 0"/></svg>',
  anime: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#e91e63;"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M8 16c1 1 7 1 8 0"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#00e5ff;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#e53935;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#ffb300;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#00e5ff;"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>',
  film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;color:#ffb300;"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:#00e5ff;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" style="width:18px;height:18px;color:#00e676;"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  newspaper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;color:#9c27b0;"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9"/><path d="M18 14h-8M18 18h-8M12 10h4M12 6h4"/></svg>'
};

/* ================================================================
   2. المفضلة
   ================================================================ */
function mvLoadFavorites() {
  try {
    _mvFavMovies = JSON.parse(localStorage.getItem(MV_FAV_KEY) || '[]');
    if (!Array.isArray(_mvFavMovies)) _mvFavMovies = [];
  } catch (e) { _mvFavMovies = []; }
}
function mvSaveFavorites() {
  try { localStorage.setItem(MV_FAV_KEY, JSON.stringify(_mvFavMovies)); } catch (e) {}
}
function mvIsFav(id) { return _mvFavMovies.indexOf(id) > -1; }
function mvToggleFav(id) {
  const idx = _mvFavMovies.indexOf(id);
  if (idx > -1) {
    _mvFavMovies.splice(idx, 1);
    if (typeof showToast === 'function') showToast('تمت الإزالة من المفضلة', 'info');
  } else {
    _mvFavMovies.push(id);
    if (typeof showToast === 'function') showToast('تمت الإضافة للمفضلة', 'success');
  }
  mvSaveFavorites();
  if (navigator.vibrate) navigator.vibrate(12);
}

function srLoadFavorites() {
  try {
    _srFavSeries = JSON.parse(localStorage.getItem(SR_FAV_KEY) || '[]');
    if (!Array.isArray(_srFavSeries)) _srFavSeries = [];
  } catch (e) { _srFavSeries = []; }
}
function srSaveFavorites() {
  try { localStorage.setItem(SR_FAV_KEY, JSON.stringify(_srFavSeries)); } catch (e) {}
}
function srIsFav(id) { return _srFavSeries.indexOf(id) > -1; }
function srToggleFav(id) {
  const idx = _srFavSeries.indexOf(id);
  if (idx > -1) {
    _srFavSeries.splice(idx, 1);
    if (typeof showToast === 'function') showToast('تمت الإزالة من المفضلة', 'info');
  } else {
    _srFavSeries.push(id);
    if (typeof showToast === 'function') showToast('تمت الإضافة للمفضلة', 'success');
  }
  srSaveFavorites();
  if (navigator.vibrate) navigator.vibrate(12);
}

/* ================================================================
   ✅ [جديد] 3. Auto-Scroll للصفوف (الحركة التلقائية)
   ================================================================ */

/* ✅ إيقاف كل الـ intervals النشطة */
function stopAllRowAutoScroll() {
  _mvRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _srRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _mvRowAutoScrollIntervals = [];
  _srRowAutoScrollIntervals = [];
  console.log('🛑 [AutoScroll] All stopped');
}

/* ✅ تشغيل Auto-Scroll على صف واحد */
function startRowAutoScroll(rowEl, intervalArray, speed) {
  if (!rowEl) return;

  const scrollSpeed = speed || 1.5; // بكسل لكل tick
  const tickInterval = 30; // كل 30ms

  let isPaused = false;
  let isUserInteracting = false;

  // ✅ إيقاف عند التفاعل
  const onUserStart = function () {
    isUserInteracting = true;
    isPaused = true;
  };
  const onUserEnd = function () {
    isUserInteracting = false;
    // ✅ استئناف بعد 3 ثوانٍ من آخر تفاعل
    setTimeout(function () {
      if (!isUserInteracting) isPaused = false;
    }, 3000);
  };

  rowEl.addEventListener('touchstart', onUserStart, { passive: true });
  rowEl.addEventListener('touchend', onUserEnd, { passive: true });
  rowEl.addEventListener('mousedown', onUserStart);
  rowEl.addEventListener('mouseup', onUserEnd);
  rowEl.addEventListener('mouseleave', onUserEnd);

  // ✅ Pause عند إخفاء التطبيق
  const visHandler = function () {
    if (document.hidden) {
      isPaused = true;
    } else if (!isUserInteracting) {
      isPaused = false;
    }
  };
  document.addEventListener('visibilitychange', visHandler);

  // ✅ interval للحركة
  const intervalId = setInterval(function () {
    if (isPaused || document.hidden) return;
    if (!document.body.contains(rowEl)) {
      clearInterval(intervalId);
      return;
    }

    // إذا وصلنا للنهاية، ارجع للبداية
    const maxScroll = rowEl.scrollWidth - rowEl.clientWidth;
    if (maxScroll <= 0) return;

    if (rowEl.scrollLeft >= maxScroll - 2) {
      // ✅ رجوع سلس للبداية
      rowEl.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      rowEl.scrollLeft += scrollSpeed;
    }
  }, tickInterval);

  intervalArray.push(intervalId);
  return intervalId;
}

/* ✅ تفعيل Auto-Scroll لكل الصفوف في صفحة الأفلام */
function activateMoviesRowsAutoScroll() {
  const page = document.getElementById('moviesFullPage');
  if (!page) return;

  // إيقاف القديم
  _mvRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _mvRowAutoScrollIntervals = [];

  setTimeout(function () {
    page.querySelectorAll('.mv-row').forEach(function (row) {
      startRowAutoScroll(row, _mvRowAutoScrollIntervals, 1.5);
    });
    console.log('▶️ [AutoScroll] Movies rows activated:', page.querySelectorAll('.mv-row').length);
  }, 500);
}

/* ✅ تفعيل Auto-Scroll لكل الصفوف في صفحة المسلسلات */
function activateSeriesRowsAutoScroll() {
  const page = document.getElementById('seriesFullPage');
  if (!page) return;

  _srRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _srRowAutoScrollIntervals = [];

  setTimeout(function () {
    page.querySelectorAll('.mv-row').forEach(function (row) {
      startRowAutoScroll(row, _srRowAutoScrollIntervals, 1.5);
    });
    console.log('▶️ [AutoScroll] Series rows activated:', page.querySelectorAll('.mv-row').length);
  }, 500);
}

/* ================================================================
   4. 🎬 فتح H90 Player (محسّن)
   ================================================================ */
function openH90Player(options) {
  const { url, title = 'H90 Player', poster = '', isLive = false } = options || {};

  if (!url) {
    if (typeof showToast === 'function') showToast('لا يوجد رابط', 'error');
    return;
  }

  const deepLink = 'h90player://play?url=' + encodeURIComponent(url) +
    '&title=' + encodeURIComponent(title) +
    '&poster=' + encodeURIComponent(poster || '') +
    '&live=' + (isLive ? '1' : '0');

  console.log('🎬 Opening in H90 Player:', url.substring(0, 80));
  console.log('🔗 Deep Link:', deepLink.substring(0, 150));

  const isNative = !!(
    window.__H90_APK_MODE__ ||
    window.__H90_NATIVE_EARLY__ ||
    (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
    window.cordova ||
    location.protocol === 'file:'
  );

  if (isNative) {
    openViaDeepLink(deepLink, url);
  } else {
    fallbackPlay(url);
  }
}

function openViaDeepLink(deepLink, fallbackUrl) {
  let opened = false;
  const visHandler = function () { if (document.hidden) opened = true; };
  document.addEventListener('visibilitychange', visHandler);

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    try {
      window.Capacitor.Plugins.App.openUrl({ url: deepLink }).catch(function () {
        window.location.href = deepLink;
      });
    } catch (e) {
      window.location.href = deepLink;
    }
  } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher) {
    try {
      window.Capacitor.Plugins.AppLauncher.openUrl({ url: deepLink }).catch(function () {
        window.location.href = deepLink;
      });
    } catch (e) {
      window.location.href = deepLink;
    }
  } else {
    window.location.href = deepLink;
  }

  setTimeout(function () {
    document.removeEventListener('visibilitychange', visHandler);
    if (!opened && !document.hidden) {
      console.warn('⚠️ H90 Player لم يفتح');
      if (typeof showToast === 'function') showToast('H90 Player غير مثبّت', 'warning');
      fallbackPlay(fallbackUrl);
    }
  }, 2000);
}

function fallbackPlay(url) {
  if (window.open) window.open(url, '_blank');
  else window.location.href = url;
}

/* ================================================================
   5. صفحة الأفلام
   ================================================================ */
async function renderMoviesPage() {
  let page = document.getElementById('moviesFullPage');
  if (!page) {
    page = document.createElement('div');
    page.id = 'moviesFullPage';
    page.innerHTML =
      '<div class="mfp-header">' +
        '<button class="mfp-back" onclick="mvCloseMoviesPage()">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</button>' +
        '<div class="mfp-title">الأفلام<small id="mfpSubtitle">جارٍ التحميل...</small></div>' +
        '<button class="mfp-header-btn" onclick="mvRefreshMovies()">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="mfp-body" id="mfpBody">' +
        '<div class="mv-loader" style="padding: 100px 20px;">' +
          '<div class="mv-loader-spinner"></div>' +
          '<div class="mv-loader-text">جارٍ تحميل الأفلام...</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(page);
  }

  page.classList.add('show');
  document.body.classList.add('movies-page-open');
  document.body.style.overflow = 'hidden';

  const body = document.getElementById('mfpBody');
  const subtitle = document.getElementById('mfpSubtitle');

  try {
    if (!_mvAllMovies || _mvAllMovies.length === 0) {
      if (subtitle) subtitle.textContent = 'جارٍ التحميل...';
      _mvAllMovies = await window.MoviesAPI.loadMovies();
    }

    if (!_mvAllMovies || _mvAllMovies.length === 0) {
      body.innerHTML = '<div class="mv-empty" style="padding: 100px 30px;"><div class="mv-empty-icon">' + getIcon('film') + '</div><div class="mv-empty-title">لا توجد أفلام</div></div>';
      return;
    }

    if (subtitle) subtitle.textContent = _mvAllMovies.length.toLocaleString('ar-EG') + ' فيلم';

    body.innerHTML = buildMoviesPageHTML();
    bindMoviesPageEvents();

    // ✅ [جديد] تفعيل Auto-Scroll
    activateMoviesRowsAutoScroll();

  } catch (e) {
    console.error('❌ [Movies]', e);
    if (subtitle) subtitle.textContent = 'فشل التحميل';
    body.innerHTML = '<div class="mv-empty" style="padding: 100px 30px;"><div class="mv-empty-icon">' + getIcon('alert') + '</div><div class="mv-empty-title">فشل التحميل</div><div class="mv-empty-desc">' + (e.message || '') + '</div></div>';
  }
}

function mvCloseMoviesPage() {
  const page = document.getElementById('moviesFullPage');
  if (page) page.classList.remove('show');
  document.body.classList.remove('movies-page-open');
  document.body.style.overflow = '';
  if (_mvHeroSlideInterval) { clearInterval(_mvHeroSlideInterval); _mvHeroSlideInterval = null; }
  // ✅ [جديد] إيقاف Auto-Scroll
  _mvRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _mvRowAutoScrollIntervals = [];
}

async function mvRefreshMovies() {
  if (typeof showToast === 'function') showToast('جارٍ التحديث...', 'info');
  window.MoviesAPI.clearCache();
  _mvAllMovies = [];
  await renderMoviesPage();
  if (typeof showToast === 'function') showToast('تم التحديث', 'success');
}

/* ================================================================
   6. صفحة المسلسلات
   ================================================================ */
async function renderSeriesPage() {
  let page = document.getElementById('seriesFullPage');
  if (!page) {
    page = document.createElement('div');
    page.id = 'seriesFullPage';
    page.innerHTML =
      '<div class="mfp-header">' +
        '<button class="mfp-back" onclick="srCloseSeriesPage()">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>' +
        '</button>' +
        '<div class="mfp-title">المسلسلات<small id="srpSubtitle">جارٍ التحميل...</small></div>' +
        '<button class="mfp-header-btn" onclick="srRefreshSeries()">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="mfp-body" id="srpBody">' +
        '<div class="mv-loader" style="padding: 100px 20px;">' +
          '<div class="mv-loader-spinner"></div>' +
          '<div class="mv-loader-text">جارٍ تحميل المسلسلات...</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(page);
  }

  page.classList.add('show');
  document.body.classList.add('movies-page-open');
  document.body.style.overflow = 'hidden';

  const body = document.getElementById('srpBody');
  const subtitle = document.getElementById('srpSubtitle');

  try {
    if (!_srAllSeries || _srAllSeries.length === 0) {
      if (subtitle) subtitle.textContent = 'جارٍ التحميل...';
      if (typeof SeriesAPI !== 'undefined') {
        _srAllSeries = await SeriesAPI.loadSeries();
      }
    }

    if (!_srAllSeries || _srAllSeries.length === 0) {
      body.innerHTML = '<div class="mv-empty" style="padding: 100px 30px;"><div class="mv-empty-icon">' + getIcon('tv') + '</div><div class="mv-empty-title">لا توجد مسلسلات</div></div>';
      return;
    }

    if (subtitle) subtitle.textContent = _srAllSeries.length.toLocaleString('ar-EG') + ' مسلسل';

    body.innerHTML = buildSeriesPageHTML();
    bindSeriesPageEvents();

    // ✅ [جديد] تفعيل Auto-Scroll
    activateSeriesRowsAutoScroll();

  } catch (e) {
    console.error('❌ [Series]', e);
    if (subtitle) subtitle.textContent = 'فشل التحميل';
    body.innerHTML = '<div class="mv-empty" style="padding: 100px 30px;"><div class="mv-empty-icon">' + getIcon('alert') + '</div><div class="mv-empty-title">فشل التحميل</div><div class="mv-empty-desc">' + (e.message || '') + '</div></div>';
  }
}

function srCloseSeriesPage() {
  const page = document.getElementById('seriesFullPage');
  if (page) page.classList.remove('show');
  document.body.classList.remove('movies-page-open');
  document.body.style.overflow = '';
  if (_srHeroSlideInterval) { clearInterval(_srHeroSlideInterval); _srHeroSlideInterval = null; }
  // ✅ [جديد] إيقاف Auto-Scroll
  _srRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _srRowAutoScrollIntervals = [];
}

async function srRefreshSeries() {
  if (typeof showToast === 'function') showToast('جارٍ التحديث...', 'info');
  if (typeof SeriesAPI !== 'undefined') SeriesAPI.clearCache();
  _srAllSeries = [];
  await renderSeriesPage();
  if (typeof showToast === 'function') showToast('تم التحديث', 'success');
}

/* ================================================================
   7. بناء صفحة المسلسلات
   ================================================================ */
function buildSeriesPageHTML() {
  const series = _srAllSeries;
  const heroSeries = typeof SeriesAPI !== 'undefined' && SeriesAPI.getTrending
    ? SeriesAPI.getTrending(series, 5) : series.slice(0, 5);
  _srHeroItems = heroSeries;

  const groups = typeof SeriesAPI !== 'undefined' && SeriesAPI.getFeaturedGroups
    ? SeriesAPI.getFeaturedGroups(series) : {};

  let html = '';

  if (heroSeries.length > 0) {
    html += '<div class="mv-hero" id="srHero"><div class="mv-hero-track" id="srHeroTrack">';
    heroSeries.forEach(function (s, i) { html += buildSeriesHeroSlide(s, i); });
    html += '</div><div class="mv-hero-dots" id="srHeroDots">';
    heroSeries.forEach(function (_, i) {
      html += '<div class="mv-hero-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></div>';
    });
    html += '</div></div>';
  }

  html +=
    '<div class="mv-search-wrap">' +
      '<div class="mv-search-box">' +
        '<div class="mv-search-icon">' + getIcon('search') + '</div>' +
        '<input type="text" class="mv-search-input" id="srSearchInput" placeholder="ابحث عن مسلسل..." autocomplete="off">' +
        '<button class="mv-search-clear" id="srSearchClear">' + getIcon('close') + '</button>' +
      '</div>' +
    '</div>';

  html += '<div id="srRowsContainer">';

  if (groups.ramadan && groups.ramadan.length > 0)         html += buildSeriesRow('رمضان 2026', 'calendar', 'ramadan', groups.ramadan.slice(0, 15));
  if (groups.top50 && groups.top50.length > 0)             html += buildSeriesRow('أفضل 50 مسلسل', 'star', 'top50', groups.top50.slice(0, 15));
  if (groups.netflix && groups.netflix.length > 0)         html += buildSeriesRow('Netflix', 'tv', 'netflix', groups.netflix.slice(0, 15));
  if (groups.shahid && groups.shahid.length > 0)           html += buildSeriesRow('Shahid', 'tv', 'shahid', groups.shahid.slice(0, 15));
  if (groups.amazon && groups.amazon.length > 0)           html += buildSeriesRow('Amazon', 'tv', 'amazon', groups.amazon.slice(0, 15));
  if (groups.hbo && groups.hbo.length > 0)                 html += buildSeriesRow('HBO', 'tv', 'hbo', groups.hbo.slice(0, 15));
  if (groups.apple && groups.apple.length > 0)             html += buildSeriesRow('Apple TV+', 'tv', 'apple', groups.apple.slice(0, 15));
  if (groups.disney && groups.disney.length > 0)           html += buildSeriesRow('Disney+', 'tv', 'disney', groups.disney.slice(0, 15));
  if (groups.hulu && groups.hulu.length > 0)               html += buildSeriesRow('Hulu', 'tv', 'hulu', groups.hulu.slice(0, 15));
  if (groups.turkish && groups.turkish.length > 0)         html += buildSeriesRow('تركي', 'theater', 'turkish', groups.turkish.slice(0, 15));
  if (groups.anime && groups.anime.length > 0)             html += buildSeriesRow('أنمي', 'anime', 'anime', groups.anime.slice(0, 15));
  if (groups.asian && groups.asian.length > 0)             html += buildSeriesRow('آسيوي', 'film', 'asian', groups.asian.slice(0, 15));
  if (groups.indian && groups.indian.length > 0)           html += buildSeriesRow('هندي', 'film', 'indian', groups.indian.slice(0, 15));
  if (groups.documentary && groups.documentary.length > 0) html += buildSeriesRow('وثائقي', 'info', 'documentary', groups.documentary.slice(0, 15));
  if (groups.kids && groups.kids.length > 0)               html += buildSeriesRow('أطفال', 'play', 'kids', groups.kids.slice(0, 15));
  if (groups.tv && groups.tv.length > 0)                   html += buildSeriesRow('برامج ومسابقات', 'newspaper', 'tvshows', groups.tv.slice(0, 15));
  if (groups.gulf && groups.gulf.length > 0)               html += buildSeriesRow('خليجي', 'film', 'gulf', groups.gulf.slice(0, 15));
  if (groups.egypt && groups.egypt.length > 0)             html += buildSeriesRow('مصري', 'film', 'egypt', groups.egypt.slice(0, 15));
  if (groups.syria && groups.syria.length > 0)             html += buildSeriesRow('سوري', 'film', 'syria', groups.syria.slice(0, 15));
  if (groups.lebanon && groups.lebanon.length > 0)         html += buildSeriesRow('لبناني', 'film', 'lebanon', groups.lebanon.slice(0, 15));
  if (groups.morocco && groups.morocco.length > 0)         html += buildSeriesRow('المغرب وتونس', 'film', 'morocco', groups.morocco.slice(0, 15));
  if (groups.jordan && groups.jordan.length > 0)           html += buildSeriesRow('أردني', 'film', 'jordan', groups.jordan.slice(0, 15));
  if (groups.history && groups.history.length > 0)         html += buildSeriesRow('بدوي وتاريخي', 'film', 'history', groups.history.slice(0, 15));

  html += '</div>';
  html += '<div id="srSearchResults" style="display:none;"></div>';

  return html;
}

function buildSeriesHeroSlide(series, index) {
  const poster = series.poster || '';
  const title = series.title || series.name;
  const year = series.year || '';
  const rating = series.rating ? series.rating.toFixed(1) : '—';
  const isFav = srIsFav(series.id);

  return (
    '<div class="mv-hero-slide' + (index === 0 ? ' active' : '') + '" data-index="' + index + '" data-series-id="' + series.id + '">' +
      (poster ? '<img class="mv-hero-bg" src="' + poster + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
      '<div class="mv-hero-overlay"></div>' +
      '<div class="mv-hero-content">' +
        (poster ? '<img class="mv-hero-poster" src="' + poster + '" alt="' + title + '" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
        '<div class="mv-hero-title">' + title + '</div>' +
        '<div class="mv-hero-meta">' +
          (rating !== '—' ? '<div class="mv-hero-rating">★ ' + rating + '</div>' : '') +
          (year ? '<div class="mv-hero-year">' + year + '</div>' : '') +
        '</div>' +
        '<div class="mv-hero-actions">' +
          '<button class="mv-hero-btn mv-hero-btn-primary" onclick="event.stopPropagation();srOpenDetails(' + series.id + ')">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>التفاصيل</button>' +
          '<button class="mv-hero-btn mv-hero-btn-icon' + (isFav ? ' active' : '') + '" onclick="event.stopPropagation();srToggleFavFromUI(' + series.id + ', this)">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function buildSeriesRow(title, iconKey, key, seriesList) {
  const icon = MV_ICONS[iconKey] || '';
  let html = '<div class="mv-section" data-section-key="' + key + '">';
  html += '<div class="mv-section-header"><div class="mv-section-title">' + icon + '<span>' + title + '</span></div><button class="mv-section-see-all" onclick="srShowAll(\'' + key + '\')">عرض الكل</button></div>';
  html += '<div class="mv-row">';
  seriesList.forEach(function (s) { html += buildSeriesCard(s); });
  html += '</div></div>';
  return html;
}

function buildSeriesCard(series) {
  const poster = series.poster || '';
  const title = series.title || series.name;
  const year = series.year || '';
  const rating = series.rating ? series.rating.toFixed(1) : '';
  const isFav = srIsFav(series.id);

  return (
    '<div class="mv-card" data-series-id="' + series.id + '" onclick="srOpenDetails(' + series.id + ')">' +
      '<div class="mv-card-poster">' +
        '<div class="mv-card-placeholder">' + getIcon('tv') + '</div>' +
        (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy" onload="this.classList.add(\'loaded\')" onerror="this.style.display=\'none\'">' : '') +
        (rating ? '<div class="mv-card-rating"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + rating + '</div>' : '') +
        (year ? '<div class="mv-card-year">' + year + '</div>' : '') +
        '<button class="mv-card-fav' + (isFav ? ' active' : '') + '" onclick="event.stopPropagation();srToggleFavFromUI(' + series.id + ', this)">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="mv-card-title">' + title + '</div>' +
    '</div>'
  );
}

function bindSeriesPageEvents() {
  const heroTrack = document.getElementById('srHeroTrack');
  const heroDots = document.getElementById('srHeroDots');

  if (heroTrack) {
    heroTrack.addEventListener('scroll', function () {
      const idx = Math.round(heroTrack.scrollLeft / heroTrack.clientWidth);
      if (idx !== _srHeroCurrentIndex) {
        _srHeroCurrentIndex = idx;
        document.querySelectorAll('#seriesFullPage .mv-hero-dot').forEach(function (d, i) { d.classList.toggle('active', i === idx); });
        document.querySelectorAll('#seriesFullPage .mv-hero-slide').forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      }
    }, { passive: true });
  }

  if (heroDots) {
    heroDots.addEventListener('click', function (e) {
      const dot = e.target.closest('.mv-hero-dot');
      if (!dot || !heroTrack) return;
      const idx = parseInt(dot.dataset.index, 10);
      heroTrack.scrollTo({ left: idx * heroTrack.clientWidth, behavior: 'smooth' });
    });
  }

  if (_srHeroSlideInterval) clearInterval(_srHeroSlideInterval);
  _srHeroSlideInterval = setInterval(function () {
    if (!heroTrack || document.hidden) return;
    if (!document.getElementById('srHeroTrack')) { clearInterval(_srHeroSlideInterval); return; }
    const next = (_srHeroCurrentIndex + 1) % Math.max(_srHeroItems.length, 1);
    heroTrack.scrollTo({ left: next * heroTrack.clientWidth, behavior: 'smooth' });
  }, 6000);

  const searchInput = document.getElementById('srSearchInput');
  const searchClear = document.getElementById('srSearchClear');
  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener('input', function () {
      const q = this.value.trim();
      if (searchClear) searchClear.classList.toggle('show', q.length > 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () { srPerformSearch(q); }, 250);
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      this.classList.remove('show');
      srPerformSearch('');
    });
  }
}

function srPerformSearch(query) {
  const rowsContainer = document.getElementById('srRowsContainer');
  const searchResults = document.getElementById('srSearchResults');
  if (!rowsContainer || !searchResults) return;

  if (!query || query.trim().length < 2) {
    rowsContainer.style.display = '';
    searchResults.style.display = 'none';
    // ✅ [جديد] إعادة تفعيل Auto-Scroll
    activateSeriesRowsAutoScroll();
    return;
  }

  // ✅ [جديد] إيقاف Auto-Scroll أثناء البحث
  _srRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _srRowAutoScrollIntervals = [];

  rowsContainer.style.display = 'none';
  searchResults.style.display = 'block';

  let results = [];
  if (typeof SeriesAPI !== 'undefined') {
    results = SeriesAPI.search(_srAllSeries, query, 60);
  }

  if (results.length === 0) {
    searchResults.innerHTML = '<div class="mv-empty"><div class="mv-empty-icon">' + getIcon('search') + '</div><div class="mv-empty-title">لا نتائج</div></div>';
    return;
  }

  let html = '<div class="mv-section"><div class="mv-section-header"><div class="mv-section-title">' + MV_ICONS.search + '<span>نتائج البحث (' + results.length + ')</span></div></div><div class="mv-grid">';
  results.forEach(function (s) { html += buildSeriesCard(s); });
  html += '</div></div>';
  searchResults.innerHTML = html;
}

function srShowAll(key) {
  const rowsContainer = document.getElementById('srRowsContainer');
  const searchResults = document.getElementById('srSearchResults');
  if (!rowsContainer) return;

  if (searchResults) searchResults.style.display = 'none';
  rowsContainer.style.display = '';

  const groups = typeof SeriesAPI !== 'undefined' ? SeriesAPI.getFeaturedGroups(_srAllSeries) : {};
  let list = [];
  let title = '';
  let iconKey = 'tv';

  const mapping = {
    ramadan: { data: groups.ramadan, title: 'رمضان 2026', icon: 'calendar' },
    top50: { data: groups.top50, title: 'أفضل 50', icon: 'star' },
    netflix: { data: groups.netflix, title: 'Netflix', icon: 'tv' },
    shahid: { data: groups.shahid, title: 'Shahid', icon: 'tv' },
    amazon: { data: groups.amazon, title: 'Amazon', icon: 'tv' },
    hbo: { data: groups.hbo, title: 'HBO', icon: 'tv' },
    apple: { data: groups.apple, title: 'Apple TV+', icon: 'tv' },
    disney: { data: groups.disney, title: 'Disney+', icon: 'tv' },
    hulu: { data: groups.hulu, title: 'Hulu', icon: 'tv' },
    turkish: { data: groups.turkish, title: 'تركي', icon: 'theater' },
    anime: { data: groups.anime, title: 'أنمي', icon: 'anime' },
    asian: { data: groups.asian, title: 'آسيوي', icon: 'film' },
    indian: { data: groups.indian, title: 'هندي', icon: 'film' },
    documentary: { data: groups.documentary, title: 'وثائقي', icon: 'info' },
    kids: { data: groups.kids, title: 'أطفال', icon: 'play' },
    tvshows: { data: groups.tv, title: 'برامج ومسابقات', icon: 'newspaper' },
    gulf: { data: groups.gulf, title: 'خليجي', icon: 'film' },
    egypt: { data: groups.egypt, title: 'مصري', icon: 'film' },
    syria: { data: groups.syria, title: 'سوري', icon: 'film' },
    lebanon: { data: groups.lebanon, title: 'لبناني', icon: 'film' },
    morocco: { data: groups.morocco, title: 'المغرب وتونس', icon: 'film' },
    jordan: { data: groups.jordan, title: 'أردني', icon: 'film' },
    history: { data: groups.history, title: 'بدوي وتاريخي', icon: 'film' }
  };

  const item = mapping[key];
  if (item) { list = item.data || []; title = item.title; iconKey = item.icon; }

  const icon = MV_ICONS[iconKey] || '';
  let html = '<div class="mv-section"><div class="mv-section-header"><button onclick="renderSeriesPage()" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">' + getIcon('chevronRight') + '</button><div class="mv-section-title" style="flex:1;text-align:right;">' + icon + '<span>' + title + ' (' + list.length + ')</span></div></div><div class="mv-grid">';
  list.forEach(function (s) { html += buildSeriesCard(s); });
  html += '</div></div>';
  rowsContainer.innerHTML = html;

  const body = document.getElementById('srpBody');
  if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   8. تفاصيل المسلسل + الحلقات
   ================================================================ */
async function srOpenDetails(seriesId) {
  const series = _srAllSeries.find(function (s) { return s.id === seriesId; });
  if (!series) return;

  _srDetailsCurrentSeries = series;
  _srCurrentInfo = null;
  _srCurrentSeason = null;

  let page = document.getElementById('srDetailsPage');
  if (!page) {
    page = document.createElement('div');
    page.id = 'srDetailsPage';
    page.className = 'mv-details-page';
    document.body.appendChild(page);
  }

  const poster = series.poster || '';
  const title = series.title || series.name;
  const year = series.year || '';
  const rating = series.rating ? series.rating.toFixed(1) : '—';
  const isFav = srIsFav(series.id);

  page.innerHTML =
    '<div class="mv-backdrop-wrap">' +
      (poster ? '<img class="mv-backdrop-img" src="' + poster + '" alt="">' : '') +
      '<div class="mv-backdrop-overlay"></div>' +
      '<button class="mv-details-back" onclick="srCloseDetails()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
    '</div>' +
    '<div class="mv-details-content">' +
      '<div class="mv-details-header">' +
        (poster ? '<img class="mv-details-poster" src="' + poster + '" onerror="this.style.display=\'none\'">' : '') +
        '<div class="mv-details-info">' +
          '<div class="mv-details-title">' + title + '</div>' +
          '<div class="mv-details-meta">' +
            (rating !== '—' ? '<div class="mv-chip mv-chip-rating">★ ' + rating + '</div>' : '') +
            (year ? '<div class="mv-chip mv-chip-year">' + year + '</div>' : '') +
            '<div class="mv-chip mv-chip-cat">' + (series.categoryName || 'مسلسل') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mv-details-actions">' +
        '<button class="mv-action-btn mv-action-fav' + (isFav ? ' active' : '') + '" onclick="srToggleFavFromUI(' + series.id + ', this, true)" style="flex:1">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" style="width:22px;height:22px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' + (isFav ? 'إزالة' : 'أضف') +
        '</button>' +
      '</div>' +
      (series.plot ? '<div class="mv-details-section"><div class="mv-details-section-title">القصة</div><div class="mv-details-overview">' + series.plot + '</div></div>' : '') +
      (series.cast ? '<div class="mv-details-section"><div class="mv-details-section-title">الممثلون</div><div class="mv-details-overview">' + series.cast + '</div></div>' : '') +
      '<div id="srEpisodesContainer" class="mv-details-section">' +
        '<div class="mv-details-section-title">الحلقات</div>' +
        '<div style="text-align:center;padding:30px;color:rgba(255,255,255,0.5);"><div class="mv-loader-spinner" style="width:30px;height:30px;margin:0 auto 12px;border-width:3px;"></div><div style="font-size:12px;">جارٍ تحميل الحلقات...</div></div>' +
      '</div>' +
    '</div>';

  page.classList.add('show');
  document.body.style.overflow = 'hidden';

  try {
    if (typeof SeriesAPI !== 'undefined') {
      const info = await SeriesAPI.getSeriesInfo(series.id);
      _srCurrentInfo = info;
      renderEpisodes(info, series);
    }
  } catch (e) {
    document.getElementById('srEpisodesContainer').innerHTML =
      '<div class="mv-details-section-title">الحلقات</div><div style="text-align:center;padding:20px;color:#e53935;">فشل تحميل الحلقات</div>';
  }
}

function renderEpisodes(info, series) {
  const container = document.getElementById('srEpisodesContainer');
  if (!container) return;

  if (!info || !info.seasons || info.seasons.length === 0) {
    container.innerHTML = '<div class="mv-details-section-title">الحلقات</div><div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">لا توجد حلقات</div>';
    return;
  }

  const firstSeason = info.seasons[0];
  _srCurrentSeason = firstSeason;

  let html = '<div class="mv-details-section-title">الحلقات</div>';

  if (info.seasons.length > 1) {
    html += '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:12px;margin-bottom:12px;scrollbar-width:none;">';
    info.seasons.forEach(function (seasonNum, idx) {
      const isActive = idx === 0;
      html += '<button class="mv-season-chip' + (isActive ? ' active' : '') + '" onclick="srSelectSeason(\'' + seasonNum + '\', this)" data-season="' + seasonNum + '" style="flex-shrink:0;padding:8px 16px;background:' + (isActive ? 'linear-gradient(135deg,#e53935,#c62828)' : 'rgba(255,255,255,0.05)') + ';border:1px solid ' + (isActive ? '#e53935' : 'rgba(255,255,255,0.1)') + ';border-radius:20px;color:#fff;font-size:12.5px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;">الموسم ' + seasonNum + '</button>';
    });
    html += '</div>';
  }

  html += '<div id="srEpisodesList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;">';
  const episodes = info.episodes[firstSeason] || [];
  html += buildEpisodesHTML(episodes, firstSeason, series.id);
  html += '</div>';

  container.innerHTML = html;
}

function buildEpisodesHTML(episodes, season, seriesId) {
  if (!episodes || episodes.length === 0) {
    return '<div style="grid-column:1/-1;text-align:center;padding:20px;color:rgba(255,255,255,0.5);">لا توجد حلقات</div>';
  }

  let html = '';
  episodes.forEach(function (ep) {
    const epNum = ep.episode_num || ep.id;
    const epTitle = ep.title || ('الحلقة ' + epNum);
    const ext = ep.container_extension || 'mp4';
    const epId = ep.id || 0;

    html +=
      '<button class="mv-episode-btn" onclick="srPlayEpisode(' + epId + ', \'' + ext + '\', ' + seriesId + ', ' + season + ', ' + epNum + ')" style="display:flex;align-items:center;gap:10px;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;color:#fff;font-family:inherit;cursor:pointer;text-align:right;">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#e53935,#c62828);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#fff"><polygon points="6 3 20 12 6 21 6 3"/></svg>' +
        '</div>' +
        '<div style="flex:1;overflow:hidden;">' +
          '<div style="font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + epTitle + '</div>' +
          '<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">الحلقة ' + epNum + '</div>' +
        '</div>' +
      '</button>';
  });
  return html;
}

function srSelectSeason(seasonNum, btn) {
  document.querySelectorAll('.mv-season-chip').forEach(function (b) {
    b.classList.remove('active');
    b.style.background = 'rgba(255,255,255,0.05)';
    b.style.borderColor = 'rgba(255,255,255,0.1)';
  });
  btn.classList.add('active');
  btn.style.background = 'linear-gradient(135deg,#e53935,#c62828)';
  btn.style.borderColor = '#e53935';

  _srCurrentSeason = seasonNum;

  const series = _srDetailsCurrentSeries;
  if (!series || !_srCurrentInfo) return;

  const episodes = _srCurrentInfo.episodes[seasonNum] || [];
  const listContainer = document.getElementById('srEpisodesList');
  if (listContainer) {
    listContainer.innerHTML = buildEpisodesHTML(episodes, seasonNum, series.id);
  }
}

/* ================================================================
   9. ▶️ تشغيل حلقة
   ================================================================ */
async function srPlayEpisode(episodeId, ext, seriesId, season, episode) {
  if (typeof Sound !== 'undefined' && Sound.tap) Sound.tap();
  if (navigator.vibrate) navigator.vibrate(15);

  const series = _srAllSeries.find(function (s) { return s.id === seriesId; });
  if (!series) return;

  if (typeof showToast === 'function') showToast('جارٍ تجهيز البث...', 'info');

  let streamUrl = '';
  try {
    if (typeof SeriesAPI !== 'undefined') {
      streamUrl = await SeriesAPI.buildStreamUrl(episodeId, ext || 'mp4');
    }
  } catch (e) {
    console.error('❌ فشل Token:', e);
  }

  if (!streamUrl) {
    if (typeof showToast === 'function') showToast('فشل رابط البث', 'error');
    return;
  }

  const title = (series.title || series.name) + ' — S' + season + 'E' + episode;

  srCloseDetails();

  openH90Player({
    url: streamUrl,
    title: title,
    poster: series.poster || '',
    isLive: false
  });
}

/* ================================================================
   10. شاشة الترفيه
   ================================================================ */
function renderEntertainmentScreen() {
  const grid = document.getElementById('channelsGrid');
  if (!grid) return;

  const header = (typeof renderScreenHeader === 'function')
    ? renderScreenHeader('الترفيه', 'اختر ما تريد مشاهدته', 'backToMainTab()')
    : '';

  const seriesCard =
    '<div class="ent-card" onclick="openEntertainmentSub(\'series\')" style="--ent-accent: #00e5ff; --ent-accent2: #0091ea; --ent-glow: rgba(0,229,255,0.35);">' +
      '<div class="ent-card-icon"><div style="width:36px;height:36px;">' + getIcon('tv') + '</div></div>' +
      '<div class="ent-card-content"><div class="ent-card-title">المسلسلات</div><div class="ent-card-desc">أحدث المسلسلات العربية والأجنبية</div></div>' +
      '<div class="ent-card-arrow">' + getIcon('chevronLeft') + '</div>' +
    '</div>';

  const moviesCard =
    '<div class="ent-card" onclick="openEntertainmentSub(\'movies\')" style="--ent-accent: #ffb300; --ent-accent2: #ff8f00; --ent-glow: rgba(255,179,0,0.35);">' +
      '<div class="ent-card-icon"><div style="width:36px;height:36px;">' + getIcon('monitor') + '</div></div>' +
      '<div class="ent-card-content"><div class="ent-card-title">الأفلام</div><div class="ent-card-desc">أحدث الأفلام بجودات متعددة</div></div>' +
      '<div class="ent-card-arrow">' + getIcon('chevronLeft') + '</div>' +
    '</div>';

  grid.innerHTML = header + seriesCard + moviesCard;
}

function openEntertainmentSub(type) {
  if (typeof Sound !== 'undefined' && Sound.tap) Sound.tap();
  if (type === 'movies') { renderMoviesPage(); return; }
  if (type === 'series') { renderSeriesPage(); return; }
}

function renderComingSoon(type) {
  const grid = document.getElementById('channelsGrid');
  if (!grid) return;
  const headerHtml = (typeof renderScreenHeader === 'function') ? renderScreenHeader('قريباً', '', 'backToMainTab()') : '';
  grid.innerHTML = headerHtml + '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:rgba(255,255,255,0.5);">قريباً</div>';
}

function renderSeriesScreen() { renderSeriesPage(); }
function renderMoviesScreen() { renderMoviesPage(); }

function backToEntertainment() {
  if (typeof Sound !== 'undefined' && Sound.close) Sound.close();
  if (typeof haptic === 'function') haptic(8);
  _currentRenderedTab = null;
  if (typeof switchTab === 'function') switchTab('entertainment');
}

/* ================================================================
   11. بناء صفحة الأفلام
   ================================================================ */
function buildMoviesPageHTML() {
  const movies = _mvAllMovies;
  const heroMovies = window.MoviesAPI.getNewReleases(movies, 5);
  _mvHeroItems = heroMovies;

  const trending = window.MoviesAPI.getTrending(movies, 15);
  const topRated = window.MoviesAPI.getTopRated(movies, 15);
  const recent = window.MoviesAPI.getRecentlyAdded(movies, 15);
  const newReleases = window.MoviesAPI.getNewReleases(movies, 15);
  const topImdbMovies = window.MoviesAPI.filterByCategory(movies, '122');
  const marvelMovies = window.MoviesAPI.filterByCategory(movies, '256');
  const dcMovies = window.MoviesAPI.filterByCategory(movies, '255');
  const actionMovies = window.MoviesAPI.filterByCategory(movies, '243');
  const horrorMovies = window.MoviesAPI.filterByCategory(movies, '241');
  const comedyMovies = window.MoviesAPI.filterByCategory(movies, '251');
  const dramaMovies = window.MoviesAPI.filterByCategory(movies, '242');
  const animeMovies = window.MoviesAPI.filterByCategory(movies, '213');

  let html = '';

  if (heroMovies.length > 0) {
    html += '<div class="mv-hero" id="mvHero"><div class="mv-hero-track" id="mvHeroTrack">';
    heroMovies.forEach(function (m, i) { html += buildHeroSlide(m, i); });
    html += '</div><div class="mv-hero-dots" id="mvHeroDots">';
    heroMovies.forEach(function (_, i) {
      html += '<div class="mv-hero-dot' + (i === 0 ? ' active' : '') + '" data-index="' + i + '"></div>';
    });
    html += '</div></div>';
  }

  html +=
    '<div class="mv-search-wrap">' +
      '<div class="mv-search-box">' +
        '<div class="mv-search-icon">' + getIcon('search') + '</div>' +
        '<input type="text" class="mv-search-input" id="mvSearchInput" placeholder="ابحث عن فيلم..." autocomplete="off">' +
        '<button class="mv-search-clear" id="mvSearchClear">' + getIcon('close') + '</button>' +
      '</div>' +
    '</div>';

  html +=
    '<div class="mv-cats-bar" id="mvCatsBar">' +
      '<button class="mv-cat-chip active" data-cat="">الكل</button>' +
      '<button class="mv-cat-chip" data-cat="254">2026</button>' +
      '<button class="mv-cat-chip" data-cat="98">2024-2026</button>' +
      '<button class="mv-cat-chip" data-cat="122">TOP IMDB</button>' +
      '<button class="mv-cat-chip" data-cat="256">Marvel</button>' +
      '<button class="mv-cat-chip" data-cat="255">DC</button>' +
      '<button class="mv-cat-chip" data-cat="243">Action</button>' +
      '<button class="mv-cat-chip" data-cat="241">Horror</button>' +
      '<button class="mv-cat-chip" data-cat="251">Comedy</button>' +
      '<button class="mv-cat-chip" data-cat="242">Drama</button>' +
      '<button class="mv-cat-chip" data-cat="213">Anime</button>' +
      '<button class="mv-cat-chip" data-cat="168">Arabic</button>' +
    '</div>';

  html += '<div id="mvRowsContainer">';
  if (trending.length > 0)      html += buildMoviesRow('رائج اليوم', 'fire', 'trending', trending);
  if (newReleases.length > 0)   html += buildMoviesRow('أُضيف حديثاً', 'new', 'new', newReleases);
  if (topRated.length > 0)      html += buildMoviesRow('الأعلى تقييماً', 'star', 'top', topRated);
  if (topImdbMovies.length > 0) html += buildMoviesRow('TOP IMDB', 'target', 'topimdb', topImdbMovies.slice(0, 15));
  if (marvelMovies.length > 0)  html += buildMoviesRow('Marvel', 'lightning', 'marvel', marvelMovies.slice(0, 15));
  if (dcMovies.length > 0)      html += buildMoviesRow('DC', 'shield', 'dc', dcMovies.slice(0, 15));
  if (horrorMovies.length > 0)  html += buildMoviesRow('رعب', 'ghost', 'horror', horrorMovies.slice(0, 15));
  if (comedyMovies.length > 0)  html += buildMoviesRow('كوميديا', 'laugh', 'comedy', comedyMovies.slice(0, 15));
  if (actionMovies.length > 0)  html += buildMoviesRow('أكشن', 'explosion', 'action', actionMovies.slice(0, 15));
  if (dramaMovies.length > 0)   html += buildMoviesRow('دراما', 'theater', 'drama', dramaMovies.slice(0, 15));
  if (animeMovies.length > 0)   html += buildMoviesRow('أنيمي', 'anime', 'anime', animeMovies.slice(0, 15));
  if (recent.length > 0)        html += buildMoviesRow('آخر الإضافات', 'clock', 'recent', recent);
  html += '</div>';

  html += '<div id="mvSearchResults" style="display:none;"></div>';
  return html;
}

function buildHeroSlide(movie, index) {
  const poster = movie.poster || '';
  const title = movie.title || movie.name;
  const year = movie.year || '';
  const rating = movie.rating ? movie.rating.toFixed(1) : '—';
  const isFav = mvIsFav(movie.id);

  return (
    '<div class="mv-hero-slide' + (index === 0 ? ' active' : '') + '" data-index="' + index + '">' +
      (poster ? '<img class="mv-hero-bg" src="' + poster + '" alt="" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
      '<div class="mv-hero-overlay"></div>' +
      '<div class="mv-hero-content">' +
        (poster ? '<img class="mv-hero-poster" src="' + poster + '" alt="' + title + '" loading="lazy" onerror="this.style.display=\'none\'">' : '') +
        '<div class="mv-hero-title">' + title + '</div>' +
        '<div class="mv-hero-meta">' +
          (rating !== '—' ? '<div class="mv-hero-rating">★ ' + rating + '</div>' : '') +
          (year ? '<div class="mv-hero-year">' + year + '</div>' : '') +
        '</div>' +
        '<div class="mv-hero-actions">' +
          '<button class="mv-hero-btn mv-hero-btn-primary" onclick="event.stopPropagation();mvPlayMovie(' + movie.id + ')">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>شاهد الآن</button>' +
          '<button class="mv-hero-btn mv-hero-btn-icon' + (isFav ? ' active' : '') + '" onclick="event.stopPropagation();mvToggleFavFromUI(' + movie.id + ', this)">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function buildMoviesRow(title, iconKey, key, movies) {
  const icon = MV_ICONS[iconKey] || '';
  let html = '<div class="mv-section" data-section-key="' + key + '">';
  html += '<div class="mv-section-header"><div class="mv-section-title">' + icon + '<span>' + title + '</span></div><button class="mv-section-see-all" onclick="mvShowAll(\'' + key + '\')">عرض الكل</button></div>';
  html += '<div class="mv-row">';
  movies.forEach(function (m) { html += buildMovieCard(m); });
  html += '</div></div>';
  return html;
}

function buildMovieCard(movie) {
  const poster = movie.poster || '';
  const title = movie.title || movie.name;
  const year = movie.year || '';
  const rating = movie.rating ? movie.rating.toFixed(1) : '';
  const isFav = mvIsFav(movie.id);

  return (
    '<div class="mv-card" data-movie-id="' + movie.id + '" onclick="mvOpenDetails(' + movie.id + ')">' +
      '<div class="mv-card-poster">' +
        '<div class="mv-card-placeholder">' + getIcon('film') + '</div>' +
        (poster ? '<img src="' + poster + '" alt="' + title + '" loading="lazy" onload="this.classList.add(\'loaded\')" onerror="this.style.display=\'none\'">' : '') +
        (rating ? '<div class="mv-card-rating"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + rating + '</div>' : '') +
        (year ? '<div class="mv-card-year">' + year + '</div>' : '') +
        '<button class="mv-card-fav' + (isFav ? ' active' : '') + '" onclick="event.stopPropagation();mvToggleFavFromUI(' + movie.id + ', this)">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="mv-card-title">' + title + '</div>' +
    '</div>'
  );
}

function bindMoviesPageEvents() {
  const heroTrack = document.getElementById('mvHeroTrack');
  const heroDots = document.getElementById('mvHeroDots');

  if (heroTrack) {
    heroTrack.addEventListener('scroll', function () {
      const idx = Math.round(heroTrack.scrollLeft / heroTrack.clientWidth);
      if (idx !== _mvHeroCurrentIndex) {
        _mvHeroCurrentIndex = idx;
        document.querySelectorAll('#moviesFullPage .mv-hero-dot').forEach(function (d, i) { d.classList.toggle('active', i === idx); });
        document.querySelectorAll('#moviesFullPage .mv-hero-slide').forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      }
    }, { passive: true });
  }

  if (heroDots) {
    heroDots.addEventListener('click', function (e) {
      const dot = e.target.closest('.mv-hero-dot');
      if (!dot || !heroTrack) return;
      const idx = parseInt(dot.dataset.index, 10);
      heroTrack.scrollTo({ left: idx * heroTrack.clientWidth, behavior: 'smooth' });
    });
  }

  if (_mvHeroSlideInterval) clearInterval(_mvHeroSlideInterval);
  _mvHeroSlideInterval = setInterval(function () {
    if (!heroTrack || document.hidden) return;
    if (!document.getElementById('mvHeroTrack')) { clearInterval(_mvHeroSlideInterval); return; }
    const next = (_mvHeroCurrentIndex + 1) % Math.max(_mvHeroItems.length, 1);
    heroTrack.scrollTo({ left: next * heroTrack.clientWidth, behavior: 'smooth' });
  }, 6000);

  const searchInput = document.getElementById('mvSearchInput');
  const searchClear = document.getElementById('mvSearchClear');
  if (searchInput) {
    let debounceTimer = null;
    searchInput.addEventListener('input', function () {
      const q = this.value.trim();
      if (searchClear) searchClear.classList.toggle('show', q.length > 0);
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () { mvPerformSearch(q); }, 250);
    });
  }
  if (searchClear) {
    searchClear.addEventListener('click', function () {
      if (searchInput) searchInput.value = '';
      this.classList.remove('show');
      mvPerformSearch('');
    });
  }

  const catsBar = document.getElementById('mvCatsBar');
  if (catsBar) {
    catsBar.addEventListener('click', function (e) {
      const chip = e.target.closest('.mv-cat-chip');
      if (!chip) return;
      document.querySelectorAll('#moviesFullPage .mv-cat-chip').forEach(function (c) { c.classList.toggle('active', c === chip); });
      mvFilterByCategory(chip.dataset.cat);
    });
  }
}

function mvPerformSearch(query) {
  const rowsContainer = document.getElementById('mvRowsContainer');
  const searchResults = document.getElementById('mvSearchResults');
  if (!rowsContainer || !searchResults) return;

  if (!query || query.trim().length < 2) {
    rowsContainer.style.display = '';
    searchResults.style.display = 'none';
    // ✅ [جديد] إعادة تفعيل Auto-Scroll
    activateMoviesRowsAutoScroll();
    return;
  }

  // ✅ [جديد] إيقاف Auto-Scroll أثناء البحث
  _mvRowAutoScrollIntervals.forEach(function (id) { clearInterval(id); });
  _mvRowAutoScrollIntervals = [];

  rowsContainer.style.display = 'none';
  searchResults.style.display = 'block';

  const results = window.MoviesAPI.search(_mvAllMovies, query, 60);

  if (results.length === 0) {
    searchResults.innerHTML = '<div class="mv-empty"><div class="mv-empty-icon">' + getIcon('search') + '</div><div class="mv-empty-title">لا نتائج</div></div>';
    return;
  }

  let html = '<div class="mv-section"><div class="mv-section-header"><div class="mv-section-title">' + MV_ICONS.search + '<span>نتائج البحث (' + results.length + ')</span></div></div><div class="mv-grid">';
  results.forEach(function (m) { html += buildMovieCard(m); });
  html += '</div></div>';
  searchResults.innerHTML = html;
}

function mvFilterByCategory(catId) {
  const rowsContainer = document.getElementById('mvRowsContainer');
  const searchResults = document.getElementById('mvSearchResults');
  if (!rowsContainer) return;

  if (searchResults) searchResults.style.display = 'none';
  rowsContainer.style.display = '';

  if (!catId) {
    const body = document.getElementById('mfpBody');
    if (body) {
      body.innerHTML = buildMoviesPageHTML();
      bindMoviesPageEvents();
      activateMoviesRowsAutoScroll();
    }
    return;
  }

  const filtered = window.MoviesAPI.filterByCategory(_mvAllMovies, catId);
  const catName = window.MoviesAPI.CATEGORIES[catId] ? window.MoviesAPI.CATEGORIES[catId].name : 'أفلام';

  if (filtered.length === 0) {
    rowsContainer.innerHTML = '<div class="mv-empty"><div class="mv-empty-icon">' + getIcon('film') + '</div><div class="mv-empty-title">لا توجد أفلام</div></div>';
    return;
  }

  filtered.sort(function (a, b) { return b.rating - a.rating; });

  let html = '<div class="mv-section"><div class="mv-section-header"><button onclick="mvFilterByCategory(\'\')" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">' + getIcon('chevronRight') + '</button><div class="mv-section-title" style="flex:1;text-align:right;"><span>' + catName + ' (' + filtered.length + ')</span></div></div><div class="mv-grid">';
  filtered.slice(0, 60).forEach(function (m) { html += buildMovieCard(m); });
  html += '</div></div>';
  rowsContainer.innerHTML = html;

  // ✅ [جديد] تفعيل Auto-Scroll إذا كان الصف الوحيد
  activateMoviesRowsAutoScroll();
}

function mvShowAll(key) {
  const rowsContainer = document.getElementById('mvRowsContainer');
  const searchResults = document.getElementById('mvSearchResults');
  if (!rowsContainer) return;

  if (searchResults) searchResults.style.display = 'none';
  rowsContainer.style.display = '';

  let movies = [];
  let title = '';
  let iconKey = 'fire';

  switch (key) {
    case 'trending': movies = window.MoviesAPI.getTrending(_mvAllMovies, 100); title = 'رائج اليوم'; iconKey = 'fire'; break;
    case 'new': movies = window.MoviesAPI.getNewReleases(_mvAllMovies, 100); title = 'أُضيف حديثاً'; iconKey = 'new'; break;
    case 'top': movies = window.MoviesAPI.getTopRated(_mvAllMovies, 100); title = 'الأعلى تقييماً'; iconKey = 'star'; break;
    case 'topimdb': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '122').slice(0, 100); title = 'TOP IMDB'; iconKey = 'target'; break;
    case 'marvel': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '256').slice(0, 100); title = 'Marvel'; iconKey = 'lightning'; break;
    case 'dc': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '255').slice(0, 100); title = 'DC'; iconKey = 'shield'; break;
    case 'horror': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '241').slice(0, 100); title = 'رعب'; iconKey = 'ghost'; break;
    case 'comedy': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '251').slice(0, 100); title = 'كوميديا'; iconKey = 'laugh'; break;
    case 'action': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '243').slice(0, 100); title = 'أكشن'; iconKey = 'explosion'; break;
    case 'drama': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '242').slice(0, 100); title = 'دراما'; iconKey = 'theater'; break;
    case 'anime': movies = window.MoviesAPI.filterByCategory(_mvAllMovies, '213').slice(0, 100); title = 'أنيمي'; iconKey = 'anime'; break;
    case 'recent': movies = window.MoviesAPI.getRecentlyAdded(_mvAllMovies, 100); title = 'آخر الإضافات'; iconKey = 'clock'; break;
  }

  const icon = MV_ICONS[iconKey] || '';
  let html = '<div class="mv-section"><div class="mv-section-header"><button onclick="mvFilterByCategory(\'\')" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">' + getIcon('chevronRight') + '</button><div class="mv-section-title" style="flex:1;text-align:right;">' + icon + '<span>' + title + ' (' + movies.length + ')</span></div></div><div class="mv-grid">';
  movies.forEach(function (m) { html += buildMovieCard(m); });
  html += '</div></div>';
  rowsContainer.innerHTML = html;

  const body = document.getElementById('mfpBody');
  if (body) body.scrollTo({ top: 0, behavior: 'smooth' });
}

function mvOpenDetails(movieId) {
  const movie = _mvAllMovies.find(function (m) { return m.id === movieId; });
  if (!movie) return;

  _mvDetailsCurrentMovie = movie;

  let page = document.getElementById('mvDetailsPage');
  if (!page) {
    page = document.createElement('div');
    page.id = 'mvDetailsPage';
    page.className = 'mv-details-page';
    document.body.appendChild(page);
  }

  const poster = movie.poster || '';
  const title = movie.title || movie.name;
  const year = movie.year || '';
  const rating = movie.rating ? movie.rating.toFixed(1) : '—';
  const isFav = mvIsFav(movie.id);

  page.innerHTML =
    '<div class="mv-backdrop-wrap">' +
      (poster ? '<img class="mv-backdrop-img" src="' + poster + '" alt="">' : '') +
      '<div class="mv-backdrop-overlay"></div>' +
      '<button class="mv-details-back" onclick="mvCloseDetails()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>' +
    '</div>' +
    '<div class="mv-details-content">' +
      '<div class="mv-details-header">' +
        (poster ? '<img class="mv-details-poster" src="' + poster + '" onerror="this.style.display=\'none\'">' : '') +
        '<div class="mv-details-info">' +
          '<div class="mv-details-title">' + title + '</div>' +
          '<div class="mv-details-meta">' +
            (rating !== '—' ? '<div class="mv-chip mv-chip-rating">★ ' + rating + '</div>' : '') +
            (year ? '<div class="mv-chip mv-chip-year">' + year + '</div>' : '') +
            '<div class="mv-chip mv-chip-cat">' + (movie.categoryName || 'فيلم') + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="mv-details-actions">' +
        '<button class="mv-action-btn mv-action-play" onclick="mvPlayMovie(' + movie.id + ')">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>شاهد الآن</button>' +
        '<button class="mv-action-btn mv-action-fav' + (isFav ? ' active' : '') + '" onclick="mvToggleFavFromUI(' + movie.id + ', this, true)">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" style="width:22px;height:22px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>' +
      '</div>' +
      '<div class="mv-details-section">' +
        '<div class="mv-details-section-title">نظرة عامة</div>' +
        '<div class="mv-details-overview">فيلم ' + (movie.categoryName || '') + ' من إنتاج ' + (year || '') + '.</div>' +
      '</div>' +
    '</div>';

  page.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function mvCloseDetails() {
  const page = document.getElementById('mvDetailsPage');
  if (page) page.classList.remove('show');
  document.body.style.overflow = '';
}

function mvToggleFavFromUI(movieId, btn, isDetails) {
  mvToggleFav(movieId);
  const isFav = mvIsFav(movieId);
  if (btn) {
    btn.classList.toggle('active', isFav);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
  }
}

/* ================================================================
   12. ▶️ تشغيل الفيلم عبر H90 Player
   ================================================================ */
async function mvPlayMovie(movieId) {
  const movie = _mvAllMovies.find(function (m) { return m.id === movieId; });
  if (!movie) return;

  if (typeof Sound !== 'undefined' && Sound.tap) Sound.tap();
  if (navigator.vibrate) navigator.vibrate(15);

  if (typeof showToast === 'function') showToast('جارٍ تجهيز البث...', 'info');

  let streamUrl = '';
  try {
    if (window.MoviesAPI && typeof window.MoviesAPI.buildStreamUrl === 'function') {
      streamUrl = await window.MoviesAPI.buildStreamUrl(movie.id, movie.extension || 'mkv');
    }
  } catch (e) {
    console.error('❌ فشل Token:', e);
  }

  if (!streamUrl) {
    if (typeof showToast === 'function') showToast('فشل رابط البث', 'error');
    return;
  }

  console.log('🎬 رابط البث:', streamUrl.substring(0, 100));

  mvCloseDetails();

  openH90Player({
    url: streamUrl,
    title: movie.title || movie.name,
    poster: movie.poster || '',
    isLive: false
  });
}

/* ================================================================
   13. الإغلاق
   ================================================================ */
function srCloseDetails() {
  const page = document.getElementById('srDetailsPage');
  if (page) page.classList.remove('show');
  document.body.style.overflow = '';
}

function srToggleFavFromUI(seriesId, btn, isDetails) {
  srToggleFav(seriesId);
  const isFav = srIsFav(seriesId);
  if (btn) {
    btn.classList.toggle('active', isFav);
    const svg = btn.querySelector('svg');
    if (svg) svg.setAttribute('fill', isFav ? 'currentColor' : 'none');
  }
}

/* ================================================================
   14. التصدير
   ================================================================ */
window.renderEntertainmentScreen = renderEntertainmentScreen;
window.openEntertainmentSub = openEntertainmentSub;
window.renderComingSoon = renderComingSoon;
window.renderSeriesScreen = renderSeriesScreen;
window.renderMoviesScreen = renderMoviesScreen;
window.backToEntertainment = backToEntertainment;

window.renderMoviesPage = renderMoviesPage;
window.mvCloseMoviesPage = mvCloseMoviesPage;
window.mvRefreshMovies = mvRefreshMovies;
window.mvPlayMovie = mvPlayMovie;
window.mvOpenDetails = mvOpenDetails;
window.mvCloseDetails = mvCloseDetails;
window.mvToggleFavFromUI = mvToggleFavFromUI;
window.mvToggleFav = mvToggleFav;
window.mvShowAll = mvShowAll;
window.mvFilterByCategory = mvFilterByCategory;
window.mvPerformSearch = mvPerformSearch;

window.renderSeriesPage = renderSeriesPage;
window.srCloseSeriesPage = srCloseSeriesPage;
window.srRefreshSeries = srRefreshSeries;
window.srOpenDetails = srOpenDetails;
window.srCloseDetails = srCloseDetails;
window.srToggleFavFromUI = srToggleFavFromUI;
window.srToggleFav = srToggleFav;
window.srShowAll = srShowAll;
window.srPerformSearch = srPerformSearch;
window.srSelectSeason = srSelectSeason;
window.srPlayEpisode = srPlayEpisode;

window.openH90Player = openH90Player;

/* ✅ [جديد] تصدير دوال Auto-Scroll */
window.stopAllRowAutoScroll = stopAllRowAutoScroll;
window.activateMoviesRowsAutoScroll = activateMoviesRowsAutoScroll;
window.activateSeriesRowsAutoScroll = activateSeriesRowsAutoScroll;

mvLoadFavorites();
srLoadFavorites();

console.log('%c🎬 H90 — Entertainment Module v10.0 (Auto-Scroll + Deep Link) Loaded',
  'background:linear-gradient(135deg,#00e5ff,#ffb300);color:#fff;padding:5px 12px;border-radius:8px;font-weight:900;font-size:11px;');