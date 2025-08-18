(function ($) {
  $(function () {
    var $toggles = $('[data-shop-toggle]');
    var $panel = $('#shop-panel');
    var $backdrop = $('[data-backdrop]');
    if (!$panel.length) return;

    function openPanel() {
      $panel.prop('hidden', false).addClass('is-open');
      $backdrop.prop('hidden', false).addClass('is-open');
      $toggles.attr('aria-expanded', 'true');
      $panel.find('a,button').first().trigger('focus');
      $(document).on('keydown.headerEsc', onEsc);
    }

    function closePanel() {
      $panel.removeClass('is-open');
      $backdrop.removeClass('is-open');
      $toggles.attr('aria-expanded', 'false');
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
  });
})(window.jQuery);
