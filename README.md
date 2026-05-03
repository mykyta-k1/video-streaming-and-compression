# StreamLab — Відеотрансляція та Стиснення

Навчальний односторінковий сайт що демонструє:

- Візуальне порівняння кодеків стиснення зображень (JPEG, WebP, AVIF, JPEG 2000) через FFmpeg
- Потокову HLS-трансляцію в реальному часі з OBS через MediaMTX

## Запуск локально

```bash
python3 -m http.server 3000
# відкрийте http://localhost:3000
```

> Протокол `file://` не підходить для HLS — завжди використовуйте локальний HTTP-сервер.

---

## 1. Підготовка зображень для порівняння

Помістіть оригінальне зображення у `images/original.jpg`, потім згенеруйте стиснені варіанти:

```bash
# JPEG
ffmpeg -i images/original.jpg -q:v 2 images/jpeg/compressed.jpg
```

```bash
# WebP
ffmpeg -i images/original.jpg -c:v libwebp -quality 80 images/webp/compressed.webp
```

```bash
# AVIF  (потребує FFmpeg з підтримкою libaom)
ffmpeg -i images/original.jpg -c:v libaom-av1 -crf 30 -b:v 0 images/avif/compressed.avif
```

```bash
# JPEG 2000  (потребує FFmpeg з підтримкою libopenjpeg)
ffmpeg -i images/original.jpg -c:v jpeg2000 -compression_level 80 images/jpeg2000/compressed.jp2
```

Після генерації файлів оновіть поля `sizeBefore`, `sizeAfter` та `ratio` у об'єкті `CODECS` у `main.js` відповідно до реальних розмірів файлів.

---

## 2. Встановлення MediaMTX (RTMP → HLS)

MediaMTX — це медіасервер у вигляді одного виконуваного файлу, який приймає RTMP від OBS та роздає HLS браузеру.

**Завантаження:**

```bash
wget https://github.com/bluenviron/mediamtx/releases/latest/download/mediamtx_linux_amd64.tar.gz
tar -xzf mediamtx_linux_amd64.tar.gz
```

**Конфіг — `mediamtx.yml`:**

```yaml
paths:
  live:
    source: publisher
```

**Запуск:**

```bash
./mediamtx
```

MediaMTX буде слухати на:

- RTMP прийом: `rtmp://localhost:1935/live`
- HLS виддача: `http://localhost:8888/mystream/index.m3u8`

---

## 3. Налаштування OBS Studio

Відкрийте **Налаштування → Трансляція**:

| Поле        | Значення                             |
|-------------|--------------------------------------|
| Сервіс      | Custom Streaming Server              |
| Сервер      | `rtmp://IP_ВАШОГО_СЕРВЕРА:1935/live` |
| Ключ потоку | `mystream`                           |

Відкрийте **Налаштування → Вивід → Трансляція**:

| Поле            | Значення        |
|-----------------|-----------------|
| Кодек           | x264 (Software) |
| Бітрейт         | 2500 Kbps       |
| Інтервал кадрів | 2 с             |

Відкрийте **Налаштування → Відео**:

| Поле                | Значення |
|---------------------|----------|
| Роздільна здатність | 1280×720 |
| Кадрів за секунду   | 30       |

Натисніть **Почати трансляцію** в OBS. Плеєр у браузері автоматично переключиться з ⚫ Офлайн на 🔴 LIVE.

---

## 4. Підключення браузерного плеєра

Відредагуйте `main.js` та оновіть адресу потоку відповідно до вашого сервера:

```js
const HLS_STREAM_URL = 'http://IP_ВАШОГО_СЕРВЕРА:8888/mystream/index.m3u8';
```

---

## Схема передачі сигналу

```
OBS  →(RTMP)→  MediaMTX  →(HLS-сегменти)→  Браузер (HLS.js)
```

- OBS кодує відео та відправляє через RTMP
- MediaMTX приймає RTMP, розбиває на HLS `.ts` сегменти та `.m3u8` плейлист
- HLS.js у браузері завантажує та відтворює сегменти із затримкою ~3–6 секунди
