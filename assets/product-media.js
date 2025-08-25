// Init Swiper sliders
document.querySelectorAll('.swiper-gallery').forEach((gallery) => {
  const thumbs = new Swiper(gallery.querySelector('.pm-thumbs-swiper'), {
    spaceBetween: 8,
    slidesPerView: 4,
    loop: true,
    slidesPerView: 'auto',
    freeMode: true,
    watchSlidesProgress: true,
  });

  new Swiper(gallery.querySelector('.pm-main-swiper'), {
    spaceBetween: 0,
    navigation: {
      nextEl: gallery.querySelector('.swiper-button-next'),
      prevEl: gallery.querySelector('.swiper-button-prev'),
    },
    thumbs: {
      swiper: thumbs,
    },
  });
});

// PhotoSwipe init (v5)
(function initPhotoSwipe() {
  if (!(window.PhotoSwipeLightbox && window.PhotoSwipe)) return;

  document.querySelectorAll('.pm-gallery').forEach((wrap) => {
    const lightbox = new PhotoSwipeLightbox({
      gallery: wrap.querySelector('.pm-main-swiper .swiper-wrapper'),
      children: 'a.pswp-item',
      pswpModule: PhotoSwipe,
      addCaptionHTMLFn: (item, captionEl) => {
        const alt = item?.data?.alt || '';
        captionEl.textContent = alt;
        return !!alt;
      },
    });

    lightbox.on('itemData', (e) => {
      const anchor = e?.itemData?.element;
      const img = anchor ? anchor.querySelector('img') : null;
      if (img) {
        e.itemData.alt = img.getAttribute('alt') || '';
      }
    });

    lightbox.init();
  });
})();
