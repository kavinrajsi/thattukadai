// Enhanced Homepage Slider JavaScript
// Handles Owl Carousel initialization, loading states, and dynamic styling

(function () {
  'use strict';

  class HomepageSlider {
    constructor(element) {
      this.element = element;
      this.sectionId = element.dataset.sectionId;
      this.owl = null;
      this.isInitialized = false;

      this.init();
    }

    init() {
      // Add loading class initially
      this.element.classList.add('loading');

      // Set up text colors and fixed height
      this.setupDynamicStyles();

      // Initialize owl carousel when ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initOwl());
      } else {
        this.initOwl();
      }

      // Handle Shopify section events
      this.bindShopifyEvents();
    }

    setupDynamicStyles() {
      // Apply text colors from data attributes
      const slides = this.element.querySelectorAll('.homepage-slider__slide[data-text-color]');
      slides.forEach((slide) => {
        const textColor = slide.dataset.textColor;
        if (textColor) {
          slide.style.setProperty('--text-color', textColor);
        }
      });

      // Set fixed height if specified
      const heightMode = this.element.dataset.heightMode;
      const fixedHeight = this.element.dataset.fixedHeight;

      if (heightMode === 'fixed' && fixedHeight) {
        this.element.style.setProperty('--fixed-height', `${fixedHeight}px`);
      }
    }

    bool(val) {
      return String(val) === 'true';
    }

    initOwl() {
      // Check if jQuery and Owl Carousel are available
      if (typeof jQuery === 'undefined' || !jQuery.fn || !jQuery.fn.owlCarousel) {
        console.warn('[homepage-slider] Owl Carousel not found. Include owl.carousel.js');
        return;
      }

      const $ = jQuery;
      const $owl = $(this.element).find('.homepage-slider__owl');

      if ($owl.length === 0) {
        console.warn('[homepage-slider] Owl carousel element not found');
        return;
      }

      // Get configuration from data attributes
      const config = this.getOwlConfig();

      // Handle reduced motion preference
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        config.autoplay = false;
        config.smartSpeed = 0;
      }

      // Initialize Owl Carousel
      $owl.owlCarousel(config);

      // Store reference
      this.owl = $owl;
      this.isInitialized = true;

      // Handle loading states
      this.handleImageLoading($owl);

      // Remove loading class
      this.element.classList.remove('loading');
      this.element.classList.add('loaded');

      // Bind custom events
      this.bindOwlEvents($owl);
    }

    getOwlConfig() {
      const autoplay = this.bool(this.element.dataset.autoplay);
      const autoplayTimeout = parseInt(this.element.dataset.timeout, 10) || 5000;
      const loop = this.bool(this.element.dataset.loop);
      const nav = this.bool(this.element.dataset.nav);
      const dots = this.bool(this.element.dataset.dots);
      const pauseOnHover = this.bool(this.element.dataset.pauseOnHover);
      const lazyLoad = this.bool(this.element.dataset.lazy);
      const transition = this.element.dataset.animate;

      const config = {
        items: 1,
        loop: loop,
        nav: nav,
        dots: dots,
        autoplay: autoplay,
        autoplayTimeout: autoplayTimeout,
        autoplayHoverPause: pauseOnHover,
        lazyLoad: lazyLoad,
        smartSpeed: 500,
        navText: ['‹', '›'],
        responsive: {
          0: { items: 1 },
          768: { items: 1 },
          1024: { items: 1 },
        },
        onInitialized: () => {
          this.onOwlInitialized();
        },
        onChanged: (event) => {
          this.onSlideChanged(event);
        },
      };

      // Add fade transition if specified
      if (transition === 'fade') {
        config.animateOut = 'fadeOut';
        config.animateIn = 'fadeIn';
      }

      return config;
    }

    handleImageLoading($owl) {
      const images = $owl.find('.homepage-slider__img');
      let loadedCount = 0;
      const totalImages = images.length;

      if (totalImages === 0) return;

      images.each((index, img) => {
        if (img.complete) {
          loadedCount++;
        } else {
          $(img).on('load error', () => {
            loadedCount++;
            if (loadedCount === totalImages) {
              this.onAllImagesLoaded();
            }
          });
        }
      });

      if (loadedCount === totalImages) {
        this.onAllImagesLoaded();
      }
    }

    onAllImagesLoaded() {
      // Trigger layout recalculation
      if (this.owl) {
        this.owl.trigger('refresh.owl.carousel');
      }
    }

    onOwlInitialized() {
      // Carousel is fully initialized
      this.element.dispatchEvent(
        new CustomEvent('homepage-slider:initialized', {
          detail: { sectionId: this.sectionId },
        })
      );
    }

    onSlideChanged(event) {
      // Slide changed event
      this.element.dispatchEvent(
        new CustomEvent('homepage-slider:changed', {
          detail: {
            sectionId: this.sectionId,
            currentIndex: event.item.index,
            totalSlides: event.item.count,
          },
        })
      );
    }

    bindOwlEvents($owl) {
      // Add keyboard navigation
      this.element.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          $owl.trigger('prev.owl.carousel');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          $owl.trigger('next.owl.carousel');
        }
      });

      // Pause autoplay on focus
      this.element.addEventListener('focusin', () => {
        if (this.bool(this.element.dataset.autoplay)) {
          $owl.trigger('stop.owl.autoplay');
        }
      });

      // Resume autoplay on blur
      this.element.addEventListener('focusout', () => {
        if (this.bool(this.element.dataset.autoplay)) {
          $owl.trigger('play.owl.autoplay');
        }
      });
    }

    bindShopifyEvents() {
      // Handle Shopify section reload
      document.addEventListener('shopify:section:load', (e) => {
        if (e.detail.sectionId === this.sectionId) {
          this.destroy();
          this.init();
        }
      });

      // Handle Shopify section unload
      document.addEventListener('shopify:section:unload', (e) => {
        if (e.detail.sectionId === this.sectionId) {
          this.destroy();
        }
      });
    }

    destroy() {
      if (this.owl && this.isInitialized) {
        this.owl.trigger('destroy.owl.carousel');
        this.owl = null;
        this.isInitialized = false;
      }

      this.element.classList.remove('loading', 'loaded');
    }

    // Public methods for external control
    next() {
      if (this.owl) this.owl.trigger('next.owl.carousel');
    }

    prev() {
      if (this.owl) this.owl.trigger('prev.owl.carousel');
    }

    goTo(index) {
      if (this.owl) this.owl.trigger('to.owl.carousel', [index]);
    }

    play() {
      if (this.owl) this.owl.trigger('play.owl.autoplay');
    }

    stop() {
      if (this.owl) this.owl.trigger('stop.owl.autoplay');
    }
  }

  // Initialize all homepage sliders on the page
  function initializeSliders() {
    const sliders = document.querySelectorAll('.homepage-slider');
    sliders.forEach((slider) => {
      if (!slider.homepageSliderInstance) {
        slider.homepageSliderInstance = new HomepageSlider(slider);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSliders);
  } else {
    initializeSliders();
  }

  // Expose class globally for external access
  window.HomepageSlider = HomepageSlider;
})();
