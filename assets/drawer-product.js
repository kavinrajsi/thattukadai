(function () {
  const drawer = document.getElementById('product-drawer');
  if (!drawer) return;

  const panel = drawer.querySelector('.product-drawer__panel');
  const closeEls = drawer.querySelectorAll('[data-drawer-close]');
  const titleEl = drawer.querySelector('.product-drawer__title');
  const priceEl = drawer.querySelector('.product-drawer__price');
  const descEl = drawer.querySelector('.product-drawer__desc');
  const imgEl = drawer.querySelector('.product-drawer__image');
  const variantsWrap = drawer.querySelector('.product-drawer__variants');
  const variantSelect = drawer.querySelector('.product-drawer__select');
  const qtyInput = drawer.querySelector('.qty-input');
  const addBtn = drawer.querySelector('.product-drawer__add');
  const viewLink = drawer.querySelector('.product-drawer__view');
  const noteEl = drawer.querySelector('.product-drawer__note');

  let state = { product: null, selectedVariant: null, openerBtn: null };

  function money(cents) {
    try {
      return Shopify.formatMoney ? Shopify.formatMoney(cents) : `₹${(cents / 100).toFixed(2)}`;
    } catch (e) {
      return `₹${(cents / 100).toFixed(2)}`;
    }
  }

  function openDrawer() {
    drawer.setAttribute('aria-hidden', 'false');
    setTimeout(() => panel.focus(), 0);
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    noteEl.textContent = '';
    if (state.openerBtn) state.openerBtn.focus();
  }

  closeEls.forEach((el) => el.addEventListener('click', closeDrawer));
  drawer.addEventListener('click', (e) => {
    if (e.target.matches('.product-drawer__overlay')) closeDrawer();
  });
  document.addEventListener('keydown', (e) => {
    if (drawer.getAttribute('aria-hidden') === 'false' && e.key === 'Escape') closeDrawer();
  });

  function updatePrice() {
    const v = state.selectedVariant;
    if (!v) {
      priceEl.textContent = '';
      return;
    }
    if (v.compare_at_price && v.compare_at_price > v.price) {
      priceEl.innerHTML = `<span style="font-weight:800">${money(v.price)}</span> <s style="color:#9b9b9b">${money(
        v.compare_at_price
      )}</s>`;
    } else {
      priceEl.innerHTML = `<span style="font-weight:800">${money(v.price)}</span>`;
    }
  }

  function renderProduct(p, productUrl) {
    state.product = p;

    titleEl.textContent = p.title;
    descEl.innerHTML = p.description || '';
    viewLink.href = productUrl;

    if (p.images && p.images.length) {
      imgEl.src = p.images[0];
      imgEl.alt = p.title;
      imgEl.hidden = false;
    } else {
      imgEl.hidden = true;
    }

    if (p.variants && p.variants.length > 1) {
      variantsWrap.hidden = false;
      variantSelect.innerHTML = '';
      p.variants.forEach((v) => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.title + (v.available ? '' : ' — Sold out');
        opt.disabled = !v.available;
        variantSelect.appendChild(opt);
      });
      const firstAvail = p.variants.find((v) => v.available) || p.variants[0];
      variantSelect.value = String(firstAvail.id);
      state.selectedVariant = firstAvail;
    } else {
      variantsWrap.hidden = true;
      state.selectedVariant = p.variants && p.variants[0] ? p.variants[0] : null;
    }

    updatePrice();
    qtyInput.value = 1;
  }

  variantSelect?.addEventListener('change', () => {
    const id = Number(variantSelect.value);
    state.selectedVariant = state.product.variants.find((v) => v.id === id);
    updatePrice();
  });

  drawer.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-qty');
      const val = Math.max(1, parseInt(qtyInput.value || '1', 10) + (dir === 'incr' ? 1 : -1));
      qtyInput.value = val;
    });
  });

  addBtn.addEventListener('click', async () => {
    const v = state.selectedVariant;
    if (!v || !v.available) {
      noteEl.textContent = 'This option is unavailable.';
      return;
    }
    const quantity = Math.max(1, parseInt(qtyInput.value || '1', 10));
    addBtn.disabled = true;
    addBtn.textContent = 'Adding…';
    noteEl.textContent = '';
    try {
      const res = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: v.id, quantity }] }),
      });
      if (!res.ok) throw new Error('Cart error');
      const data = await res.json();
      addBtn.textContent = 'Added ✓';
      noteEl.textContent = 'Added to cart.';
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: data }));
    } catch (e) {
      addBtn.textContent = 'Add to cart';
      noteEl.textContent = 'Could not add to cart. Please try again.';
    } finally {
      setTimeout(() => {
        addBtn.disabled = false;
        addBtn.textContent = 'Add to cart';
      }, 900);
    }
  });

  // GLOBAL EVENT DELEGATION:
  // Any .product-card__cta on the page will open this drawer.
  function onGlobalCtaClick(e) {
    const btn = e.target.closest('.product-card__cta');
    if (!btn) return;
    e.preventDefault();

    state.openerBtn = btn;
    const handle = btn.getAttribute('data-product-handle');
    const url = btn.getAttribute('data-product-url') || `/products/${handle}`;

    if (!handle) return;

    fetch(`/products/${handle}.js`)
      .then((r) => r.json())
      .then((product) => {
        renderProduct(product, url);
        openDrawer();
      })
      .catch((err) => console.error(err));
  }

  document.addEventListener('click', onGlobalCtaClick);

  // Re-bind when sections reload inside Theme Editor
  document.addEventListener('shopify:section:load', () => {
    // nothing specific needed due to global delegation
  });
})();
