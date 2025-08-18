class PredictiveSearch extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.results = this.querySelector('#predictive-search');
    this.form = this.querySelector('form');

    this.input.setAttribute('aria-expanded', 'false');

    this.input.addEventListener(
      'input',
      this.debounce(() => {
        const term = this.input.value.trim();
        if (!term) return this.close();
        this.getResults(term);
      }, 250)
    );

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    document.addEventListener('click', (e) => {
      if (!this.contains(e.target)) this.close();
    });
  }

  getResults(term) {
    const root = window.Shopify?.routes?.root || '/';
    const types = 'product,collection,page,article';
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

  open() {
    this.results.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
  }

  close() {
    this.results.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
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
