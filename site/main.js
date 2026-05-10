// ─── Конфігурація ────────────────────────────────────────────────────────────
(function resolveConfig() {
  const cfg    = window.STREAMLAB_CONFIG || {};
  const params = new URLSearchParams(window.location.search);
  window._SL = {
    vpsIp:     params.get('vps') || cfg.vpsIp     || '',
    streamKey: params.get('key') || cfg.streamKey || '',
    rtmpPort:  cfg.rtmpPort || 1935,
    hlsPort:   cfg.hlsPort  || 8888,
  };
  window._SL.hlsUrl  = `http://${window._SL.vpsIp}:${window._SL.hlsPort}/${window._SL.streamKey}/index.m3u8`;
  window._SL.rtmpUrl = `rtmp://${window._SL.vpsIp}:${window._SL.rtmpPort}/live`;
  window._SL.ready   = Boolean(window._SL.vpsIp && window._SL.streamKey);
})();

// ─── Hero відео ──────────────────────────────────────────────────────────────
const HERO_VIDEOS = [
  'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4',
  'https://videos.pexels.com/video-files/2278095/2278095-hd_1920_1080_30fps.mp4',
  'https://videos.pexels.com/video-files/856344/856344-hd_1920_1080_25fps.mp4',
];

// ─── Кодеки ──────────────────────────────────────────────────────────────────
const CODECS = {
  jpeg: {
    label: 'JPEG',
    ext: 'JPG',
    description: 'Lossy-стиснення. Видаляє деталі які людське око погано помічає. При агресивному стисненні з\'являються характерні блочні артефакти.',
    original:   'images/bmp/original.bmp',
    compressed: 'images/jpeg/compressed.jpg',
    sizeBefore: '7.4 МБ',
    sizeAfter:  '1.1 МБ',
    ratio:      '94%',
    cmd: 'ffmpeg -i input.bmp -q:v 2 output.jpg',
  },
  webp: {
    label: 'WebP',
    ext: 'WEBP',
    description: 'Сучасний формат від Google. Підтримує як lossy так і lossless стиснення. При однаковій якості файл менший ніж JPEG на ~25–35%.',
    original:   'images/bmp/original.bmp',
    compressed: 'images/webp/compressed.webp',
    sizeBefore: '7.4 МБ',
    sizeAfter:  '620.5 КБ',
    ratio:      '96%',
    cmd: 'ffmpeg -i input.bmp -c:v libwebp -quality 80 output.webp',
  },
  avif: {
    label: 'AVIF',
    ext: 'AVIF',
    description: 'Найсучасніший формат на базі кодека AV1. Найкраще стиснення серед усіх — при порівнянній якості файл вдвічі менший за JPEG.',
    original:   'images/bmp/original.bmp',
    compressed: 'images/avif/compressed.avif',
    sizeBefore: '7.4 МБ',
    sizeAfter:  '510.3 КБ',
    ratio:      '98%',
    cmd: 'ffmpeg -i input.bmp -c:v libaom-av1 -crf 30 -b:v 0 output.avif',
  }
};

const PLACEHOLDER_SRC = (() => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">` +
    `<rect width="1280" height="720" fill="#1a1a26"/>` +
    `<text x="640" y="345" font-family="sans-serif" font-size="26" fill="#4f8ef7" text-anchor="middle">Додайте файли зображень у папку images/</text>` +
    `<text x="640" y="390" font-family="sans-serif" font-size="18" fill="#8888a4" text-anchor="middle">Дивіться README.md для команд FFmpeg</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
})();

// ─── Ініціалізація ───────────────────────────────────────────────────────────
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

  // BMP — обидві сторони показують оригінал (немає стиснення)
  beforeImg.src = codec.original;
  afterImg.src  = codec.compressed;
  beforeImg.onerror = () => { beforeImg.src = PLACEHOLDER_SRC; };
  afterImg.onerror  = () => { afterImg.src  = PLACEHOLDER_SRC; };

  document.getElementById('codec-label').textContent      = codec.label;
  document.getElementById('codec-description').textContent = codec.description;
  document.getElementById('meta-before').textContent      = codec.sizeBefore;
  document.getElementById('meta-after').textContent       = codec.sizeAfter;
  document.getElementById('meta-ratio').textContent       = codec.ratio;
  document.getElementById('meta-format').textContent      = codec.ext;
  document.getElementById('cmd-text').textContent         = codec.cmd;

  // Для BMP лівий підпис інший
  const leftLabel = document.getElementById('slider-left-label');
  if (leftLabel) leftLabel.textContent = key === 'bmp' ? 'Еталон' : 'Оригінал';

  const input = document.getElementById('slider-input');
  input.value = 50;
  updateSliderPosition(50);
}

function initSlider() {
  const input = document.getElementById('slider-input');
  const container = document.getElementById('slider-container');
  
  // Ініціалізуємо дефолтну позицію
  updateSliderPosition(50);
  
  // Basic input/change event handling
  input.addEventListener('input', () => updateSliderPosition(+input.value), { passive: true });
  input.addEventListener('change', () => updateSliderPosition(+input.value));
  
  // Enhanced mouse drag support directly on container
  let isDragging = false;
  
  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleDrag(e);
  });
  
  container.addEventListener('mousemove', (e) => {
    if (isDragging) handleDrag(e);
  });
  
  container.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  container.addEventListener('mouseleave', () => {
    isDragging = false;
  });
  
  // Touch support
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    handleDrag(e.touches[0]);
  }, { passive: true });
  
  container.addEventListener('touchmove', (e) => {
    if (isDragging) handleDrag(e.touches[0]);
  }, { passive: true });
  
  container.addEventListener('touchend', () => {
    isDragging = false;
  }, { passive: true });
  
  function handleDrag(e) {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    input.value = percent;
    updateSliderPosition(percent);
  }
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