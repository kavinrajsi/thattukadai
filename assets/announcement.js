(function () {
  /**
   * Set a session cookie (no explicit expiry).
   * It will last for the browser session.
   */
  function setCookie(name, value) {
    document.cookie = name + '=' + (value || '') + '; path=/; SameSite=Lax';
  }

  /**
   * Get a cookie value by name
   */
  function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Initialize a single announcement bar (date gating removed)
   */
  function initBar(bar) {
    if (!bar) return;

    // Handle dismissal via session cookies
    var enableDismiss = bar.getAttribute('data-enable-dismiss') === 'true';
    var key = bar.getAttribute('data-key');

    if (enableDismiss && getCookie(key) === 'true') {
      bar.style.display = 'none';
      return;
    }

    // Bind dismiss button click event
    if (enableDismiss) {
      var closeBtn = bar.querySelector('.announcement-bar__close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function () {
          bar.style.display = 'none';
          setCookie(key, 'true');
        });
      }
    }
  }

  /**
   * Initialize all announcement bars on the page
   */
  function initAll() {
    var bars = document.querySelectorAll('.announcement-bar');
    if (!bars || !bars.length) return;
    bars.forEach(initBar);
  }

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
