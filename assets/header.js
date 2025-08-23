(function ($) {
  $(function () {
    var $toggles = $('[data-shop-toggle]');
    var $panel = $('#shop-panel');
    var $backdrop = $('[data-backdrop]');
    var $products = $('#mega-products'); // NEW
    if (!$panel.length) return;

    function openPanel() {
      $panel.prop('hidden', false).addClass('is-open');
      $backdrop.prop('hidden', false).addClass('is-open');
      $toggles.attr('aria-expanded', 'true');
      $panel.find('a,button').first().trigger('focus');
      $('body').addClass('noscroll');
      $(document).on('keydown.headerEsc', onEsc);
    }

    function closePanel() {
      $panel.removeClass('is-open');
      $backdrop.removeClass('is-open');
      $toggles.attr('aria-expanded', 'false');
      $('body').removeClass('noscroll');
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
    // NEW: Collection → Top 8 products
    // -------------------------
    var currency = ($products.data('currency') || 'USD').toString();

    // Delegate clicks from the mega list
    $panel.on('click', '.mega__list a', function (e) {
      var href = $(this).attr('href') || '';
      // Match /collections/<handle>
      var m = href.match(/\/collections\/([^\/\?\#]+)/i);
      if (!m) return; // not a collection link → let it navigate normally

      e.preventDefault();
      var handle = m[1];

      // Loading state
      renderProductsLoading();

      fetch('/collections/' + encodeURIComponent(handle) + '/products.json?limit=8', {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (data) {
          // data.products is an array
          if (!data || !Array.isArray(data.products)) {
            renderProductsError();
            return;
          }
          renderProductsGrid(data.products.slice(0, 8));
        })
        .catch(function () {
          renderProductsError();
        });
    });

    function renderProductsLoading() {
      if (!$products.length) return;
      $products.prop('hidden', false).html('<div class="mega__grid"><div>Loading…</div></div>');
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
        // Shopify CDN supports typical sizing params via _{width}x.
        // If the URL already has size, leave it; else add 360x
        var src = product.images[0].src;
        if (/_\d+x\./.test(src)) return src;
        return src.replace(/(\.(jpg|jpeg|png|webp))(?:\?.*)?$/i, '_360x$1');
      }
      return null;
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
        var price = p.price || (p.variants && p.variants[0] && p.variants[0].price) || 0;

        html += '<a class="mega__card" href="' + url + '">';
        if (img) {
          html += '<img src="' + img + '" alt="' + escapeHtml(p.title) + '">';
        }
        html += '<div class="mega__card-title">' + escapeHtml(p.title) + '</div>';
        html += '<div class="mega__card-price">' + moneyFormat(price) + '</div>';
        html += '</a>';
      });
      html += '</div>';

      $products.prop('hidden', false).html(html);
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  });
})(window.jQuery);
