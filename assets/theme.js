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
