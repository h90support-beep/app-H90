/* ================================================================
   H90 — channels-server2.js (v16.0 — With Logos Applied)
   ================================================================
   ✅ يتصل بـ Worker 2 (Lio) v4.0
   ✅ يقرأ CHANNEL_LOGOS و GROUP_LOGOS من channels.js
   ✅ يُطبّق الصور تلقائيًا على كل قناة
   ✅ Cache ذكي 24 ساعة (v16_0)
   ================================================================ */

'use strict';

const SERVER2_PROXY_API = 'https://lio.houssenalhoussen24.workers.dev';
const S2_PROXY_WRAPPER = 'https://lio.houssenalhoussen24.workers.dev/proxy?url=';

/* ✅ v16.0: مفتاح جديد (يمسح القديم) */
const SERVER2_CACHE_KEY = 'h90_server2_v16_0';
const SERVER2_CACHE_TIME_KEY = 'h90_server2_time_v16_0';
const SERVER2_CACHE_DURATION = 24 * 60 * 60 * 1000;

let SERVER2_DATA = [];
let SERVER2_GROUPS_DATA = [];

/* ═══════════════════════════════════════════════════════════════
   TARGET_GROUPS
   ═══════════════════════════════════════════════════════════════ */
const S2_TARGET_GROUPS = [
  { id: 'bein',        name_ar: 'beIN Sports',        icon: 'sports',    order: 1  },
  { id: 'shahid',      name_ar: 'Shahid Sport',       icon: 'satellite', order: 2  },
  { id: 'alwan',       name_ar: 'ALWAN Sport',        icon: 'palette',   order: 3  },
  { id: 'shasha',      name_ar: 'Shasha',             icon: 'theater',   order: 4  },
  { id: 'thmanyah',    name_ar: 'Thmanyah',           icon: 'hash',      order: 5  },
  { id: 'alkass',      name_ar: 'Al Kass',            icon: 'film',      order: 6  },
  { id: 'fajer',       name_ar: 'AL FAJER',           icon: 'sunrise',   order: 7  },
  { id: 'adsports',    name_ar: 'AD Sports',          icon: 'sports',    order: 8  },
  { id: 'dubaisports', name_ar: 'Dubai Sports',       icon: 'satellite', order: 9  },
  { id: 'ksasports',   name_ar: 'KSA Sports',         icon: 'sports',    order: 10 },
  { id: 'starzplay',   name_ar: 'StarzPlay Sport',    icon: 'film',      order: 11 },
  { id: 'arabic',      name_ar: 'قنوات رياضية عربية', icon: 'tv',        order: 12 }
];

function getS2BrandIcon(groupId) {
  const icons = {
    bein: 'sports', shahid: 'satellite', alwan: 'palette',
    shasha: 'theater', thmanyah: 'hash', alkass: 'film',
    fajer: 'sunrise', adsports: 'sports', dubaisports: 'satellite',
    ksasports: 'sports', starzplay: 'film', arabic: 'tv'
  };
  return icons[groupId] || 'tv';
}

/* ═══════════════════════════════════════════════════════════════
   wrapUrlIfNeeded
   ═══════════════════════════════════════════════════════════════ */
function wrapUrlIfNeeded(url) {
  if (!url) return '';
  var u = String(url).trim();
  if (!u) return '';
  if (u.indexOf('/proxy?url=') !== -1) return u;
  if (u.startsWith('http://')) return S2_PROXY_WRAPPER + encodeURIComponent(u);
  return u;
}

/* ═══════════════════════════════════════════════════════════════
   ✅ v16.0: دالة تطبيق الصور من channels.js
   ═══════════════════════════════════════════════════════════════ */
function _applyLogoToChannel(ch) {
  if (!ch) return ch;

  /* ✅ 1) إذا جاءت صورة من Worker (Group logo) → احتفظ بها */
  if (ch.logo && ch.logo.trim()) {
    // إذا كانت http → لفه
    if (ch.logo.startsWith('http://')) {
      ch.logo = S2_PROXY_WRAPPER + encodeURIComponent(ch.logo);
    }
    return ch;
  }

  /* ✅ 2) ابحث في CHANNEL_LOGOS من channels.js */
  if (typeof CHANNEL_LOGOS !== 'undefined' && CHANNEL_LOGOS[ch.id]) {
    var url = CHANNEL_LOGOS[ch.id];
    if (url.startsWith('http://')) {
      url = S2_PROXY_WRAPPER + encodeURIComponent(url);
    }
    ch.logo = url;
    return ch;
  }

  /* ✅ 3) fallback → GROUP_LOGOS */
  if (typeof GROUP_LOGOS !== 'undefined' && ch.group && GROUP_LOGOS[ch.group]) {
    var gurl = GROUP_LOGOS[ch.group];
    if (gurl.startsWith('http://')) {
      gurl = S2_PROXY_WRAPPER + encodeURIComponent(gurl);
    }
    ch.logo = gurl;
    return ch;
  }

  return ch;
}

/* ═══════════════════════════════════════════════════════════════
   loadServer2Channels
   ═══════════════════════════════════════════════════════════════ */
async function loadServer2Channels(forceReload) {
  try {
    let rawData = null;

    /* 1. Cache */
    if (!forceReload) {
      try {
        const cachedTime = parseInt(localStorage.getItem(SERVER2_CACHE_TIME_KEY) || '0', 10);
        const cachedData = localStorage.getItem(SERVER2_CACHE_KEY);
        if (cachedData && (Date.now() - cachedTime) < SERVER2_CACHE_DURATION) {
          rawData = JSON.parse(cachedData);
          console.log('[S2] ✅ From cache (v16.0):', rawData.length, 'channels');
        }
      } catch (e) {}
    }

    /* 2. Fetch */
    if (!rawData) {
      console.log('[S2] 🌐 Fetching from Worker 2...');

      try {
        const res = await fetch(SERVER2_PROXY_API + '/channels', {
          method: 'GET',
          cache: 'no-store',
          mode: 'cors'
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();
        if (!data.success || !data.channels) throw new Error('Invalid response');

        /* ✅ تحويل + تطبيق الصور */
        const mapped = data.channels.map(function(c) {
          var labelsArray = [];
          var urlsArray = [];

          if (c.qualities && Array.isArray(c.qualities)) {
            c.qualities.forEach(function(q) {
              labelsArray.push(q.label || '');
              var wrappedUrl = wrapUrlIfNeeded(q.url);
              urlsArray.push(wrappedUrl);
            });
          }

          var channel = {
            id: c.id,
            name_ar: c.name_ar,
            name_en: c.name_en,
            category: c.group,
            group: c.group,
            brandLabel: c.brandLabel,
            brandIcon: getS2BrandIcon(c.group),
            server: 'server2',
            logo: c.logo || '',    // ← من Worker (Group logo)
            letter: c.letter || (c.name_ar || '').substring(0, 2).toUpperCase(),
            qualities: c.qualities || [],
            urls: {
              server2: {
                qualities: labelsArray,
                list: urlsArray
              }
            }
          };

          /* ✅ v16.0: تطبيق CHANNEL_LOGOS */
          _applyLogoToChannel(channel);
          return channel;
        });

        rawData = mapped;
        console.log('[S2] ✅ Loaded:', rawData.length, 'channels (v16.0 with logos)');

        if (rawData[0]) {
          console.log('[S2] 📎 مثال قناة:', rawData[0].id, '→ logo:', (rawData[0].logo || '').substring(0, 100));
        }

        try {
          localStorage.setItem(SERVER2_CACHE_KEY, JSON.stringify(rawData));
          localStorage.setItem(SERVER2_CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {}

      } catch (fetchError) {
        console.error('[S2-ERROR] Fetch failed:', fetchError.message);
        try {
          const cachedData = localStorage.getItem(SERVER2_CACHE_KEY);
          if (cachedData) {
            rawData = JSON.parse(cachedData);
            console.log('[S2] ⚠️ Using old cache:', rawData.length, 'channels');
          }
        } catch (e2) {}
      }
    }

    SERVER2_DATA = rawData || [];
    SERVER2_GROUPS_DATA = buildServer2Groups(SERVER2_DATA);

    window.SERVER2_CHANNELS = SERVER2_DATA;
    window.S2_CHANNELS_RAW = SERVER2_DATA;

    return {
      channels: SERVER2_DATA,
      groups: SERVER2_GROUPS_DATA
    };

  } catch (e) {
    console.error('[S2-ERROR] Load failed:', e);
    return { channels: [], groups: [] };
  }
}

/* ═══════════════════════════════════════════════════════════════
   buildServer2Groups
   ═══════════════════════════════════════════════════════════════ */
function buildServer2Groups(channels) {
  if (!channels || channels.length === 0) return [];

  const groupsMap = {};

  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i];
    if (!ch.group) continue;
    if (!groupsMap[ch.group]) {
      groupsMap[ch.group] = {
        id: ch.group,
        channels: [],
        icon: ch.brandIcon,
        name_ar: ch.brandLabel
      };
    }
    if (groupsMap[ch.group].channels.indexOf(ch.id) === -1) {
      groupsMap[ch.group].channels.push(ch.id);
    }
  }

  const list = [];
  for (const k in groupsMap) {
    if (!groupsMap.hasOwnProperty(k)) continue;
    const g = groupsMap[k];
    const tg = S2_TARGET_GROUPS.find(function(t) { return t.id === k; });
    if (!tg) continue;

    /* ✅ v16.0: صورة الباقة من GROUP_LOGOS */
    let coverImg = '';
    if (typeof GROUP_LOGOS !== 'undefined' && GROUP_LOGOS[g.id]) {
      coverImg = GROUP_LOGOS[g.id];
      if (coverImg.startsWith('http://')) {
        coverImg = S2_PROXY_WRAPPER + encodeURIComponent(coverImg);
      }
    } else {
      for (let i = 0; i < g.channels.length; i++) {
        const ch = channels.find(function(c) { return c.id === g.channels[i]; });
        if (ch && ch.logo) { coverImg = ch.logo; break; }
      }
    }

    list.push({
      id: 's2grp_' + g.id,
      name_ar: tg.name_ar,
      icon: tg.icon,
      coverImage: coverImg,
      server: 'server2',
      channels: g.channels,
      _order: tg.order
    });
  }

  list.sort(function(a, b) { return a._order - b._order; });
  list.forEach(function(g) { delete g._order; });

  console.log('[S2] 📦 Built', list.length, 'groups');
  return list;
}

/* ═══════════════════════════════════════════════════════════════
   buildServer2Channels
   ═══════════════════════════════════════════════════════════════ */
function buildServer2Channels() {
  return SERVER2_DATA.map(function(ch) {
    return {
      id: ch.id,
      name_ar: ch.name_ar,
      name_en: ch.name_en,
      name: ch.name_ar,
      category: ch.category,
      group: ch.group,
      brandLabel: ch.brandLabel,
      brandIcon: ch.brandIcon,
      server: 'server2',
      logo: ch.logo,
      letter: ch.letter,
      qualities: ch.qualities,
      url: (ch.urls && ch.urls.server2 && ch.urls.server2.list[0]) || '',
      streamUrl: (ch.urls && ch.urls.server2 && ch.urls.server2.list[0]) || '',
      urls: ch.urls
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
   clearServer2Cache
   ═══════════════════════════════════════════════════════════════ */
function clearServer2Cache() {
  try {
    localStorage.removeItem(SERVER2_CACHE_KEY);
    localStorage.removeItem(SERVER2_CACHE_TIME_KEY);
    ['v7','v7_1','v8','v8_1','v9_0','v11_0','v12_0','v13_0','v14_0','v14_1','v15_0'].forEach(function(v) {
      localStorage.removeItem('h90_server2_' + v);
      localStorage.removeItem('h90_server2_time_' + v);
    });
    SERVER2_DATA = [];
    SERVER2_GROUPS_DATA = [];
    console.log('[S2] ✅ Cache cleared (all versions incl. v15_0)');
  } catch (e) {}
}

/* ═══════════════════════════════════════════════════════════════
   Exports
   ═══════════════════════════════════════════════════════════════ */
window.loadServer2Channels = loadServer2Channels;
window.buildServer2Channels = buildServer2Channels;
window.buildServer2Groups = buildServer2Groups;
window.clearServer2Cache = clearServer2Cache;
window.SERVER2_PROXY_API = SERVER2_PROXY_API;
window.S2_PROXY_WRAPPER = S2_PROXY_WRAPPER;
window.S2_TARGET_GROUPS = S2_TARGET_GROUPS;
window.wrapUrlIfNeeded = wrapUrlIfNeeded;

window.SERVER2_CHANNELS = window.SERVER2_CHANNELS || [];
window.S2_CHANNELS_RAW = window.S2_CHANNELS_RAW || [];

console.log(
  '%c Server 2 ' +
  '%c v16.0 — With Logos Applied ',
  'background:linear-gradient(135deg,#00e5ff,#007bff);color:#fff;padding:5px 10px;border-radius:6px 0 0 6px;font-weight:900;font-size:11px;',
  'background:#00a94f;color:#fff;padding:5px 10px;border-radius:0 6px 6px 0;font-weight:900;font-size:10px;'
);
console.log('[S2] 🔗 Worker API:', SERVER2_PROXY_API);
console.log('[S2] 📸 CHANNEL_LOGOS available:', typeof CHANNEL_LOGOS !== 'undefined' ? 'YES' : 'NO');
console.log('[S2] 📦 GROUP_LOGOS available:', typeof GROUP_LOGOS !== 'undefined' ? 'YES' : 'NO');