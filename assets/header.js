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

  // Stop outside-click from closing when interacting inside panels
  // $megaProducts.on('click', function (e) {
  //   console.log('🛑 Click inside megaProducts');
  //   e.stopPropagation();
  // });
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

    // Toggle desktop menu on body
    $body.toggleClass('active-desktop-menu');
    console.log('Desktop menu active?', $body.hasClass('active-desktop-menu'));

    // Update aria-expanded
    var expanded = $(this).attr('aria-expanded') === 'true';
    $(this).attr('aria-expanded', String(!expanded));
    console.log('Desktop aria-expanded:', !expanded);
  });

  // --- Mobile: main menu button ---
  $mobileBtn.on('click', function (e) {
    console.log('📱 Mobile main menu button clicked');
    e.stopPropagation();

    // Toggle mobile menu
    $body.toggleClass('active-mobile-menu');
    console.log('Mobile menu active?', $body.hasClass('active-mobile-menu'));

    // If mobile menu opens and desktop is open, close desktop
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

    // Sync hidden attribute for a11y
    $mobileShopMenu.prop('hidden', !$mobileShopMenu.hasClass('active-mobile-submenu'));
  });

  // --- Collection link click ---
  $(document).on('click', '.mega__body [data-collection-handle]', function (e) {
    console.log('📦 Collection link clicked');
    e.preventDefault();
    e.stopPropagation();

    var handle = $(this).data('collection-handle');
    console.log('Collection handle clicked:', handle);

    var $targetBlock = $(".mega__collection-block[data-collection-handle='" + handle + "']");

    // Activate only the matching block
    $('.mega__collection-block').removeClass('active');
    $targetBlock.addClass('active');
    console.log('Activated block for:', handle);
  });

  // --- Click outside anywhere to close/reset ---
  $(document).on('click', function () {
    console.log('🌍 Click outside detected, closing menus');
    closeAllMenus();
  });

  // Open search
  $('.js-search-toggle').on('click', function () {
    $('body').toggleClass('active-search');
  });

  // Close search
  $('.js-search-close').on('click', function () {
    $('body').removeClass('active-search');
  });

  // --- ESC key to close everything ---
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') {
      console.log('⎋ ESC pressed, closing menus');
      closeAllMenus();
      $('body').removeClass('active-search');
    }
  });
});
