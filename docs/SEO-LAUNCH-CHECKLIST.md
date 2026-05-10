# SEO Launch Checklist — мясо-бар.рф

Дата обновления: 10 мая 2026.

## 1) Домен и canonical

- Основной домен: `https://мясо-бар.рф`
- Технический IDN (punycode): `https://xn----8sbc6bkpc5i.xn--p1ai` (используется системой автоматически при необходимости).
- Перед релизом убедиться, что `SITE_URL` установлен в frontend build и backend runtime.

## 2) Frontend build env

Файл `frontend/.env` (или CI env):

```env
SITE_URL=https://мясо-бар.рф
CLEAN_PARAMS=utm_source&utm_medium&utm_campaign&utm_term&utm_content&utm_id&utm_referrer&yclid&ysclid&fbclid
YANDEX_VERIFICATION_CODE=
GOOGLE_SITE_VERIFICATION=
VITE_YM_COUNTER_ID=
VITE_YANDEX_VERIFICATION=
VITE_GOOGLE_SITE_VERIFICATION=
VITE_GA_MEASUREMENT_ID=
```

## 3) Backend env

Файл `backend/.env`:

```env
SITE_URL=https://мясо-бар.рф
CLIENT_ORIGIN=https://мясо-бар.рф
# при необходимости:
# CORS_ORIGINS=https://www.мясо-бар.рф
```

## 4) Проверки после деплоя

1. Открыть `https://мясо-бар.рф/robots.txt`.
2. Проверить наличие `Host` и `Sitemap`.
3. Открыть `https://мясо-бар.рф/sitemap.xml`.
4. Проверить `title/description/OG` и JSON-LD на главной.
5. Проверить `/#menu`, `/#booking`, `/#order`, `/#contacts` — должны меняться title/description.
6. Проверить `manifest.webmanifest` и иконку PWA (`/assets/meatbar-logo-mark-square.webp`).
7. Проверить CORS с боевого домена (ошибок `CORS origin is not allowed` быть не должно).

## 5) Верификация поисковиков

- После получения кодов:
  - заполнить `YANDEX_VERIFICATION_CODE` и `GOOGLE_SITE_VERIFICATION` (build-файлы),
  - заполнить `VITE_YANDEX_VERIFICATION` и `VITE_GOOGLE_SITE_VERIFICATION` (meta-теги),
  - пересобрать frontend.
- Проверить:
  - `https://мясо-бар.рф/yandex_<код>.html`
  - `https://мясо-бар.рф/google<код>.html`

## 6) Подключение в кабинетах

1. Яндекс Вебмастер:
   - добавить сайт,
   - подтвердить права,
   - загрузить sitemap,
   - задать регион: Нижневартовск.
2. Google Search Console:
   - добавить property,
   - подтвердить права,
   - отправить sitemap.
3. 2ГИС / Яндекс Бизнес / Google Business Profile:
   - сверить адрес/телефон/часы/ссылку на сайт,
   - сверить категорию и описание.
