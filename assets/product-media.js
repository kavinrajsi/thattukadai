// Thumbnail -> slide switching
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.pm-thumb');
  if (!btn) return;

  const gallery = btn.closest('.pm-gallery');
  const targetId = btn.getAttribute('data-target-id');

  gallery.querySelectorAll('.pm-slide').forEach((slide) => {
    slide.classList.toggle('is-active', slide.dataset.mediaId === targetId);
  });
});

// ----- PhotoSwipe for IMAGES -----
(function initPhotoSwipeForImages() {
  if (!(window.PhotoSwipeLightbox && window.PhotoSwipe)) return;

  document.querySelectorAll('.pm-gallery').forEach((wrap) => {
    const lightbox = new PhotoSwipeLightbox({
      gallery: wrap.querySelector('.pm-main'),
      children: 'a.pswp-item',
      pswpModule: PhotoSwipe,
    });
    // Optional caption pulled from the <img alt>
    lightbox.on('itemData', (e) => {
      const anchor = e?.itemData?.element;
      const img = anchor ? anchor.querySelector('img') : null;
      if (img && e?.itemData) e.itemData.alt = img.getAttribute('alt') || '';
    });
    lightbox.on('uiRegister', function () {
      this.pswp.ui.registerElement({
        name: 'caption',
        className: 'pswp__custom-caption',
        appendTo: 'root',
        onInit: (el, pswp) => {
          pswp.on('change', () => {
            const curr = pswp.currSlide?.data?.alt || '';
            el.textContent = curr;
          });
        },
      });
    });
    lightbox.init();
  });
})();

// ----- PhotoSwipe for VIDEOS (Shopify-hosted MP4 and external embeds) -----
(function initVideoLightbox() {
  if (!(window.PhotoSwipe && window.PhotoSwipeLightbox)) return;

  function openVideoSlide({ type, src, poster, w, h }) {
    // Build HTML content for the slide
    let html = '';
    if (type === 'mp4') {
      html = `
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center">
          <video src="${src}" ${
        poster ? `poster="${poster}"` : ''
      } controls autoplay playsinline style="max-width:100%;max-height:100%"></video>
        </div>`;
    } else if (type === 'embed') {
      html = `
        <div style="position:relative;width:100%;height:0;padding-bottom:${
          h && w ? ((h / w) * 100).toFixed(2) : 56.25
        }%;">
          <iframe src="${src}"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowfullscreen
                  style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"></iframe>
        </div>`;
    } else {
      return;
    }

    // Create a raw PhotoSwipe instance with one HTML slide
    const pswp = new PhotoSwipe({
      dataSource: [{ html, width: Number(w) || 1280, height: Number(h) || 720 }],
    });
    pswp.init();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pm-video-lightbox');
    if (!btn) return;

    e.preventDefault();
    const type = btn.getAttribute('data-pswp-type');
    const src = btn.getAttribute('data-src');
    const poster = btn.getAttribute('data-poster') || '';
    const w = btn.getAttribute('data-w') || '';
    const h = btn.getAttribute('data-h') || '';

    if (!src) return;
    openVideoSlide({ type, src, poster, w, h });
  });
})();
