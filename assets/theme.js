// Basic starter JS for thattukadai theme
console.log('thattukadai theme loaded');

document.addEventListener('DOMContentLoaded', function () {
  var $ = window.jQuery;
  var $el = $('.bestsellers__list');
  if (!$ || !$el.length || !$el.owlCarousel) return;

  $el.owlCarousel({
    items: 4,
    margin: 20,
    loop: false,
    nav: true,
    dots: false,
    navText: ['‹', '›'],
    responsive: {
      0: { items: 1.1, margin: 14 },
      480: { items: 2.1, margin: 16 },
      768: { items: 3, margin: 18 },
      1024: { items: 4, margin: 20 },
    },
  });
});
