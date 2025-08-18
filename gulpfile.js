const { src, dest, watch, series, parallel } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const sourcemaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const rename = require('gulp-rename');
const gulpIf = require('gulp-if');
const browserSync = require('browser-sync').create();

const paths = {
  entry: 'dev/sass/base.scss', // your main SCSS file
  scss: 'dev/sass/**/*.scss', // all scss to watch
  dest: 'assets', // Shopify outputs
  liquid: [
    'layout/**/*.liquid',
    'sections/**/*.liquid',
    'snippets/**/*.liquid',
    'templates/**/*.{liquid,json}',
    'config/**/*.{liquid,json}',
    'assets/**/*.{js,json}',
  ],
};

function styles() {
  const isProd = process.env.NODE_ENV === 'production';

  return (
    src(paths.entry, { allowEmpty: true })
      .pipe(plumber({ errorHandler: notify.onError('Sass error: <%= error.message %>') }))
      .pipe(gulpIf(!isProd, sourcemaps.init()))
      .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))
      .pipe(postcss([autoprefixer(), ...(isProd ? [cssnano()] : [])]))
      .pipe(rename({ basename: 'base', extname: '.css' }))
      .pipe(gulpIf(!isProd, sourcemaps.write('.')))
      .pipe(dest(paths.dest))
      // inject CSS without full page reload (only when BS is running)
      .pipe(browserSync.stream({ match: '**/*.css' }))
  );
}

function serve() {
  // IMPORTANT: run `shopify theme dev` separately first (see step 3).
  browserSync.init({
    proxy: 'http://127.0.0.1:9292', // Shopify CLI local server
    open: false, // don’t auto-open browser
    notify: false, // small BS badge off
    reloadDebounce: 200,
  });

  // SCSS → compile + inject
  watch(paths.scss, styles);

  // Any theme file change → full reload
  watch(paths.liquid).on('change', browserSync.reload);
}

function dev() {
  watch(paths.scss, styles);
}

exports.styles = styles;
exports.dev = dev;
exports.serve = series(styles, serve); // run this for BS + watch
exports.default = series(styles, dev); // classic watch without BS
