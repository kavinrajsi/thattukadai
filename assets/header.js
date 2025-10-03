$(document).ready(function () {
  console.log('✅ Document ready');

  // --- Cache ---
  var $body = $('body');
  var $desktopBtn = $('[data-desktop-menu-button]');
  var $mobileBtn = $('[data-mobile-menu-button]');
  var $mobileShopToggle = $('[data-mobile-shop-toggle]');
  var $mobileShopMenu = $('[data-mobile-shop-menu]');
  var $megaProducts = $('#mega-products');
  var $mobileMenuPanel = $('#mobile-menu-panel');

  // --- Helpers ---
  function closeAllMenus() {
    console.log('🔒 closeAllMenus() called');
    $body.removeClass('active-mobile-menu active-desktop-menu');
    $mobileShopMenu.removeClass('active-mobile-submenu').prop('hidden', true);
    $desktopBtn.attr('aria-expanded', 'false');
    $mobileShopToggle.attr('aria-expanded', 'false');
    $('.mega__collection-block').removeClass('active');
  }

  // Smooth scroll helper
  function scrollToWithOffset($el, offset) {
    if (!$el || !$el.length) return;
    $('html, body').animate({ scrollTop: $el.offset().top - (offset || 180) }, 600);
  }

  // Stop outside-click from closing when interacting inside panels
  $mobileMenuPanel.on('click', function (e) {
    console.log('🛑 Click inside mobileMenuPanel');
    e.stopPropagation();
  });
  $mobileShopMenu.on('click', function (e) {
    console.log('🛑 Click inside mobileShopMenu');
    e.stopPropagation();
  });

  // --- Desktop: Shop (+) button ---
  $desktopBtn.on('click', function (e) {
    console.log('🖥️ Desktop button clicked');
    e.stopPropagation();

    $body.toggleClass('active-desktop-menu');
    console.log('Desktop menu active?', $body.hasClass('active-desktop-menu'));

    var expanded = $(this).attr('aria-expanded') === 'true';
    $(this).attr('aria-expanded', String(!expanded));
    console.log('Desktop aria-expanded:', !expanded);
  });

  // --- Mobile: main menu button ---
  $mobileBtn.on('click', function (e) {
    console.log('📱 Mobile main menu button clicked');
    e.stopPropagation();

    $body.toggleClass('active-mobile-menu');
    console.log('Mobile menu active?', $body.hasClass('active-mobile-menu'));

    if ($body.hasClass('active-mobile-menu') && $body.hasClass('active-desktop-menu')) {
      console.log('Closing desktop menu because mobile is active');
      $body.removeClass('active-desktop-menu');
      $desktopBtn.attr('aria-expanded', 'false');
    }
  });

  // --- Mobile: Shop subsection toggle ---
  $mobileShopToggle.on('click', function (e) {
    console.log('📂 Mobile shop toggle clicked');
    e.stopPropagation();

    var isOpen = $(this).attr('aria-expanded') === 'true';
    console.log('Mobile shop toggle was open?', isOpen);
    $(this).attr('aria-expanded', String(!isOpen));

    $mobileShopMenu.toggleClass('active-mobile-submenu');
    console.log('Mobile submenu active?', $mobileShopMenu.hasClass('active-mobile-submenu'));

    $mobileShopMenu.prop('hidden', !$mobileShopMenu.hasClass('active-mobile-submenu'));
  });

  // --- Collection link click (inside mega menu) ---
  $(document).on('click', '.mega__body [data-collection-handle]', function (e) {
    console.log('📦 Collection link clicked');
    e.preventDefault();
    e.stopPropagation();

    var handle = $(this).data('collection-handle');
    console.log('Collection handle clicked:', handle);

    var $targetBlock = $(".mega__collection-block[data-collection-handle='" + handle + "']");

    $('.mega__collection-block').removeClass('active');
    $targetBlock.addClass('active');
    console.log('Activated block for:', handle);
  });

  // --- Click outside anywhere to close/reset ---
  $(document).on('click', function () {
    console.log('🌍 Click outside detected, closing menus');
    closeAllMenus();
  });

  // --- Search toggle ---
  $('.js-search-toggle').on('click', function () {
    $body.toggleClass('active-search');
  });
  $('.js-search-close').on('click', function () {
    $body.removeClass('active-search');
  });

  // --- ESC key to close everything ---
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      console.log('⎋ ESC pressed, closing menus + search');
      closeAllMenus();
      $body.removeClass('active-search');
    }
  });

  // --- Collection-nav links (Filter By nav) ---
  $(document).on('click', '.collection-nav a', function (e) {
    var href = $(this).attr('href') || '';
    var parts = href.split('#');
    var urlPart = parts[0]; // e.g. /collections/sale
    var hashPart = parts[1] || ''; // e.g. main-collection

    var targetId = hashPart || '';
    var $target = targetId ? $('#' + targetId) : $();

    var isSamePage = urlPart === '' || urlPart.replace(/\/+$/, '') === window.location.pathname.replace(/\/+$/, '');

    if (isSamePage && targetId && $target.length) {
      e.preventDefault();
      scrollToWithOffset($target, 180);
      history.pushState(null, '', '#' + targetId);
    } else {
      // different page: allow normal navigation
    }
  });

  // --- On page load: scroll to hash with offset if present ---
  function scrollHashIfPresent() {
    if (window.location.hash) {
      var id = window.location.hash.slice(1);
      var $el = $('#' + id);
      if ($el.length) {
        setTimeout(function () {
          scrollToWithOffset($el, 80);
        }, 0);
      }
    }
  }
  scrollHashIfPresent();
});
