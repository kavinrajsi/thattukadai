(function ($) {
  function formatMoney(cents) {
    try {
      if (window.Shopify && typeof Shopify.formatMoney === 'function') {
        return Shopify.formatMoney(cents);
      }
    } catch (err) {}
    var amount = (parseInt(cents, 10) || 0) / 100;
    return '₹' + amount.toFixed(2);
  }

  function renderLineVariants(item) {
    if (item.options_with_values && item.options_with_values.length) {
      return item.options_with_values
        .filter(function (ov) {
          return ov && ov.value && ov.value !== 'Default Title';
        })
        .map(function (ov) {
          return (
            '<div class="drawer-item__variant"><span class="opt-name">' +
            ov.name +
            ':</span> <span class="opt-val">' +
            ov.value +
            '</span></div>'
          );
        })
        .join('');
    }

    if (item.variant_title && item.variant_title !== 'Default Title') {
      return '<div class="drawer-item__variant">' + item.variant_title + '</div>';
    }

    return '';
  }

  function renderLineProperties(item) {
    var props = item.properties;
    if (!props) return '';

    var propHtml = Object.keys(props)
      .filter(function (key) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) return false;
        if (key.charAt(0) === '_') return false;
        var value = props[key];
        return value !== null && value !== undefined && String(value).trim() !== '';
      })
      .map(function (key) {
        var value = props[key];
        return (
          '<li><span>' +
          key +
          ':</span> <span>' +
          value +
          '</span></li>'
        );
      })
      .join('');

    if (!propHtml) return '';

    return '<ul class="drawer-item__props">' + propHtml + '</ul>';
  }

  function renderCartHTML(cart) {
    if (!cart || !cart.items || cart.items.length === 0) {
      return '<div class="drawer-empty">Your cart is empty.</div>';
    }

    var itemsHtml = cart.items
      .map(function (item, idx) {
        var line = idx + 1;
        var variantsHtml = renderLineVariants(item);
        var propsHtml = renderLineProperties(item);
        var savingsHtml = '';
        if (item.original_line_price > item.final_line_price) {
          savingsHtml =
            '<div class="drawer-item__savings">Saved ' +
            formatMoney(item.original_line_price - item.final_line_price) +
            '</div>';
        }

        var altText = item.title || item.product_title || '';

        return (
          '<li class="drawer-item" data-line="' +
          line +
          '">' +
          '<img class="drawer-item__image" src="' +
          (item.image || '') +
          '" alt="' +
          altText.replace(/"/g, '&quot;') +
          '" width="95" height="100" loading="lazy">' +
          '<div class="drawer-item__meta">' +
          '<a href="' +
          item.url +
          '" class="drawer-item__title">' +
          item.product_title +
          '</a>' +
          variantsHtml +
          propsHtml +
          '<div class="drawer-item__price">' +
          formatMoney(item.final_line_price) +
          savingsHtml +
          '</div>' +
          '<div class="drawer-item__action">' +
          '<div class="drawer-item__qty">' +
          '<button type="button" class="qty-btn" data-qty-minus aria-label="Decrease quantity">−</button>' +
          '<input class="qty-input" type="number" min="1" inputmode="numeric" value="' +
          item.quantity +
          '" aria-label="Quantity">' +
          '<button type="button" class="qty-btn" data-qty-plus aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<button type="button" class="drawer-item__remove" data-line-remove title="Remove">Remove</button>' +
          '</div>' +
          '</div>' +
          '</li>'
        );
      })
      .join('');

    return (
      '<div class="drawer-content">' +
      '<ul class="drawer-items">' +
      itemsHtml +
      '</ul>' +
      '<div class="drawer-summary">' +
      '<div class="drawer-subtotal">' +
      '<span>Subtotal</span>' +
      '<strong>' +
      formatMoney(cart.total_price) +
      '</strong>' +
      '</div>' +
      '</div>' +
      '</div>'
    );
  }

  /* =========================
     Drawer open / close
  ========================== */
  function openCartDrawer() {
    $('#cart-drawer').addClass('is-open').attr('aria-hidden', 'false');
    $('body').addClass('drawer-open');
  }
  function closeCartDrawer() {
    $('#cart-drawer').removeClass('is-open').attr('aria-hidden', 'true');
    $('body').removeClass('drawer-open');
  }
  $(document).on('click', '#cart-drawer [data-drawer-close], #cart-drawer .cart-drawer__overlay', function () {
    closeCartDrawer();
  });

  /* =========================
     Cart count helpers
  ========================== */
  function cartLabel(n) {
    return n === 1 ? '1 item in cart' : n + ' items in cart';
  }
  function updateCartCount(n) {
    var $badge = $('[data-cart-count]');
    if (!$badge.length) return;
    $badge.text(n);
    $badge.attr('aria-label', cartLabel(n));
  }
  // Initial sync and prefetch drawer view
  $(function () {
    $.getJSON('/cart.js', function (cart) {
      updateCartCount(cart.item_count);
    });
  });

  /* =========================
     Skeleton (instant feedback)
  ========================== */
  function drawerSkeletonHTML() {
    var lines = '';
    for (var i = 0; i < 3; i++) {
      lines +=
        '' +
        '<div class="cart-drawer__skeleton-items-item">' +
        '<div class="cart-drawer__skeleton-items-item__image"></div>' +
        '<div class="cart-drawer__skeleton-items-item__meta">' +
        '<div class="skel skel-line--title"></div>' +
        '<div class="skel skel-line--variant"></div>' +
        '<div class="skel skel-line--price"></div>' +
        '<div class="cart-drawer__skeleton-items-item__meta__action">' +
        '<div class="cart-drawer__skeleton-items-item__meta__action-qty">' +
        '<div class="skel skel-btn"></div>' +
        '<div class="skel skel-input"></div>' +
        '<div class="skel skel-btn"></div>' +
        '</div>' +
        '<div class="skel skel-remove"></div>' +
        '</div>' +
        '</div>' +
        '</div>';
    }
    return '<div class="drawer-skeleton">' + lines + '</div>';
  }

  /* =========================
     Refresh drawer HTML
  ========================== */
  function refreshCartDrawer() {
    return $.getJSON('/cart.js')
      .done(function (cart) {
        $('#cart-drawer .cart-drawer__body').html(renderCartHTML(cart));
        updateCartCount(cart.item_count);
        if (cart && cart.items && cart.items.length) {
          loadCartRecommendations(cart.items[0].product_id);
        } else {
          $('#cart-drawer [data-cart-recommendations]').prop('hidden', true);
        }
      })
      .fail(function () {
        $('#cart-drawer .cart-drawer__body').html('<div class="drawer-empty">Unable to load cart.</div>');
      });
  }

  var lastRecommendationProductId = null;

  function renderRecommendationCard(product) {
    if (!product) return '';
    var image = product.featured_image || '';
    var title = product.title || '';
    var url = product.url || ('/products/' + (product.handle || ''));
    var priceHtml = '<div class="cart-drawer__recommendation-price">' + formatMoney(product.price) + '</div>';
    if (product.compare_at_price && product.compare_at_price > product.price) {
      priceHtml =
        '<div class="cart-drawer__recommendation-price">' +
        '<span>' + formatMoney(product.price) + '</span> ' +
        '<s>' + formatMoney(product.compare_at_price) + '</s>' +
        '</div>';
    }

    var availableVariant = null;
    if (product.variants && product.variants.length) {
      for (var i = 0; i < product.variants.length; i++) {
        if (product.variants[i].available) {
          availableVariant = product.variants[i];
          break;
        }
      }
      if (!availableVariant) availableVariant = product.variants[0];
    }

    var imageMarkup = image
      ? '<img src="' + image + '" alt="' + title.replace(/"/g, '&quot;') + '" loading="lazy">'
      : '';

    var actionMarkup = '';
    if (availableVariant && availableVariant.available) {
      actionMarkup =
        '<button class="cart-drawer__recommendation-button" type="button" data-recommendation-add data-variant-id="' +
        availableVariant.id +
        '" data-product-id="' +
        product.id +
        '">Add to cart</button>';
    } else {
      actionMarkup =
        '<a class="cart-drawer__recommendation-button cart-drawer__recommendation-button--link" href="' +
        url +
        '">View product</a>';
    }

    return (
      '<div class="cart-drawer__recommendation">' +
      imageMarkup +
      '<h5 class="cart-drawer__recommendation-title">' + title + '</h5>' +
      priceHtml +
      actionMarkup +
      '</div>'
    );
  }

  function loadCartRecommendations(productId) {
    if (!productId) return;
    var $wrap = $('#cart-drawer [data-cart-recommendations]');
    if (!$wrap.length) return;

    if (productId === lastRecommendationProductId && !$wrap.prop('hidden')) {
      return;
    }
    lastRecommendationProductId = productId;

    var $list = $wrap.find('.cart-drawer__recommendations-list');
    $wrap.prop('hidden', true);
    $list.empty();

    var url = '/recommendations/products.json?product_id=' + encodeURIComponent(productId) + '&limit=4';

    $.getJSON(url)
      .done(function (data) {
        if (!data || !data.products || !data.products.length) {
          $wrap.prop('hidden', true);
          return;
        }
        var html = data.products.map(renderRecommendationCard).join('');
        $list.html(html);
        $wrap.prop('hidden', false);
      })
      .fail(function () {
        $wrap.prop('hidden', true);
      });
  }

  /* =========================
     Header count click -> open drawer
  ========================== */
  // $(document).on('click', '[data-cart-count]', function (e) {
  //   e.preventDefault();
  //   var $a = $(this).closest('a');
  //   if ($a.length) e.preventDefault();
  //   $('#cart-drawer .cart-drawer__body').html(drawerSkeletonHTML());
  //   openCartDrawer();
  //   $.when(refreshCartDrawer());
  // });
  $(document).on('click', '.header__icon--cart', function (e) {
    e.preventDefault();
    $('#cart-drawer .cart-drawer__body').html(drawerSkeletonHTML());
    openCartDrawer();
    refreshCartDrawer();
  });

  function setLineLoading(line, isLoading) {
    var $item = $('.drawer-item[data-line="' + line + '"]');
    if (!$item.length) return;
    $item.toggleClass('is-loading', !!isLoading);
    $item.find('.drawer-item__remove').toggleClass('is-loading', !!isLoading);
  }

  /* =========================
     Track which submit button triggered the form
  ========================== */
  function isCheckoutSubmit($form, event) {
    var submitterName = '';

    if (event && event.originalEvent && event.originalEvent.submitter) {
      submitterName = event.originalEvent.submitter.name || '';
    }

    if (!submitterName) {
      submitterName = $form.data('submitter-name') || '';
    }

    var isCheckout = submitterName === 'checkout' || $form.data('skip-ajax') === true;

    // Always clear tracking data after determining the intent
    $form.removeData('submitter-name');
    $form.removeData('skip-ajax');

    return isCheckout;
  }

  $(document).on('click', 'form[action*="/cart/add"] button[type="submit"]', function () {
    var $form = $(this).closest('form');
    if (!$form.length) return;

    var name = this.name || '';
    $form.data('submitter-name', name);

    if (name === 'checkout') {
      $form.data('skip-ajax', true);
    } else {
      $form.removeData('skip-ajax');
    }
  });

  /* =========================
     Product form AJAX add-to-cart
  ========================== */
  $(document).on('submit', 'form[action*="/cart/add"]', function (e) {
    var $form = $(this);
    if (isCheckoutSubmit($form, e)) {
      // Let Shopify handle checkout submissions (Buy Now)
      return;
    }

    e.preventDefault();
    var $btn = $form.find('button[type="submit"], .product-atc').first();
    var $id = $form.find('input[name="id"]');
    var $qty = $form.find('[name="quantity"]');

    if (!$id.val()) {
      alert('Please select a variant.');
      return;
    }
    if ($btn.prop('disabled')) {
      return;
    }

    var originalText = $btn.text();
    $btn.prop('disabled', true).addClass('is-loading').text('Adding…');

    $.ajax({
      type: 'POST',
      url: '/cart/add.js',
      data: { id: $id.val(), quantity: $qty.length ? $qty.val() || 1 : 1 },
      dataType: 'json',
    })
      .done(function (data) {
        var addedProductId = data && data.items && data.items.length ? data.items[0].product_id : null;
        // Update count fast
        $.getJSON('/cart.js', function (cart) {
          updateCartCount(cart.item_count);
        });
        // Open instantly with skeleton; load real content in background
        $('#cart-drawer .cart-drawer__body').html(drawerSkeletonHTML());
        openCartDrawer();
        refreshCartDrawer();
        if (addedProductId) {
          loadCartRecommendations(addedProductId);
        }
      })
      .fail(function (xhr) {
        var msg = 'Unable to add to cart.';
        try {
          var res = xhr.responseJSON || JSON.parse(xhr.responseText);
          msg = res.description || res.message || msg;
        } catch (e) {}
        alert(msg);
      })
      .always(function () {
        $btn.prop('disabled', false).removeClass('is-loading').text(originalText);
      });
  });

  /* =========================
     Qty change / Remove (inside drawer)
  ========================== */
  function changeLineQty(line, qty) {
    qty = Math.max(0, parseInt(qty || 0, 10) || 0);
    // START loader
    setLineLoading(line, true);

    return $.ajax({
      type: 'POST',
      url: '/cart/change.js',
      data: { line: line, quantity: qty },
      dataType: 'json',
    })
      .done(function (cart) {
        // Keep drawer visible; refresh content
        $.when(refreshCartDrawer()).always(openCartDrawer);
        // Update header count
        updateCartCount(cart.item_count);
      })
      .fail(function () {
        alert('Could not update cart. Please try again.');
      })
      .always(function () {
        // STOP loader (safe even if the line disappears after remove)
        setLineLoading(line, false);
      });
  }

  $(document).on('click', '.drawer-item [data-qty-plus]', function () {
    var $item = $(this).closest('.drawer-item');
    var line = parseInt($item.data('line'), 10);
    var $in = $item.find('.qty-input');
    var next = (parseInt($in.val(), 10) || 1) + 1;
    $in.val(next);
    changeLineQty(line, next);
  });

  $(document).on('click', '.drawer-item [data-qty-minus]', function () {
    var $item = $(this).closest('.drawer-item');
    var line = parseInt($item.data('line'), 10);
    var $in = $item.find('.qty-input');
    var next = Math.max(1, (parseInt($in.val(), 10) || 1) - 1);
    $in.val(next);
    changeLineQty(line, next);
  });

  $(document).on('blur', '.drawer-item .qty-input', function () {
    var $item = $(this).closest('.drawer-item');
    var line = parseInt($item.data('line'), 10);
    var val = Math.max(1, parseInt($(this).val(), 10) || 1);
    $(this).val(val);
    changeLineQty(line, val);
  });

  $(document).on('keydown', '.drawer-item .qty-input', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $(this).blur();
    }
  });

  $(document).on('click', '.drawer-item [data-line-remove]', function () {
    var $item = $(this).closest('.drawer-item');
    var line = parseInt($item.data('line'), 10);
    changeLineQty(line, 0);
  });

  /* =========================
     Also catch adds by other scripts
  ========================== */
  $(document).ajaxSuccess(function (evt, xhr, settings) {
    if (settings && settings.url && settings.url.indexOf('/cart/add.js') === 0) {
      var responseData = xhr && (xhr.responseJSON || (xhr.responseText ? (function () {
        try {
          return JSON.parse(xhr.responseText);
        } catch (err) {
          return null;
        }
      })() : null));
      var addedProductId = responseData && responseData.items && responseData.items.length ? responseData.items[0].product_id : null;
      $.getJSON('/cart.js', function (cart) {
        updateCartCount(cart.item_count);
      });
      $('#cart-drawer .cart-drawer__body').html(drawerSkeletonHTML());
      openCartDrawer();
      refreshCartDrawer();
      if (addedProductId) {
        loadCartRecommendations(addedProductId);
      }
    }
  });

  $('#cart-drawer').on('click', '[data-recommendation-add]', function () {
    var $btn = $(this);
    var variantId = $btn.data('variant-id');
    var productId = $btn.data('product-id');
    if (!variantId) return;

    var originalText = $btn.text();
    $btn.prop('disabled', true).text('Adding…');

    $.ajax({
      type: 'POST',
      url: '/cart/add.js',
      data: { id: variantId, quantity: 1 },
      dataType: 'json',
    })
      .done(function (data) {
        $btn.text('Added ✓');
        $.getJSON('/cart.js', function (cart) {
          updateCartCount(cart.item_count);
        });
        openCartDrawer();
        refreshCartDrawer().done(function () {
          if (productId) loadCartRecommendations(productId);
        });
      })
      .fail(function () {
        alert('Unable to add item. Please try again.');
      })
      .always(function () {
        setTimeout(function () {
          $btn.prop('disabled', false).text(originalText);
        }, 900);
      });
  });

  $(document).on('mousedown', function (e) {
    var $drawer = $('#cart-drawer');
    if (!$drawer.hasClass('is-open')) return;

    var $panel = $drawer.find('.cart-drawer__panel');
    var clickedInsidePanel = $panel.is(e.target) || $panel.has(e.target).length > 0;
    if (!clickedInsidePanel) {
      closeCartDrawer();
    }
  });

  // prevent clicks inside the panel from bubbling to the document handler
  $(document).on('mousedown', '#cart-drawer .cart-drawer__panel', function (e) {
    e.stopPropagation();
  });

  // Expose helpers if needed elsewhere
  window.refreshCartDrawer = refreshCartDrawer;
  window.openCartDrawer = openCartDrawer;
  window.updateCartCount = updateCartCount;
})(window.jQuery);
