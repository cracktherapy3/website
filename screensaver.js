/* ============================================================
   918919191.xyz — dvd hell screensaver
   several youtube players bouncing and playing at once,
   with wildly inconsistent bounce speeds
   ============================================================ */
(function () {
  "use strict";

  var PLAYER_COUNT = 5;
  var SWITCH_MS = 20000;
  var ACCENTS = ["#C28BA5", "#94608B"];

  /* videos from the playlist that actually allow embedding */
  var VIDEOS = [
    "b4--2AAYnJA",
    "99Gz7VoBXJA",
    "NF-LFSeONhs",
    "wb_RxJX_O3I",
    "8DqGgIgx4KU",
    "MJwDX8vCcjo",
    "Ntft_zd-_NM",
    "HinNtt_QE4M",
    "DNm5eb97Y0g",
    "NP5Ostyfsu8",
    "Aq4UaSGcvbE",
    "ok2Lah-P5PI",
    "TKDylBjXk8E",
    "tyXT6Av9nAY",
    "rmrRC6_cF-o",
    "QAOlNYEPlgU",
    "Yfiej-8NOoI",
    "LYJIVJ3pw_8",
    "nsbCNkDjtQo",
    "_uwNEgTjGQA",
    "d9R3tPG9lZI",
    "dpXaBVKO8r8",
    "1jd7pcRedhc",
    "E-DCAJmDA2g",
    "467Vz6l-3uw",
    "D9OwS0MkQS8",
    "aHk42kDwesM",
    "SWKBorRzqGo",
    "V_5uYoOaVtM",
    "cm8-lW25-e4",
    "lvG9VkvRgFA",
    "IkGEh-U-OUw"
  ];

  var screen = document.getElementById("dvd-screen");
  if (!screen) {
    return;
  }

  var players = [];
  var badIds = Object.create(null);
  var soundUnlocked = false;
  var apiRequested = false;
  var measured = false;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function usedVideos(self) {
    var used = Object.create(null);
    players.forEach(function (p) {
      if (p !== self && p.videoId) {
        used[p.videoId] = true;
      }
    });
    return used;
  }

  function pickVideo(self) {
    var used = usedVideos(self);
    var pool = VIDEOS.filter(function (id) {
      return !used[id] && !badIds[id];
    });
    if (!pool.length) {
      pool = VIDEOS.filter(function (id) {
        return !badIds[id] && (!self || id !== self.videoId);
      });
    }
    if (!pool.length) {
      pool = VIDEOS.filter(function (id) { return !badIds[id]; });
    }
    if (!pool.length) {
      pool = VIDEOS.slice();
    }
    return randomItem(pool);
  }

  /* ----------------------------------------------------------
     build the bouncing boxes
     ---------------------------------------------------------- */

  function buildPlayers() {
    for (var i = 0; i < PLAYER_COUNT; i += 1) {
      var box = document.createElement("div");
      box.className = "dvd-player";
      box.style.setProperty("--dvd-accent", ACCENTS[i % ACCENTS.length]);

      var video = document.createElement("div");
      video.className = "dvd-video";

      var mount = document.createElement("div");
      mount.id = "yt-player-" + i;
      video.appendChild(mount);

      var badge = document.createElement("span");
      badge.className = "dvd-badge";
      badge.setAttribute("aria-hidden", "true");
      badge.textContent = "";

      box.appendChild(video);
      box.appendChild(badge);
      screen.appendChild(box);

      players.push({
        index: i,
        box: box,
        mount: mount,
        player: null,
        videoId: null,
        rotationTimer: null,
        started: false,
        accent: i % ACCENTS.length,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        maxX: 0,
        maxY: 0,
        nextPerturb: 0
      });
    }
  }

  /* ----------------------------------------------------------
     bouncing with deliberately broken speed
     ---------------------------------------------------------- */

  function setTransform(p) {
    p.box.style.transform = "translate3d(" + p.x.toFixed(2) + "px," + p.y.toFixed(2) + "px,0)";
  }

  function setVelocity(p) {
    var speed = clamp(Math.max(screen.clientWidth, screen.clientHeight) * 0.22, 130, 430);
    speed *= 0.6 + Math.random() * 1.1;
    var angle = Math.random() * Math.PI * 2;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.nextPerturb = 0;
  }

  function perturb(p) {
    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (!speed) {
      setVelocity(p);
      return;
    }
    var factor = Math.random() < 0.45
      ? 0.12 + Math.random() * 0.45
      : 1.5 + Math.random() * 2.8;
    var maxSpeed = Math.max(screen.clientWidth, screen.clientHeight) * 1.8;
    var target = clamp(speed * factor, 35, maxSpeed);
    var scale = target / speed;
    p.vx *= scale;
    p.vy *= scale;
  }

  function measure() {
    var screenWidth = screen.clientWidth;
    var screenHeight = screen.clientHeight;
    if (screenWidth <= 0 || screenHeight <= 0) {
      return;
    }

    players.forEach(function (p) {
      var boxWidth = p.box.offsetWidth;
      var boxHeight = p.box.offsetHeight;
      if (!boxWidth || !boxHeight) {
        return;
      }
      p.maxX = Math.max(0, screenWidth - boxWidth);
      p.maxY = Math.max(0, screenHeight - boxHeight);

      if (!measured) {
        p.x = Math.random() * p.maxX;
        p.y = Math.random() * p.maxY;
        setVelocity(p);
      } else {
        p.x = clamp(p.x, 0, p.maxX);
        p.y = clamp(p.y, 0, p.maxY);
      }
      setTransform(p);
    });

    measured = true;
  }

  function onBounce(p) {
    p.accent = (p.accent + 1) % ACCENTS.length;
    p.box.style.setProperty("--dvd-accent", ACCENTS[p.accent]);
    if (Math.random() < 0.55) {
      perturb(p);
      p.nextPerturb = 0;
    }
  }

  var lastFrame = 0;

  function frame(now) {
    window.requestAnimationFrame(frame);

    if (!lastFrame) {
      lastFrame = now;
    }
    var delta = Math.min((now - lastFrame) / 1000, 0.05);
    lastFrame = now;

    players.forEach(function (p) {
      if (now >= p.nextPerturb) {
        perturb(p);
        p.nextPerturb = now + 180 + Math.random() * 1200;
      }

      p.x += p.vx * delta;
      p.y += p.vy * delta;

      var hit = false;
      if (p.x <= 0) {
        p.x = 0;
        p.vx = Math.abs(p.vx);
        hit = true;
      } else if (p.x >= p.maxX) {
        p.x = p.maxX;
        p.vx = -Math.abs(p.vx);
        hit = true;
      }
      if (p.y <= 0) {
        p.y = 0;
        p.vy = Math.abs(p.vy);
        hit = true;
      } else if (p.y >= p.maxY) {
        p.y = p.maxY;
        p.vy = -Math.abs(p.vy);
        hit = true;
      }
      if (hit) {
        onBounce(p);
      }

      setTransform(p);
    });
  }

  /* ----------------------------------------------------------
     youtube
     ---------------------------------------------------------- */

  function unlockAll() {
    soundUnlocked = true;
    players.forEach(function (p) {
      if (!p.player) {
        return;
      }
      try {
        p.player.unMute();
        p.player.setVolume(100);
        p.player.playVideo();
      } catch (err) {}
    });
  }

  function tryAutoUnmute(p) {
    if (!p.player || soundUnlocked) {
      return;
    }
    try {
      p.player.unMute();
      p.player.setVolume(100);
    } catch (err) {
      return;
    }
    window.setTimeout(function () {
      if (!p.player) {
        return;
      }
      var state = -1;
      try {
        state = p.player.getPlayerState();
      } catch (err) {}
      if (state === 1) {
        soundUnlocked = true;
        unlockAll();
        return;
      }
      try {
        p.player.mute();
        p.player.playVideo();
      } catch (err) {}
    }, 700);
  }

  function scheduleRotation(p, delay) {
    window.clearTimeout(p.rotationTimer);
    p.rotationTimer = window.setTimeout(function () {
      rotate(p);
    }, delay || SWITCH_MS);
  }

  function rotate(p) {
    if (!p.player) {
      scheduleRotation(p);
      return;
    }
    var next = pickVideo(p);
    if (!next) {
      scheduleRotation(p);
      return;
    }
    p.videoId = next;
    try {
      p.player.loadVideoById(next);
    } catch (err) {
      scheduleRotation(p);
      return;
    }
    scheduleRotation(p, SWITCH_MS + Math.random() * 1500);
  }

  function onReady(p, event) {
    p.player = event.target;
    try {
      p.player.mute();
    } catch (err) {}

    try {
      var iframe = p.player.getIframe();
      if (iframe) {
        iframe.title = "YouTube video player \u2014 channel 918 screensaver";
        iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
        iframe.setAttribute("tabindex", "-1");
      }
    } catch (err) {}

    if (soundUnlocked) {
      try {
        p.player.unMute();
        p.player.setVolume(100);
      } catch (err) {}
    }

    scheduleRotation(p, SWITCH_MS + p.index * 700 + Math.random() * 1500);
  }

  function onStateChange(p, event) {
    if (!window.YT) {
      return;
    }
    var state = event.data;
    if (state === window.YT.PlayerState.PLAYING) {
      if (!p.started) {
        p.started = true;
        tryAutoUnmute(p);
      }
    } else if (state === window.YT.PlayerState.ENDED) {
      window.clearTimeout(p.rotationTimer);
      rotate(p);
    }
  }

  function onError(p) {
    if (p.videoId) {
      badIds[p.videoId] = true;
    }
    window.clearTimeout(p.rotationTimer);
    window.setTimeout(function () {
      rotate(p);
    }, 400 + Math.random() * 700);
  }

  function createPlayer(p) {
    if (p.player || !window.YT || !window.YT.Player) {
      return;
    }

    var chosen = pickVideo(p);
    p.videoId = chosen;

    var params = {
      autoplay: 1,
      mute: 1,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      modestbranding: 1,
      playsinline: 1,
      rel: 0,
      enablejsapi: 1
    };
    if (window.location.protocol === "http:" || window.location.protocol === "https:") {
      params.origin = window.location.origin;
    }

    try {
      p.player = new window.YT.Player(p.mount.id, {
        width: "100%",
        height: "100%",
        videoId: chosen,
        playerVars: params,
        events: {
          onReady: function (event) { onReady(p, event); },
          onStateChange: function (event) { onStateChange(p, event); },
          onError: function () { onError(p); }
        }
      });
    } catch (err) {
      p.player = null;
    }
  }

  function initPlayers() {
    if (!window.YT || !window.YT.Player) {
      return;
    }
    players.forEach(createPlayer);
  }

  function ensureApi() {
    if (window.YT && window.YT.Player) {
      initPlayers();
      return;
    }
    if (apiRequested) {
      return;
    }
    apiRequested = true;
    window.onYouTubeIframeAPIReady = initPlayers;

    var tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  }

  /* ----------------------------------------------------------
     go
     ---------------------------------------------------------- */

  buildPlayers();
  measure();
  window.requestAnimationFrame(frame);

  if (window.ResizeObserver) {
    try {
      new ResizeObserver(measure).observe(screen);
    } catch (err) {
      window.addEventListener("resize", measure);
    }
  } else {
    window.addEventListener("resize", measure);
  }

  document.addEventListener("pointerdown", unlockAll, { passive: true });
  document.addEventListener("keydown", unlockAll);

  ensureApi();
})();
