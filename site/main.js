// ─── Конфігурація ────────────────────────────────────────────────────────────
// Значення беруться з config.js (STREAMLAB_CONFIG).
// URL-параметри мають вищий пріоритет — зручно для тестування:
//   http://localhost:3000/?vps=1.2.3.4&key=mykey
// ─────────────────────────────────────────────────────────────────────────────

(function resolveConfig() {
  const cfg = (typeof STREAMLAB_CONFIG !== 'undefined') ? STREAMLAB_CONFIG : {};
  const params = new URLSearchParams(window.location.search);

  window._SL = {
    vpsIp:     params.get('vps') || cfg.vpsIp     || 'YOUR_VPS_IP',
    streamKey: params.get('key') || cfg.streamKey || 'YOUR_SECRET_KEY',
    rtmpPort:  cfg.rtmpPort || 1935,
    hlsPort:   cfg.hlsPort  || 8888,
  };

  window._SL.hlsUrl  = `http://${window._SL.vpsIp}:${window._SL.hlsPort}/${window._SL.streamKey}/index.m3u8`;
  window._SL.rtmpUrl = `rtmp://${window._SL.vpsIp}:${window._SL.rtmpPort}/live`;
  window._SL.ready   = window._SL.vpsIp !== 'YOUR_VPS_IP' && window._SL.streamKey !== 'YOUR_SECRET_KEY';
})();

// ─── Hero відео (Pexels, без водяних знаків) ────────────────────────────────
const HERO_VIDEOS = [
  'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4',
  'https://videos.pexels.com/video-files/2278095/2278095-hd_1920_1080_30fps.mp4',
  'https://videos.pexels.com/video-files/4625614/4625614-hd_1920_1080_25fps.mp4',
  'https://videos.pexels.com/video-files/856344/856344-hd_1920_1080_25fps.mp4',
];

// ─── Кодеки ─────────────────────────────────────────────────────────────────
const CODECS = {
  jpeg: {
    label: 'JPEG', ext: 'JPG',
    original:   'images/original.jpg',
    compressed: 'images/jpeg/compressed.jpg',
    sizeBefore: '2.4 МБ', sizeAfter: '320 КБ', ratio: '87%',
    cmd: 'ffmpeg -i input.png -q:v 2 output.jpg',
  },
  webp: {
    label: 'WebP', ext: 'WEBP',
    original:   'images/original.jpg',
    compressed: 'images/webp/compressed.webp',
    sizeBefore: '2.4 МБ', sizeAfter: '210 КБ', ratio: '91%',
    cmd: 'ffmpeg -i input.png -c:v libwebp -quality 80 output.webp',
  },
  avif: {
    label: 'AVIF', ext: 'AVIF',
    original:   'images/original.jpg',
    compressed: 'images/avif/compressed.avif',
    sizeBefore: '2.4 МБ', sizeAfter: '95 КБ', ratio: '96%',
    cmd: 'ffmpeg -i input.png -c:v libaom-av1 -crf 30 -b:v 0 output.avif',
  },
  jpeg2000: {
    label: 'JPEG 2000', ext: 'JP2',
    original:   'images/original.jpg',
    compressed: 'images/jpeg2000/compressed.jp2',
    sizeBefore: '2.4 МБ', sizeAfter: '280 КБ', ratio: '88%',
    cmd: 'ffmpeg -i input.png -c:v jpeg2000 -compression_level 80 output.jp2',
  },
};

const PLACEHOLDER_SRC = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">` +
    `<rect width="1280" height="720" fill="#1a1a26"/>` +
    `<text x="640" y="345" font-family="sans-serif" font-size="26" fill="#4f8ef7" text-anchor="middle">Додайте файли зображень у папку images/</text>` +
    `<text x="640" y="390" font-family="sans-serif" font-size="18" fill="#8888a4" text-anchor="middle">Дивіться README.md для команд FFmpeg</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
})();

document.addEventListener('DOMContentLoaded', () => {
  initHeroVideo();
  initNavScroll();
  initMobileNav();
  initCodecTabs();
  initSlider();
  initCopyButtons();
  initStreamConfig();
  initHlsPlayer();
});

function initHeroVideo() {
  const video = document.getElementById('hero-video');
  video.src = HERO_VIDEOS[Math.floor(Math.random() * HERO_VIDEOS.length)];
}

function initNavScroll() {
  const nav = document.getElementById('nav');
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const nav    = document.getElementById('nav');
  if (!toggle) return;
  toggle.addEventListener('click', () => nav.classList.toggle('nav-open'));
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('nav-open'));
  });
}

function initCodecTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      applyCodec(btn.dataset.codec);
    });
  });
  applyCodec('jpeg');
}

function applyCodec(key) {
  const codec = CODECS[key];
  const beforeImg = document.getElementById('before-img');
  const afterImg  = document.getElementById('after-img');
  beforeImg.src = codec.original;
  afterImg.src  = codec.compressed;
  beforeImg.onerror = () => { beforeImg.src = PLACEHOLDER_SRC; };
  afterImg.onerror  = () => { afterImg.src  = PLACEHOLDER_SRC; };
  document.getElementById('codec-label').textContent = codec.label;
  document.getElementById('meta-before').textContent = codec.sizeBefore;
  document.getElementById('meta-after').textContent  = codec.sizeAfter;
  document.getElementById('meta-ratio').textContent  = codec.ratio;
  document.getElementById('meta-format').textContent = codec.ext;
  document.getElementById('cmd-text').textContent    = codec.cmd;
  const input = document.getElementById('slider-input');
  input.value = 50;
  updateSliderPosition(50);
}

function initSlider() {
  const input = document.getElementById('slider-input');
  input.addEventListener('input', () => updateSliderPosition(+input.value));
}

function updateSliderPosition(val) {
  document.getElementById('before-img').style.clipPath = `inset(0 ${100 - val}% 0 0)`;
  document.getElementById('slider-handle').style.left  = val + '%';
}

function initCopyButtons() {
  setupCopy('copy-btn',     'cmd-text');
  setupCopy('copy-mtx-btn', 'mtx-cmd');
  setupCopy('copy-hls-btn', 'hls-url-display');
}

function setupCopy(btnId, textId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const text = document.getElementById(textId).textContent;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Скопійовано!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Копіювати'; btn.classList.remove('copied'); }, 2000);
    });
  });
}

function initStreamConfig() {
  const sl = window._SL;
  const hlsDisplay = document.getElementById('hls-url-display');
  if (hlsDisplay) hlsDisplay.textContent = sl.hlsUrl;
  const obsServer = document.getElementById('obs-server-val');
  const obsKey    = document.getElementById('obs-key-val');
  if (obsServer) obsServer.textContent = sl.rtmpUrl;
  if (obsKey)    obsKey.textContent    = sl.streamKey;
  const warn = document.getElementById('config-warning');
  if (warn) warn.style.display = sl.ready ? 'none' : 'flex';
}

function initHlsPlayer() {
  const video      = document.getElementById('video-player');
  const badge      = document.getElementById('status-badge');
  const offlineMsg = document.getElementById('player-offline-msg');
  const sl         = window._SL;

  if (!sl.ready) { setOffline(badge, offlineMsg); return; }

  if (!Hls.isSupported()) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sl.hlsUrl;
      video.addEventListener('loadedmetadata', () => setLive(badge, offlineMsg, video));
      video.addEventListener('error', () => setOffline(badge, offlineMsg));
    } else {
      setOffline(badge, offlineMsg);
    }
    return;
  }

  const hls = new Hls({ maxLoadingDelay: 4, maxBufferLength: 10 });
  hls.loadSource(sl.hlsUrl);
  hls.attachMedia(video);
  hls.on(Hls.Events.MANIFEST_PARSED, () => setLive(badge, offlineMsg, video));
  hls.on(Hls.Events.ERROR, (_, data) => { if (data.fatal) setOffline(badge, offlineMsg); });
}

function setLive(badge, offlineMsg, video) {
  badge.className   = 'status-badge live';
  badge.textContent = '🔴 LIVE';
  offlineMsg.classList.add('hidden');
  video.play().catch(() => {});
}

function setOffline(badge, offlineMsg) {
  badge.className   = 'status-badge offline';
  badge.textContent = '⚫ Офлайн';
  offlineMsg.classList.remove('hidden');
}