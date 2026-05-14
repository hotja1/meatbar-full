---
inclusion: fileMatch
fileMatchPattern: 'frontend/index.html,frontend/src/lib/seo.ts,frontend/scripts/generate-seo-files.mjs,backend/src/seo.js,backend/src/routes/*.js'
---

# SEO для Нижневартовска (Яндекс + Google)

Основа — официальные гайды Яндекс Вебмастер, Google Search Central, schema.org. Адаптировано под ру-сегмент и локальный бизнес.

## Домен и canonical

- Основной: `https://мясо-бар.рф` (IDN).
- Punycode: `https://xn----8sbc6bkpc5i.xn--p1ai`.
- Runtime canonical строится из реального `window.location.origin` в `frontend/src/lib/seo.ts`.
- Backend тоже нормализует canonical через `seoPayload(req, config)` в `backend/src/seo.js` с учётом `x-forwarded-proto`/`x-forwarded-host`.

## Env для прода

Frontend build:

```
SITE_URL=https://мясо-бар.рф
CLEAN_PARAMS=utm_source&utm_medium&utm_campaign&utm_term&utm_content&utm_id&utm_referrer&yclid&ysclid&fbclid
YANDEX_VERIFICATION_CODE=
GOOGLE_SITE_VERIFICATION=
VITE_YANDEX_VERIFICATION=
VITE_GOOGLE_SITE_VERIFICATION=
VITE_YM_COUNTER_ID=
VITE_GA_MEASUREMENT_ID=
```

Backend:

```
SITE_URL=https://мясо-бар.рф
CLIENT_ORIGIN=https://мясо-бар.рф
```

## Что уже настроено

- `<title>`, `<meta description>`, OG, Twitter Card — в `frontend/index.html`.
- JSON-LD Restaurant в `index.html` + dynamic `@graph` (Restaurant + WebSite + BreadcrumbList) в `seo.ts`.
- Section-based updates title/description на hash-change (`#menu`, `#booking`, `#order`, `#contacts`, `#gallery`, `#journey`, `#our-room`, `#bar`, `#jobs`).
- Admin `/admin/*` → `noindex,nofollow,noarchive` на frontend и `X-Robots-Tag` на backend.
- `robots.txt` и `sitemap.xml` строятся в двух местах:
  - build: `frontend/scripts/generate-seo-files.mjs` → `frontend/dist/`.
  - runtime: backend-роуты `/robots.txt` и `/sitemap.xml` с учётом host из proxy.
- `robots.txt` включает `User-agent: Yandex` + `Clean-param` для UTM/`yclid`/`ysclid`/`fbclid`.
- Верификация поисковиков — через env, не хранится в репо.

## Yandex-специфика

- `Host:` директива в `robots.txt` обязательна.
- `Clean-param` — важнее чем у Google.
- Регион «Нижневартовск» настраивать в Яндекс Вебмастере (`geo.region = RU-KHM`, `geo.placename` в `<meta>` уже есть).
- Турбо-страницы — не подключаем сейчас, можем поверх контента позже.
- Яндекс.Бизнес и 2ГИС карточки синхронизировать вручную (см. `docs/SEO-LAUNCH-CHECKLIST.md`).

## Google-специфика

- `hreflang` для ru-RU + x-default уже есть.
- JSON-LD Restaurant + LocalBusiness — Google читает оба.
- `BreadcrumbList` в schema помогает rich snippets.
- Search Console — верифицировать через DNS TXT или загрузку файла `google<code>.html`.

## Что НЕ ломать

- `lang="ru"` на `<html>`.
- Meta `charset="UTF-8"` и порядок тегов (viewport, theme-color, application-name).
- JSON-LD формат (валидировать на `validator.schema.org` после правки).
- `canonical` и `og:url` — всегда абсолютные.
- `robots` meta — `index,follow,max-image-preview:large` для публичных, `noindex` для `/admin/*`.

## Контент (важнее тех. настройки)

- H1 главной: «Мясо Бар — мясной ресторан в Нижневартовске».
- H2/H3 — длинные ключевые фразы с городом.
- Alt на картинках — с упоминанием бренда и города.
- Микро-копи под секциями: 30–60 слов, упоминание ХМАО / Югра / Самотлорского р-на.

Детальный прод-чеклист — `docs/SEO-LAUNCH-CHECKLIST.md`.
