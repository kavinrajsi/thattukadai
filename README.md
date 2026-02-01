# Thattukadai - Shopify Theme

A custom Shopify theme for **thattukadai**, an e-commerce storefront built with Shopify Liquid templates, SASS, and vanilla JavaScript with jQuery.

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

```bash
# Start Shopify local dev server (serves on http://127.0.0.1:9292)
npm run dev:shopify

# Watch SASS and compile to CSS (development mode with source maps)
npm run dev

# Watch SASS + BrowserSync proxy (requires dev:shopify running separately)
npm run dev:sync
```

### Production Build

```bash
npm run build
```

## Project Structure

```
thattukadai/
├── assets/           # Compiled CSS, JS, images, fonts (deployed to Shopify)
├── config/           # Theme settings schema and data
├── dev/
│   └── sass/         # SASS source files
│       ├── base.scss           # Entry point (imports all partials)
│       ├── common/             # Shared styles (grid, typography, header, footer, etc.)
│       └── page/               # Per-template styles (_template-*.scss)
├── layout/           # Base theme layouts
├── sections/         # Configurable content blocks with JSON schemas
├── snippets/         # Reusable Liquid partials
└── templates/        # JSON templates defining page sections
```

### Build Pipeline

Gulp compiles SASS from `dev/sass/base.scss` into `assets/base.css`. Development mode generates source maps; production mode minifies via CSSNano. BrowserSync proxies the Shopify CLI dev server for CSS hot-injection.

### JavaScript

All JS files are standalone (no bundler) in `assets/`:

| File | Purpose |
|------|---------|
| `theme.js` | Global theme initialization, scroll-based header |
| `variant-picker.js` | Product variant selection (swatches + dropdowns) |
| `product-media.js` | Product image gallery with Swiper |
| `drawer-cart.js` | Slide-out AJAX cart drawer |
| `drawer-product.js` | Quick-view product drawer |
| `predictive-search.js` | Search autocomplete |
| `header.js` | Header navigation, mobile menu, search toggle |

**Third-party libraries:** jQuery, Swiper, Flickity, PhotoSwipe, Owl Carousel (included as pre-built bundles).

### Custom Fonts

The theme uses the Neilvard font family (OTF/TTF). The `.price-icon` class uses "Neilvard One" for price typography.

## Adding New Styles

When adding a new SASS partial, it must be added as a `@use` import in `dev/sass/base.scss` to be included in the build. Always run `npm run build` before deploying to ensure `assets/base.css` is up to date.

## Deployment

The `.shopifyignore` file excludes `dev/`, `*.md`, `*.yml`, and git files from theme deployment. Only compiled assets in `assets/` are deployed.

## Code Style

- **Prettier:** 120 char width, single quotes for JS/SCSS, double quotes for Liquid
- **CSScomb:** Configured for CSS property ordering
- **Theme Check:** `MatchingTranslations` and `TemplateLength` checks disabled
