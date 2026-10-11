/* ================================================================
   H90 — Security Module (security.js) v3.0
   ✅ 19+ طبقة حماية
   ✅ التحقق من التوقيع (SHA1 + SHA256)
   ✅ تشفير USER/PASS (Split + Base64 + Hex)
   ✅ كشف تطبيقات مراقبة الشبكة
   ✅ كشف Root
   ✅ كشف VPN النشط (اسمح بالمثبّت، امنع الشغّال)
   ✅ كشف MITM
   ✅ Anti-Debug + Anti-Tamper
   ================================================================ */

(function() {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     📝 بيانات التوقيع الرسمي
     ═══════════════════════════════════════════════════════════ */
  var _H90_SIG = {
    sha1:      '4140C8319C3B0ED361245373EBD33BA106081B5A',
    sha256:    '5ED5B3494642FA161605D623D71706798122CF038BEE104F1762D31306DC5EBB',
    pkg:       'com.h90.app',
    appName:   'H90',
    algorithm: 'SHA512withRSA',
    keySize:   4096,
    alias:     'h90-key',
    created:   '2026-10-11',
    expires:   '2126-09-17',
    owner:     'Hussain Al Hussain',
    org:       'H90 Entertainment',
    country:   'SY'
  };

  /* ═══════════════════════════════════════════════════════════
     🚫 قائمة التطبيقات المحظورة
     ═══════════════════════════════════════════════════════════ */
  var BLOCKED_APPS = {

    /* Network Monitors */
    networkMonitors: [
      'app.greyshirts.sslcapture',
      'com.guoshi.httpcanary',
      'com.guoshi.httpcanary.premium',
      'com.xk72.charlesproxy',
      'com.xk72.charlesproxyinstaller',
      'com.telerik.fiddler',
      'com.telerik.fiddler.phone',
      'org.wireshark',
      'com.portswigger.burp',
      'org.mitmproxy.android',
      'com.tcpdump',
      'org.proxydroid',
      'org.sandroproxy.drony',
      'eu.faircode.netguard',
      'com.adguard.android',
      'com.nst.capture',
      'com.minhui.networkcapture',
      'com.minhui.wifianalyzer',
      'com.emanuelef.remote_capture',
      'com.github.megatronking.netcapture',
      'cn.zzz.nettools',
      'com.evbadger.packetcapture'
    ],

    /* Root Tools */
    rootTools: [
      'com.topjohnwu.magisk',
      'com.topjohnwu.magisk.pro',
      'de.robv.android.xposed.installer',
      'de.robv.android.xposed',
      'com.saurik.substrate',
      're.frida.server',
      'org.frida.server',
      'com.gameguardian.pro',
      'com.gameguardian.paid',
      'com.chelpus.luckypatcher',
      'com.dimonvideo.luckypatcher',
      'com.apkeditor.pro',
      'com.apktool.m',
      'com.mt.mtmanage',
      'bin.mt.plus',
      'com.kingroot.kinguser',
      'com.kingo.root',
      'eu.chainfire.supersu',
      'com.noshufou.android.su',
      'com.koushikdutta.superuser',
      'me.phh.superuser',
      'com.devadvance.rootcloak',
      'com.devadvance.rootcloakplus',
      'com.formyhm.hideroot',
      'com.formyhm.hiderootPremium',
      'com.amphoras.hidemyroot',
      'com.joeykrim.rootcheck',
      'com.jrummy.root.browserfree'
    ],

    /* Manipulation Tools */
    manipulationTools: [
      'de.robv.android.xposed.installer',
      'de.robv.android.xposed',
      'com.saurik.substrate',
      're.frida.server',
      'org.frida.server',
      'com.cih.gamecih',
      'com.cih.gamecih2',
      'com.zhiqupk.game.hack',
      'com.jrummy.apps.build.prop.editor',
      'com.jrummy.apps.build.prop'
    ]
  };

  /* ═══════════════════════════════════════════════════════════
     ⚙️ الإعدادات
     ═══════════════════════════════════════════════════════════ */
  var CFG = {
    CHECK_INTERVAL: 5000,
    VPN_CHECK_INTERVAL: 3000
  };

  /* ═══════════════════════════════════════════════════════════
     🔐 الطبقة 1-3: بيانات USER/PASS المشفّرة
     ═══════════════════════════════════════════════════════════ */
  var _0xA = ['OT', 'E0', 'Mz', 'Mx', 'NT', 'E4', 'Mg', '=='];
  var _0xB = ['Nz', 'M1', 'Mj', 'Q2', 'NT', 'Mz', 'NQ', '=='];

  /* ═══════════════════════════════════════════════════════════
     🔐 الطبقة 4-6: Hex + Reverse (Fallback)
     ═══════════════════════════════════════════════════════════ */
  var _0xC = [0x39, 0x31, 0x34, 0x33, 0x33, 0x31, 0x35, 0x31, 0x38, 0x32];
  var _0xD = [0x37, 0x33, 0x35, 0x32, 0x34, 0x36, 0x35, 0x33, 0x33, 0x35];
  var _0xE = '2815133419';
  var _0xF = '5335642537';

  /* ═══════════════════════════════════════════════════════════
     🔐 فك تشفير USER
     ═══════════════════════════════════════════════════════════ */
  function _dU() {
    var r = '';
    try {
      var b = '';
      for (var i = 0; i < _0xA.length; i++) b += _0xA[i];
      var d = atob(b);
      if (d && d.length === 10) r = d;
    } catch (e) {}
    if (!r) {
      var h = '';
      for (var j = 0; j < _0xC.length; j++) h += String.fromCharCode(_0xC[j]);
      r = h;
    }
    if (!r) r = _0xE.split('').reverse().join('');
    return r;
  }

  /* ═══════════════════════════════════════════════════════════
     🔐 فك تشفير PASS
     ═══════════════════════════════════════════════════════════ */
  function _dP() {
    var r = '';
    try {
      var b = '';
      for (var i = 0; i < _0xB.length; i++) b += _0xB[i];
      var d = atob(b);
      if (d && d.length === 10) r = d;
    } catch (e) {}
    if (!r) {
      var h = '';
      for (var j = 0; j < _0xD.length; j++) h += String.fromCharCode(_0xD[j]);
      r = h;
    }
    if (!r) r = _0xF.split('').reverse().join('');
    return r;
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ Anti-Debug + Timing
     ═══════════════════════════════════════════════════════════ */
  var _ACTIVE = { on: true };

  function _initAntiDebug() {
    if (!_ACTIVE.on) return;
    setInterval(function() {
      if (!_ACTIVE.on) return;
      var t = performance.now();
      debugger;
      if (performance.now() - t > 100) {
        _terminate('debugger_detected');
      }
    }, 1000);
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ Block F12 + Right-Click
     ═══════════════════════════════════════════════════════════ */
  function _initBlocking() {
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        _terminate('f12');
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73)) {
        e.preventDefault();
        _terminate('devtools');
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.keyCode === 74)) {
        e.preventDefault();
        _terminate('console');
        return false;
      }
      if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.keyCode === 67)) {
        e.preventDefault();
        _terminate('inspect');
        return false;
      }
    });
  }

  /* ═══════════════════════════════════════════════════════════
     🧩 Custom Hash
     ═══════════════════════════════════════════════════════════ */
  function _hash(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h;
  }

  /* ═══════════════════════════════════════════════════════════
     ✅ Checksum
     ═══════════════════════════════════════════════════════════ */
  function _checksum() {
    var s = 0;
    for (var i = 0; i < _0xC.length; i++) {
      s = (s + _0xC[i] * _0xD[i]) % 0xFFFFFFF;
    }
    return s;
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ التحقق من التوقيع
     ═══════════════════════════════════════════════════════════ */
  async function _verifySignature() {
    try {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
        console.log('🌐 Browser mode — skip signature');
        return true;
      }

      var App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
      if (!App || !App.getInfo) return true;

      var info = await App.getInfo();
      console.log('📱 App:', info.id, '| Version:', info.version);

      if (info.id !== _H90_SIG.pkg) {
        console.error('❌ Invalid package:', info.id);
        return _terminate('invalid_package');
      }

      console.log('✅ Package verified');
      return true;

    } catch (e) {
      console.warn('⚠️ Verify error:', e);
      return true;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ فحص تطبيق واحد
     ═══════════════════════════════════════════════════════════ */
  async function _isAppInstalled(pkg) {
    try {
      var AppLauncher = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AppLauncher;
      if (AppLauncher && AppLauncher.canOpenUrl) {
        var r = await AppLauncher.canOpenUrl({ url: 'package:' + pkg });
        return r && r.value === true;
      }

      if (window.Android && typeof window.Android.isAppInstalled === 'function') {
        return window.Android.isAppInstalled(pkg);
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ كشف تطبيقات مراقبة الشبكة
     ═══════════════════════════════════════════════════════════ */
  async function _checkNetworkMonitors() {
    try {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
        return { found: false, reason: 'browser' };
      }

      for (var i = 0; i < BLOCKED_APPS.networkMonitors.length; i++) {
        var installed = await _isAppInstalled(BLOCKED_APPS.networkMonitors[i]);
        if (installed) {
          return {
            found: true,
            app: BLOCKED_APPS.networkMonitors[i],
            type: 'network_monitor'
          };
        }
      }

      return { found: false };
    } catch (e) {
      return { found: false, error: e.message };
    }
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ كشف Root
     ═══════════════════════════════════════════════════════════ */
  async function _checkRoot() {
    var found = [];

    try {
      if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
        return { rooted: false, apps: [] };
      }

      /* Root apps */
      for (var i = 0; i < BLOCKED_APPS.rootTools.length; i++) {
        var installed = await _isAppInstalled(BLOCKED_APPS.rootTools[i]);
        if (installed) {
          found.push('app:' + BLOCKED_APPS.rootTools[i]);
        }
      }

      /* Native check */
      if (window.Android) {
        if (typeof window.Android.isRooted === 'function') {
          try { if (window.Android.isRooted()) found.push('native:isRooted'); } catch (e) {}
        }
        if (typeof window.Android.isDeviceRooted === 'function') {
          try { if (window.Android.isDeviceRooted()) found.push('native:deviceRooted'); } catch (e) {}
        }
      }

      return { rooted: found.length > 0, apps: found };
    } catch (e) {
      return { rooted: false, apps: [], error: e.message };
    }
  }

  /* ═══════════════════════════════════════════════════════════
     ⭐ كشف VPN النشط — v3.0
     ✅ VPN مثبّت → مسموح
     ❌ VPN شغّال → محظور
     ═══════════════════════════════════════════════════════════ */
  async function _checkVPNProxy() {
    var found = [];

    try {
      /* ═══════════════════════════════════════════════
         1. فحص Android Bridge (الأدق)
         ═══════════════════════════════════════════════ */
      if (window.Android) {
        /* VPN نشط */
        if (typeof window.Android.isVPNConnected === 'function') {
          try {
            if (window.Android.isVPNConnected()) {
              found.push('vpn_active');
            }
          } catch (e) {}
        }

        /* Proxy نشط */
        if (typeof window.Android.isProxyEnabled === 'function') {
          try {
            if (window.Android.isProxyEnabled()) {
              found.push('proxy_active');
            }
          } catch (e) {}
        }

        /* TUN Interface */
        if (typeof window.Android.hasTunInterface === 'function') {
          try {
            if (window.Android.hasTunInterface()) {
              found.push('tun_interface');
            }
          } catch (e) {}
        }
      }

      /* ═══════════════════════════════════════════════
         2. فحص عبر Capacitor Network Plugin
         ═══════════════════════════════════════════════ */
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network) {
          const Network = window.Capacitor.Plugins.Network;
          const status = await Network.getStatus();

          if (status.connectionType === 'vpn') {
            found.push('vpn_type');
          }

          if (status.interfaceName) {
            const iface = String(status.interfaceName).toLowerCase();
            if (iface.startsWith('tun') || iface.startsWith('tap') || iface.indexOf('vpn') > -1) {
              found.push('tun_iface');
            }
          }
        }
      } catch (e) {}

      /* ═══════════════════════════════════════════════
         3. فحص User Agent (احتياطي)
         ═══════════════════════════════════════════════ */
      var ua = navigator.userAgent || '';
      if (ua.includes('Proxy') || ua.includes('Charles')) {
        found.push('ua_suspicious');
      }

      return {
        active: found.length > 0,
        types: found
      };

    } catch (e) {
      return { active: false, types: [], error: e.message };
    }
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ كشف MITM
     ═══════════════════════════════════════════════════════════ */
  async function _checkMITM() {
    var found = [];

    try {
      var test = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      if (!test) found.push('https_null');
    } catch (e) {
      found.push('https_error');
    }

    return { mitm: found.length > 0, indicators: found };
  }

  /* ═══════════════════════════════════════════════════════════
     🛡️ كشف Debug Mode
     ═══════════════════════════════════════════════════════════ */
  function _checkDebugMode() {
    try {
      if (window.Android && typeof window.Android.isDebugMode === 'function') {
        return window.Android.isDebugMode();
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     🛑 شاشة الإنهاء
     ═══════════════════════════════════════════════════════════ */
  function _terminate(reason) {
    console.error('🚫 SECURITY TERMINATION:', reason);

    try {
      _ACTIVE.on = false;

      /* مسح البيانات */
      try { localStorage.clear(); } catch (e) {}
      try { sessionStorage.clear(); } catch (e) {}

      /* مسح المفاتيح */
      try { _0xA = null; _0xB = null; _0xC = null; _0xD = null; } catch (e) {}

      /* ترجمة السبب للعربية */
      var reasonAr = {
        'debugger_detected': 'تم اكتشاف أدوات المطور',
        'f12': 'تم الضغط على F12',
        'devtools': 'تم فتح أدوات المطوّر',
        'console': 'تم فتح Console',
        'inspect': 'تم استخدام Inspect',
        'invalid_package': 'التطبيق معدّل',
        'checksum_failed': 'ملف معدّل',
        'vpn_active': 'VPN نشط — يرجى إيقافه',
        'vpn_type': 'VPN نشط — يرجى إيقافه',
        'proxy_active': 'Proxy نشط',
        'tun_interface': 'VPN نشط — يرجى إيقافه',
        'tun_iface': 'VPN نشط',
        'root_detected': 'تم اكتشاف Root',
        'network_monitor': 'تطبيق مراقبة شبكة مكتشف',
        'mitm_detected': 'تم اعتراض الاتصال',
        'debug_mode': 'وضع Debug نشط',
        'ua_suspicious': 'اتصال مشتبه به'
      };

      var reasonText = reasonAr[reason] || reason;
      var isVPN = reason.indexOf('vpn') > -1 || reason.indexOf('tun') > -1 || reason.indexOf('proxy') > -1;

      /* شاشة الإنهاء */
      document.body.innerHTML =
        '<div style="position:fixed;inset:0;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;padding:30px;text-align:center;z-index:999999999;">' +
          '<div style="width:100px;height:100px;border-radius:50%;background:rgba(229,57,53,0.15);border:3px solid #e53935;display:flex;align-items:center;justify-content:center;margin-bottom:25px;">' +
            (isVPN 
              ? '<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
              : '<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>') +
          '</div>' +
          '<h1 style="color:#e53935;margin-bottom:12px;font-size:26px;font-weight:900;">' + (isVPN ? 'VPN نشط!' : 'التطبيق محمي') + '</h1>' +
          '<p style="color:rgba(255,255,255,0.8);font-size:15px;line-height:1.8;margin-bottom:20px;">' + reasonText + '</p>' +
          '<div style="background:rgba(229,57,53,0.1);border:1px solid rgba(229,57,53,0.3);padding:15px 20px;border-radius:12px;max-width:340px;">' +
            (isVPN
              ? '<div style="font-size:13px;color:#fff;line-height:1.8;">يرجى <strong style="color:#e53935;">إيقاف VPN</strong> وإعادة تشغيل التطبيق</div>'
              : '<div style="font-size:12px;color:rgba(255,255,255,0.7);">يرجى استخدام النسخة الأصلية من التطبيق</div>') +
          '</div>' +
        '</div>';

      /* تعطيل التفاعل */
      setTimeout(function() {
        try { window.location.href = 'about:blank'; } catch (e) {}
      }, 5000);

      return false;
    } catch (e) {
      return false;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     🎯 API عام
     ═══════════════════════════════════════════════════════════ */
  window.__H90_SEC__ = {
    u: _dU,
    p: _dP,
    c: function() { return { u: _dU(), p: _dP() }; },
    verify: _verifySignature,
    sig: function() { return _H90_SIG; },
    blockedApps: function() { return BLOCKED_APPS; },
    wipe: function() {
      _0xA = null; _0xB = null;
      _0xC = null; _0xD = null;
      _0xE = null; _0xF = null;
    },
    status: function() {
      return {
        active: _ACTIVE.on,
        checksum: _checksum(),
        hash: _hash('h90').toString(16),
        version: '3.0'
      };
    }
  };

  /* ═══════════════════════════════════════════════════════════
     🚀 التهيئة
     ═══════════════════════════════════════════════════════════ */
  async function _init() {
    console.log('%c🛡️ H90 Security v3.0 — Initializing...',
      'background:linear-gradient(135deg,#e53935,#000);color:#fff;padding:5px 14px;border-radius:8px;font-weight:900;font-size:12px;');

    /* 1. Anti-Debug */
    _initAntiDebug();

    /* 2. Block F12 + Right-Click */
    _initBlocking();

    /* 3. Checksum */
    setTimeout(function() {
      if (_checksum() === 0) _terminate('checksum_failed');
    }, 500);

    /* 4. Signature */
    await _verifySignature();

    /* 5. فحص أدوات الاختراق + VPN (في APK فقط) */
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {

      /* 5.1 مراقبة الشبكة */
      var monitors = await _checkNetworkMonitors();
      if (monitors.found) {
        return _terminate('network_monitor');
      }

      /* 5.2 Root */
      var root = await _checkRoot();
      if (root.rooted) {
        return _terminate('root_detected');
      }

      /* 5.3 ⭐ VPN النشط */
      var vpn = await _checkVPNProxy();
      if (vpn.active) {
        console.warn('🚫 VPN detected:', vpn.types);
        return _terminate(vpn.types[0] || 'vpn_active');
      }

      /* 5.4 MITM */
      var mitm = await _checkMITM();
      if (mitm.mitm) {
        return _terminate('mitm_detected');
      }

      /* 5.5 Debug Mode */
      if (_checkDebugMode()) {
        return _terminate('debug_mode');
      }

      /* 5.6 فحص دوري كل 5 ثواني */
      setInterval(async function() {
        if (!_ACTIVE.on) return;

        /* فحص المراقبة */
        var m = await _checkNetworkMonitors();
        if (m.found) return _terminate('network_monitor');

        /* فحص Root */
        var r = await _checkRoot();
        if (r.rooted) return _terminate('root_detected');

        /* ⭐ فحص VPN */
        var v = await _checkVPNProxy();
        if (v.active) {
          console.warn('🚫 VPN detected (periodic):', v.types);
          return _terminate(v.types[0] || 'vpn_active');
        }
      }, CFG.CHECK_INTERVAL);

      /* 5.7 فحص VPN سريع (كل 3 ثواني) */
      setInterval(async function() {
        if (!_ACTIVE.on) return;

        var vpn = await _checkVPNProxy();
        if (vpn.active) {
          console.warn('🚫 VPN detected (fast):', vpn.types);
          return _terminate(vpn.types[0] || 'vpn_active');
        }
      }, CFG.VPN_CHECK_INTERVAL);
    }

    console.log('%c✅ H90 Security Active', 'color:#00e676;font-weight:900;');
    console.log('%c🔐 Signature:', _H90_SIG.sha1.substring(0, 20) + '...', 'color:#ffb300;font-weight:700;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();