// Basic starter JS for thattukadai theme
console.log('thattukadai theme loaded');

(function () {
  // Find the header once the DOM is ready
  var header = document.querySelector('header');
  if (!header) return;

  var lastY = window.scrollY || window.pageYOffset || 0;
  var currentY = lastY;
  var ticking = false;

  // How much movement to consider a real scroll (px)
  var MIN_DELTA = 10;
  // Don’t toggle until we’re past this many px from the very top
  var START_AT = 60;

  function onScroll() {
    currentY = window.scrollY || window.pageYOffset || 0;
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  function update() {
    var diff = currentY - lastY;

    // Reset classes at the top (no direction yet)
    if (currentY <= START_AT) {
      header.classList.remove('scrollup', 'scrolldown');
      lastY = currentY;
      ticking = false;
      return;
    }

    // Ignore micro scroll jitter
    if (Math.abs(diff) >= MIN_DELTA) {
      if (diff > 0) {
        // Scrolling down
        header.classList.add('scrolldown');
        header.classList.remove('scrollup');
      } else {
        // Scrolling up
        header.classList.add('scrollup');
        header.classList.remove('scrolldown');
      }
      lastY = currentY;
    }

    ticking = false;
  }

  // Use passive listeners for smoother scrolling on mobile
  window.addEventListener('scroll', onScroll, { passive: true });
})();

document.addEventListener('DOMContentLoaded', function () {
  var $ = window.jQuery;
  var $el = $('.bestsellers__list');
  if (!$ || !$el.length || !$el.owlCarousel) return;

  $el.owlCarousel({
    items: 4,
    margin: 20,
    loop: false,
    nav: true,
    dots: false,
    navText: ['‹', '›'],
    responsive: {
      0: { items: 1.1, margin: 14 },
      480: { items: 2.1, margin: 16 },
      768: { items: 3, margin: 18 },
      1024: { items: 4, margin: 20 },
    },
  });
});
