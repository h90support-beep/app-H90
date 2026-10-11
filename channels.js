/* ================================================================
   H90 — channels.js (Coordinator) — v5.0
   ================================================================
   ✅ يجمع السيرفرين (Server 1 + Server 2)
   ✅ API موحّد
   ✅ يحل مشكلة تعارض الـ id بين server1 و server2
   ✅ CHANNEL_LOGOS: قاعدة صور موحدة لكل القنوات
   ✅ GROUP_LOGOS: صور الباقات الرياضية
   ✅ _proxifyImage: تمرير صور http عبر Worker
   🔧 v5.0: صورة موحدة beIN + إصلاح getChannelById
   ================================================================ */

'use strict';

/* ================================================================
   1. إعدادات السيرفرات
   ================================================================ */
const SERVERS = {
  server1: {
    id: 'server1',
    name: 'Server 1',
    description: 'VLC Required',
    icon: 'external',
    type: 'external',
    color: '#ffa502'
  },
  server2: {
    id: 'server2',
    name: 'Server 2',
    description: 'Internal Player',
    icon: 'internal',
    type: 'internal',
    color: '#2ed573'
  }
};

/* ================================================================
   2. Proxy للصور
   ================================================================ */
const IMAGE_PROXY = 'https://lio.houssenalhoussen24.workers.dev/proxy?url=';

function _proxifyImage(imgUrl) {
  if (!imgUrl) return '';
  const u = String(imgUrl).trim();
  if (!u) return '';
  if (u.startsWith('https://')) return u;
  if (u.startsWith('http://')) {
    return IMAGE_PROXY + encodeURIComponent(u);
  }
  return u;
}

/* ================================================================
   3. ✅ صورة موحدة لكل قنوات beIN Sports
   ================================================================ */
const BEIN_LOGO = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkuwIi4KCSdEc0i8OLMZSEhUkAzkd6cWArxA&s';

/* ================================================================
   4. CHANNEL_LOGOS — صور القنوات الموحدة
   ================================================================ */
const CHANNEL_LOGOS = {

  /* ═══════════════ 1. beIN SPORTS — صورة موحدة ═══════════════ */
  'bein1':       BEIN_LOGO,
  'bein2':       BEIN_LOGO,
  'bein3':       BEIN_LOGO,
  'bein4':       BEIN_LOGO,
  'bein5':       BEIN_LOGO,
  'bein6':       BEIN_LOGO,
  'bein7':       BEIN_LOGO,
  'bein8':       BEIN_LOGO,
  'bein9':       BEIN_LOGO,
  'beinnews':    BEIN_LOGO,
  'beinglobal':  BEIN_LOGO,
  'bein4k':      BEIN_LOGO,
  'beinxtra1':   BEIN_LOGO,
  'beinxtra2':   BEIN_LOGO,
  'beinnba':     BEIN_LOGO,
  'beinglobal':  BEIN_LOGO,

  /* ═══════════════ 2. Shahid Sport ═══════════════ */
  'shahid1':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid2':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid3':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid4':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid5':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid6':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid7':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid8':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid9':     'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'shahid10':    'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',

  /* ═══════════════ 3. ALWAN Sport ═══════════════ */
  'alwan1':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan2':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan3':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan4':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan5':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan6':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan7':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan8':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan9':      'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwan10':     'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwanf1':     'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwanufc':    'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'alwanwwe':    'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',

  /* ═══════════════ 4. SHASHA ═══════════════ */
  'shasha1':     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr-Ar0bO8HBO_LpdsGdbbPbMudjigxr0nLew&s',
  'shasha2':     'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr-Ar0bO8HBO_LpdsGdbbPbMudjigxr0nLew&s',
  'shasha1_hd':  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr-Ar0bO8HBO_LpdsGdbbPbMudjigxr0nLew&s',
  'shasha1_sd':  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr-Ar0bO8HBO_LpdsGdbbPbMudjigxr0nLew&s',
  'shasha1_4k':  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr-Ar0bO8HBO_LpdsGdbbPbMudjigxr0nLew&s',

  /* ═══════════════ 5. THMANYAH ═══════════════ */
  'thmanyah1':   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',
  'thmanyah2':   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',
  'thmanyah3':   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',
  'thmanyah4':   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',
  'thmanyah5':   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',
  'thmanyah6':   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',
  'thmanyah7':   'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',

  /* ═══════════════ 6. AL KASS ═══════════════ */
  'alkass1':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'alkass2':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'alkass3':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'alkass4':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'alkass5':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'alkass6':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'alkass7':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'alkass8':     'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',

  /* ═══════════════ 7. AL FAJER ═══════════════ */
  'fajer1':      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQebrSefMXRxiQ0ztfPXsFefodA11EAH_ChEQ&s',
  'fajer2':      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQebrSefMXRxiQ0ztfPXsFefodA11EAH_ChEQ&s',
  'fajer3':      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQebrSefMXRxiQ0ztfPXsFefodA11EAH_ChEQ&s',
  'fajer4':      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQebrSefMXRxiQ0ztfPXsFefodA11EAH_ChEQ&s',
  'fajer5':      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQebrSefMXRxiQ0ztfPXsFefodA11EAH_ChEQ&s',

  /* ═══════════════ 8. AD Sports ═══════════════ */
  'ad1':         'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'ad2':         'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'adpremium1':  'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'adpremium2':  'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'adasia1':     'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'adasia2':     'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'yas':         'http://pro.netmos.ovh:6051/img/tsawer/sport/SP.yastv.png',
  'adextra':     'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'adyas':       'http://pro.netmos.ovh:6051/img/tsawer/sport/SP.yastv.png',

  /* ═══════════════ 9. Dubai Sports ═══════════════ */
  'dubai1':      'http://pro.netmos.ovh:6051/img/Dubai.Sports.1.png',
  'dubai2':      'http://pro.netmos.ovh:6051/img/Dubai.Sports.2.png',
  'dubai3':      'http://pro.netmos.ovh:6051/img/Dubai.Sports.2.png',
  'dubairacing1':'http://pro.netmos.ovh:6051/img/Dubai.Sports.2.png',
  'dubairacing2':'http://pro.netmos.ovh:6051/img/Dubai.Sports.2.png',
  'dubairacing3':'http://pro.netmos.ovh:6051/img/Dubai.Sports.2.png',
  'ontime1':     'http://pro.netmos.ovh:6051/img/Ontime.Sports.png',
  'ontime2':     'http://pro.netmos.ovh:6051/img/Ontime.Sports.2.png',
  'ontimehd':    'https://www.tahiamasr.com/Upload/libfiles/63/0/52.jpg',

  /* ═══════════════ 10. StarzPlay ═══════════════ */
  'starzplay':   'http://pro.netmos.ovh:7355/images/8f571c9f39af9e950481a32505975dc2.png',
  'starzplayufc':'http://pro.netmos.ovh:7355/images/8f571c9f39af9e950481a32505975dc2.png',
  'starzplaygolf':'https://www.arabiclist.net/media/platforms/logos/starsplay.jpg',
  'starzplay1':  'https://www.arabiclist.net/media/platforms/logos/starsplay.jpg',
  'starzplay2':  'https://www.arabiclist.net/media/platforms/logos/starsplay.jpg',
  'starzplay3':  'https://www.arabiclist.net/media/platforms/logos/starsplay.jpg',

  /* ═══════════════ 11. قنوات رياضية عربية ═══════════════ */
  'sharjah':     'https://sba.net.ae/uploads/19/Jan/24/32ef5753d51bf08a78a06935576556347a6e65746a66464c44675a6e4445.png',
  'oman':        'http://pro.netmos.ovh:6051/img/tsawer/sport/SP.omansport.png',
  'bahrain1':    'http://pro.netmos.ovh:6051/img/Bahrain.Sports.png',
  'bahrain2':    'http://pro.netmos.ovh:6051/img/Bahrain.Sports.png',
  'kuwait':      'http://pro.netmos.ovh:7355/images/b060252c477acb532bcdb54e06633e71.jpeg',
  'kuwaitplus':  'http://pro.netmos.ovh:7355/images/b060252c477acb532bcdb54e06633e71.jpeg',
  'iraqia':      'http://pro.netmos.ovh:7355/images/f691c7e426db215eec5811d50406678b.png',
  'libya1':      'http://pro.netmos.ovh:7355/images/ebbcc89a9d49cc4538dfa3c75bfec15a.png',
  'libya2':      'http://pro.netmos.ovh:7355/images/ebbcc89a9d49cc4538dfa3c75bfec15a.png',
  'syria':       'http://pro.netmos.ovh:6051/img/tsawer/News/Al.Ikhbariya.png',
  'nilesport':   'http://pro.netmos.ovh:6051/img/nilesport.png',
  'alahly':      'https://image.discovery.indazn.com/ca/v2/ca/image?id=05f7c5b8-8727-4e89-8a7f-4daa103d8b10&quality=70',
  'zamalek':     'https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/ffcfdf41645049.560704ca6bd71.jpg',
  'ahlytv':      'https://image.discovery.indazn.com/ca/v2/ca/image?id=05f7c5b8-8727-4e89-8a7f-4daa103d8b10&quality=70',
  'sportstv1':   'https://www.matnnews.com/UploadCache/libfiles/9/3/600x338o/606.png',
  'sportstv2':   'https://www.matnnews.com/UploadCache/libfiles/9/3/600x338o/606.png',
  'elheddaf':    'http://pro.netmos.ovh:6051/img/El-Heddaf.png',
  'maghreb1':    'https://maghrebtelevision.com/wp-content/uploads/2019/10/logo-plat-MAGHREB-TV-02-.png',
  'maghreb2':    'https://maghrebtelevision.com/wp-content/uploads/2019/10/logo-plat-MAGHREB-TV-02-.png',
  'maghreb3':    'https://maghrebtelevision.com/wp-content/uploads/2019/10/logo-plat-MAGHREB-TV-02-.png',
  'tunisiasport':'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnALGhBhzsPugkyrP3biJZzYZqOSZOA8-WjA&s'

};

/* ================================================================
   5. GROUP_LOGOS — صور الباقات الرياضية
   ================================================================ */
const GROUP_LOGOS = {
  'bein':        BEIN_LOGO,
  'shahid':      'https://shahid.mbc.net/mediaObject/a7ac67b4-fd29-4bcd-bd69-5ab5d27efdbd',
  'alwan':       'https://i2.wp.com/almuheet.net/wp-content/uploads/%D9%82%D9%86%D9%88%D8%A7%D8%AA-%D8%A7%D9%84%D9%88%D8%A7%D9%86-%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6%D9%8A%D8%A9.jpg',
  'shasha':      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRr-Ar0bO8HBO_LpdsGdbbPbMudjigxr0nLew&s',
  'thmanyah':    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3oZdTkpQ4esuN_nemtI_q9g_vjP9TQVJW7IlTatRwvZRKRVF716dKmuRX&s=10',
  'alkass':      'https://i.ytimg.com/vi/BfY7XM3y_28/sddefault.jpg',
  'fajer':       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQebrSefMXRxiQ0ztfPXsFefodA11EAH_ChEQ&s',
  'adsports':    'http://pro.netmos.ovh:6051/img/tsawer/sport/Abu.Dhabi.Sports.png',
  'dubaisports': 'http://pro.netmos.ovh:6051/img/Dubai.Sports.1.png',
  'ksasports':   'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Emblem_of_Saudi_Arabia.svg/1887px-Emblem_of_Saudi_Arabia.svg.png',
  'starzplay':   'http://pro.netmos.ovh:7355/images/8f571c9f39af9e950481a32505975dc2.png',
  'arabic':      'http://pro.netmos.ovh:6051/img/tsawer/sport/SP.omansport.png'
};

/* ================================================================
   6. الحالة العامة
   ================================================================ */
let CHANNELS_DATA = [];
let CHANNEL_GROUPS = [];

/* ✅ قراءة currentServerId من window بأمان */
function _getCurrentServerId() {
  try {
    if (typeof window !== 'undefined' && window.currentServerId) {
      return window.currentServerId;
    }
  } catch (e) {}
  return null;
}

/* ================================================================
   7. loadM3UFromWorker
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
   8. applyLogo — تطبيق الصورة تلقائيًا
   ================================================================ */
function applyLogo(channel) {
  if (!channel) return channel;

  /* ✅ 1) إذا عنده صورة بالفعل → مرّرها عبر Proxy */
  if (channel.logo && channel.logo.trim()) {
    channel.logo = _proxifyImage(channel.logo);
    return channel;
  }

  /* ✅ 2) ابحث بالـ ID */
  if (channel.id && CHANNEL_LOGOS[channel.id]) {
    channel.logo = _proxifyImage(CHANNEL_LOGOS[channel.id]);
    return channel;
  }

  /* ✅ 3) fallback → صورة الباقة */
  if (channel.group && GROUP_LOGOS[channel.group]) {
    channel.logo = _proxifyImage(GROUP_LOGOS[channel.group]);
    return channel;
  }

  return channel;
}

/* ================================================================
   9. API — القنوات
   ✅ v5.0: getChannelById يحترم preferServer أولًا
   ================================================================ */
function getChannelById(id, preferServer) {
  if (!id) return null;

  /* ✅ 1) الأولوية: السيرفر المُمرَّر */
  if (preferServer) {
    var found = CHANNELS_DATA.find(function(c) {
      return c.id === id && c.server === preferServer;
    });
    if (found) return applyLogo(found);
  }

  /* ✅ 2) إذا لم يُمرَّر: استخدم currentServerId */
  var currentSrv = _getCurrentServerId();
  if (currentSrv && currentSrv !== preferServer) {
    var found2 = CHANNELS_DATA.find(function(c) {
      return c.id === id && c.server === currentSrv;
    });
    if (found2) return applyLogo(found2);
  }

  /* ✅ 3) fallback: أول قناة بنفس الـ id */
  var fallback = CHANNELS_DATA.find(function(c) { return c.id === id; }) || null;
  return applyLogo(fallback);
}

function getAllChannels() {
  return CHANNELS_DATA.map(applyLogo);
}

function getChannelsByCategory(cat) {
  if (!cat || cat === 'all') return getAllChannels();
  return CHANNELS_DATA
    .filter(function(c) { return c.category === cat; })
    .map(applyLogo);
}

function getChannelName(channel, lang) {
  if (!channel) return '';
  return (lang || 'ar') === 'ar' ? channel.name_ar : channel.name_en;
}

function getChannelsCount() {
  return CHANNELS_DATA.length;
}

function getServerChannels(serverId) {
  if (!serverId) return [];
  return CHANNELS_DATA
    .filter(function(c) { return c.server === serverId; })
    .map(applyLogo);
}

/* ================================================================
   10. API — الباقات
   ================================================================ */
function getAllGroups() {
  return CHANNEL_GROUPS;
}

function getGroupById(groupId, preferServer) {
  if (!groupId) return null;

  if (preferServer) {
    var found = CHANNEL_GROUPS.find(function(g) {
      return g.id === groupId && g.server === preferServer;
    });
    if (found) return found;
  }

  var currentSrv = _getCurrentServerId();
  if (currentSrv && currentSrv !== preferServer) {
    var found2 = CHANNEL_GROUPS.find(function(g) {
      return g.id === groupId && g.server === currentSrv;
    });
    if (found2) return found2;
  }

  return CHANNEL_GROUPS.find(function(g) { return g.id === groupId; }) || null;
}

function getChannelsByGroup(groupId) {
  const group = getGroupById(groupId);
  if (!group || !group.channels) return [];

  var targetServer = group.server;

  return group.channels
    .map(function(id) {
      if (targetServer) {
        var ch = CHANNELS_DATA.find(function(c) {
          return c.id === id && c.server === targetServer;
        }) || getChannelById(id, targetServer);
        return applyLogo(ch);
      }
      return getChannelById(id);
    })
    .filter(Boolean);
}

function getGroupsCount() {
  return CHANNEL_GROUPS.length;
}

function getServerGroups(serverId) {
  if (!serverId) return [];
  return CHANNEL_GROUPS.filter(function(g) {
    if (!g.channels || g.channels.length === 0) return false;
    if (g.server) return g.server === serverId;
    const first = getChannelById(g.channels[0]);
    return first && first.server === serverId;
  });
}

/* ================================================================
   11. API — السيرفرات
   ================================================================ */
function getServerById(serverId) {
  if (!serverId) return null;
  return SERVERS[serverId] || null;
}

/* ================================================================
   12. API — روابط القنوات
   ✅ v5.0: fallback ذكي
   ================================================================ */
function getChannelUrls(channel, serverId) {
  if (!channel || !channel.urls) return [];

  var server = serverId || channel.server || 'server1';
  var serverData = channel.urls[server];

  if (!serverData) {
    var other = server === 'server1' ? 'server2' : 'server1';
    if (channel.urls[other]) {
      console.warn('[URLS] Fallback:', server, '→', other, 'for', channel.id);
      serverData = channel.urls[other];
    }
  }

  if (!serverData) return [];

  var list = Array.isArray(serverData) ? serverData : (serverData.list || []);
  if (!Array.isArray(list)) return [];

  return list.filter(function(u) {
    return u && typeof u === 'string' && u.trim().length > 0;
  });
}

function getChannelQualities(channel, serverId) {
  if (!channel || !channel.urls) return [];

  var server = serverId || channel.server || 'server1';
  var serverData = channel.urls[server];

  if (!serverData) {
    var other = server === 'server1' ? 'server2' : 'server1';
    if (channel.urls[other]) {
      serverData = channel.urls[other];
    }
  }

  if (!serverData) return [];

  if (Array.isArray(serverData)) return [];

  return serverData.qualities || [];
}

/* ================================================================
   13. API — صور الباقات
   ================================================================ */
function getGroupCoverImage(group) {
  if (!group) return '';

  /* ✅ 1) GROUP_LOGOS للباقة (بناءً على id الباقة الأصلي) */
  var realGroupId = group.id ? group.id.replace(/^s\d+grp_/, '') : null;
  if (realGroupId && GROUP_LOGOS[realGroupId]) {
    return _proxifyImage(GROUP_LOGOS[realGroupId]);
  }

  /* ✅ 2) صورة مخصصة */
  if (group.coverImage) {
    return _proxifyImage(group.coverImage);
  }

  /* ✅ 3) صورة أول قناة */
  if (!group.channels || group.channels.length === 0) return '';
  const firstChannel = getChannelById(group.channels[0], group.server);
  if (!firstChannel || !firstChannel.logo) return '';
  return firstChannel.logo;
}

/* ================================================================
   14. API — البحث
   ================================================================ */
function searchChannels(query) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  return CHANNELS_DATA
    .filter(function(c) {
      const nameAr = (c.name_ar || '').toLowerCase();
      const nameEn = (c.name_en || '').toLowerCase();
      return nameAr.indexOf(q) > -1 || nameEn.indexOf(q) > -1;
    })
    .map(applyLogo);
}

/* ================================================================
   15. تنظيف Cache
   ================================================================ */
function clearM3UCache() {
  try {
    if (typeof clearServer1Cache === 'function') clearServer1Cache();
    if (typeof clearServer2Cache === 'function') clearServer2Cache();

    CHANNELS_DATA = [];
    CHANNEL_GROUPS = [];

    console.log('✅ تم مسح كل Cache القنوات');
  } catch (e) {
    console.error('❌ فشل مسح Cache:', e);
  }
}

/* ================================================================
   16. الإتاحة العامة (window)
   ================================================================ */
window.SERVERS = SERVERS;
window.CHANNEL_LOGOS = CHANNEL_LOGOS;
window.GROUP_LOGOS = GROUP_LOGOS;
window.applyLogo = applyLogo;

window.loadM3UFromWorker = loadM3UFromWorker;
window.clearM3UCache = clearM3UCache;

window.getChannelById = getChannelById;
window.getAllChannels = getAllChannels;
window.getChannelsByCategory = getChannelsByCategory;
window.getChannelName = getChannelName;
window.getChannelsCount = getChannelsCount;
window.getServerChannels = getServerChannels;

window.getAllGroups = getAllGroups;
window.getGroupById = getGroupById;
window.getChannelsByGroup = getChannelsByGroup;
window.getGroupsCount = getGroupsCount;
window.getServerGroups = getServerGroups;

window.getServerById = getServerById;
window.getChannelUrls = getChannelUrls;
window.getChannelQualities = getChannelQualities;
window.getGroupCoverImage = getGroupCoverImage;
window.searchChannels = searchChannels;

console.log('✅ channels.js — Coordinator v5.0 loaded');
console.log('📸 CHANNEL_LOGOS:', Object.keys(CHANNEL_LOGOS).length, 'صورة');
console.log('📦 GROUP_LOGOS:', Object.keys(GROUP_LOGOS).length, 'باقة رياضية');