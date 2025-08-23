(function ($) {
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
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/cart?view=drawer';
    document.head.appendChild(link);
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
    return $.get('/cart?view=drawer')
      .done(function (html) {
        $('#cart-drawer .cart-drawer__body').html(html);
      })
      .fail(function () {
        // Fallback render with /cart.js if drawer view missing
        $.getJSON('/cart.js', function (cart) {
          if (!cart || !cart.items) return;
          var html = '<ul class="drawer-items">';
          cart.items.forEach(function (it, idx) {
            // Build variant HTML from options_with_values (robust vs "Default Title")
            var variantHTML = '';
            if (it.options_with_values && it.options_with_values.length) {
              variantHTML = it.options_with_values
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
            } else if (it.variant_title && it.variant_title !== 'Default Title') {
              variantHTML = '<div class="drawer-item__variant">' + it.variant_title + '</div>';
            }

            html +=
              '<li class="drawer-item" data-line="' +
              (idx + 1) +
              '">' +
              '<img class="drawer-item__image" src="' +
              (it.image || '') +
              '" width="60" height="60" alt=""/>' +
              '<div class="drawer-item__meta">' +
              '<a href="' +
              it.url +
              '" class="drawer-item__title">' +
              it.product_title +
              '</a>' +
              variantHTML +
              '<div class="drawer-item__qty">' +
              '<button type="button" class="qty-btn" data-qty-minus aria-label="Decrease quantity">−</button>' +
              '<input class="qty-input" type="number" min="1" inputmode="numeric" value="' +
              it.quantity +
              '" aria-label="Quantity" />' +
              '<button type="button" class="qty-btn" data-qty-plus aria-label="Increase quantity">+</button>' +
              '<button type="button" class="drawer-item__remove" data-line-remove title="Remove">Remove</button>' +
              '</div>' +
              '</div>' +
              '<div class="drawer-item__price">' +
              (window.Shopify && Shopify.formatMoney ? Shopify.formatMoney(it.final_line_price) : it.final_line_price) +
              '</div>' +
              '</li>';
          });
          html += '</ul>';
          html +=
            '<div class="drawer-summary"><div class="drawer-subtotal"><span>Subtotal</span><strong>' +
            (window.Shopify && Shopify.formatMoney ? Shopify.formatMoney(cart.total_price) : cart.total_price) +
            '</strong></div><p class="drawer-note">Taxes and shipping calculated at checkout.</p></div>';
          $('#cart-drawer .cart-drawer__body').html(html);
        });
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
  $(document).on('click', '.icon-link--bag', function (e) {
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
     Product form AJAX add-to-cart
  ========================== */
  $(document).on('submit', 'form[action*="/cart/add"]', function (e) {
    e.preventDefault();
    var $form = $(this);
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
      .done(function () {
        // Update count fast
        $.getJSON('/cart.js', function (cart) {
          updateCartCount(cart.item_count);
        });
        // Open instantly with skeleton; load real content in background
        $('#cart-drawer .cart-drawer__body').html(drawerSkeletonHTML());
        openCartDrawer();
        refreshCartDrawer();
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
      $.getJSON('/cart.js', function (cart) {
        updateCartCount(cart.item_count);
      });
      $('#cart-drawer .cart-drawer__body').html(drawerSkeletonHTML());
      openCartDrawer();
      refreshCartDrawer();
    }
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
