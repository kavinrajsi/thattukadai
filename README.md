# Thattukadai - Shopify Theme

A custom Shopify theme for **thattukadai**, an e-commerce storefront built with Shopify Liquid templates, SASS, and vanilla JavaScript with jQuery. Online Store 2.0 layout — JSON templates wire sections defined in `sections/`.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)
- A Shopify development store

### Installation

```bash
npm install
```

### Development

Run the Shopify CLI dev server and the SASS watcher together. The typical local flow is two terminals:

```bash
# Terminal 1 — Shopify local dev server (http://127.0.0.1:9292)
npm run dev:shopify

# Terminal 2 — choose ONE of the following

# (a) Watch SASS only (sourcemaps, no browser sync)
npm run dev

# (b) Watch SASS + BrowserSync proxy of the Shopify dev server
#     CSS hot-injects without a reload; .liquid/.json/.js changes trigger a full reload.
npm run dev:sync
```

`dev:sync` requires `dev:shopify` to be running first (it proxies `http://127.0.0.1:9292`).

### Production Build

```bash
npm run build   # NODE_ENV=production — minifies assets/base.css via CSSNano
```

No test framework is configured; `npm test` is a placeholder.

## Project Structure

```
thattukadai/
├── assets/           # Compiled CSS, JS, images, fonts (deployed to Shopify)
├── config/           # Theme settings schema and data
├── dev/
│   └── sass/         # SASS source files
│       ├── base.scss           # Entry point — @use imports every active partial
│       ├── common/             # Shared styles (grid, typography, header, footer, etc.)
│       └── page/               # Per-template styles (_template-*.scss)
├── layout/           # theme.liquid, password.liquid
├── locales/          # en.default.json (only locale shipped)
├── sections/         # Configurable sections with JSON schemas (32 files)
├── snippets/         # Reusable Liquid partials (17 files)
└── templates/        # JSON templates defining page sections (incl. customers/)
```

### Build Pipeline

Gulp (`gulpfile.js`) compiles `dev/sass/base.scss` → `assets/base.css`. Autoprefixer always runs; development adds sourcemaps, production runs CSSNano. The `serve` task starts BrowserSync as a proxy of `http://127.0.0.1:9292` so CSS changes stream into the page; changes to `layout/`, `sections/`, `snippets/`, `templates/`, `config/`, and `assets/{js,json}` trigger a full reload.

### JavaScript

All JS files are standalone (no bundler) in `assets/`. jQuery is global.

Loaded globally by `layout/theme.liquid`:

| File | Purpose |
|------|---------|
| `theme.js` | Scroll-direction header classes; footer mobile accordion |
| `header.js` | Header navigation, mega menu, mobile menu, search toggle |
| `drawer-cart.js` | Slide-out AJAX cart drawer (Shopify Cart API) |
| `drawer-product.js` | Quick-view drawer — fetches product JSON, variants, ATC |
| `variant-picker.js` | Product variant selection (swatches + dropdowns), disables unavailable combos, syncs URL/hidden input |
| `product-media.js` | Product image gallery — Swiper thumbs/main + PhotoSwipe lightbox |
| `predictive-search.js` | Web Component for search autocomplete with a11y announcements |

Loaded per-section (not by `theme.liquid`):

| File | Purpose |
|------|---------|
| `announcement.js` | Announcement bar dismissal via session cookies |
| `product-sidebar.js` | Standalone product widget — variant picker, qty, ATC via `/products/{handle}.js` |

`footer.js` is currently empty.

**Third-party libraries** (vendored pre-built in `assets/`):

- jQuery (`jquery.min.js`)
- Swiper (`swiper-bundle.min.js` + CSS)
- Flickity (`flickity.pkgd.min.js` + CSS)
- PhotoSwipe v5 (`photoswipe.umd.min.js`, `photoswipe-lightbox.umd.min.js` + CSS)
- Owl Carousel 2 (`owl.carousel.js` + default theme CSS)

PhotoSwipe and Swiper are only loaded on `product` pages; Flickity is loaded on `index`, `collection`, and `product` pages.

### Custom Fonts

The theme ships the Neilvard font family (OTF/TTF pairs in `assets/`): One, Semibold-One, Two, Three, Four, Illustration. `Neilvard-One.ttf` and `Neilvard-Semibold-One.ttf` are preloaded; `@font-face` declarations live inline in `layout/theme.liquid`. The `.price-icon` class uses "Neilvard One".

The layout also reads the theme editor's font picker settings (`heading-1`..`heading-6`, `type_body-1`/`-2`, `font-normal`/`-medium`/`-semibold`/`-bold`/`-extrabold`) and exposes them as CSS variables (`--font-h1`..`--font-b2`, `--font-400`..`--font-800`).

### Theme Settings

`config/settings_schema.json` exposes favicon, brand logo (raster + SVG), color palette, social links, and the font pickers listed above. The boolean `settings.is_local_dev`, when true, disables the `fonts.shopifycdn.com` preconnect and Shopify `font_face` emission — useful when developing offline. Note: this setting is referenced in `layout/theme.liquid` but is not currently defined in `settings_schema.json`; toggle it via `config/settings_data.json` if needed.

## Adding New Styles

When adding a new SASS partial, add a `@use` import in `dev/sass/base.scss` or it will not be compiled into `base.css`. Always run `npm run build` before deploying so the committed `assets/base.css` is up to date — the SCSS sources are not shipped to Shopify (see `.shopifyignore`).

## Deployment

`.shopifyignore` excludes `.git/`, `.gitignore`, `.idea`, `dev/`, `*.md`, and `*.yml` from theme push. Only the compiled artifacts in `assets/` (alongside `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/`) reach Shopify.

## Theme Check

`.theme-check.yml` disables `MatchingTranslations` and `TemplateLength`. All other Shopify theme-check rules apply at their defaults.

## Notes

- `snippets/shogun-optimizer.liquid` is a large third-party (Shogun) script rendered at the top of `<head>`. Keep this in mind when debugging head-of-document performance or CSP issues.
