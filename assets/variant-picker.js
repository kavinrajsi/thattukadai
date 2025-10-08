/* assets/variant-picker.js (jQuery edition)
   - Works with markup from snippets/variant-picker.liquid (swatches + selects)
   - Updates URL, form hidden input[name="id"], and ATC state
   - Disables impossible combos; marks sold-out options
   - Emits jQuery event "vp:variant:change" on window with { variant }
*/
(function ($, window, document) {
  'use strict';

  // ------------ Utilities ------------
  function parseJSON($el) {
    try {
      return JSON.parse($.trim($el.text()));
    } catch (e) {
      return null;
    }
  }

  function $findForm($vp) {
    var id = $vp.data('form-id');
    if (id) {
      var $explicit = $('#' + id);
      if ($explicit.length) return $explicit;
    }
    var $scope = $vp.closest('section, .shopify-section, form, main, body');
    var $form = $scope.find('form[action*="/cart"]').first();
    return $form.length ? $form : $();
  }

  function setHiddenVariantId($form, id) {
    if (!$form || !$form.length) return;
    var $idInput = $form.find('input[name="id"]');
    if (!$idInput.length) {
      $idInput = $('<input>', { type: 'hidden', name: 'id' }).appendTo($form);
    }
    $idInput.val(id);
  }

  function setATCEnabled($form, enabled, ariaText) {
    if (!$form || !$form.length) return;
    var $btn = $form.find('[type="submit"], button[name="add"]').first();
    if (!$btn.length) return;
    $btn.prop('disabled', !enabled);
    if (ariaText) $btn.attr('aria-label', ariaText);
  }

  function updateStatus($vp, text) {
    var $s = $vp.prevAll('.vp__status').first();
    if (!$s.length) {
      $s = $vp.find('.vp-status').first();
    }
    if ($s.length) $s.text(text || '');
  }

  function optionsLen($vp) {
    var data = parseJSON($vp.find('.vp-variants-json'));
    return data ? data.options.length : 0;
  }

  function selectedOptions($vp, len) {
    var opts = new Array(len);
    for (var i = 0; i < len; i++) {
      var $sel = $vp.find('.vp-select[data-option-index="' + i + '"]');
      if ($sel.length) {
        opts[i] = $sel.val();
        continue;
      }
      var $radio = $vp.find('.vp-swatch-input[data-option-index="' + i + '"]:checked');
      if ($radio.length) opts[i] = $radio.val();
    }
    return opts;
  }

  function findVariantByOptions(data, opts) {
    for (var i = 0; i < data.variants.length; i++) {
      var v = data.variants[i];
      var match = true;
      for (var j = 0; j < v.options.length; j++) {
        if ((opts[j] || '') !== v.options[j]) {
          match = false;
          break;
        }
      }
      if (match) return v;
    }
    return null;
  }

  function updateSelectedLabels($vp) {
    $vp.find('.vp__group').each(function () {
      var $group = $(this);
      var $checked = $group.find('.vp-swatch-input:checked');
      var text = $checked.length ? $checked.val() : '';
      $group.find('.vp__selected').text(text);
    });
  }

  function refreshOptionAvailability($vp, data) {
    var len = data.options.length;

    for (var idx = 0; idx < len; idx++) {
      var current = selectedOptions($vp, len);

      // Selects
      $vp.find('.vp-select[data-option-index="' + idx + '"] option').each(function () {
        var $opt = $(this);
        var test = current.slice();
        test[idx] = $opt.val();

        var exists = false,
          inStock = false;
        for (var k = 0; k < data.variants.length; k++) {
          var v = data.variants[k];
          var ok = true;
          for (var m = 0; m < len; m++) {
            if ((test[m] || '') !== v.options[m]) {
              ok = false;
              break;
            }
          }
          if (ok) {
            exists = true;
            if (v.available) inStock = true;
            if (exists && inStock) break;
          }
        }

        $opt.prop('disabled', !exists);

        var base = $opt.attr('data-base');
        if (!base) {
          base = $.trim($opt.text()).replace(/ — Sold out$/, '');
          $opt.attr('data-base', base);
        }
        $opt.text(exists && !inStock ? base + ' — Sold out' : base);
      });

      // Swatches
      $vp.find('.vp-swatch-input[data-option-index="' + idx + '"]').each(function () {
        var $input = $(this);
        var test2 = current.slice();
        test2[idx] = $input.val();

        var exists2 = false,
          inStock2 = false;
        for (var k2 = 0; k2 < data.variants.length; k2++) {
          var vv = data.variants[k2];
          var ok2 = true;
          for (var m2 = 0; m2 < len; m2++) {
            if ((test2[m2] || '') !== vv.options[m2]) {
              ok2 = false;
              break;
            }
          }
          if (ok2) {
            exists2 = true;
            if (vv.available) inStock2 = true;
            if (exists2 && inStock2) break;
          }
        }

        $input.prop('disabled', !exists2);
        var $label = $input.closest('.vp-swatch');
        $label.toggleClass('vp-swatch--disabled', !exists2);
        $label.toggleClass('vp-swatch--soldout', exists2 && !inStock2);
      });
    }
  }

  function updateURL(variantId) {
    if (!window.history || !history.replaceState) return;
    var url = new URL(window.location.href);
    url.searchParams.set('variant', variantId);
    history.replaceState({}, '', url.toString());
  }

  function emitVariantChange(variant) {
    // jQuery event on window with payload
    $(window).trigger('vp:variant:change', { variant: variant });
  }

  // ------------ Core handlers ------------
  function handleChange(e) {
    var $control = $(e.target).closest('.vp-select, .vp-swatch-input');
    if (!$control.length) return;

    var $vp = $control.closest('.vp');
    if (!$vp.length) return;

    var data = parseJSON($vp.find('.vp-variants-json'));
    if (!data) return;

    refreshOptionAvailability($vp, data);

    updateSelectedLabels($vp);

    var opts = selectedOptions($vp, data.options.length);
    var variant = findVariantByOptions(data, opts);

    var $form = $findForm($vp);
    if (variant) {
      setHiddenVariantId($form, variant.id);
      setATCEnabled($form, !!variant.available, variant.available ? 'Add to cart' : 'Sold out');
      updateStatus($vp, variant.available ? '' : 'This combination is currently sold out.');
      updateURL(variant.id);
      emitVariantChange(variant);
    } else {
      setATCEnabled($form, false, 'Unavailable');
      updateStatus($vp, 'This combination is unavailable.');
    }
  }

  function initPicker($vp) {
    var data = parseJSON($vp.find('.vp-variants-json'));
    if (!data) return;

    // Baseline option text for selects
    $vp.find('.vp-select option').each(function () {
      var $o = $(this);
      if (!$o.attr('data-base')) $o.attr('data-base', $.trim($o.text()).replace(/ — Sold out$/, ''));
    });

    // Set initial variant id on form
    var initialId = $vp.data('initial-variant-id');
    var $form = $findForm($vp);
    if (initialId) setHiddenVariantId($form, initialId);

    // Initial availability sync
    refreshOptionAvailability($vp, data);

    var initialVariant = null;
    if (initialId) {
      initialVariant =
        (data.variants || []).find(function (v) {
          return String(v.id) === String(initialId);
        }) || null;
    }
    if (!initialVariant) {
      var opts = selectedOptions($vp, data.options.length);
      initialVariant = findVariantByOptions(data, opts);
    }

    updateSelectedLabels($vp);

    syncMainProductDetails(initialVariant);
  }

  // ------------ Wire up ------------
  $(document).on('change', '.vp-select, .vp-swatch-input', handleChange);

  $(function () {
    $('.vp').each(function () {
      initPicker($(this));
    });
  });

  // Optional: tiny API
  window.VariantPicker = {
    refresh: function (root) {
      var $vp = typeof root === 'string' ? $(root) : $(root);
      if (!$vp.length) return;
      var data = parseJSON($vp.find('.vp-variants-json'));
      if (data) refreshOptionAvailability($vp, data);
    },
  };
})(jQuery, window, document);

function formatMoney(cents) {
  if (window.Shopify && typeof Shopify.formatMoney === 'function') {
    return Shopify.formatMoney(cents);
  }
  var amount = (parseInt(cents, 10) || 0) / 100;
  return '₹' + amount.toFixed(2);
}

function formatMoneyWithoutCurrency(cents) {
  var formatted = formatMoney(cents);
  if (!formatted) return '';
  return formatted.replace(/[^0-9.,-]/g, '').trim();
}

function syncMainProductDetails(variant) {
  var $section = $('.main-product');
  if (!$section.length) return;

  var $price = $section.find('.product__price .product-price[data-price-mode="variant"]');
  if ($price.length) {
    var showCompare = String($price.data('show-compare')) === 'true';
    var compareStyle = String($price.data('compare-style') || 'strike');
    var showDiscount = String($price.data('show-discount')) === 'true';
    var discountFormat = String($price.data('discount-format') || 'percent');

    if (!variant || !variant.available) {
      $price.html('<span class="price-unavailable">Unavailable</span>');
    } else {
      var onSale = variant.compare_at_price && variant.compare_at_price > variant.price;
      var priceText = formatMoneyWithoutCurrency(variant.price);
      var htmlParts = [];

      if (onSale && showCompare) {
        htmlParts.push(
          '<span class="sale-price">' +
            '<span class="price-icon" aria-hidden="true">₹</span>' +
            '<span class="price-amount">' +
            priceText +
            '</span>' +
          '</span>'
        );

        if (compareStyle !== 'hidden') {
          var compareClasses = 'compare-at';
          if (compareStyle === 'strike') {
            compareClasses += ' is-struck';
          }
          htmlParts.push(
            '<span class="' +
              compareClasses +
              '">' +
              formatMoney(variant.compare_at_price) +
            '</span>'
          );
        }
      } else {
        htmlParts.push(
          '<span class="price-single">' +
            '<span class="price-icon" aria-hidden="true">₹</span>' +
            '<span class="price-amount">' +
            priceText +
            '</span>' +
          '</span>'
        );
      }

      if (onSale && showDiscount && showCompare && variant.compare_at_price) {
        var savingsAmount = Math.max(0, variant.compare_at_price - variant.price);
        var discountPercent = variant.compare_at_price
          ? Math.max(0, Math.round((1 - variant.price / variant.compare_at_price) * 100))
          : 0;
        var discountText = '';

        if (discountFormat === 'amount') {
          discountText = '(Save ' + formatMoney(savingsAmount) + ')';
        } else if (discountFormat === 'both') {
          discountText =
            '(Save ' + formatMoney(savingsAmount) + ' — ' + discountPercent + '% OFF)';
        } else {
          discountText = '(' + discountPercent + '% OFF)';
        }

        htmlParts.push('<span class="discount">' + discountText + '</span>');
      }

      $price.html(htmlParts.join(''));
    }
  }

  var $sku = $section.find('#variant-sku');
  if ($sku.length) {
    $sku.text(variant && variant.sku ? variant.sku : '');
  }
}

$(window).on('vp:variant:change', function (e, payload) {
  payload = payload || {};
  var v = payload.variant || null;

  syncMainProductDetails(v);

  if (!v || !v.featured_media_id) return;
  // Example: slide to the variant's featured image
  var $slides = $('.pm-main-swiper .swiper-slide');
  $slides.each(function (i) {
    if ($(this).data('media-id') == String(v.featured_media_id) && window.pmMainSwiper) {
      window.pmMainSwiper.slideTo(i);
      return false;
    }
  });
});
