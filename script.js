/* ================================================================
   H90 v25.9.5 — Core Script (APK Ready + Welcome Notifications)
   ✅ ربط كامل مع matches.js (تذكيرات المباريات)
   ✅ طلب إذن الإشعارات تلقائياً بعد شاشة الترحيب
   ✅ دعم Capacitor Push + LocalNotifications في APK
   ✅ إصلاح حفظ وقت التذكير (يستخدم saveMatchReminderTime)
   ✅ إصلاح toggleNotifSetting (يطلب الإذن لأي مفتاح إشعارات)
   ✅ إصلاح requestNotificationPermission (Notification API مباشر)
   ✅ إصلاح Stream Monitor للعمل في APK
   ✅ إصلاح الإشعارات المحلية للعمل في APK
   ✅ حماية شاملة من الأخطاء
   ✅ بدون تغيير أي وظائف أخرى
   ✅ قسم الترفيه مفصول إلى fun.js
   ✅ [جديد] فتح الأفلام والمسلسلات في تطبيق H90 Player الخارجي
   ✅ [جديد] إصلاح الأخطاء البرمجية (NOTIF_ASKED_AFTER_WELCOME_KEY)
   ✅ [جديد] توسيع قائمة الأسئلة الشائعة FAQ
   ================================================================ */

'use strict';

/* ================================================================
   0. 🎵 Sound Helper
   ================================================================ */
const SoundBridge = {
  tap()      { try { typeof H90Sounds !== 'undefined' && H90Sounds.tap      && H90Sounds.tap();      } catch (e) {} },
  nav()      { try { typeof H90Sounds !== 'undefined' && H90Sounds.nav      && H90Sounds.nav();      } catch (e) {} },
  open()     { try { typeof H90Sounds !== 'undefined' && H90Sounds.open     && H90Sounds.open();     } catch (e) {} },
  close()    { try { typeof H90Sounds !== 'undefined' && H90Sounds.close    && H90Sounds.close();    } catch (e) {} },
  favorite() { try { typeof H90Sounds !== 'undefined' && H90Sounds.favorite && H90Sounds.favorite(); } catch (e) {} },
  success()  { try { typeof H90Sounds !== 'undefined' && (H90Sounds.success ? H90Sounds.success() : (H90Sounds.tap && H90Sounds.tap())); } catch (e) {} },
  error()    { try { typeof H90Sounds !== 'undefined' && (H90Sounds.error   ? H90Sounds.error()   : (H90Sounds.tap && H90Sounds.tap())); } catch (e) {} },
  warning()  { try { typeof H90Sounds !== 'undefined' && (H90Sounds.warning ? H90Sounds.warning() : (H90Sounds.tap && H90Sounds.tap())); } catch (e) {} },
  toggle()   { try { typeof H90Sounds !== 'undefined' && (H90Sounds.toggle  ? H90Sounds.toggle()  : (H90Sounds.tap && H90Sounds.tap())); } catch (e) {} },
  add()      { try { typeof H90Sounds !== 'undefined' && (H90Sounds.add     ? H90Sounds.add()     : (H90Sounds.tap && H90Sounds.tap())); } catch (e) {} },
  remove()   { try { typeof H90Sounds !== 'undefined' && (H90Sounds.remove  ? H90Sounds.remove()  : (H90Sounds.tap && H90Sounds.tap())); } catch (e) {} },
  message()  { try { typeof H90Sounds !== 'undefined' && (H90Sounds.message ? H90Sounds.message() : (H90Sounds.tap && H90Sounds.tap())); } catch (e) {} }
};
window.SoundBridge = SoundBridge;

(function unlockAudioOnce() {
  const events = ['touchstart', 'touchend', 'mousedown', 'click', 'keydown'];
  const handler = () => {
    try {
      if (typeof H90Sounds !== 'undefined' && typeof H90Sounds.unlock === 'function') {
        H90Sounds.unlock();
      }
    } catch (e) {}
    events.forEach(evt => document.removeEventListener(evt, handler, true));
  };
  events.forEach(evt => document.addEventListener(evt, handler, true));
})();

/* ================================================================
   ✨ كشف بيئة APK
   ================================================================ */
const __H90_IS_APK__ = (function () {
  try {
    return !!(
      window.__H90_APK_MODE__ ||
      window.__H90_NATIVE_EARLY__ ||
      (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
      window.cordova ||
      location.protocol === 'file:'
    );
  } catch (e) { return false; }
})();

console.log('🔍 H90 Core — Environment:', __H90_IS_APK__ ? 'APK/Native' : 'Web');

/* ================================================================
   1. الحالة العامة
   ================================================================ */
let currentLang = 'ar';
let currentTab = 'channels';
let currentView = 'servers';
let currentServerId = null;
let currentGroupId = null;
let currentFilteredChannels = [];
let favorites = [];
let recentChannels = [];
let deferredPrompt = null;
let clockInterval = null;
let currentSubScreen = null;
let _currentRenderedTab = null;

const FAV_KEY = 'h90_favorites';
const RECENT_KEY = 'h90_recent';
const THEME_KEY = 'h90_theme';
const SETTINGS_KEY = 'h90_settings';
const NOTIF_SETTINGS_KEY = 'h90_notif_settings';
const SOUND_KEY = 'h90_notif_sound';
const MATCH_TIME_KEY = 'h90_match_reminder_time';
const NOTIF_API = 'https://h90-notfiy.dairalzor33.workers.dev';
const LAST_SEEN_NOTIF_KEY = 'h90_last_seen_notif';
const NOTIF_ASKED_AFTER_WELCOME_KEY = 'h90_notif_asked_after_welcome'; // ✅ تم تعريفه هنا

const DEFAULT_NOTIF_SETTINGS = {
  general: true, matches: true, breaking: false,
  newchannels: true, streamOffline: true, dnd: false
};

const SOUND_OPTIONS = [
  { id: 'default', name: 'افتراضي',   icon: 'bell' },
  { id: 'chime',   name: 'جرس ناعم',   icon: 'music' },
  { id: 'beep',    name: 'صفير قصير',  icon: 'megaphone' },
  { id: 'alert',   name: 'تنبيه قوي',  icon: 'alert' },
  { id: 'silent',  name: 'صامت',       icon: 'mute' }
];

const TIME_OPTIONS = [
  { id: 5,   label: '5 دقائق' },
  { id: 10,  label: '10 دقائق' },
  { id: 15,  label: '15 دقيقة' },
  { id: 30,  label: '30 دقيقة' },
  { id: 60,  label: 'ساعة واحدة' },
  { id: 120, label: 'ساعتان' }
];

/* ================================================================
   2. مكتبة أيقونات SVG
   ================================================================ */
const SVG_ICONS = {
  check:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  close:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  alert:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  info:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  star:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  starFilled: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  tv:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>',
  play:       '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>',
  monitor:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  layers:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
  chevronLeft:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  clock:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  bell:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  music:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  megaphone:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>',
  mute:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
  search:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  trash:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
  q4k:        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><text x="12" y="15" text-anchor="middle" font-size="7" fill="currentColor" stroke="none" font-weight="900">4K</text></svg>',
  diamond:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M12 21V9M6 3l6 6 6-6"/></svg>',
  lightning:  '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>',
  target:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  film:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>',
  shuffle:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
  refresh:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
  ball:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 7l3 2.5-1 3.5h-4l-1-3.5L12 7z"/><path d="M12 2v5M19.5 8.5L15 10.5M18 18l-3.5-2M6 18l3.5-2M4.5 8.5L9 10.5"/></svg>',
  calendar:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  theater:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20v6a5 5 0 0 1-5 5h-1v3h2a2 2 0 0 1 2 2v2H4v-2a2 2 0 0 1 2-2h2v-3H7a5 5 0 0 1-5-5V3z"/><circle cx="8" cy="7" r="1" fill="currentColor"/><circle cx="16" cy="7" r="1" fill="currentColor"/><path d="M9 11c1 1 5 1 6 0"/></svg>',
  newspaper:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V9"/><path d="M18 14h-8M18 18h-8M12 10h4M12 6h4"/></svg>',
  ticket:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z"/><line x1="13" y1="6" x2="13" y2="8"/><line x1="13" y1="11" x2="13" y2="13"/><line x1="13" y1="16" x2="13" y2="18"/></svg>',
  home:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
};

function getIcon(name) {
  return SVG_ICONS[name] || SVG_ICONS.info;
}

/* ================================================================
   3. الاهتزاز
   ================================================================ */
function haptic(pattern) {
  if (navigator.vibrate) {
    try { navigator.vibrate(pattern || 10); } catch (e) {}
  }
}

/* ================================================================
   ✨ طلب إذن الإشعارات الموحّد
   ================================================================ */
async function requestNotificationPermissionUnified() {
  console.log('🔔 [H90] طلب إذن الإشعارات...');

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    console.log('✅ [H90] الإذن ممنوح مسبقاً');
    showToast('✅ الإشعارات مفعّلة مسبقاً', 'success');
    updateNotifToggles();
    if (window.H90Firebase && typeof window.H90Firebase.register === 'function') {
      window.H90Firebase.register().catch(function () {});
    }
    return true;
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
    console.warn('⚠️ [H90] الإذن مرفوض مسبقاً');
    showToast('⚠️ الإشعارات مرفوضة — فعّلها من إعدادات المتصفح', 'warning');
    Sound.warning();
    return false;
  }

  if (__H90_IS_APK__ && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications) {
    try {
      var PushNotifications = window.Capacitor.Plugins.PushNotifications;
      var permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === 'granted') {
        console.log('✅ [H90] Capacitor Push permission granted');
        showToast('✅ تم تفعيل الإشعارات', 'success');
        Sound.success();
        haptic(15);
        updateNotifToggles();

        try { await PushNotifications.register(); } catch (e) {}

        try {
          window.dispatchEvent(new CustomEvent('h90:notifications:enabled'));
        } catch (e) {}

        return true;
      }
    } catch (e) {
      console.warn('⚠️ Capacitor Push permission failed:', e);
    }
  }

  if (typeof Notification === 'undefined') {
    showToast('⚠️ متصفحك لا يدعم الإشعارات', 'warning');
    return false;
  }

  var perm = 'default';
  try {
    console.log('📢 [H90] استدعاء Notification.requestPermission()...');
    perm = await Notification.requestPermission();
    console.log('📢 [H90] نتيجة الإذن:', perm);
  } catch (e) {
    console.error('❌ [H90] فشل طلب الإذن:', e);
    showToast('❌ فشل طلب الإذن', 'error');
    return false;
  }

  if (perm !== 'granted') {
    console.warn('⚠️ [H90] الإذن غير ممنوح:', perm);
    Sound.warning();
    return false;
  }

  console.log('✅ [H90] تم منح الإذن');
  showToast('✅ تم تفعيل الإشعارات', 'success');
  Sound.success();
  haptic(15);
  updateNotifToggles();

  try {
    if (window.H90Firebase && typeof window.H90Firebase.register === 'function') {
      window.H90Firebase.register().catch(function (e) {
        console.warn('Firebase register failed:', e);
      });
    }
  } catch (e) {
    console.warn('Post-permission registration failed:', e);
  }

  try {
    window.dispatchEvent(new CustomEvent('h90:notifications:enabled'));
  } catch (e) {}

  return true;
}

/* ================================================================
   ✨ فحص إذا كانت الإشعارات مفعّلة
   ================================================================ */
function areNotificationsEnabled() {
  if (__H90_IS_APK__ && window.H90Firebase && typeof window.H90Firebase.hasCapacitorPush === 'function') {
    if (window.H90Firebase.hasCapacitorPush()) {
      var status = window.H90Firebase.getStatus ? window.H90Firebase.getStatus() : {};
      if (status.hasNativeToken || status.hasToken) return true;
    }
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    return true;
  }
  return false;
}

/* ================================================================
   ✨ طلب الإذن تلقائياً بعد شاشة الترحيب
   ================================================================ */
async function askNotificationAfterWelcome() {
  try {
    if (localStorage.getItem(NOTIF_ASKED_AFTER_WELCOME_KEY) === 'true') {
      console.log('ℹ️ [H90] تم سؤال المستخدم سابقاً بعد الترحيب');
      return false;
    }
  } catch (e) {}

  if (areNotificationsEnabled()) {
    console.log('✅ [H90] الإذن ممنوح مسبقاً');
    try { localStorage.setItem(NOTIF_ASKED_AFTER_WELCOME_KEY, 'true'); } catch (e) {}
    return true;
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
    console.log('⚠️ [H90] الإذن مرفوض مسبقاً');
    try { localStorage.setItem(NOTIF_ASKED_AFTER_WELCOME_KEY, 'true'); } catch (e) {}
    return false;
  }

  await new Promise(function (r) { setTimeout(r, 800); });

  console.log('🔔 [H90] طلب الإذن بعد شاشة الترحيب...');
  var granted = await requestNotificationPermissionUnified();

  try { localStorage.setItem(NOTIF_ASKED_AFTER_WELCOME_KEY, 'true'); } catch (e) {}

  return granted;
}

/* ================================================================
   4. التهيئة الأولية
   ================================================================ */
document.addEventListener('DOMContentLoaded', async function () {
  console.log('%c🚀 H90 v25.9.5 — Core Ready (Welcome Notifications)', 'color:#ff2d55;font-weight:900;font-size:14px');

  setTimeout(function () {
    console.log('%c🔔 حالة الإشعارات:', 'color:#00e5ff;font-weight:900;font-size:13px');
    console.log('  - Notification API:', typeof Notification !== 'undefined' ? 'مدعوم' : 'غير مدعوم');
    console.log('  - الإذن الحالي:', typeof Notification !== 'undefined' ? Notification.permission : 'N/A');
    console.log('  - H90Firebase جاهز:', !!(window.H90Firebase && window.H90Firebase.isReady && window.H90Firebase.isReady()));
    console.log('  - Capacitor Push:', !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications));
    console.log('  - Local Notifications:', !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications));
    console.log('  - areNotificationsEnabled:', areNotificationsEnabled());
    console.log('  - سُئل بعد الترحيب سابقاً:', localStorage.getItem(NOTIF_ASKED_AFTER_WELCOME_KEY) === 'true');
  }, 2000);

  window.addEventListener('h90:welcome:closed', function () {
    console.log('👋 [H90] شاشة الترحيب أُغلقت — محاولة طلب الإذن');
    setTimeout(function () {
      askNotificationAfterWelcome();
    }, 700);
  });

  var welcomeCheckInterval = setInterval(function () {
    try {
      if (localStorage.getItem('h90_welcome_seen_v1') === 'true') {
        clearInterval(welcomeCheckInterval);
        setTimeout(function () {
          askNotificationAfterWelcome();
        }, 1200);
      }
    } catch (e) {}
  }, 1000);

  setTimeout(function () { clearInterval(welcomeCheckInterval); }, 180000);

  loadFavorites();
  loadRecent();
  loadTheme();

  if (typeof loadM3UFromWorker === 'function') {
    try { await loadM3UFromWorker(); }
    catch (e) { console.error('❌ فشل تحميل القنوات:', e); }
  }

  setTimeout(function () {
    try {
      renderServers();
      renderThemeGrid();
    } catch (e) { console.warn('render initial fail:', e); }
  }, 100);

  document.querySelectorAll('.nav-item').forEach(function (item) {
    if (item.dataset.bound === '1') return;
    item.dataset.bound = '1';
    item.addEventListener('click', function () {
      var tab = item.dataset.tab;
      if (tab) switchTab(tab);
    });
  });

  if (window.PlayerEngine && typeof window.PlayerEngine.init === 'function') {
    setTimeout(function () {
      try { window.PlayerEngine.init(); } catch (e) {}
    }, 500);
  }

  updateNotifToggles();
  initDNDState();

  if (typeof window.updateTeamsCountLabel === 'function') {
    setTimeout(window.updateTeamsCountLabel, 500);
  }

  setTimeout(function () {
    if (typeof window.startMatchReminders === 'function' && areNotificationsEnabled()) {
      window.startMatchReminders();
    } else if (!areNotificationsEnabled()) {
      console.log('ℹ️ تذكيرات المباريات في الانتظار — في انتظار إذن الإشعارات');
    }
  }, 3000);

  setTimeout(checkNewH90Notifications, 3000);

  setTimeout(bindSoundEvents, 300);
});

/* ================================================================
   4.1 bindSoundEvents
   ================================================================ */
function bindSoundEvents() {
  if (typeof H90Sounds === 'undefined') {
    console.warn('⚠️ sounds.js not loaded — sound bindings skipped');
    return;
  }

  document.querySelectorAll('.header-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { Sound.tap(); }, { passive: true });
  });

  document.addEventListener('click', function (e) {
    var card = e.target.closest('.channel-card, .channel-item, .server-card, .group-card, .ent-card');
    if (card) Sound.open();
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var favBtn = e.target.closest('.channel-fav');
    if (favBtn) Sound.favorite();
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var pcBtn = e.target.closest('.pc-btn');
    if (pcBtn && !pcBtn.classList.contains('pc-play')) Sound.tap();
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var pill = e.target.closest('.quality-pill');
    if (pill) Sound.tap();
  }, { passive: true });

  document.querySelectorAll('#drawer > div[onclick]').forEach(function (item) {
    item.addEventListener('click', function () { Sound.tap(); }, { passive: true });
  });

  document.querySelectorAll('.lang-option').forEach(function (btn) {
    btn.addEventListener('click', function () { Sound.tap(); }, { passive: true });
  });

  console.log('🔊 Sound bindings attached');
}

/* ================================================================
   5. switchTab
   ================================================================ */
function switchTab(tab) {
  if (_currentRenderedTab === tab && tab !== 'channels' && tab !== 'settings' && tab !== 'matches' && tab !== 'entertainment') {
    return;
  }

  _currentRenderedTab = tab;
  currentTab = tab;

  if (tab !== 'series' && tab !== 'movies' && tab !== 'news' && tab !== 'entertainment' && clockInterval) {
    clearInterval(clockInterval);
    clockInterval = null;
  }

  document.querySelectorAll('.nav-item').forEach(function (item) {
    item.classList.toggle('active', item.dataset.tab === tab);
  });

  var categoriesBar = document.getElementById('categoriesBar');
  var heroBanner = document.getElementById('heroBanner');
  var pageContent = document.getElementById('pageContent');
  var matchesTabContent = document.getElementById('matchesTabContent');

  if (categoriesBar) categoriesBar.style.display = 'none';
  if (heroBanner) heroBanner.style.display = 'none';
  if (pageContent) pageContent.style.display = 'block';
  if (matchesTabContent) matchesTabContent.style.display = 'none';

  currentSubScreen = null;

  try {
    if (tab === 'channels') {
      currentView = 'servers';
      currentServerId = null;
      currentGroupId = null;
      renderServers();
    } else if (tab === 'matches') {
      currentView = 'matches-menu';
      currentServerId = null;
      currentGroupId = null;
      renderMatchesScreen();
    } else if (tab === 'entertainment') {
      currentView = 'entertainment-menu';
      currentServerId = null;
      currentGroupId = null;
      if (typeof window.renderEntertainmentScreen === 'function') {
        window.renderEntertainmentScreen();
      }
    } else if (tab === 'series') {
      currentView = 'coming-soon';
      currentSubScreen = 'series';
      if (typeof window.renderSeriesScreen === 'function') {
        window.renderSeriesScreen();
      }
     } else if (tab === 'movies') {
      currentView = 'coming-soon';
      currentSubScreen = 'movies';
      if (typeof window.renderMoviesPage === 'function') {
        window.renderMoviesPage();
      }
    } else if (tab === 'news') {
      currentView = 'coming-soon';
      currentSubScreen = 'news';
      renderNewsScreen();
    } else if (tab === 'schedule') {
      currentView = 'matches';
      currentSubScreen = 'schedule';
      if (typeof window.renderMatches === 'function') {
        window.renderMatches();
      }
    } else if (tab === 'favorites') {
      currentView = 'favorites';
      currentServerId = null;
      currentGroupId = null;
      renderFavorites();
    } else if (tab === 'recent') {
      currentView = 'recent';
      currentServerId = null;
      currentGroupId = null;
      renderRecent();
    } else if (tab === 'rooms') {
      currentView = 'rooms';
      if (typeof openRoomsScreen === 'function') {
        openRoomsScreen();
      }
    } else if (tab === 'settings') {
      openSettings();
    }
  } catch (e) {
    console.error('❌ switchTab error:', e);
  }

  Sound.nav();
  haptic(10);
}

/* ================================================================
   6. renderScreenHeader
   ================================================================ */
function renderScreenHeader(title, subtitle, backFunction) {
  var backFn = backFunction || 'backToMainTab()';
  return (
    '<div class="screen-header">' +
      '<button onclick="' + backFn + '" class="screen-header-back" aria-label="رجوع">' +
        '<div style="width:20px;height:20px;">' + getIcon('chevronRight') + '</div>' +
      '</button>' +
      '<div class="screen-header-title">' +
        '<div class="screen-header-title-main">' + title + '</div>' +
        (subtitle ? '<div class="screen-header-title-sub">' + subtitle + '</div>' : '') +
      '</div>' +
    '</div>'
  );
}

/* ================================================================
   8. renderMatchesScreen — شاشة المباريات
   ================================================================ */
function renderMatchesScreen() {
  try {
    var grid = document.getElementById('channelsGrid');
    if (!grid) return;

    var header = renderScreenHeader('المباريات', 'اختر ما تريد', 'backToMainTab()');

    var newsCard =
      '<div class="ent-card" onclick="openMatchesSub(\'news\')" style="--ent-accent: #ff2d55; --ent-accent2: #e6003d; --ent-glow: rgba(255,45,85,0.35);">' +
        '<div class="ent-card-icon"><div style="width:36px;height:36px;">' + getIcon('newspaper') + '</div></div>' +
        '<div class="ent-card-content">' +
          '<div class="ent-card-title">أخبار المباريات</div>' +
          '<div class="ent-card-desc">آخر الأخبار والتحليلات الرياضية</div>' +
        '</div>' +
        '<div class="ent-card-arrow">' + getIcon('chevronLeft') + '</div>' +
      '</div>';

    var scheduleCard =
      '<div class="ent-card" onclick="openMatchesSub(\'schedule\')" style="--ent-accent: #00e676; --ent-accent2: #00b248; --ent-glow: rgba(0,230,118,0.35);">' +
        '<div class="ent-card-icon"><div style="width:36px;height:36px;">' + getIcon('calendar') + '</div></div>' +
        '<div class="ent-card-content">' +
          '<div class="ent-card-title">مواعيد المباريات</div>' +
          '<div class="ent-card-desc">مباريات اليوم والأسبوع القادم</div>' +
        '</div>' +
        '<div class="ent-card-arrow">' + getIcon('chevronLeft') + '</div>' +
      '</div>';

    grid.innerHTML = header + newsCard + scheduleCard;
  } catch (e) {
    console.error('❌ renderMatchesScreen:', e);
  }
}

/* ================================================================
   8.1 openMatchesSub
   ================================================================ */
function openMatchesSub(type) {
  Sound.tap();
  if (type === 'news') {
    _currentRenderedTab = null;
    switchTab('news');
  } else if (type === 'schedule') {
    _currentRenderedTab = null;
    switchTab('schedule');
  }
}

/* ================================================================
   9. backToMainTab
   ================================================================ */
function backToMainTab() {
  Sound.close();
  haptic(8);
  _currentRenderedTab = null;

  if (currentView === 'coming-soon' && currentSubScreen) {
    if (currentSubScreen === 'series' || currentSubScreen === 'movies') {
      if (typeof window.backToEntertainment === 'function') {
        window.backToEntertainment();
      } else {
        switchTab('entertainment');
      }
      return;
    }
    if (currentSubScreen === 'news') {
      switchTab('matches');
      return;
    }
  }

  if (currentView === 'matches' && currentSubScreen === 'schedule') {
    switchTab('matches');
    return;
  }

  switchTab('channels');
}

/* ================================================================
   10.1 renderNewsScreen
   ================================================================ */
function renderNewsScreen() {
  if (typeof window.renderComingSoon === 'function') {
    window.renderComingSoon('news');
  }
}

/* ================================================================
   10.2 backToMatches
   ================================================================ */
function backToMatches() {
  Sound.close();
  haptic(8);
  _currentRenderedTab = null;
  switchTab('matches');
}

/* ================================================================
   11. renderEmptyState + hexToRgb
   ================================================================ */
function renderEmptyState(iconName, title, desc) {
  return (
    '<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px 24px;text-align:center;">' +
      '<div style="position:relative;width:96px;height:96px;border-radius:28px;background:rgba(255,45,85,0.08);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;margin-bottom:22px;">' +
        '<div style="position:relative;z-index:1;width:44px;height:44px;color:#ff2d55;">' + getIcon(iconName) + '</div>' +
      '</div>' +
      '<div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:8px;letter-spacing:-0.3px;">' + title + '</div>' +
      (desc ? '<div style="font-size:13px;color:rgba(255,255,255,0.55);line-height:1.7;max-width:320px;font-weight:500;">' + desc + '</div>' : '') +
    '</div>'
  );
}

function hexToRgb(hex) {
  var h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
  var n = parseInt(h, 16);
  return ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255);
}

/* ================================================================
   12. renderServers
   ================================================================ */
function renderServers() {
  var grid = document.getElementById('channelsGrid');
  if (!grid) return;

  var server1 = {
    id: 'server1', name: 'Server 1', desc: 'يتطلب تطبيق VLC', badge: 'مشغل خارجي',
    accent: '#ffb300', accent2: '#ff8f00', icon: 'monitor', badgeIcon: 'alert'
  };
  var server2 = {
    id: 'server2', name: 'Server 2', desc: 'مشغل داخلي', badge: 'بدون تطبيقات خارجية',
    accent: '#00e676', accent2: '#00b248', icon: 'play', badgeIcon: 'check'
  };

  var html =
    '<div style="grid-column:1/-1;padding:16px 4px 12px;text-align:right;">' +
      '<div style="font-size:22px;font-weight:900;color:#fff;margin-bottom:6px;letter-spacing:-0.5px;">اختر السيرفر</div>' +
      '<div style="font-size:13px;color:rgba(255,255,255,0.55);font-weight:500;">سيرفران متاحان للمشاهدة</div>' +
    '</div>' +
    buildServerCard(server1) +
    buildServerCard(server2);

  grid.innerHTML = html;

  grid.querySelectorAll('.server-card').forEach(function (card) {
    card.addEventListener('click', function () { openServer(card.dataset.serverId); });
  });
}

function buildServerCard(server) {
  return (
    '<div class="server-card" data-server-id="' + server.id + '" ' +
         'style="grid-column:1/-1;position:relative;background:rgba(255,255,255,0.03);border:1.5px solid rgba(' + hexToRgb(server.accent) + ',0.35);border-radius:22px;padding:22px;cursor:pointer;margin-bottom:12px;overflow:hidden;transition:transform 0.2s;box-shadow:0 4px 16px rgba(' + hexToRgb(server.accent) + ',0.15);">' +
      '<div style="position:absolute;top:-50%;right:-20%;width:240px;height:240px;background:radial-gradient(circle,rgba(' + hexToRgb(server.accent) + ',0.35),transparent 65%);filter:blur(30px);pointer-events:none;"></div>' +
      '<div style="position:relative;z-index:1;display:flex;align-items:center;gap:16px;">' +
        '<div style="width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,' + server.accent + ',' + server.accent2 + ');display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;">' +
          '<div style="width:36px;height:36px;">' + getIcon(server.icon) + '</div>' +
        '</div>' +
        '<div style="flex:1;text-align:right;">' +
          '<div style="font-size:19px;font-weight:900;color:#fff;margin-bottom:4px;letter-spacing:-0.3px;">' + server.name + '</div>' +
          '<div style="font-size:13px;color:rgba(255,255,255,0.65);margin-bottom:10px;font-weight:500;">' + server.desc + '</div>' +
          '<div style="display:inline-flex;align-items:center;gap:6px;background:rgba(' + hexToRgb(server.accent) + ',0.15);border:1px solid rgba(' + hexToRgb(server.accent) + ',0.4);color:' + server.accent + ';padding:5px 12px;border-radius:20px;font-size:11px;font-weight:800;">' +
            '<div style="width:12px;height:12px;">' + getIcon(server.badgeIcon) + '</div>' +
            '<span>' + server.badge + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="width:24px;height:24px;color:' + server.accent + ';flex-shrink:0;">' + getIcon('chevronLeft') + '</div>' +
      '</div>' +
    '</div>'
  );
}

/* ================================================================
   13. openServer + renderServerGroups
   ================================================================ */
function openServer(serverId) {
  currentServerId = serverId;
  currentView = 'groups';
  renderServerGroups(serverId);
  Sound.open();
  haptic(10);
}

function renderServerGroups(serverId) {
  var grid = document.getElementById('channelsGrid');
  if (!grid) return;

  var server = (typeof SERVERS !== 'undefined') ? SERVERS[serverId] : null;
  if (!server) {
    grid.innerHTML = renderEmptyState('alert', 'السيرفر غير موجود', 'حاول مرة أخرى أو اختر سيرفر آخر.');
    return;
  }

  var allGroups = (typeof getAllGroups === 'function') ? getAllGroups() : [];

  var groups = allGroups.filter(function (g) {
    if (!g.channels || g.channels.length === 0) return false;
    if (g.server) return g.server === serverId;
    var firstCh = (typeof getChannelById === 'function') ? getChannelById(g.channels[0]) : null;
    return firstCh && firstCh.server === serverId;
  });

  console.log('📺 renderServerGroups:', serverId, '→', groups.length, 'باقة');

  if (groups.length === 0) {
    grid.innerHTML = renderEmptyState('tv', 'لا توجد باقات', 'لم يتم العثور على باقات في هذا السيرفر.');
    return;
  }

  var accent = serverId === 'server1' ? '#ffb300' : '#00e676';
  var accent2 = serverId === 'server1' ? '#ff8f00' : '#00b248';

  var headerHtml =
    '<div class="group-header" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;padding:12px 4px;margin-bottom:8px;">' +
      '<button onclick="backToServers()" class="group-back-btn" aria-label="رجوع" style="width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-family:inherit;padding:0;">' +
        '<div style="width:20px;height:20px;">' + getIcon('chevronRight') + '</div>' +
      '</button>' +
      '<div style="flex:1;text-align:right;">' +
        '<div style="font-size:19px;font-weight:900;color:#fff;letter-spacing:-0.3px;">' + server.name + '</div>' +
        '<div style="font-size:12px;color:' + accent + ';margin-top:3px;font-weight:700;">' + server.description + '</div>' +
      '</div>' +
      '<div style="display:inline-flex;align-items:center;gap:5px;background:rgba(' + hexToRgb(accent) + ',0.15);border:1px solid rgba(' + hexToRgb(accent) + ',0.35);color:' + accent + ';padding:5px 10px;border-radius:20px;font-size:11px;font-weight:800;">' +
        '<span>' + groups.length + '</span><span style="opacity:0.7;">باقات</span>' +
      '</div>' +
    '</div>';

  var groupsHtml = '';
  groups.forEach(function (group) {
    var coverImg = (typeof getGroupCoverImage === 'function') ? getGroupCoverImage(group) : '';
    var channelCount = group.channels.length;
    var coverHtml = coverImg
      ? '<img src="' + coverImg + '" alt="' + group.name_ar + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="logo-placeholder" style="display:none;">' + getIcon('layers') + '</div>'
      : '<div class="logo-placeholder">' + getIcon('layers') + '</div>';

    groupsHtml +=
      '<div class="channel-card group-card" data-group-id="' + group.id + '">' +
        '<div class="channel-logo">' + coverHtml +
          '<span class="status-badge" style="background:linear-gradient(135deg,' + accent + ',' + accent2 + ');">' + channelCount + '</span>' +
        '</div>' +
        '<div class="channel-name">' + group.name_ar + '</div>' +
        '<div class="channel-servers">' +
          '<div style="width:10px;height:10px;display:inline-flex;">' + getIcon('tv') + '</div>' +
          '<span>' + channelCount + ' قنوات</span>' +
        '</div>' +
      '</div>';
  });

  grid.innerHTML = headerHtml + groupsHtml;

  grid.querySelectorAll('.group-card').forEach(function (card) {
    card.addEventListener('click', function () { openGroup(card.dataset.groupId); });
  });
}

function backToServers() {
  currentServerId = null;
  currentView = 'servers';
  renderServers();
  Sound.close();
  haptic(8);
}

/* ================================================================
   14. openGroup + renderGroupChannels
   ================================================================ */
function openGroup(groupId) {
  var group = (typeof getGroupById === 'function') ? getGroupById(groupId) : null;
  if (!group) return;
  currentGroupId = groupId;
  currentView = 'channels';
  renderGroupChannels(group);
  Sound.open();
  haptic(10);
}

function renderGroupChannels(group) {
  var grid = document.getElementById('channelsGrid');
  if (!grid) return;

  var channels = (typeof getChannelsByGroup === 'function') ? getChannelsByGroup(group.id) : [];
  var server = (typeof SERVERS !== 'undefined') ? SERVERS[currentServerId] : null;
  var accent = currentServerId === 'server1' ? '#ffb300' : '#00e676';
  var accent2 = currentServerId === 'server1' ? '#ff8f00' : '#00b248';

  if (channels.length === 0) {
    grid.innerHTML = renderEmptyState('tv', 'لا توجد قنوات', 'هذه الباقة فارغة حالياً.');
    return;
  }

  var headerHtml =
    '<div class="group-header" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;padding:12px 4px;margin-bottom:8px;">' +
      '<button onclick="backToServerGroups()" class="group-back-btn" aria-label="رجوع" style="width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-family:inherit;padding:0;">' +
        '<div style="width:20px;height:20px;">' + getIcon('chevronRight') + '</div>' +
      '</button>' +
      '<div style="flex:1;text-align:right;">' +
        '<div style="font-size:16px;font-weight:800;color:#fff;">' + group.name_ar + '</div>' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:3px;">' +
          channels.length + ' قنوات · <span style="color:' + accent + ';font-weight:800;">' + (server ? server.name : '') + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';

  var channelsHtml = '';
  channels.forEach(function (ch) {
    var isFav = favorites.indexOf(ch.id) > -1;
    var name = ch.name_ar;
    var logoHtml = ch.logo
      ? '<img src="' + ch.logo + '" alt="' + name + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="logo-placeholder" style="display:none;">' + (ch.letter || getIcon('tv')) + '</div>'
      : '<div class="logo-placeholder">' + (ch.letter || getIcon('tv')) + '</div>';

    var serverUrls = 0;
    if (typeof getChannelUrls === 'function') {
      serverUrls = getChannelUrls(ch, ch.server || currentServerId).length;
    }
    if (serverUrls === 0 && ch.qualities && ch.qualities.length) serverUrls = ch.qualities.length;

    var favIcon = isFav ? getIcon('starFilled') : getIcon('star');

    channelsHtml +=
      '<div class="channel-card" data-channel-id="' + ch.id + '">' +
        '<button class="channel-fav ' + (isFav ? 'active' : '') + '" data-fav-id="' + ch.id + '" aria-label="مفضلة">' + favIcon + '</button>' +
        '<div class="channel-logo">' + logoHtml +
          '<span class="status-badge" style="background:linear-gradient(135deg,' + accent + ',' + accent2 + ');">LIVE</span>' +
        '</div>' +
        '<div class="channel-name">' + name + '</div>' +
        '<div class="channel-servers">' +
          '<div style="width:10px;height:10px;display:inline-flex;">' + getIcon('layers') + '</div>' +
          '<span>' + (serverUrls || 1) + ' روابط</span>' +
        '</div>' +
      '</div>';
  });

  grid.innerHTML = headerHtml + channelsHtml;

  grid.querySelectorAll('.channel-card[data-channel-id]').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.channel-fav')) return;
      openChannel(card.dataset.channelId);
    });
  });

  grid.querySelectorAll('.channel-fav').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFavorite(btn.dataset.favId);
      setTimeout(function () {
        var g = (typeof getGroupById === 'function') ? getGroupById(currentGroupId) : null;
        if (g) renderGroupChannels(g);
      }, 50);
    });
  });
}

function backToServerGroups() {
  currentGroupId = null;
  currentView = 'groups';
  renderServerGroups(currentServerId);
  Sound.close();
  haptic(8);
}

/* ================================================================
   15. openChannel
   ================================================================ */
function openChannel(channelId) {
  var channel = (typeof getChannelById === 'function') ? getChannelById(channelId) : null;
  if (!channel) return;

  var serverId = currentServerId || channel.server || 'server1';

  console.log('🎯 openChannel:', channelId, '— serverId:', serverId, '— currentServerId:', currentServerId);

  Sound.tap();

  if (serverId === 'server1') {
    // ✅ Server 1: فتح VLC الخارجي
    var qualities = (channel.qualities || []).map(function(q) { return q.label || q; });
    if (qualities.length > 1) showQualityPickerForVLC(channel, qualities);
    else openInVLCExternal(channel, 0);
    return;
  }

  if (serverId === 'server2') {
    // ✅ Server 2: فتح تطبيق H90 Player الخارجي
    openExternalPlayer(channel);
    return;
  }
}

/* ================================================================
   ✨ [جديد] openExternalPlayer — فتح تطبيق H90 Player الخارجي
   ================================================================ */
async function openExternalPlayer(channel) {
  console.log('🚀 [H90] محاولة فتح تطبيق المشغل الخارجي للقناة:', channel.name_ar);
  showToast('جارٍ تجهيز البث...', 'info');
  haptic(15);

  // 1. احصل على رابط البث
  if (typeof requestStreamUrl !== 'function') {
    showToast('خطأ: Proxy غير متاح', 'error');
    Sound.error();
    return;
  }

  var quality = (channel.qualities && channel.qualities.length > 0)
    ? (channel.qualities[0].label || channel.qualities[0])
    : 'HD';

  var streamData = await requestStreamUrl(channel.id, quality);

  if (!streamData || !streamData.url) {
    showToast('فشل الحصول على رابط البث', 'error');
    Sound.error();
    return;
  }

  var streamUrl = streamData.url;
  console.log('✅ [H90] رابط البث جاهز:', streamUrl);

  // 2. جهّز الرابط الذي سيفتح التطبيق الثاني
  //    h90player://play?url=<VIDEO_URL>&name=<CHANNEL_NAME>
  var targetUrl = 'h90player://play?url=' + encodeURIComponent(streamUrl) + '&name=' + encodeURIComponent(channel.name_ar);

  // 3. استخدم AppLauncher لفتح التطبيق
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher) {
    var AppLauncher = window.Capacitor.Plugins.AppLauncher;
    try {
      await AppLauncher.openUrl({ url: targetUrl });
      console.log('✅ [H90] تم إرسال الأمر لتطبيق المشغل');
      addToRecent(channel.id);
      Sound.success();
      haptic(20);
    } catch (e) {
      console.error('❌ [H90] فشل فتح التطبيق:', e);
      showToast('⚠️ تطبيق H90 Player غير مثبت على جهازك', 'warning');
      Sound.error();
    }
  } else {
    // ✅ Fallback: فتح الرابط مباشرة (يعمل في المتصفح)
    console.log('ℹ️ [H90] AppLauncher غير متاح — فتح الرابط مباشرة');
    try {
      window.location.href = targetUrl;
      addToRecent(channel.id);
    } catch (e) {
      console.error('❌ فشل فتح الرابط:', e);
      showToast('⚠️ لا يمكن فتح المشغل', 'error');
    }
  }
}

/* ================================================================
   16. showQualityPickerForVLC
   ================================================================ */
function showQualityPickerForVLC(channel, qualities) {
  var old = document.getElementById('qualityPickerModal');
  if (old) old.remove();

  var accent = '#ffb300';
  var accent2 = '#ff8f00';

  var modal = document.createElement('div');
  modal.id = 'qualityPickerModal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;';

  var buttons = '';
  qualities.forEach(function (q, i) {
    var qLabel = q.label || q;
    var iconName = getQualityIconName(qLabel);
    var desc = getQualityDesc(qLabel);

    buttons +=
      '<button class="quality-choice-btn" data-index="' + i + '" style="display:flex;align-items:center;gap:14px;width:100%;padding:14px 16px;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.08);border-radius:16px;color:#fff;font-family:inherit;cursor:pointer;margin-bottom:10px;text-align:right;">' +
        '<div style="width:46px;height:46px;border-radius:14px;background:rgba(' + hexToRgb(accent) + ',0.15);border:1px solid rgba(' + hexToRgb(accent) + ',0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:' + accent + ';">' +
          '<div style="width:24px;height:24px;">' + getIcon(iconName) + '</div>' +
        '</div>' +
        '<div style="flex:1;text-align:right;">' +
          '<div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:3px;">' + qLabel + '</div>' +
          '<div style="font-size:11px;color:rgba(255,255,255,0.55);font-weight:500;">' + desc + '</div>' +
        '</div>' +
        '<div style="width:18px;height:18px;color:rgba(255,255,255,0.3);flex-shrink:0;">' + getIcon('chevronLeft') + '</div>' +
      '</button>';
  });

  modal.innerHTML =
    '<div style="background:rgba(30,30,40,0.98);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:24px;max-width:420px;width:100%;max-height:85vh;overflow-y:auto;">' +
      '<div style="text-align:center;margin-bottom:22px;">' +
        '<div style="width:68px;height:68px;background:linear-gradient(135deg,' + accent + ',' + accent2 + ');border-radius:20px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:#fff;">' +
          '<div style="width:34px;height:34px;">' + getIcon('monitor') + '</div>' +
        '</div>' +
        '<div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:5px;">' + channel.name_ar + '</div>' +
        '<div style="font-size:12px;color:rgba(255,255,255,0.55);font-weight:500;">اختر الجودة — سيتم فتح VLC</div>' +
      '</div>' +
      '<div>' + buttons + '</div>' +
      '<button id="cancelQualityPicker" style="width:100%;padding:13px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;color:rgba(255,255,255,0.7);font-weight:700;font-family:inherit;cursor:pointer;font-size:13px;margin-top:8px;">إلغاء</button>' +
    '</div>';

  document.body.appendChild(modal);

  modal.querySelectorAll('.quality-choice-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var index = parseInt(btn.dataset.index);
      Sound.tap();
      modal.remove();
      openInVLCExternal(channel, index);
    });
  });

  document.getElementById('cancelQualityPicker').addEventListener('click', function () {
    Sound.close();
    modal.remove();
  });

  Sound.open();
  haptic(10);
}

function getQualityIconName(q) {
  var ql = String(q).toUpperCase();
  if (ql.includes('4K') || ql.includes('UHD')) return 'q4k';
  if (ql.includes('FHD')) return 'diamond';
  if (ql.includes('HEVC') || ql.includes('265')) return 'lightning';
  if (ql === 'HD') return 'target';
  if (ql === 'SD2') return 'film';
  if (ql === 'SD') return 'tv';
  if (ql.includes('LOW')) return 'shuffle';
  return 'film';
}

function getQualityDesc(q) {
  var ql = String(q).toUpperCase();
  if (ql.includes('4K') || ql.includes('UHD')) return 'جودة فائقة (4K)';
  if (ql.includes('FHD')) return 'جودة عالية (1080p)';
  if (ql.includes('HEVC') || ql.includes('265')) return 'H.265 (يحتاج VLC)';
  if (ql === 'HD') return 'جودة عالية (720p)';
  if (ql === 'SD2') return 'جودة متوسطة';
  if (ql === 'SD') return 'جودة عادية';
  if (ql.includes('LOW')) return 'جودة منخفضة';
  return 'جودة ' + q;
}

/* ================================================================
   17. openInVLCExternal
   ================================================================ */
async function openInVLCExternal(channel, qualityIndex) {
  var qualities = (channel.qualities || []).map(function(q) { return q.label || q; });
  var quality = qualities[qualityIndex || 0] || 'HD';

  console.log('🎬 طلب رابط للقناة:', channel.name_ar, '— الجودة:', quality);
  showToast('جارٍ تجهيز البث...', 'info');
  haptic(15);

  if (typeof requestStreamUrl !== 'function') {
    showToast('خطأ: Proxy غير متاح', 'error');
    Sound.error();
    return;
  }

  var streamData = await requestStreamUrl(channel.id, quality);

  if (!streamData || !streamData.url) {
    showToast('فشل الحصول على رابط البث', 'error');
    Sound.error();
    return;
  }

  addToRecent(channel.id);
  Sound.success();

  if (window.PlayerEngine && typeof window.PlayerEngine.openInVLC === 'function') {
    window.PlayerEngine.openInVLC(streamData.url);
  } else {
    window.location.href = streamData.url;
  }

  haptic(20);
}

/* ================================================================
   18. openPlayerDirect — ⚠️ لم يعد مستخدماً (تم استبداله بـ openExternalPlayer)
   ================================================================ */
// ملاحظة: تم تعطيل هذه الدالة لأنها تفتح المشغل الداخلي.
// تم استبدالها بـ openExternalPlayer التي تفتح التطبيق الخارجي.
// يمكنك حذفها أو تركها للرجوع إليها لاحقاً.
/*
function openPlayerDirect(channel, serverIndex, serverId) {
  // ... الكود القديم ...
}
*/

/* ================================================================
   19-23. المفضلة والسجل
   ================================================================ */
function renderFavorites() {
  var grid = document.getElementById('channelsGrid');
  if (!grid) return;

  var allChannels = (typeof getAllChannels === 'function') ? getAllChannels() : [];
  var favChannels = allChannels.filter(function (c) { return favorites.indexOf(c.id) > -1; });

  var header = renderScreenHeader('المفضلة', favChannels.length + ' قناة في المفضلة', 'backToMainTab()');

  if (favChannels.length === 0) {
    grid.innerHTML = header + renderEmptyState('star', 'لا توجد مفضلات', 'أضف قنواتك المفضلة بالضغط على نجمة البطاقة.');
    return;
  }

  renderChannelList(favChannels, header);
}

function renderRecent() {
  var grid = document.getElementById('channelsGrid');
  if (!grid) return;

  var allChannels = (typeof getAllChannels === 'function') ? getAllChannels() : [];
  var recentList = recentChannels.map(function (id) {
    return allChannels.find(function (c) { return c.id === id; });
  }).filter(Boolean);

  var header = renderScreenHeader('الأخيرة', recentList.length + ' قناة شوهدت مؤخراً', 'backToMainTab()');

  if (recentList.length === 0) {
    grid.innerHTML = header + renderEmptyState('clock', 'لا توجد سجلات', 'القنوات التي تشاهدها ستظهر هنا.');
    return;
  }

  renderChannelList(recentList, header);
}

function renderChannelList(channels, headerHtml) {
  var grid = document.getElementById('channelsGrid');
  if (!grid) return;

  var html = headerHtml || '';

  channels.forEach(function (ch) {
    var isFav = favorites.indexOf(ch.id) > -1;
    var logoHtml = ch.logo
      ? '<img src="' + ch.logo + '" alt="' + ch.name_ar + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"><div class="logo-placeholder" style="display:none;">' + (ch.letter || getIcon('tv')) + '</div>'
      : '<div class="logo-placeholder">' + (ch.letter || getIcon('tv')) + '</div>';

    var isExternal = ch.server === 'server1';
    var accent = isExternal ? '#ffb300' : '#00e676';
    var accent2 = isExternal ? '#ff8f00' : '#00b248';
    var badgeText = isExternal ? 'VLC' : 'LIVE';
    var favIcon = isFav ? getIcon('starFilled') : getIcon('star');

    html +=
      '<div class="channel-card" data-channel-id="' + ch.id + '">' +
        '<button class="channel-fav ' + (isFav ? 'active' : '') + '" data-fav-id="' + ch.id + '" aria-label="مفضلة">' + favIcon + '</button>' +
        '<div class="channel-logo">' + logoHtml +
          '<span class="status-badge" style="background:linear-gradient(135deg,' + accent + ',' + accent2 + ');">' + badgeText + '</span>' +
        '</div>' +
        '<div class="channel-name">' + ch.name_ar + '</div>' +
      '</div>';
  });
  grid.innerHTML = html;

  grid.querySelectorAll('.channel-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      if (e.target.closest('.channel-fav')) return;
      openChannel(card.dataset.channelId);
    });
  });

  grid.querySelectorAll('.channel-fav').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleFavorite(btn.dataset.favId);
      if (currentView === 'favorites') renderFavorites();
      else if (currentView === 'recent') renderRecent();
    });
  });
}

/* ================================================================
   20. closePlayer
   ================================================================ */
function closePlayer() {
  var playerPage = document.getElementById('playerPage');
  var video = document.getElementById('videoPlayer');
  if (video) { try { video.pause(); video.removeAttribute('src'); video.load(); } catch (e) {} }
  if (playerPage) { playerPage.classList.remove('show'); playerPage.style.display = 'none'; }
  document.body.classList.remove('player-open');
  stopStreamMonitor();
  Sound.close();

  if (currentGroupId) {
    var g = (typeof getGroupById === 'function') ? getGroupById(currentGroupId) : null;
    if (g) renderGroupChannels(g);
  }
}

/* ================================================================
   21. switchServer
   ================================================================ */
function switchServer(index) {
  if (!window.PlayerEngine) return;
  var ch = window.PlayerEngine.getCurrentChannel();
  if (!ch) return;
  var server = window.PlayerEngine.getCurrentServer();
  var qualities = window.PlayerEngine.getCurrentQualities();

  if (index < 0 || index >= qualities.length) { showToast('الجودة غير متاحة', 'warning'); return; }

  if (typeof updateQualityPillsUI === 'function') updateQualityPillsUI(index);

  var streamType = window.PlayerEngine.getStreamType();
  var hlsLevels = window.PlayerEngine.getHlsLevels();
  var canSwitchInternal = streamType === 'hls' && hlsLevels.length > 1 && hlsLevels.length === qualities.length;

  if (canSwitchInternal) window.PlayerEngine.setManualQuality(index);
  else {
    window.PlayerEngine.loadChannel(ch, index, server);
    showToast(qualities[index] || ('الرابط ' + (index + 1)), 'info');
  }
  Sound.tap();
  haptic(8);
}

function switchServerAuto() {
  if (!window.PlayerEngine) return;
  if (typeof window.PlayerEngine.setManualQuality === 'function') window.PlayerEngine.setManualQuality(-1);
  Sound.tap();
  haptic(8);
}

/* ================================================================
   22. Favorites
   ================================================================ */
function loadFavorites() {
  try { favorites = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); }
  catch (e) { favorites = []; }
}

function saveFavorites() {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch (e) {}
}

function toggleFavorite(id) {
  var idx = favorites.indexOf(id);
  if (idx > -1) {
    favorites.splice(idx, 1);
    showToast('تمت الإزالة من المفضلة', 'info');
    Sound.remove();
  } else {
    favorites.push(id);
    showToast('تمت الإضافة للمفضلة', 'success');
    Sound.favorite();
  }
  saveFavorites();
  haptic(12);
}

/* ================================================================
   23. Recent
   ================================================================ */
function loadRecent() {
  try { recentChannels = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); }
  catch (e) { recentChannels = []; }
}

function addToRecent(id) {
  recentChannels = recentChannels.filter(function (x) { return x !== id; });
  recentChannels.unshift(id);
  recentChannels = recentChannels.slice(0, 20);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(recentChannels)); } catch (e) {}
}

/* ================================================================
   24. Drawer
   ================================================================ */
function openDrawer() {
  var d = document.getElementById('drawer');
  var o = document.getElementById('drawerOverlay');
  if (d) d.classList.add('show');
  if (o) o.classList.add('show');
  Sound.open();
  haptic(8);
}

function closeDrawer() {
  var d = document.getElementById('drawer');
  var o = document.getElementById('drawerOverlay');
  var wasOpen = d && d.classList.contains('show');
  if (d) d.classList.remove('show');
  if (o) o.classList.remove('show');
  if (wasOpen) Sound.close();
}

/* ================================================================
   25-30. الثيمات والإعدادات والإشعارات
   ================================================================ */
function loadTheme() { applyTheme(localStorage.getItem(THEME_KEY) || 'crimson'); }

function applyTheme(theme) {
  if (theme === 'black') document.body.classList.add('theme-black');
  else document.body.classList.remove('theme-black');
}

function toggleTheme() {
  var isBlack = document.body.classList.toggle('theme-black');
  localStorage.setItem(THEME_KEY, isBlack ? 'black' : 'crimson');
  renderThemeGrid();
  closeDrawer();
  Sound.tap();
  haptic(10);
}

function renderThemeGrid() {
  var grid = document.getElementById('themeGrid');
  if (!grid) return;

  var current = localStorage.getItem(THEME_KEY) || 'crimson';
  if (current === 'red') current = 'crimson';

  var themes = [
    { id: 'crimson', name: 'أحمر نيون', color: '#ff2d55', bg: '#0a0a0f', icon: 'lightning' },
    { id: 'black',   name: 'أسود نقي',  color: '#ffffff', bg: '#000000', icon: 'diamond' }
  ];

  var html = '';
  themes.forEach(function (t) {
    var active = t.id === current;
    var borderStyle = active ? 'border-color:rgba(255,255,255,0.9);' : 'border-color:rgba(255,255,255,0.1);opacity:0.7;';

    html +=
      '<button onclick="setTheme(\'' + t.id + '\')" style="aspect-ratio:1.6;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;border:2.5px solid;background:linear-gradient(135deg,' + t.bg + ' 45%,' + t.color + ' 130%);color:#fff;font-weight:800;font-size:13px;font-family:inherit;position:relative;' + borderStyle + '">' +
        '<div style="width:28px;height:28px;color:' + t.color + ';margin-bottom:6px;">' + getIcon(t.icon) + '</div>' +
        '<div style="font-size:12px;letter-spacing:0.5px;">' + t.name + '</div>' +
        (active ? '<div style="position:absolute;top:8px;right:8px;width:20px;height:20px;background:' + t.color + ';border-radius:50%;display:flex;align-items:center;justify-content:center;color:#000;"><div style="width:12px;height:12px;">' + getIcon('check') + '</div></div>' : '') +
      '</button>';
  });

  grid.innerHTML = html;
}

function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  renderThemeGrid();
  showToast(theme === 'crimson' ? 'تم تطبيق الثيم الأحمر' : 'تم تطبيق الثيم الأسود', 'success');
  Sound.success();
  haptic(12);
}

function getNotifSettings() {
  try {
    return Object.assign({}, DEFAULT_NOTIF_SETTINGS, JSON.parse(localStorage.getItem(NOTIF_SETTINGS_KEY) || '{}'));
  } catch (e) { return Object.assign({}, DEFAULT_NOTIF_SETTINGS); }
}

function saveNotifSettings(s) {
  try { localStorage.setItem(NOTIF_SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
}

function getSelectedSound() { return localStorage.getItem(SOUND_KEY) || 'default'; }

function getMatchReminderTime() {
  if (typeof window.getMatchReminderTime === 'function' && window.getMatchReminderTime !== getMatchReminderTime) {
    try {
      var t = window.getMatchReminderTime();
      if (typeof t === 'number' && t > 0) return t;
    } catch (e) {}
  }
  var t2 = parseInt(localStorage.getItem(MATCH_TIME_KEY) || '30', 10);
  return isNaN(t2) ? 30 : t2;
}

async function toggleNotifSetting(key) {
  var settings = getNotifSettings();
  var newValue = !settings[key];

  var notifKeys = ['general', 'matches', 'breaking', 'newchannels', 'streamOffline'];
  var isNotifKey = notifKeys.indexOf(key) > -1;

  if (newValue && isNotifKey && !areNotificationsEnabled()) {
    showToast('🔔 جارٍ طلب إذن الإشعارات...', 'info');
    var granted = await requestNotificationPermissionUnified();
    if (!granted) {
      showToast('⚠️ يجب السماح بالإشعارات أولاً', 'warning');
      Sound.warning();
      updateNotifToggles();
      return;
    }
  }

  settings[key] = newValue;
  saveNotifSettings(settings);

  if (key === 'dnd') updateDNDIndicator(newValue);

  if (key === 'matches' && typeof window.startMatchReminders === 'function') {
    if (newValue && areNotificationsEnabled()) {
      window.startMatchReminders();
    } else if (!newValue && typeof window.stopMatchReminders === 'function') {
      window.stopMatchReminders();
    }
  }

  updateNotifToggles();
  Sound.toggle();
  haptic(10);
}

function updateNotifToggles() {
  var settings = getNotifSettings();

  ['general', 'matches', 'breaking', 'newchannels', 'streamOffline', 'dnd'].forEach(function (key) {
    var el = document.getElementById('toggle-notif-' + key);
    if (el) el.classList.toggle('on', settings[key] === true);
  });

  var timeBtn = document.getElementById('changeMatchTimeBtn');
  if (timeBtn) timeBtn.style.display = settings.matches ? 'flex' : 'none';

  var timeLabel = document.getElementById('currentMatchTimeValue');
  if (timeLabel) {
    var mins = getMatchReminderTime();
    var opt = TIME_OPTIONS.find(function (o) { return o.id === mins; });
    timeLabel.textContent = opt ? opt.label : (mins + ' دقيقة');
  }

  var reqBtn = document.getElementById('requestNotifPermissionBtn');
  if (reqBtn) {
    var hideReqBtn = false;

    if (__H90_IS_APK__ && window.H90Firebase && typeof window.H90Firebase.hasCapacitorPush === 'function' && window.H90Firebase.hasCapacitorPush()) {
      var status = window.H90Firebase.getStatus ? window.H90Firebase.getStatus() : {};
      if (status.hasNativeToken) hideReqBtn = true;
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      hideReqBtn = true;
    }

    reqBtn.style.display = hideReqBtn ? 'none' : 'flex';
  }
}

function updateDNDIndicator(isOn) {
  var indicator = document.getElementById('dndIndicator');
  if (indicator) indicator.classList.toggle('show', isOn);
}

function initDNDState() {
  updateDNDIndicator(getNotifSettings().dnd === true);
}

async function requestNotificationPermission() {
  await requestNotificationPermissionUnified();
}

async function sendLocalNotification(title, body, extra) {
  if (__H90_IS_APK__ && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
    try {
      var LN = window.Capacitor.Plugins.LocalNotifications;

      if (typeof LN.requestPermissions === 'function') {
        try { await LN.requestPermissions(); } catch (e) {}
      }

      await LN.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 1000000),
          title: title,
          body: body,
          schedule: { at: new Date(Date.now() + 500) },
          sound: null,
          attachments: null,
          actionTypeId: '',
          extra: extra || { type: 'h90_notification' }
        }]
      });

      console.log('📢 [Capacitor LN] إشعار:', title);
      return true;
    } catch (e) {
      console.warn('⚠️ Capacitor LN failed:', e.message);
    }
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    var n = new Notification(title, {
      body: body,
      icon: 'H90.jpg',
      badge: 'H90.jpg',
      dir: 'rtl',
      lang: 'ar',
      tag: 'h90-' + Date.now()
    });

    n.onclick = function() {
      try { window.focus(); } catch (e) {}
      n.close();
    };

    setTimeout(function() { try { n.close(); } catch (e) {} }, 8000);

    console.log('📢 [Web] إشعار:', title);
    return true;
  } catch (e) {
    console.error('❌ Web Notification failed:', e.message);
    return false;
  }
}

/* ================================================================
   27. Stream Monitor
   ================================================================ */
var streamMonitorInterval = null;
var lastStreamState = null;

function startStreamMonitor(channel) {
  stopStreamMonitor();
  lastStreamState = null;

  streamMonitorInterval = setInterval(function () {
    var video = document.getElementById('videoPlayer');
    if (!video) return;

    var settings = getNotifSettings();
    if (!settings.streamOffline) return;

    var isStalled = video.readyState < 2 && !video.paused;

    if (isStalled && lastStreamState === 'live') {
      sendLocalNotification('انقطع البث', channel.name_ar, {
        type: 'stream_offline',
        channelId: channel.id
      });
      lastStreamState = 'offline';
    } else if (video.readyState >= 2) {
      lastStreamState = 'live';
    }
  }, 8000);
}

function stopStreamMonitor() {
  if (streamMonitorInterval) { clearInterval(streamMonitorInterval); streamMonitorInterval = null; }
}

/* ================================================================
   28-30. Time/Sound Picker + Settings
   ================================================================ */
function openTimePicker() {
  var modal = document.getElementById('timePickerModal');
  var list = document.getElementById('timeOptionsList');
  if (!modal || !list) return;

  var current = getMatchReminderTime();

  list.innerHTML = TIME_OPTIONS.map(function (opt) {
    var selected = opt.id === current ? 'selected' : '';
    return '<button class="time-option ' + selected + '" onclick="selectMatchTime(' + opt.id + ')"><span>' + opt.label + '</span><span class="check"></span></button>';
  }).join('');

  modal.classList.add('show');
  Sound.open();
}

function closeTimePicker() {
  var m = document.getElementById('timePickerModal');
  if (m) m.classList.remove('show');
  Sound.close();
}

function selectMatchTime(minutes) {
  var mins = parseInt(minutes, 10);
  if (isNaN(mins) || mins < 1) return;

  if (typeof window.saveMatchReminderTime === 'function') {
    try {
      window.saveMatchReminderTime(mins);
    } catch (e) {
      console.warn('saveMatchReminderTime failed:', e);
      try { localStorage.setItem(MATCH_TIME_KEY, String(mins)); } catch (e2) {}
    }
  } else {
    try { localStorage.setItem(MATCH_TIME_KEY, String(mins)); } catch (e) {}
  }

  var opt = TIME_OPTIONS.find(function (o) { return o.id === mins; });
  showToast('وقت التذكير: ' + (opt ? opt.label : mins), 'success');
  closeTimePicker();
  updateNotifToggles();
  Sound.success();
  haptic(12);

  try {
    window.dispatchEvent(new CustomEvent('h90:reminder:time-changed', {
      detail: { minutes: mins }
    }));
  } catch (e) {}

  if (typeof window.checkMatchesForReminders === 'function') {
    setTimeout(window.checkMatchesForReminders, 500);
  }
}

function openSoundPicker() {
  var modal = document.getElementById('soundPickerModal');
  var list = document.getElementById('soundOptionsList');
  if (!modal || !list) return;

  var current = getSelectedSound();

  list.innerHTML = SOUND_OPTIONS.map(function (opt) {
    var selected = opt.id === current ? 'selected' : '';
    return '<button class="sound-option ' + selected + '" onclick="selectSound(\'' + opt.id + '\')"><div class="play-preview"><div style="width:18px;height:18px;">' + getIcon(opt.icon) + '</div></div><div style="flex:1;text-align:right;"><div style="font-size:14px;font-weight:800;">' + opt.name + '</div></div></button>';
  }).join('');

  modal.classList.add('show');
  Sound.open();
}

function closeSoundPicker() {
  var m = document.getElementById('soundPickerModal');
  if (m) m.classList.remove('show');
  Sound.close();
}

function selectSound(soundId) {
  try { localStorage.setItem(SOUND_KEY, soundId); } catch (e) {}
  showToast('تم اختيار الصوت', 'success');
  closeSoundPicker();
  updateNotifToggles();
  Sound.success();
  haptic(12);
}

function openSettings() {
  closeDrawer();
  renderThemeGrid();
  loadSettingToggles();
  updateNotifToggles();

  if (typeof window.updateTeamsCountLabel === 'function') {
    window.updateTeamsCountLabel();
  }

  var m = document.getElementById('settingsModal');
  if (m) m.classList.add('show');
  Sound.open();
  haptic(10);
}

function closeSettings() {
  var m = document.getElementById('settingsModal');
  if (m) m.classList.remove('show');
  if (_currentRenderedTab === 'settings') _currentRenderedTab = null;
  Sound.close();
}

function loadSettingToggles() {
  try {
    var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    var ta = document.getElementById('toggle-autoplay');
    if (ta) ta.classList.toggle('on', s.autoplay !== false);
  } catch (e) {}
  updateNotifToggles();
}

function toggleSetting(key) {
  var s = {};
  try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch (e) {}
  s[key] = !s[key];
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) {}
  var el = document.getElementById('toggle-' + key);
  if (el) el.classList.toggle('on', s[key]);
  Sound.toggle();
  haptic(10);
}

function clearAppCache() {
  if (!confirm('هل تريد مسح كل البيانات؟')) return;
  if (typeof clearM3UCache === 'function') clearM3UCache();
  if (typeof window.clearMatchesCache === 'function') window.clearMatchesCache();
  if (typeof clearServer1Cache === 'function') clearServer1Cache();
  if (typeof clearServer2Cache === 'function') clearServer2Cache();
  localStorage.clear();
  sessionStorage.clear();
  Sound.error();
  location.reload();
}

/* ================================================================
   31. Search
   ================================================================ */
var searchDebounceTimer = null;

function openSearchOverlay() {
  var o = document.getElementById('searchOverlay');
  if (o) o.classList.add('show');
  setTimeout(function () {
    var i = document.getElementById('searchOverlayInput');
    if (i) i.focus();
  }, 100);
  renderSearchBody('');
  Sound.open();
}

function closeSearchOverlay() {
  var o = document.getElementById('searchOverlay');
  var wasOpen = o && o.classList.contains('show');
  if (o) o.classList.remove('show');
  if (wasOpen) Sound.close();
}

function handleSearchOverlay(q) {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(function () { renderSearchBody(q); }, 120);
}

function renderSearchBody(q) {
  var body = document.getElementById('searchOverlayBody');
  if (!body) return;

  q = (q || '').trim();

  if (!q) {
    body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.35);"><div style="width:60px;height:60px;margin:0 auto 16px;opacity:0.5;color:#ff2d55;">' + getIcon('search') + '</div><div style="font-weight:700;font-size:14px;">ابحث عن قناة</div></div>';
    return;
  }

  var results = (typeof getAllChannels === 'function' ? getAllChannels() : []).filter(function (ch) {
    return ch.name_ar.toLowerCase().indexOf(q.toLowerCase()) > -1;
  });

  if (results.length === 0) {
    body.innerHTML = '<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.4);"><div style="width:60px;height:60px;margin:0 auto 16px;opacity:0.4;color:#ff2d55;">' + getIcon('search') + '</div><div style="font-weight:800;font-size:15px;color:#fff;margin-bottom:6px;">لا نتائج</div><div style="font-size:12px;">لم يتم العثور على "' + q + '"</div></div>';
    return;
  }

  var html = '<div style="color:rgba(255,255,255,0.55);font-size:12px;font-weight:800;padding:12px 4px 10px;display:flex;align-items:center;gap:8px;"><div style="width:14px;height:14px;">' + getIcon('tv') + '</div><span>' + results.length + ' نتيجة</span></div>';

  results.slice(0, 50).forEach(function (ch) {
    var safeId = ch.id.replace(/'/g, "\\'");
    var isFav = favorites.indexOf(ch.id) > -1;
    var accent = ch.server === 'server1' ? '#ffb300' : '#00e676';

    html +=
      '<button onclick="selectSearch(\'' + safeId + '\')" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:14px;color:#fff;cursor:pointer;font-family:inherit;text-align:right;width:100%;margin-bottom:8px;">' +
        '<div style="width:42px;height:42px;background:rgba(' + hexToRgb(accent) + ',0.15);border:1px solid rgba(' + hexToRgb(accent) + ',0.3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:' + accent + ';">' +
          '<div style="width:20px;height:20px;">' + getIcon('tv') + '</div>' +
        '</div>' +
        '<div style="flex:1;text-align:right;">' +
          '<div style="font-weight:700;font-size:13px;color:#fff;">' + ch.name_ar + '</div>' +
          '<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px;">' + (ch.group || '') + '</div>' +
        '</div>' +
        (isFav ? '<div style="width:16px;height:16px;color:#ffb300;flex-shrink:0;">' + getIcon('starFilled') + '</div>' : '') +
      '</button>';
  });

  body.innerHTML = html;
}

function selectSearch(id) {
  Sound.tap();
  closeSearchOverlay();
  setTimeout(function () { openChannel(id); }, 250);
}

/* ================================================================
   32. Notifications
   ================================================================ */
async function fetchH90Notifications() {
  try {
    const res = await fetch(NOTIF_API + '/notifications?limit=50', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data.notifications || [];
  } catch (e) {
    console.error('فشل تحميل الإشعارات:', e);
    return null;
  }
}

async function openNotifDrawer() {
  var body = document.getElementById('notifDrawerBody');
  var d = document.getElementById('notifDrawer');
  var b = document.getElementById('notifBadge');

  if (d) d.classList.add('show');
  if (b) b.style.display = 'none';

  if (body) {
    body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;color:rgba(255,255,255,0.5);"><div style="width:50px;height:50px;border-radius:50%;border:3px solid rgba(255,45,85,0.2);border-top-color:#ff2d55;animation:spin 1s linear infinite;margin-bottom:18px;"></div><div style="font-weight:700;font-size:14px;">جارٍ تحميل الإشعارات...</div></div>';
  }

  Sound.open();
  haptic(8);

  var notifs = await fetchH90Notifications();

  if (notifs === null) {
    if (body) {
      body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;text-align:center;"><div style="width:70px;height:70px;border-radius:22px;background:rgba(255,45,85,0.1);border:1px solid rgba(255,45,85,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:18px;color:#ff2d55;"><div style="width:32px;height:32px;">' + getIcon('alert') + '</div></div><div style="font-weight:800;color:#fff;font-size:15px;margin-bottom:6px;">فشل تحميل الإشعارات</div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:16px;">تحقق من اتصالك بالإنترنت</div><button onclick="openNotifDrawer()" style="padding:10px 24px;background:linear-gradient(135deg,#ff2d55,#e6003d);color:#fff;border:none;border-radius:12px;font-weight:800;font-family:inherit;cursor:pointer;font-size:13px;">إعادة المحاولة</button></div>';
    }
    return;
  }

  if (notifs.length === 0) {
    if (body) {
      body.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px;text-align:center;color:rgba(255,255,255,0.4);"><div style="width:80px;height:80px;border-radius:24px;background:rgba(255,45,85,0.1);border:1px solid rgba(255,45,85,0.3);display:flex;align-items:center;justify-content:center;margin-bottom:18px;color:#ff2d55;"><div style="width:36px;height:36px;">' + getIcon('bell') + '</div></div><div style="font-weight:800;color:#fff;font-size:15px;margin-bottom:6px;">لا توجد إشعارات</div><div style="font-size:12px;">ستظهر الإشعارات هنا عند وصولها</div></div>';
    }
    return;
  }

  var html = '';
  notifs.forEach(function (n) {
    var d2 = new Date(n.timestamp);
    var timeStr = d2.toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    var isNew = (Date.now() - n.timestamp) < 86400000;

    html +=
      '<div style="background:rgba(255,255,255,0.04);border:1px solid ' + (isNew ? 'rgba(255,45,85,0.4)' : 'rgba(255,255,255,0.08)') + ';border-radius:14px;padding:14px;margin-bottom:10px;position:relative;">' +
        (isNew ? '<div style="position:absolute;top:12px;left:12px;width:8px;height:8px;background:#ff2d55;border-radius:50%;"></div>' : '') +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><div style="width:28px;height:28px;border-radius:10px;background:linear-gradient(135deg,#ff2d55,#e6003d);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="width:14px;height:14px;color:#fff;">' + getIcon('bell') + '</div></div><div style="font-weight:800;color:#fff;font-size:14px;flex:1;text-align:right;">' + n.title + '</div></div>' +
        '<div style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.7;margin-bottom:10px;text-align:right;word-wrap:break-word;">' + n.body + '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:10px;color:rgba(255,255,255,0.4);"><span>📅 ' + timeStr + '</span>' + (n.url && n.url !== '/' ? '<a href="' + n.url + '" target="_blank" style="color:#00e5ff;font-weight:700;text-decoration:none;">فتح الرابط ↗</a>' : '') + '</div>' +
      '</div>';
  });

  if (body) body.innerHTML = html;
  try { localStorage.setItem(LAST_SEEN_NOTIF_KEY, Date.now().toString()); } catch (e) {}
}

async function checkNewH90Notifications() {
  try {
    var settings = getNotifSettings ? getNotifSettings() : {};
    if (settings.dnd === true) return;
    if (settings.general === false) return;

    var lastSeen = parseInt(localStorage.getItem(LAST_SEEN_NOTIF_KEY) || '0', 10);
    var notifs = await fetchH90Notifications();

    if (notifs && notifs.length > 0) {
      var latest = notifs[0].timestamp;
      var badge = document.getElementById('notifBadge');
      if (badge) {
        if (latest > lastSeen) badge.style.display = 'block';
        else badge.style.display = 'none';
      }
    }
  } catch (e) {}
}

function closeNotifDrawer() {
  var d = document.getElementById('notifDrawer');
  var wasOpen = d && d.classList.contains('show');
  if (d) d.classList.remove('show');
  if (wasOpen) Sound.close();
}

/* ================================================================
   33. Notification Polling
   ================================================================ */
let notifCheckInterval = null;

function startNotifPolling() {
  if (notifCheckInterval) clearInterval(notifCheckInterval);
  notifCheckInterval = setInterval(function () {
    if (!document.hidden) checkNewH90Notifications();
  }, 120000);
}

function stopNotifPolling() {
  if (notifCheckInterval) { clearInterval(notifCheckInterval); notifCheckInterval = null; }
}

document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    stopNotifPolling();
  } else {
    startNotifPolling();
    checkNewH90Notifications();
  }
});

startNotifPolling();

/* ================================================================
   34. showToast
   ================================================================ */
function showToast(msg, type) {
  var existing = document.querySelector('.toast.h90-toast-new');
  if (existing) existing.remove();

  var typeMap = {
    success: { icon: 'check', accent: '#00e676' },
    error:   { icon: 'alert', accent: '#ff2d55' },
    warning: { icon: 'alert', accent: '#ffb300' },
    info:    { icon: 'info',  accent: '#00e5ff' }
  };
  var cfg = typeMap[type] || typeMap.info;

  var t = document.createElement('div');
  t.className = 'toast h90-toast-new ' + (type || '');
  t.style.cssText =
    'position:fixed;bottom:90px;left:50%;transform:translateX(-50%) translateY(20px);' +
    'background:rgba(20,20,28,0.98);color:#fff;padding:12px 20px 12px 16px;border-radius:16px;font-size:13px;font-weight:700;' +
    'box-shadow:0 15px 45px rgba(0,0,0,0.5);border:1px solid rgba(' + hexToRgb(cfg.accent) + ',0.4);' +
    'opacity:0;transition:opacity 0.3s,transform 0.3s;z-index:99999;max-width:90%;display:flex;align-items:center;gap:10px;pointer-events:none;';

  var iconWrap = document.createElement('div');
  iconWrap.style.cssText = 'width:26px;height:26px;border-radius:50%;background:' + cfg.accent + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;';
  var iconInner = document.createElement('div');
  iconInner.style.cssText = 'width:14px;height:14px;color:#fff;';
  iconInner.innerHTML = getIcon(cfg.icon);
  iconWrap.appendChild(iconInner);

  var textSpan = document.createElement('span');
  textSpan.textContent = msg;

  t.appendChild(iconWrap);
  t.appendChild(textSpan);
  document.body.appendChild(t);

  setTimeout(function () {
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  setTimeout(function () {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(function () { t.remove(); }, 350);
  }, 2600);
}
window.showToast = showToast;

/* ================================================================
   35. refreshAll
   ================================================================ */
function refreshAll() {
  showToast('جارٍ التحديث...', 'info');
  Sound.tap();

  if (typeof window.clearMatchesCache === 'function') window.clearMatchesCache();
  if (typeof clearServer1Cache === 'function') clearServer1Cache();
  if (typeof clearServer2Cache === 'function') clearServer2Cache();

  if (currentView === 'servers') renderServers();
  else if (currentView === 'groups') renderServerGroups(currentServerId);
  else if (currentView === 'channels' && currentGroupId) {
    var g = (typeof getGroupById === 'function') ? getGroupById(currentGroupId) : null;
    if (g) renderGroupChannels(g);
  } else if (currentView === 'matches') {
    if (typeof window.renderMatches === 'function') window.renderMatches();
  } else if (currentView === 'entertainment-menu') {
    if (typeof window.renderEntertainmentScreen === 'function') {
      window.renderEntertainmentScreen();
    }
  } else if (currentView === 'matches-menu') {
    renderMatchesScreen();
  }
  haptic(10);
}

/* ================================================================
   36. Help / Contact
   ================================================================ */
function openHelp() {
  closeDrawer();
  var m = document.getElementById('helpModal');
  if (m) m.classList.add('show');
  Sound.open();
}

function closeHelp() {
  var m = document.getElementById('helpModal');
  if (m) m.classList.remove('show');
  Sound.close();
}

function openContact() {
  closeHelp();
  var m = document.getElementById('contactModal');
  if (m) m.classList.add('show');
  Sound.open();
}

function closeContact() {
  var m = document.getElementById('contactModal');
  if (m) m.classList.remove('show');
  Sound.close();
}

/* ================================================================
   37. FAQ — ✨ موسّع بأسئلة أكثر
   ================================================================ */
function openFAQ() {
  closeHelp();

  var faqs = [
    // ✅ قسم عام
    { cat: 'عام', q: 'ما هو تطبيق H90؟', a: 'H90 هو تطبيق لمشاهدة القنوات الرياضية والمباريات بث مباشر بجودة عالية، مع دعم متعدد للسيرفرات والمشغلات.' },
    { cat: 'عام', q: 'هل التطبيق مجاني؟', a: 'نعم، التطبيق مجاني بالكامل ولا يتطلب أي رسوم اشتراك أو تسجيل دخول.' },
    { cat: 'عام', q: 'هل يحتاج التطبيق إلى حساب؟', a: 'لا، لا يحتاج التطبيق إلى أي حساب. فقط قم بتثبيته وابدأ المشاهدة مباشرة.' },
    { cat: 'عام', q: 'ما هي إصدارات النظام المدعومة؟', a: 'التطبيق يدعم أندرويد 6.0 (Marshmallow) وما فوق، ويعمل على معظم الأجهزة الحديثة.' },

    // ✅ قسم المشاهدة
    { cat: 'المشاهدة', q: 'ما الفرق بين Server 1 و Server 2؟', a: 'Server 1 يتطلب تطبيق VLC خارجي لتشغيل القنوات (جودات متعددة)، بينما Server 2 يفتح المشغل الداخلي أو تطبيق H90 Player المنفصل.' },
    { cat: 'المشاهدة', q: 'كيف أغير جودة الفيديو؟', a: 'في Server 1: اختر الجودة من القائمة قبل الضغط على القناة. في Server 2: يمكنك التبديل بين الجودات من داخل المشغل مباشرة.' },
    { cat: 'المشاهدة', q: 'لماذا لا تعمل بعض القنوات؟', a: 'قد تكون القناة متوقفة مؤقتاً من المصدر، أو أن الرابط انتهت صلاحيته. جرّب قناة أخرى أو حدّث القائمة من زر التحديث.' },
    { cat: 'المشاهدة', q: 'ما هي جودة 4K و FHD و HD؟', a: '4K هي الأعلى جودة (Ultra HD)، FHD هي 1080p، HD هي 720p، و SD هي 480p. الجودات الأعلى تستهلك بيانات أكثر.' },
    { cat: 'المشاهدة', q: 'كيف أشاهد على شاشة التلفاز؟', a: 'يمكنك استخدام خاصية Screen Mirroring من هاتفك، أو توصيل الهاتف بكابل HDMI، أو استخدام تطبيق VLC مع Chromecast.' },
    { cat: 'المشاهدة', q: 'لماذا الفيديو يتوقف باستمرار؟', a: 'قد يكون السبب ضعف الإنترنت، أو أن السيرفر مزدحم. جرّب تقليل الجودة، أو التبديل إلى سيرفر آخر، أو إعادة تشغيل التطبيق.' },

    // ✅ قسم المفضلة والسجل
    { cat: 'المفضلة', q: 'كيف أضيف قناة للمفضلة؟', a: 'اضغط على أيقونة النجمة (⭐) الموجودة في الزاوية العلوية لبطاقة القناة. ستُضاف تلقائياً إلى قسم المفضلة.' },
    { cat: 'المفضلة', q: 'كيف أحذف قناة من المفضلة؟', a: 'افتح قسم المفضلة، ثم اضغط على النجمة المضيئة مرة أخرى لإزالة القناة.' },
    { cat: 'المفضلة', q: 'ما هو قسم "الأخيرة"؟', a: '"الأخيرة" يحفظ آخر 20 قناة شاهدتها، حتى تتمكن من الوصول إليها بسرعة دون البحث عنها مجدداً.' },
    { cat: 'المفضلة', q: 'هل تُحفظ المفضلة بعد إغلاق التطبيق؟', a: 'نعم، تُحفظ المفضلة والسجل في ذاكرة الهاتف، وتبقى حتى بعد إغلاق التطبيق أو إعادة تشغيله.' },

    // ✅ قسم الإشعارات
    { cat: 'الإشعارات', q: 'كيف أفعّل الإشعارات؟', a: 'من القائمة الجانبية > الإعدادات > الإشعارات > فعّل "إشعارات النظام". سيُطلب منك السماح بالإشعارات، اضغط "السماح".' },
    { cat: 'الإشعارات', q: 'لماذا لا تصلني إشعارات المباريات؟', a: 'تأكد من: 1) تفعيل إذن الإشعارات، 2) تفعيل "تذكيرات المباريات" في الإعدادات، 3) عدم تفعيل وضع "عدم الإزعاج" (DND).' },
    { cat: 'الإشعارات', q: 'كيف أغير وقت تذكير المباريات؟', a: 'من الإعدادات > الإشعارات > اضغط على "وقت التذكير" واختر المدة المناسبة (5 دقائق، 30 دقيقة، ساعة، إلخ).' },
    { cat: 'الإشعارات', q: 'ما هو وضع "عدم الإزعاج" (DND)؟', a: 'عند تفعيله، يتم كتم جميع الإشعارات مؤقتاً (بما فيها إشعارات المباريات) حتى تقوم بإلغاء تفعيله.' },
    { cat: 'الإشعارات', q: 'كيف أغير صوت الإشعار؟', a: 'من الإعدادات > الإشعارات > اضغط على "صوت الإشعار" واختر من بين: افتراضي، جرس ناعم، صفير قصير، تنبيه قوي، أو صامت.' },
    { cat: 'الإشعارات', q: 'لماذا لا يظهر زر "طلب الإذن"؟', a: 'إذا كان الزر مخفياً، فهذا يعني أن الإذن ممنوح مسبقاً. تحقق من إعدادات الهاتف > التطبيقات > H90 > الإشعارات.' },

    // ✅ قسم التخصيص
    { cat: 'التخصيص', q: 'كيف أغير ثيم التطبيق؟', a: 'من القائمة الجانبية > الإعدادات > الثيمات، اختر بين "أحمر نيون" أو "أسود نقي".' },
    { cat: 'التخصيص', q: 'هل يمكنني تغيير اللغة؟', a: 'التطبيق حالياً بواجهة عربية بالكامل. دعم لغات أخرى قيد التطوير.' },

    // ✅ قسم الدعم
    { cat: 'الدعم', q: 'كيف أتواصل مع الدعم؟', a: 'من القائمة الجانبية > المساعدة والدعم > التواصل. يمكنك إرسال استفسارك أو مشكلتك وسنرد عليك في أقرب وقت.' },
    { cat: 'الدعم', q: 'كيف أشارك التطبيق مع أصدقائي؟', a: 'من القائمة الجانبية > اضغط على "مشاركة التطبيق" لإرسال رابط التطبيق عبر واتساب أو أي تطبيق آخر.' },
    { cat: 'الدعم', q: 'كيف أمسح ذاكرة التخزين المؤقت؟', a: 'من الإعدادات > "مسح البيانات"، لكن احذر: هذا الخيار سيمسح المفضلة والسجل والإعدادات بالكامل.' },
    { cat: 'الدعم', q: 'كيف أحدّث قائمة القنوات؟', a: 'من القائمة الجانبية > اضغط على زر "تحديث" (🔄). سيتم إعادة تحميل جميع القنوات والباقات من السيرفرات.' }
  ];

  var html = '';
  var counter = 1;

  faqs.forEach(function (f) {
    html +=
      '<div style="background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.08);border-radius:14px;margin-bottom:10px;padding:14px;">' +
        '<div style="font-weight:800;color:#fff;font-size:13px;margin-bottom:8px;display:flex;align-items:flex-start;gap:10px;line-height:1.4;">' +
          '<span style="width:24px;height:24px;min-width:24px;border-radius:8px;background:linear-gradient(135deg,#ff2d55,#e6003d);display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;flex-shrink:0;">' + (counter++) + '</span>' +
          '<span>' + f.q + '</span>' +
        '</div>' +
        '<div style="color:rgba(255,255,255,0.65);font-size:12px;line-height:1.7;padding-right:34px;">' + f.a + '</div>' +
      '</div>';
  });

  var c = document.getElementById('faqContent');
  if (c) c.innerHTML = html;

  var m = document.getElementById('faqModal');
  if (m) m.classList.add('show');
  Sound.open();
}

function closeFAQ() {
  var m = document.getElementById('faqModal');
  if (m) m.classList.remove('show');
  Sound.close();
}

/* ================================================================
   38. shareApp
   ================================================================ */
async function shareApp() {
  var shareData = {
    title: 'H90 — البث المباشر',
    text: 'شاهد قنواتك المفضلة بث مباشر بجودة عالية',
    url: window.location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); } catch (e) {}
  }
  closeDrawer();
  Sound.tap();
}

/* ================================================================
   39. Player Bindings
   ================================================================ */
window.togglePlay       = function () { return window.PlayerEngine && window.PlayerEngine.togglePlay(); };
window.seekBy           = function (s) { return window.PlayerEngine && window.PlayerEngine.seekBy(s); };
window.seekFromClick    = function (e) { return window.PlayerEngine && window.PlayerEngine.seekFromClick(e); };
window.toggleMute       = function () { return window.PlayerEngine && window.PlayerEngine.toggleMute(); };
window.cycleSpeed       = function () { return window.PlayerEngine && window.PlayerEngine.cycleSpeed(); };
window.toggleFullscreen = function () { return window.PlayerEngine && window.PlayerEngine.toggleFullscreen(); };
window.reloadStream     = function () { return window.PlayerEngine && window.PlayerEngine.reloadStream(); };
window.closePlayer      = closePlayer;

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeSearchOverlay(); closeSettings(); closeNotifDrawer(); closeDrawer();
    closeHelp(); closeFAQ(); closeContact(); closeTimePicker(); closeSoundPicker();
    if (typeof window.closeTeamsPicker === 'function') window.closeTeamsPicker();
    if (typeof window.closeRoomsScreen === 'function') window.closeRoomsScreen();
  }
});

/* ================================================================
   40. loadM3UFromWorker
   ================================================================ */
async function loadM3UFromWorker(forceReload) {
  console.log('🔄 تحميل السيرفرات...');

  let s1 = { channels: [], groups: [] };
  try {
    if (typeof loadServer1Channels === 'function') {
      const result = await loadServer1Channels(forceReload);
      s1 = result || { channels: [], groups: [] };
    }
  } catch (e) {
    console.error('❌ Server 1 فشل:', e);
  }
  console.log('📺 Server 1: ' + (s1.channels ? s1.channels.length : 0));

  let s2 = { channels: [], groups: [] };
  try {
    if (typeof loadServer2Channels === 'function') {
      const result = await loadServer2Channels(forceReload);
      s2 = result || { channels: [], groups: [] };
    }
  } catch (e) {
    console.error('❌ Server 2 فشل:', e);
  }
  console.log('📺 Server 2: ' + (s2.channels ? s2.channels.length : 0));

  CHANNELS_DATA = [
    ...((s1.channels) || []),
    ...((s2.channels) || [])
  ];
  CHANNEL_GROUPS = [
    ...((s1.groups) || []),
    ...((s2.groups) || [])
  ];

  console.log('📺 المجموع: ' + CHANNELS_DATA.length + ' قناة، ' + CHANNEL_GROUPS.length + ' باقة');
  return true;
}

/* ================================================================
   41. Global Exports
   ================================================================ */
window.loadM3UFromWorker              = loadM3UFromWorker;
window.openDrawer                    = openDrawer;
window.closeDrawer                   = closeDrawer;
window.openSettings                  = openSettings;
window.closeSettings                 = closeSettings;
window.toggleSetting                 = toggleSetting;
window.setTheme                      = setTheme;
window.toggleTheme                   = toggleTheme;
window.clearAppCache                 = clearAppCache;
window.openHelp                      = openHelp;
window.closeHelp                     = closeHelp;
window.openFAQ                       = openFAQ;
window.closeFAQ                      = closeFAQ;
window.openContact                   = openContact;
window.closeContact                  = closeContact;
window.shareApp                      = shareApp;
window.openSearchOverlay             = openSearchOverlay;
window.closeSearchOverlay            = closeSearchOverlay;
window.handleSearchOverlay           = handleSearchOverlay;
window.selectSearch                  = selectSearch;
window.openSearch                    = openSearchOverlay;
window.closeSearch                   = closeSearchOverlay;
window.openNotifDrawer               = openNotifDrawer;
window.closeNotifDrawer              = closeNotifDrawer;
window.fetchH90Notifications         = fetchH90Notifications;
window.checkNewH90Notifications      = checkNewH90Notifications;
window.switchTab                     = switchTab;
window.openChannel                   = openChannel;
window.switchServer                  = switchServer;
window.switchServerAuto              = switchServerAuto;
window.toggleFavorite                = toggleFavorite;
window.refreshAll                    = refreshAll;
window.renderServers                 = renderServers;
window.openServer                    = openServer;
window.openGroup                     = openGroup;
window.backToServers                 = backToServers;
window.backToServerGroups            = backToServerGroups;
window.openInVLCExternal             = openInVLCExternal;
window.openExternalPlayer            = openExternalPlayer; // ✅ [جديد]
window.showQualityPickerForVLC       = showQualityPickerForVLC;
window.getQualityIconName            = getQualityIconName;
window.getQualityDesc                = getQualityDesc;
window.toggleNotifSetting            = toggleNotifSetting;
window.updateNotifToggles            = updateNotifToggles;
window.requestNotificationPermission = requestNotificationPermission;
window.openTimePicker                = openTimePicker;
window.closeTimePicker               = closeTimePicker;
window.selectMatchTime               = selectMatchTime;
window.openSoundPicker               = openSoundPicker;
window.closeSoundPicker              = closeSoundPicker;
window.selectSound                   = selectSound;
window.getIcon                       = getIcon;
window.haptic                        = haptic;
window.renderEmptyState              = renderEmptyState;
window.hexToRgb                      = hexToRgb;
window.getNotifSettings              = getNotifSettings;
window.getMatchReminderTime          = getMatchReminderTime;
window.startClockAnimation           = startClockAnimation;
window.bindSoundEvents               = bindSoundEvents;

/* ✅ التصديرات التي تخص المباريات (تبقى هنا) */
window.renderMatchesScreen           = renderMatchesScreen;
window.openMatchesSub                = openMatchesSub;
window.backToMainTab                 = backToMainTab;
window.renderScreenHeader            = renderScreenHeader;
window.renderNewsScreen              = renderNewsScreen;
window.backToMatches                 = backToMatches;

window.renderFavorites               = renderFavorites;
window.renderRecent                  = renderRecent;
window.renderChannelList             = renderChannelList;

/* ✨ تصدير أدوات الإشعارات الموحّدة */
window.areNotificationsEnabled              = areNotificationsEnabled;
window.requestNotificationPermissionUnified = requestNotificationPermissionUnified;
window.sendLocalNotification                = sendLocalNotification;
window.askNotificationAfterWelcome          = askNotificationAfterWelcome;

/* ✨ معلومات البيئة */
window.H90CoreEnv = {
  isAPK: __H90_IS_APK__,
  areNotificationsEnabled: areNotificationsEnabled,
  getStatus: function() {
    return {
      isAPK: __H90_IS_APK__,
      notifEnabled: areNotificationsEnabled(),
      notifPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
      askedAfterWelcome: (function() {
        try { return localStorage.getItem(NOTIF_ASKED_AFTER_WELCOME_KEY) === 'true'; }
        catch (e) { return false; }
      })(),
      hasCapacitor: !!window.Capacitor,
      hasCapacitorPush: !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications),
      hasLocalNotifications: !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications),
      hasAppLauncher: !!(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher),
      firebaseReady: !!(window.H90Firebase && window.H90Firebase.isReady && window.H90Firebase.isReady()),
      matchesRemindersRunning: !!(typeof window.getReminderStats === 'function' && window.getReminderStats().running)
    };
  },
  resetWelcomeAsk: function() {
    try { localStorage.removeItem(NOTIF_ASKED_AFTER_WELCOME_KEY); return true; }
    catch (e) { return false; }
  }
};

console.log('%cH90 v25.9.5 — Core Ready (External Player)',
  'background:linear-gradient(135deg,#ff2d55,#00e5ff);color:#fff;padding:6px 14px;border-radius:8px;font-weight:900;font-size:12px');

console.log('%c💡 أدوات: H90CoreEnv.getStatus() — askNotificationAfterWelcome() — H90CoreEnv.resetWelcomeAsk()',
  'color:#00e5ff;font-size:11px;font-weight:700;');