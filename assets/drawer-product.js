/* global Shopify */
(function ($, window, document) {
  'use strict';

  // ---- Cached DOM refs (inside drawer) ----
  var $drawer = $('#product-drawer');
  if (!$drawer.length) return;

  var $panel = $drawer.find('.product-drawer__panel');
  var $closeEls = $drawer.find('[data-drawer-close]');
  var $titleEl = $drawer.find('.product-drawer__title');
  var $priceEl = $drawer.find('.product-drawer__price');
  var $descEl = $drawer.find('.product-drawer__desc');
  var $imgEl = $drawer.find('.product-drawer__image');
  var $variantsWrap = $drawer.find('.product-drawer__variants');
  var $sizeLabel = $drawer.find('.product-drawer__size-label');
  var $sizeGroup = $drawer.find('.product-drawer__size-group');
  var $qtyInput = $drawer.find('.qty-input');
  var $addBtn = $drawer.find('.product-drawer__add');
  var $viewLink = $drawer.find('.product-drawer__view');
  var $noteEl = $drawer.find('.product-drawer__note');

  // ---- Local state container ----
  var state = {
    product: null, // last loaded product object
    selectedVariant: null, // currently selected variant object
    openerBtn: null, // button that opened the drawer (for focus restore)
  };

  // ---- Helpers ----

  /**
   * Format money in INR like "₹210.00"
   * Falls back if Shopify.formatMoney isn't available.
   */
  function money(cents) {
    try {
      return Shopify && Shopify.formatMoney ? Shopify.formatMoney(cents) : '₹' + (cents / 100).toFixed(2);
    } catch (e) {
      return '₹' + (cents / 100).toFixed(2);
    }
  }

  /** Open drawer (sets aria + locks scroll + sends focus to panel) */
  function openDrawer() {
    $drawer.attr('aria-hidden', 'false');
    setTimeout(function () {
      $panel.trigger('focus');
    }, 0);
    $('body').css('overflow', 'hidden');
  }

  /** Close drawer and restore focus to the opener button if we have it */
  function closeDrawer() {
    $drawer.attr('aria-hidden', 'true');
    $('body').css('overflow', '');
    $noteEl.text('');
    if (state.openerBtn) $(state.openerBtn).trigger('focus');
  }

  /** Update the price block based on selected variant */
  function updatePrice() {
    var v = state.selectedVariant;
    if (!v) {
      $priceEl.html(
        '<span class="product-price" data-price-mode="variant">' +
          '<span class="price-single">' +
            '<span class="price-icon" aria-hidden="true">₹</span>' +
            '<span class="price-amount">—</span>' +
          '</span>' +
        '</span>'
      );
      return;
    }

    var currentMoney = money(v.price);
    var compareMoney = v.compare_at_price && v.compare_at_price > v.price ? money(v.compare_at_price) : null;

    if (compareMoney) {
      $priceEl.html(
        '<span class="product-price" data-price-mode="variant">' +
          '<span class="sale-price">' +
            '<span class="price-icon" aria-hidden="true">₹</span>' +
            '<span class="price-amount">' + currentMoney + '</span>' +
          '</span>' +
          '<span class="compare-at is-struck">' + compareMoney + '</span>' +
        '</span>'
      );
    } else {
      $priceEl.html(
        '<span class="product-price" data-price-mode="variant">' +
          '<span class="price-single">' +
            '<span class="price-icon" aria-hidden="true">₹</span>' +
            '<span class="price-amount">' + currentMoney + '</span>' +
          '</span>' +
        '</span>'
      );
    }
  }

  /**
   * Render variant "pills" like the design (e.g., 250 gm / 500 gm)
   * - Accessible via role="radio" + aria-checked
   * - Disabled when variant.available === false
   */
  function renderSizePills(variants) {
    $sizeGroup.empty().attr('role', 'radiogroup');

    // Build each pill button
    $.each(variants, function (idx, v) {
      var $btn = $('<button/>', {
        type: 'button',
        class: 'size-pill',
        text: v.title,
        'data-variant-id': String(v.id),
        role: 'radio',
        'aria-checked': 'false',
        disabled: !v.available,
      });

      if (!v.available) $btn.addClass('is-disabled');

      // Click selects this variant
      $btn.on('click', function () {
        selectVariantById(v.id, true);
      });

      // Keyboard support: arrow-left / arrow-right to move, space/enter to select
      $btn.on('keydown', function (e) {
        var $pills = $sizeGroup.find('.size-pill:not(:disabled)');
        var i = $pills.index(this);
        if (e.key === 'ArrowRight') {
          $pills.eq((i + 1) % $pills.length).focus();
        }
        if (e.key === 'ArrowLeft') {
          $pills.eq((i - 1 + $pills.length) % $pills.length).focus();
        }
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          $(this).trigger('click');
        }
      });

      $sizeGroup.append($btn);
    });

    // Default selection: first available
    state.selectedVariant =
      variants.find(function (v) {
        return v.available;
      }) ||
      variants[0] ||
      null;
    reflectSelectedPill();
  }

  /** Visually/ARIA mark the active pill and refresh price + label */
  function reflectSelectedPill() {
    var id = state.selectedVariant && state.selectedVariant.id;

    $sizeGroup.find('.size-pill').each(function () {
      var isActive = Number($(this).data('variant-id')) === id;
      $(this).toggleClass('is-active', isActive).attr('aria-checked', String(isActive));
    });

    $sizeLabel.text(state.selectedVariant ? 'Size : ' + state.selectedVariant.title : 'Size');
    updatePrice();
  }

  /** Programmatic variant selection by numeric id */
  function selectVariantById(id, fromUser) {
    if (!state.product) return;
    var v = state.product.variants.find(function (x) {
      return x.id === Number(id);
    });
    if (!v) return;

    state.selectedVariant = v;
    reflectSelectedPill();

    if (fromUser && !v.available) {
      $noteEl.text('This option is unavailable.');
    } else {
      $noteEl.text('');
    }
  }

  /**
   * Render the product in the drawer
   * @param {Object} p - product object from /products/{handle}.js
   * @param {String} productUrl - canonical URL for "View details"
   */
  function renderProduct(p, productUrl) {
    state.product = p;

    // Title / description / view link
    $titleEl.text(p.title || '');
    $descEl.html(p.description || ''); // Shopify product description is already sanitized by you/the theme
    $viewLink.attr('href', productUrl || '#');

    // Image (first available)
    if (p.images && p.images.length) {
      $imgEl.attr({ src: p.images[0], alt: p.title || '' }).prop('hidden', false);
    } else {
      $imgEl.prop('hidden', true);
    }

    // Variants → pills or hide section if just one
    if (p.variants && p.variants.length > 1) {
      $variantsWrap.prop('hidden', false);
      renderSizePills(p.variants);
    } else {
      $variantsWrap.prop('hidden', true);
      state.selectedVariant = p.variants && p.variants[0] ? p.variants[0] : null;
    }

    updatePrice();
    $qtyInput.val(1);
  }

  // ---- Global bindings ----

  // Close handlers (buttons + overlay)
  $closeEls.on('click', closeDrawer);
  $drawer.on('click', function (e) {
    if ($(e.target).is('.product-drawer__overlay')) closeDrawer();
  });

  // ESC key closes when open
  $(document).on('keydown', function (e) {
    if ($drawer.attr('aria-hidden') === 'false' && e.key === 'Escape') closeDrawer();
  });

  // Qty stepper
  $drawer.on('click', '.qty-btn', function () {
    var dir = $(this).data('qty');
    var val = Math.max(1, parseInt($qtyInput.val() || '1', 10) + (dir === 'incr' ? 1 : -1));
    $qtyInput.val(val);
  });

  // Add to cart
  $addBtn.on('click', function () {
    var v = state.selectedVariant;
    if (!v || !v.available) {
      $noteEl.text('This option is unavailable.');
      return;
    }

    var quantity = Math.max(1, parseInt($qtyInput.val() || '1', 10));
    $addBtn.prop('disabled', true).text('Adding…');
    $noteEl.text('');

    // POST to Shopify AJAX cart
    $.ajax({
      url: '/cart/add.js',
      method: 'POST',
      dataType: 'json',
      contentType: 'application/json; charset=UTF-8',
      data: JSON.stringify({ items: [{ id: v.id, quantity: quantity }] }),
    })
      .done(function (data) {
        $addBtn.text('Added ✓');
        $noteEl.text('Added to cart.');
        // Ensure the product drawer is hidden before the mini cart opens
        closeDrawer();
        // Broadcast cart update for any header/cart components listening
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
      })
      .fail(function () {
        $addBtn.text('Add to cart');
        $noteEl.text('Could not add to cart. Please try again.');
      })
      .always(function () {
        setTimeout(function () {
          $addBtn.prop('disabled', false).text('Add to cart');
        }, 900);
      });
  });

  // ---- Global event delegation: any `.product-card__cta` opens this drawer ----
  // Expected attributes on the clicked element:
  //   data-product-handle  (required)
  //   data-product-url     (optional; falls back to /products/{handle})
  $(document).on('click', '.product-card__cta', function (e) {
    e.preventDefault();

    state.openerBtn = this;

    var handle = $(this).attr('data-product-handle');
    var url = $(this).attr('data-product-url') || (handle ? '/products/' + handle : '#');
    if (!handle) return;

    // Get product JSON (Shopify storefront AJAX endpoint)
    $.getJSON('/products/' + handle + '.js')
      .done(function (product) {
        renderProduct(product, url);
        openDrawer();
      })
      .fail(function (err) {
        // You may want to toast/log here
        console.error('Product fetch failed:', err);
      });
  });

  // Theme Editor compatibility: nothing needed because we use global delegation
  document.addEventListener('shopify:section:load', function () {});
})(jQuery, window, document);
