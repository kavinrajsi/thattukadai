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
  function openDesktopMenu() {
    if ($body.hasClass('active-desktop-menu')) return;
    $body.addClass('active-desktop-menu');
    $desktopBtn.attr('aria-expanded', 'true');
  }

  function closeDesktopMenu() {
    if (!$body.hasClass('active-desktop-menu')) return;
    $body.removeClass('active-desktop-menu');
    $desktopBtn.attr('aria-expanded', 'false');
    $('.mega__collection-block').removeClass('active');
    $('.mega__body li').removeClass('is-active');
  }

  var desktopHoverTimer = null;

  function activateCollection(handle) {
    var $blocks = $('.mega__collection-block');
    if (!handle) {
      $blocks.removeClass('active');
      return;
    }

    var $targetBlock = $blocks.filter(function () {
      return $(this).data('collection-handle') === handle;
    });

    if (!$targetBlock.length) return;

    $blocks.removeClass('active');
    $targetBlock.addClass('active');
  }

  function setActiveMenuItem($link) {
    var $items = $('.mega__body li');
    $items.removeClass('is-active');
    if ($link && $link.length) {
      $link.closest('li').addClass('is-active');
    }
  }

  $desktopBtn.on('mouseenter focus', function () {
    console.log('🖥️ Desktop button hover/focus');
    clearTimeout(desktopHoverTimer);
    openDesktopMenu();
  });

  $desktopBtn.on('click', function (e) {
    console.log('🖥️ Desktop button clicked');
    e.stopPropagation();

    if ($body.hasClass('active-desktop-menu')) {
      closeDesktopMenu();
    } else {
      openDesktopMenu();
    }
  });

  $megaProducts.on('mouseenter', function () {
    clearTimeout(desktopHoverTimer);
    openDesktopMenu();
  });

  $('.header--desktop').on('mouseleave', function () {
    desktopHoverTimer = setTimeout(function () {
      closeDesktopMenu();
    }, 150);
  });

  $desktopBtn.on('blur', function () {
    desktopHoverTimer = setTimeout(function () {
      if (!$megaProducts.is(':hover')) {
        closeDesktopMenu();
      }
    }, 150);
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
  $(document).on('mouseenter focus', '.mega__body a', function () {
    var $link = $(this);
    var handle = $link.data('collection-handle');
    setActiveMenuItem($link);
    if (handle) {
      activateCollection(handle);
    } else {
      activateCollection(null);
    }
  });

  $(document).on('click', '.mega__body [data-collection-handle]', function (e) {
    console.log('📦 Collection link clicked');
    e.preventDefault();
    e.stopPropagation();
    var $link = $(this);
    var handle = $link.data('collection-handle');
    setActiveMenuItem($link);
    activateCollection(handle);
  });


  // --- Click outside anywhere to close/reset ---
  // $(document).on('click', function () {
  //   console.log('🌍 Click outside detected, closing menus');
  //   closeAllMenus();
  // });

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
      // closeAllMenus();
      $body.removeClass('active-search');
    }
  });

  // Collection filter links: scroll to top when staying on same page
  $(document).on('click', '.collection-nav a', function (e) {
    var href = $(this).attr('href') || '';
    if (!href) return;

    var parts = href.split('#');
    var urlPart = parts[0];
    var hashPart = parts[1] || '';

    var currentPath = window.location.pathname.replace(/\/+$/, '');
    var targetPath = urlPart.replace(/\/+$/, '');

    if (!urlPart || targetPath === currentPath) {
      e.preventDefault();

      var image = document.querySelector('.collection-image');
      var offset = image ? image.offsetHeight : 0;
      window.scrollTo({ top: offset, behavior: 'smooth' });

      if (hashPart) {
        history.pushState(null, '', '#' + hashPart);
      }
    }
  });

});
