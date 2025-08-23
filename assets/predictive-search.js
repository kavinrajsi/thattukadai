class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.results = this.querySelector('.predictive-search-results');
    this.form = this.querySelector('form');
    this.closeButton = this.querySelector('.js-search-close');

    this.input.setAttribute('aria-expanded', 'false');

    this.input.addEventListener(
      'input',
      this.debounce(() => {
        const term = this.input.value.trim();
        if (!term) return this.close();
        this.getResults(term);
      }, 250)
    );

    // Close button click handler
    if (this.closeButton) {
      this.closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) this.close();
    });

    // Show default content when search is focused but empty
    this.input.addEventListener('focus', () => {
      if (!this.input.value.trim()) {
        this.showDefaultContent();
      }
    });
  }

  getResults(term) {
    const root = window.Shopify?.routes?.root || '/';
    const types = 'product,collection,article'; // Removed 'page' as per requirements
    const limit = 6;
    const scope = 'each';

    const url =
      `${root}search/suggest` +
      `?q=${encodeURIComponent(term)}` +
      `&resources[type]=${encodeURIComponent(types)}` +
      `&resources[limit]=${limit}` +
      `&resources[limit_scope]=${scope}` +
      `&section_id=predictive-search`;

    fetch(url, { headers: { Accept: 'text/html' } })
      .then((r) => {
        if (!r.ok) throw new Error(r.status);
        return r.text();
      })
      .then((html) => {
        const markup =
          new DOMParser().parseFromString(html, 'text/html').querySelector('#shopify-section-predictive-search')
            ?.innerHTML || '';
        this.results.innerHTML = markup;
        this.open();
      })
      .catch(() => this.close());
  }

  showDefaultContent() {
    // Show trending searches and popular products when no search term
    const defaultContent = this.getDefaultContent();
    this.results.innerHTML = defaultContent;
    this.open();
  }

  getDefaultContent() {
    // This would typically come from the liquid template's default state
    // For now, return empty to let the liquid template handle default content
    return '';
  }

  open() {
    this.results.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');

    // Add class to body for styling purposes
    document.body.classList.add('predictive-search-open');
  }

  close() {
    this.results.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');

    // Remove class from body
    document.body.classList.remove('predictive-search-open');

    // Clear results content
    this.results.innerHTML = '';
  }

  debounce(fn, wait) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
}

customElements.define('predictive-search', PredictiveSearch);
