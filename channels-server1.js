/* ================================================================
   H90 — channels-server1.js (v10.2 — Direct TS for VLC)
   ================================================================
   ✅ جلب القنوات من Worker v6.0 (.ts)
   ✅ كل الـ 12 مجموعة في TARGET_GROUPS
   ✅ روابط .ts مباشرة لـ VLC (بدون Worker)
   ✅ Worker يعمل فقط للفيديو إذا احتاج (في Server 2)
   🔧 v10.2: إزالة تمرير VLC عبر Worker (لأن .ts يعمل مباشرة)
   ================================================================ */

'use strict';

/* ═══════════════════════════════════════════════════════════════
   [01] الإعدادات
   ═══════════════════════════════════════════════════════════════ */

const PROXY_API = 'https://h90-server2.houssenammaradnan.workers.dev';

const CACHE_KEY = 'h90_server1_v21';
const CACHE_TIME_KEY = 'h90_server1_time_v21';
const CACHE_DURATION = 60 * 60 * 1000;

/* ═══════════════════════════════════════════════════════════════
   ✅ TARGET_GROUPS — كل الـ 12 مجموعة مع ترتيبها
   ═══════════════════════════════════════════════════════════════ */
const TARGET_GROUPS = [
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

/* ═══════════════════════════════════════════════════════════════
   [02] S1_LOG
   ═══════════════════════════════════════════════════════════════ */
const S1_LOG = (function() {
  const DEBUG = true;
  function log(level) {
    if (!DEBUG && level !== 'error') return;
    const args = Array.prototype.slice.call(arguments, 1);
    const m = { log: console.log, warn: console.warn, error: console.error };
    (m[level] || console.log).apply(console, ['[S1]'].concat(args));
  }
  return {
    log: function() { log.apply(null, ['log'].concat(Array.prototype.slice.call(arguments))); },
    warn: function() { log.apply(null, ['warn'].concat(Array.prototype.slice.call(arguments))); },
    error: function() { log.apply(null, ['error'].concat(Array.prototype.slice.call(arguments))); }
  };
})();

/* ═══════════════════════════════════════════════════════════════
   [03] S1_FINGERPRINT
   ═══════════════════════════════════════════════════════════════ */
const S1_FINGERPRINT = (function() {
  let _cached = null;
  function generate() {
    if (_cached) return _cached;
    const parts = [
      navigator.userAgent.substring(0, 50),
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset()
    ];
    let hash = 0;
    const raw = parts.join('|');
    for (let i = 0; i < raw.length; i++) {
      hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }
    _cached = Math.abs(hash).toString(36);
    return _cached;
  }
  return { generate: generate };
})();

/* ═══════════════════════════════════════════════════════════════
   [04] S1_RATE
   ═══════════════════════════════════════════════════════════════ */
const S1_RATE = (function() {
  const requests = new Map();
  function check(key, maxPerMinute) {
    const now = Date.now();
    const windowStart = now - 60000;
    if (!requests.has(key)) requests.set(key, []);
    const list = requests.get(key).filter(function(t) { return t > windowStart; });
    if (list.length >= maxPerMinute) {
      return { allowed: false, retryAfter: Math.ceil((list[0] + 60000 - now) / 1000) };
    }
    list.push(now);
    requests.set(key, list);
    return { allowed: true };
  }
  return { check: check };
})();

/* ═══════════════════════════════════════════════════════════════
   [05] sortBeINChannels
   ═══════════════════════════════════════════════════════════════ */
function sortBeINChannels(channels) {
  function getChannelType(name) {
    if (!name) return { type: 99, num: 9999 };
    const n = String(name).toUpperCase().trim();
    const numMatch = n.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 9999;
    if (/NEWS/i.test(n)) return { type: 1, num: 100 };
    const hasEn   = /\bEN\b/i.test(n) || /ENGLISH/i.test(n);
    const hasFr   = /\bFR\b/i.test(n) || /FRENCH/i.test(n) || /FRANÇAIS/i.test(n);
    const hasH265 = /H\s*265/i.test(n) || /HEVC/i.test(n);
    if (hasEn)   return { type: 2, num: num };
    if (hasFr)   return { type: 3, num: num };
    if (hasH265) return { type: 4, num: num };
    return { type: 1, num: num };
  }

  return channels.slice().sort(function(a, b) {
    const nameA = a.name_ar || a.name || '';
    const nameB = b.name_ar || b.name || '';
    const isBeinA = a.group === 'bein';
    const isBeinB = b.group === 'bein';
    if (isBeinA && !isBeinB) return -1;
    if (!isBeinA && isBeinB) return 1;
    if (!isBeinA && !isBeinB) return 0;
    const tA = getChannelType(nameA);
    const tB = getChannelType(nameB);
    if (tA.type !== tB.type) return tA.type - tB.type;
    return tA.num - tB.num;
  });
}

/* ═══════════════════════════════════════════════════════════════
   [06] loadServer1Channels
   ═══════════════════════════════════════════════════════════════ */
async function loadServer1Channels(forceReload) {
  try {
    let rawData = null;

    if (!forceReload) {
      try {
        const cachedTime = parseInt(localStorage.getItem(CACHE_TIME_KEY) || '0', 10);
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData && (Date.now() - cachedTime) < CACHE_DURATION) {
          rawData = JSON.parse(cachedData);
          S1_LOG.log('From cache (' + rawData.length + ' channels)');
        }
      } catch (e) {}
    }

    if (!rawData) {
      S1_LOG.log('Fetching from Worker...');
      try {
        const fullURL = PROXY_API + '/channels';
        const res = await fetch(fullURL, {
          method: 'GET',
          cache: 'no-store',
          mode: 'cors',
          headers: {
            'X-H90-Client': 'web',
            'X-H90-Fingerprint': S1_FINGERPRINT.generate()
          }
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();
        if (!data.success || !data.channels) throw new Error('Invalid response');

        const mapped = data.channels.map(function(c) {
          var fixedQualities = (c.qualities || []).map(function(q) {
            var u = String(q.url || '').trim();
            return { label: q.label, url: u };
          });

          return {
            id: c.id,
            name_ar: c.name_ar,
            name_en: c.name_en,
            category: c.group,
            group: c.group,
            brandLabel: c.brandLabel,
            brandIcon: getBrandIcon(c.group),
            server: 'server1',
            logo: c.logo || '',
            letter: c.letter || (c.name_ar || '').substring(0, 2).toUpperCase(),
            qualities: fixedQualities,
            urls: {
              server1: {
                qualities: fixedQualities.map(function(q) { return q.label; }),
                list: fixedQualities.map(function(q) { return q.url; })
              }
            }
          };
        });

        rawData = sortBeINChannels(mapped);
        S1_LOG.log('✅ Loaded ' + rawData.length + ' channels');

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(rawData));
          localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        } catch (e) {}

      } catch (fetchError) {
        console.error('[S1-ERROR] Fetch failed:', fetchError.message);
        throw fetchError;
      }
    } else {
      rawData = sortBeINChannels(rawData);
    }

    return {
      channels: rawData,
      groups: buildServer1Groups(rawData)
    };

  } catch (e) {
    S1_LOG.error('Load failed:', e.message);
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const sorted = sortBeINChannels(parsed);
        S1_LOG.log('Using old cache');
        return {
          channels: sorted,
          groups: buildServer1Groups(sorted)
        };
      }
    } catch (e2) {}
    return { channels: [], groups: [] };
  }
}

/* ═══════════════════════════════════════════════════════════════
   [07] getBrandIcon
   ═══════════════════════════════════════════════════════════════ */
function getBrandIcon(groupId) {
  const icons = {
    bein: 'sports', shahid: 'satellite', alwan: 'palette',
    shasha: 'theater', thmanyah: 'hash', alkass: 'film',
    fajer: 'sunrise', adsports: 'sports', dubaisports: 'satellite',
    ksasports: 'sports', starzplay: 'film', arabic: 'tv',
    stc: 'satellite'
  };
  return icons[groupId] || 'tv';
}

/* ═══════════════════════════════════════════════════════════════
   [08] buildServer1Groups
   ═══════════════════════════════════════════════════════════════ */
function buildServer1Groups(channels) {
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
    const tg = TARGET_GROUPS.find(function(t) { return t.id === k; });
    if (!tg) {
      S1_LOG.warn('مجموعة غير معروفة (تم تجاهلها):', k);
      continue;
    }

    let coverImg = '';
    for (let i = 0; i < g.channels.length; i++) {
      const ch = channels.find(function(c) { return c.id === g.channels[i]; });
      if (ch && ch.logo) { coverImg = ch.logo; break; }
    }

    list.push({
      id: 's1grp_' + g.id,
      name_ar: tg.name_ar,
      icon: tg.icon,
      coverImage: coverImg,
      server: 'server1',
      channels: g.channels,
      _order: tg.order
    });
  }

  list.sort(function(a, b) { return a._order - b._order; });
  list.forEach(function(g) { delete g._order; });

  S1_LOG.log('📦 Built ' + list.length + ' groups');
  return list;
}

/* ═══════════════════════════════════════════════════════════════
   [09] requestStreamUrl — للـ VLC (روابط مباشرة .ts)
   ✅ v10.2: نرسل الرابط الأصلي مباشرة (بدون Worker)
   ═══════════════════════════════════════════════════════════════ */
async function requestStreamUrl(channelId, quality) {
  try {
    S1_LOG.log('Requesting stream:', channelId, '—', quality);

    if (typeof H90_VPN_DETECTOR !== 'undefined') {
      const vpnCheck = await H90_VPN_DETECTOR.detect();
      if (!vpnCheck.allowed) {
        return {
          success: false,
          error: 'vpn_detected',
          message: '⚠️ يرجى إيقاف VPN للمتابعة',
          score: vpnCheck.score
        };
      }
    }

    const rateCheck = S1_RATE.check('stream_' + channelId, 10);
    if (!rateCheck.allowed) {
      return { success: false, error: 'too_many_requests', retryAfter: rateCheck.retryAfter };
    }

    const globalCheck = S1_RATE.check('stream_global', 30);
    if (!globalCheck.allowed) {
      return { success: false, error: 'global_rate_limit', retryAfter: globalCheck.retryAfter };
    }

    var channel = null;
    if (typeof window.getChannelById === 'function') {
      channel = window.getChannelById(channelId);
    }

    if (!channel) return { success: false, error: 'channel_not_found' };

    var urls = [];
    var qualities = [];

    if (channel.urls) {
      if (channel.urls.server1) {
        urls = channel.urls.server1.list || [];
        qualities = channel.urls.server1.qualities || [];
      }
    }

    if (!urls || urls.length === 0) {
      return { success: false, error: 'no_urls' };
    }

    var qualityIndex = 0;
    if (quality && qualities.length > 0) {
      var idx = qualities.indexOf(quality);
      if (idx > -1) qualityIndex = idx;
    }

    var originalUrl = urls[qualityIndex] || urls[0];
    if (!originalUrl) return { success: false, error: 'no_url' };

    /* ✅ v10.2: نرسل الرابط الأصلي مباشرة (.ts يعمل في VLC بدون Worker) */
    var fixedUrl = String(originalUrl).trim();

    S1_LOG.log('✅ Original:', originalUrl);
    S1_LOG.log('✅ Returned (direct):', fixedUrl);

    return {
      success: true,
      url: fixedUrl,
      direct: true
    };

  } catch (e) {
    console.error('[S1-ERROR] Stream request failed:', e.message);
    return { success: false, error: 'network_error', message: e.message };
  }
}

/* ═══════════════════════════════════════════════════════════════
   [10] Cache Helpers
   ═══════════════════════════════════════════════════════════════ */
function clearServer1Cache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    /* مسح الإصدارات القديمة */
    localStorage.removeItem('h90_server1_v17');
    localStorage.removeItem('h90_server1_time_v17');
    localStorage.removeItem('h90_server1_v18');
    localStorage.removeItem('h90_server1_time_v18');
    localStorage.removeItem('h90_server1_v19');
    localStorage.removeItem('h90_server1_time_v19');
    localStorage.removeItem('h90_server1_v20');
    localStorage.removeItem('h90_server1_time_v20');
    console.log('✅ تم مسح Server 1 Cache (كل الإصدارات)');
  } catch (e) {}
}

function getSortedBeINChannels() {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) return [];
    const parsed = JSON.parse(cachedData);
    return sortBeINChannels(parsed);
  } catch (e) {
    return [];
  }
}

function startAutoRefresh(intervalMs) {
  const interval = intervalMs || 60 * 60 * 1000;
  setInterval(async function() {
    try {
      S1_LOG.log('🔄 Auto-refreshing channels...');
      await loadServer1Channels(true);
      S1_LOG.log('✅ Channels refreshed');
    } catch (e) {
      S1_LOG.error('Auto-refresh failed:', e.message);
    }
  }, interval);
}

/* ═══════════════════════════════════════════════════════════════
   [11] Exports
   ═══════════════════════════════════════════════════════════════ */
window.loadServer1Channels = loadServer1Channels;
window.clearServer1Cache = clearServer1Cache;
window.requestStreamUrl = requestStreamUrl;
window.sortBeINChannels = sortBeINChannels;
window.getSortedBeINChannels = getSortedBeINChannels;
window.startAutoRefresh = startAutoRefresh;
window.PROXY_API = PROXY_API;
window.TARGET_GROUPS = TARGET_GROUPS;

console.log('✅ Server 1 — v10.2 (Direct TS for VLC) loaded');
console.log('🔗 Worker API:', PROXY_API);
console.log('📦 Groups:', TARGET_GROUPS.length);
console.log('🎬 VLC Mode: Direct .ts (no proxy)');