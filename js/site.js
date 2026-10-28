/* Site-wide script.
   1. Swaps pages in place instead of reloading, so the music keeps playing between pages.
   2. Runs the music: the record player on the homepage and a small stop button elsewhere. */
(function () {
  if (window.__siteBoot) return;
  window.__siteBoot = true;

  var START_AT = 38; // seconds; the song starts here and loops back to here
  var MUSIC_SRC = 'https://www.youtube-nocookie.com/embed/yycVNcishrE?start=' + START_AT + '&rel=0&playsinline=1&enablejsapi=1';
  var FADE_IN_MS = 900;
  var FADE_OUT_MS = 600;
  var playing = false;
  var frame = null;
  var volume = 0;
  var fadeTimer = null;
  var frameReady = false;
  var handshakeTimer = null;

  /* ---------- music ---------- */

  var holder = document.createElement('div');
  holder.setAttribute('data-persist', '');

  var mini = document.createElement('button');
  mini.id = 'mini-player';
  mini.type = 'button';
  mini.setAttribute('data-persist', '');
  mini.setAttribute('aria-label', 'Stop music');
  mini.title = 'Stop music';
  mini.hidden = true;
  mini.innerHTML =
    '<svg viewBox="0 0 120 100" width="60" height="50" aria-hidden="true">' +
    '<defs><mask id="spindle-mini"><rect width="120" height="100" fill="#fff"/><circle cx="48" cy="52" r="2.4" fill="#000"/></mask></defs>' +
        '<g class="mini-record" mask="url(#spindle-mini)">' +
    '<circle cx="48" cy="52" r="40" fill="#1f1611"/>' +
    '<circle cx="48" cy="52" r="29" fill="none" stroke="#fff" stroke-opacity="0.09" stroke-width="0.8"/>' +
    '<path d="M48 52 L66 17.5 A39 39 0 0 1 82 30 Z" fill="#fff" fill-opacity="0.12"/>' +
    '<path d="M48 52 L30 86.5 A39 39 0 0 1 14 74 Z" fill="#fff" fill-opacity="0.12"/>' +
    '<circle cx="48" cy="52" r="14" fill="#ffd6d6"/>' +
    '</g>' +
    '<circle cx="104" cy="14" r="6" fill="#fff" stroke="#555" stroke-width="1.4"/>' +
    '<path d="M104 14 L97 30 L73 58" fill="none" stroke="#555" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  function mount() {
    document.body.appendChild(holder);
    document.body.appendChild(mini);
    syncMusicUI();
    preload();
  }

  /* The player is loaded quietly in the background (paused and silent) as soon as the
     homepage opens, so clicking play only has to send "play" and there is no loading delay. */

  function command(func, args) {
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [] }), '*');
  }

  function setVolume(v) {
    volume = Math.max(0, Math.min(100, Math.round(v)));
    command('setVolume', [volume]);
  }

  // ease-in-out curve: starts gently, speeds up, then settles, so the volume never jumps
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  // smoothly move the volume to `target` over `ms`, then call `done`; `ease` is optional
  function fadeTo(target, ms, done, ease) {
    clearInterval(fadeTimer);
    var from = volume;
    var start = Date.now();
    fadeTimer = setInterval(function () {
      var t = Math.min(1, (Date.now() - start) / ms);
      setVolume(from + (target - from) * (ease ? ease(t) : t));
      if (t === 1) {
        clearInterval(fadeTimer);
        if (done) done();
      }
    }, 20);
  }

  function startPlayback() {
    command('playVideo');
    fadeTo(100, FADE_IN_MS, null, smoothstep);
  }

  function markReady() {
    if (frameReady) return;
    frameReady = true;
    clearInterval(handshakeTimer);
    setVolume(0); // stay silent until play is pressed
    if (playing) startPlayback(); // play was pressed before the player was ready
  }

  window.addEventListener('message', function (e) {
    if (!frame || e.source !== frame.contentWindow) return;
    var d = e.data;
    if (typeof d === 'string') {
      try { d = JSON.parse(d); } catch (err) { return; }
    }
    if (d && (d.event === 'onReady' || d.event === 'initialDelivery')) markReady();
    // state 0 = the song reached its end: loop back to the start point and keep playing
    if (d && d.event === 'onStateChange' && d.info === 0 && playing) {
      command('seekTo', [START_AT, true]);
      command('playVideo');
    }
  });

  function ensureFrame() {
    if (frame) return;
    frame = document.createElement('iframe');
    frame.id = 'audio-frame';
    frame.title = 'Background music';
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('allow', 'autoplay; encrypted-media');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    frame.addEventListener('load', function () {
      // keep greeting the player until it answers, so it will accept commands
      var tries = 0;
      clearInterval(handshakeTimer);
      handshakeTimer = setInterval(function () {
        if (frameReady || ++tries > 40) return clearInterval(handshakeTimer);
        frame.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
      }, 250);
    });
    frame.src = MUSIC_SRC;
    holder.appendChild(frame);
  }

  function preload() {
    if (!document.getElementById('play-btn')) return;
    var run = function () { ensureFrame(); };
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1500 });
    else setTimeout(run, 600);
  }

  function setPlaying(on) {
    playing = on;
    ensureFrame();
    if (on) {
      if (frameReady) startPlayback();
    } else if (frameReady) {
      fadeTo(0, FADE_OUT_MS, function () {
        if (!playing) command('pauseVideo');
      });
    }
    syncMusicUI();
  }

  function syncMusicUI() {
    var btn = document.getElementById('play-btn');
    if (btn) {
      btn.setAttribute('aria-pressed', String(playing));
      btn.setAttribute('aria-label', playing ? 'Stop music' : 'Play music');
      btn.title = playing ? 'Stop music' : 'Play music';
    }
    // on pages without the big record player, show the small stop button while music plays
    mini.hidden = !(playing && !btn);
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('#play-btn')) {
      setPlaying(!playing);
    } else if (e.target.closest && e.target.closest('#mini-player')) {
      setPlaying(false);
    }
  });

  /* ---------- page swapping ---------- */

  function pathOf(href, base) {
    return new URL(href, base).pathname;
  }

  function loadSheet(href) {
    return new Promise(function (resolve) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = link.onerror = function () { resolve(link); };
      document.head.appendChild(link);
    });
  }

  function syncStyles(doc, url) {
    var wanted = [].slice.call(doc.querySelectorAll('link[rel="stylesheet"]')).map(function (l) {
      return new URL(l.getAttribute('href'), url).href;
    });
    var wantedPaths = wanted.map(function (h) { return pathOf(h, url); });
    var have = [].slice.call(document.querySelectorAll('link[rel="stylesheet"]'));
    var havePaths = have.map(function (l) { return pathOf(l.href, location.href); });
    var loads = [];
    wanted.forEach(function (href, i) {
      if (havePaths.indexOf(wantedPaths[i]) === -1) loads.push(loadSheet(href));
    });
    return Promise.all(loads).then(function () {
      have.forEach(function (l, i) {
        if (wantedPaths.indexOf(havePaths[i]) === -1) l.remove();
      });
    });
  }

  function runScripts(root) {
    [].slice.call(root.querySelectorAll('script')).forEach(function (old) {
      var s = document.createElement('script');
      [].slice.call(old.attributes).forEach(function (a) { s.setAttribute(a.name, a.value); });
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  function applyPage(doc) {
    document.title = doc.title;
    var desc = doc.querySelector('meta[name="description"]');
    var curDesc = document.querySelector('meta[name="description"]');
    if (desc && curDesc) curDesc.setAttribute('content', desc.getAttribute('content'));

    document.body.className = doc.body.className;
    [].slice.call(document.body.childNodes).forEach(function (n) {
      if (!(n.nodeType === 1 && n.hasAttribute('data-persist'))) n.remove();
    });
    var frag = document.createDocumentFragment();
    [].slice.call(doc.body.childNodes).forEach(function (n) {
      frag.appendChild(document.importNode(n, true));
    });
    document.body.insertBefore(frag, holder);
    runScripts(document.body);
    syncMusicUI();
    preload();
  }

  function go(url, push) {
    url = new URL(url, location.href).href;
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('bad status');
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        return syncStyles(doc, url).then(function () {
          if (push) history.pushState(null, '', url);
          applyPage(doc);
          var hash = new URL(url, location.href).hash;
          var target = hash && document.getElementById(hash.slice(1));
          if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
        });
      })
      .catch(function (err) {
        if (window.__siteNoFallback) throw err; // used by tests
        // anything unexpected: fall back to a normal page load
        location.href = url;
      });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a');
    if (!a || !a.href) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (u.pathname === location.pathname && u.search === location.search) return;
    if (!/(\.html|\/)$/.test(u.pathname)) return;
    e.preventDefault();
    go(u.href, true);
  });

  window.addEventListener('popstate', function () {
    go(location.href, false);
  });

  window.__site = { go: go, setPlaying: setPlaying };

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
