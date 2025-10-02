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
    navContainer: '.bestsellers__nav',
    navText: [
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="#fff" rx="20"/>
        <path fill="#161A1D" fill-rule="evenodd" d="M30 20a.678.678 0 0 0-.678-.679H13.317l4.27-4.269a.679.679 0 0 0-.96-.96l-5.429 5.428a.681.681 0 0 0 0 .96l5.429 5.429a.678.678 0 0 0 1.108-.22.679.679 0 0 0-.148-.741l-4.27-4.27H29.32A.679.679 0 0 0 30 20Z" clip-rule="evenodd"/>
      </svg>`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 40 40">
        <rect width="40" height="40" fill="#fff" rx="20" transform="matrix(-1 0 0 1 40 0)"/>
        <path fill="#161A1D" fill-rule="evenodd" d="M10 20a.678.678 0 0 1 .678-.679h16.004l-4.27-4.269a.679.679 0 0 1 .96-.96l5.429 5.428a.681.681 0 0 1 0 .96l-5.429 5.429a.678.678 0 0 1-1.108-.22.679.679 0 0 1 .148-.741l4.27-4.27H10.68A.679.679 0 0 1 10 20Z" clip-rule="evenodd"/>
      </svg>`,
    ],

    responsive: {
      0: { items: 1.1, margin: 14 },
      480: { items: 2.1, margin: 16 },
      768: { items: 3, margin: 18 },
      1024: { items: 4, margin: 20 },
    },
  });
});

$(document).ready(function () {
  var BREAKPOINT = 767;

  function isMobile() {
    return $(window).width() <= BREAKPOINT;
  }

  function initAccordion() {
    $('.footer__navigtion-menu').each(function () {
      var $menu = $(this);
      var $trigger = $menu.find('[data-acc-trigger]');
      var $panel = $menu.find('[data-acc-panel]');

      if (!$trigger.length || !$panel.length) return;

      if (isMobile()) {
        // collapse all by default
        $menu.removeClass('is-open');
        $trigger.attr('aria-expanded', 'false');
        $panel.attr('hidden', true);
      } else {
        // desktop: always open
        $menu.addClass('is-open');
        $trigger.attr('aria-expanded', 'true');
        $panel.removeAttr('hidden');
      }

      // avoid rebinding multiple times
      if (!$trigger.data('bound')) {
        $trigger.on('click', function () {
          if (!isMobile()) return; // ignore desktop
          var expanded = $trigger.attr('aria-expanded') === 'true';
          if (expanded) {
            $menu.removeClass('is-open');
            $trigger.attr('aria-expanded', 'false');
            $panel.attr('hidden', true);
          } else {
            $menu.addClass('is-open');
            $trigger.attr('aria-expanded', 'true');
            $panel.removeAttr('hidden');
          }
        });
        $trigger.data('bound', true);
      }
    });
  }

  // run on load
  initAccordion();

  // run again when resizing
  var resizeTimer;
  $(window).on('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initAccordion, 150);
  });
});
