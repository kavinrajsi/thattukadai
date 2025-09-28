(function ($) {
  $(function () {
    // Desktop shop panel elements
    var $shopToggles = $('[data-shop-toggle]');
    var $shopPanel = $('#shop-panel');
    var $backdrop = $('[data-backdrop]');
    var $products = $('#mega-products');

    // Mobile menu elements
    var $mobileToggles = $('[data-mobile-toggle]');
    var $mobilePanel = $('#mobile-menu-panel');
    var $mobileShopToggle = $('[data-mobile-shop-toggle]');
    var $mobileShopMenu = $('[data-mobile-shop-menu]');

    // Search elements
    var $searchToggle = $('.js-search-toggle');
    var $searchPanel = $('#site-search');

    // -------------------------
    // DESKTOP SHOP PANEL (existing functionality)
    // -------------------------
    if ($shopPanel.length) {
      function openShopPanel() {
        $shopPanel.prop('hidden', false).addClass('is-open');
        $backdrop.prop('hidden', false).addClass('is-open');
        $shopToggles.attr('aria-expanded', 'true');
        $shopPanel.find('a,button').first().trigger('focus');
        $('body').addClass('menunoscroll');
        $(document).on('keydown.shopEsc', onShopEsc);
      }

      function closeShopPanel() {
        $shopPanel.removeClass('is-open');
        $backdrop.removeClass('is-open');
        $shopToggles.attr('aria-expanded', 'false');
        $('body').removeClass('menunoscroll');
        setTimeout(function () {
          $shopPanel.prop('hidden', true);
          $backdrop.prop('hidden', true);
        }, 180);
        $(document).off('keydown.shopEsc', onShopEsc);
      }

      function onShopEsc(e) {
        if (e.key === 'Escape' || e.keyCode === 27) closeShopPanel();
      }

      $shopToggles.on('click', function () {
        var isOpen = $shopPanel.hasClass('is-open');
        isOpen ? closeShopPanel() : openShopPanel();
      });

      $backdrop.on('click', function () {
        closeShopPanel();
        closeMobileMenu();
      });

      $(document).on('click.shopOutside', function (e) {
        if (!$shopPanel.hasClass('is-open')) return;
        var $header = $('[data-header]');
        if ($(e.target).closest($shopPanel).length === 0 && $(e.target).closest($header).length === 0) {
          closeShopPanel();
        }
      });

      // Product preview functionality (existing)
      var currency = ($products.data('currency') || 'USD').toString();

      function getCollectionHandleFromHref(href) {
        if (!href) return null;
        try {
          var u = new URL(href, window.location.origin);
          var path = u.pathname || '';
          var m = path.match(/\/collections\/([^\/\?\#]+)/i);
          return m ? m[1] : null;
        } catch (e) {
          var m2 = href.match(/\/collections\/([^\/\?\#]+)/i);
          return m2 ? m2[1] : null;
        }
      }

      function shouldNavigate($link) {
        return $link.data('previewClicked') === true;
      }

      function markClicked($link) {
        $link.data('previewClicked', true);
        clearTimeout($link.data('previewTimeout'));
        var t = setTimeout(function () {
          $link.removeData('previewClicked');
        }, 5000);
        $link.data('previewTimeout', t);
      }

      function handleActivateLink(e, $a) {
        var href = $a.attr('href') || '';
        var handle = getCollectionHandleFromHref(href);
        if (!handle) return;

        if (e.type === 'click' && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) {
          return;
        }

        if (!shouldNavigate($a)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          markClicked($a);
          renderProductsLoading();
          fetch('/collections/' + encodeURIComponent(handle) + '/products.json?limit=8', {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
          })
            .then(function (r) {
              // Handle non-2xx
              if (!r.ok) {
                throw new Error('HTTP ' + r.status + ' on products.json');
              }
              // Ensure JSON response (avoid HTML/password page)
              var ct = (r.headers.get('content-type') || '').toLowerCase();
              if (ct.indexOf('application/json') === -1 && ct.indexOf('json') === -1) {
                throw new Error('Non-JSON response (content-type: ' + ct + ')');
              }
              return r.json();
            })
            .then(function (data) {
              if (!data || !Array.isArray(data.products)) {
                throw new Error('Unexpected payload shape');
              }
              // pass handle so we can render "View more"
              renderProductsGrid(data.products.slice(0, 8), handle);
            })
            .catch(function (err) {
              // Optional: log for debugging; safe no-op in production
              if (window && window.console) {
                console.warn('[mega-preview] Load failed for handle "' + handle + '":', err);
              }
              renderProductsError();
            });
        }
      }

      $shopPanel
        .on('click', '.mega__list a', function (e) {
          handleActivateLink(e, $(this));
        })
        .on('keydown', '.mega__list a', function (e) {
          if (e.key === 'Enter' || e.keyCode === 13) handleActivateLink(e, $(this));
        })
        .on('touchstart', '.mega__list a', function (e) {
          handleActivateLink(e, $(this));
        });

      // Rendering helpers (existing)
      function renderProductsLoading() {
        if (!$products.length) return;
        var skeleton = '<div class="mega__grid">';
        for (var i = 0; i < 4; i++) {
          skeleton +=
            '<div class="mega__card skeleton"><div class="skeleton-text"></div><div class="skeleton-img"></div></div>';
        }
        skeleton += '</div>';
        $products.prop('hidden', false).html(skeleton);
      }

      function renderProductsError() {
        if (!$products.length) return;
        $products
          .prop('hidden', false)
          .html('<div class="mega__grid"><div>Could not load products. Please try again.</div></div>');
      }

      function moneyFormat(cents) {
        var value = (parseInt(cents, 10) || 0) / 100;
        try {
          return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
          }).format(value);
        } catch (e) {
          return value.toFixed(2) + ' ' + currency;
        }
      }

      function firstImageSrc(product) {
        if (product && product.images && product.images.length) {
          var src = product.images[0].src;
          if (/_\d+x\./.test(src)) return src;
          return src.replace(/(\.(jpg|jpeg|png|webp))(?:\?.*)?$/i, '_360x$1');
        }
        return null;
      }

      function escapeHtml(str) {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      function renderProductsGrid(products, handle) {
        if (!$products.length) return;
        if (!products.length) {
          // If you want, you can still show a link to the collection even when empty:
          var emptyHtml = '<div>No products found.</div>';
          if (handle) {
            emptyHtml +=
              '<div class="mega__more">' +
              '<a class="mega__cta" href="/collections/' +
              encodeURIComponent(handle) +
              '#main-collection">View more</a>' +
              '</div>';
          }
          $products.prop('hidden', false).html(emptyHtml);
          return;
        }

        var html = '<div class="mega__grid">';
        products.forEach(function (p) {
          var url = '/products/' + p.handle;
          var img = firstImageSrc(p);
          var price =
            typeof p.price !== 'undefined' ? p.price : (p.variants && p.variants[0] && p.variants[0].price) || 0;

          html += '<a class="mega__card" href="' + url + '">';
          html += '<div class="mega__card-title">' + escapeHtml(p.title) + '</div>';
          if (img) {
            html += '<img src="' + img + '" alt="' + escapeHtml(p.title) + '">';
          }
          html += '</a>';
        });
        html += '</div>';

        // ↓ Add the "View more" button after the grid
        if (handle) {
          html +=
            '<div class="mega__more">' +
            '<a class="mega__cta" href="/collections/' +
            encodeURIComponent(handle) +
            '#main-collection">View more</a>' +
            '</div>';
        }

        $products.prop('hidden', false).html(html);
      }
    }

    // -------------------------
    // MOBILE MENU PANEL
    // -------------------------
    if ($mobilePanel.length) {
      function openMobileMenu() {
        $mobilePanel.prop('hidden', false).addClass('is-open');
        $backdrop.prop('hidden', false).addClass('is-open');
        $mobileToggles.attr('aria-expanded', 'true');
        $mobilePanel.find('a,button').first().trigger('focus');
        $('body').addClass('menunoscroll');
        $(document).on('keydown.mobileEsc', onMobileEsc);
      }

      function closeMobileMenu() {
        $mobilePanel.removeClass('is-open');
        $backdrop.removeClass('is-open');
        $mobileToggles.attr('aria-expanded', 'false');
        $('body').removeClass('menunoscroll');
        setTimeout(function () {
          $mobilePanel.prop('hidden', true);
          $backdrop.prop('hidden', true);
        }, 180);
        $(document).off('keydown.mobileEsc', onMobileEsc);
      }

      function onMobileEsc(e) {
        if (e.key === 'Escape' || e.keyCode === 27) closeMobileMenu();
      }

      $mobileToggles.on('click', function () {
        var isOpen = $mobilePanel.hasClass('is-open');
        isOpen ? closeMobileMenu() : openMobileMenu();
      });

      // Mobile shop submenu toggle
      $mobileShopToggle.on('click', function () {
        var $toggle = $(this);
        var $menu = $mobileShopMenu;
        var isExpanded = $toggle.attr('aria-expanded') === 'true';

        if (isExpanded) {
          $toggle.attr('aria-expanded', 'false');
          $menu.prop('hidden', true).removeClass('is-open');
          $toggle.find('.mobile-menu__plus').text('+');
        } else {
          $toggle.attr('aria-expanded', 'true');
          $menu.prop('hidden', false).addClass('is-open');
          $toggle.find('.mobile-menu__plus').text('−');
        }
      });

      $(document).on('click.mobileOutside', function (e) {
        if (!$mobilePanel.hasClass('is-open')) return;
        var $header = $('[data-header]');
        if ($(e.target).closest($mobilePanel).length === 0 && $(e.target).closest($header).length === 0) {
          closeMobileMenu();
        }
      });
    }

    // -------------------------
    // SEARCH PANEL
    // -------------------------
    if ($searchPanel.length && $searchToggle.length) {
      function openSearch() {
        $searchPanel.prop('hidden', false).addClass('is-open');
        $searchPanel.find('input[type="search"]').trigger('focus');
        $('body').addClass('search-open');
        $(document).on('keydown.searchEsc', onSearchEsc);
      }

      function closeSearch() {
        $searchPanel.removeClass('is-open');
        $('body').removeClass('search-open');
        setTimeout(function () {
          $searchPanel.prop('hidden', true);
        }, 180);
        $(document).off('keydown.searchEsc', onSearchEsc);

        // Clear search input and results
        $searchPanel.find('input[type="search"]').val('');
        $searchPanel.find('.predictive-search-results').html('');
      }

      function onSearchEsc(e) {
        if (e.key === 'Escape' || e.keyCode === 27) closeSearch();
      }

      $searchToggle.on('click', function () {
        var isOpen = $searchPanel.hasClass('is-open');
        isOpen ? closeSearch() : openSearch();
      });

      // Handle close button inside search
      $(document).on('click', '.js-search-close', function (e) {
        e.preventDefault();
        closeSearch();
      });

      $(document).on('click.searchOutside', function (e) {
        if (!$searchPanel.hasClass('is-open')) return;
        if ($(e.target).closest($searchPanel).length === 0 && $(e.target).closest($searchToggle).length === 0) {
          closeSearch();
        }
      });
    }

    // -------------------------
    // UTILITY: Close all panels
    // -------------------------
    function closeAllPanels() {
      if ($shopPanel && $shopPanel.hasClass('is-open')) closeShopPanel();
      if ($mobilePanel && $mobilePanel.hasClass('is-open')) closeMobileMenu();
      if ($searchPanel && $searchPanel.hasClass('is-open')) closeSearch();
    }

    // Global escape key handler
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        closeAllPanels();
      }
    });
  });
})(window.jQuery);
