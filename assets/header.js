(function ($) {
  $(function () {
    var $toggles = $('[data-shop-toggle]');
    var $panel = $('#shop-panel');
    var $backdrop = $('[data-backdrop]');
    var $products = $('#mega-products'); // products preview container
    if (!$panel.length) return;

    // -------------------------
    // Panel open/close
    // -------------------------
    function openPanel() {
      $panel.prop('hidden', false).addClass('is-open');
      $backdrop.prop('hidden', false).addClass('is-open');
      $toggles.attr('aria-expanded', 'true');
      $panel.find('a,button').first().trigger('focus');
      $('body').addClass(' menunoscroll'); // lock page scroll
      $(document).on('keydown.headerEsc', onEsc);
    }

    function closePanel() {
      $panel.removeClass('is-open');
      $backdrop.removeClass('is-open');
      $toggles.attr('aria-expanded', 'false');
      $('body').removeClass('menunoscroll'); // unlock scroll
      setTimeout(function () {
        $panel.prop('hidden', true);
        $backdrop.prop('hidden', true);
      }, 180);
      $(document).off('keydown.headerEsc', onEsc);
    }

    function onEsc(e) {
      if (e.key === 'Escape' || e.keyCode === 27) closePanel();
    }

    $toggles.on('click', function () {
      var isOpen = $panel.hasClass('is-open');
      isOpen ? closePanel() : openPanel();
    });

    $backdrop.on('click', closePanel);

    $(document).on('click.headerOutside', function (e) {
      if (!$panel.hasClass('is-open')) return;
      var $header = $('[data-header]');
      if ($(e.target).closest($panel).length === 0 && $(e.target).closest($header).length === 0) {
        closePanel();
      }
    });

    // -------------------------
    // Collection → Top 8 products preview (navigation-safe)
    // -------------------------
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

    // First activation = preview, second within 5s = navigate
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
      if (!handle) return; // not a collection link → default behavior

      // Allow new tab/window actions
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
            return r.json();
          })
          .then(function (data) {
            if (!data || !Array.isArray(data.products)) {
              renderProductsError();
              return;
            }
            renderProductsGrid(data.products.slice(0, 8));
          })
          .catch(function () {
            renderProductsError();
          });
      } else {
        // second activation → allow navigation
      }
    }

    // Delegate multiple activation types so navigation can’t win the race
    $panel
      .on('click', '.mega__list a', function (e) {
        handleActivateLink(e, $(this));
      })
      .on('keydown', '.mega__list a', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) handleActivateLink(e, $(this));
      })
      .on('touchstart', '.mega__list a', function (e) {
        handleActivateLink(e, $(this));
      });

    // -------------------------
    // Rendering helpers
    // -------------------------
    function renderProductsLoading() {
      if (!$products.length) return;

      var skeleton = '<div class="mega__grid">';
      for (var i = 0; i < 4; i++) {
        skeleton += `
      <div class="mega__card skeleton">
        <div class="skeleton-text"></div>
        <div class="skeleton-img"></div>
      </div>
    `;
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

    function renderProductsGrid(products) {
      if (!$products.length) return;
      if (!products.length) {
        $products.prop('hidden', false).html('<div>No products found.</div>');
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
        // html += '<div class="mega__card-price">' + moneyFormat(price) + '</div>';
        html += '</a>';
      });
      html += '</div>';

      $products.prop('hidden', false).html(html);
    }
  });
})(window.jQuery);
