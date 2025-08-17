(function () {
  const moneyFormat = "{{ shop.money_format | escape }}"; // e.g. {{ amount_no_decimals_with_comma_separator }} etc. 

  const formatMoney = (cents) => {
    // Lightweight money formatter that respects shop.money_format placeholders
    // This is a simple fallback; if you already use Dawn's formatMoney util, replace this.
    const value = (cents / 100).toFixed(2);
    return moneyFormat
      .replace("{{amount}}", value)
      .replace("{{ amount }}", value)
      .replace("{{amount_no_decimals}}", Math.round(cents / 100).toString())
      .replace("{{ amount_no_decimals }}", Math.round(cents / 100).toString());
  };

  const initSidebar = (root) => {
    const handle = root.dataset.productHandle;
    if (!handle) return;

    const els = {
      img: root.querySelector(".sidebar-product__image"),
      badgeSale: root.querySelector(".sidebar-product__badge--sale"),
      discount: root.querySelector(".sidebar-product__discount"),
      title: root.querySelector(".sidebar-product__title"),
      priceCurrent: root.querySelector(".sidebar-product__price-current"),
      priceCompare: root.querySelector(".sidebar-product__price-compare"),
      desc: root.querySelector(".sidebar-product__desc"),
      select: root.querySelector(".sidebar-product__select"),
      qtyInput: root.querySelector(".sidebar-product__qty-input"),
      qtyInc: root.querySelector(".sidebar-product__qty-btn--inc"),
      qtyDec: root.querySelector(".sidebar-product__qty-btn--dec"),
      addBtn: root.querySelector(".sidebar-product__cta--add"),
      status: root.querySelector(".sidebar-product__status"),
      buyNowForm: root.querySelector(".sidebar-product__buy-now-form")
    };

    const showDynamicCheckout = root.dataset.showDynamicCheckout === "true";
    if (!showDynamicCheckout && els.buyNowForm) els.buyNowForm.style.display = "none";

    const setStatus = (msg, ok = true) => {
      if (!els.status) return;
      els.status.hidden = !msg;
      els.status.textContent = msg || "";
      els.status.style.color = ok ? "#0a7a0a" : "#b91c1c";
      if (msg) setTimeout(() => { els.status.hidden = true; }, 4000);
    };

    const updateMedia = (product, variant) => {
      const chosenImage = (variant && variant.featured_image) || product.featured_image;
      if (chosenImage && els.img) {
        // Use img_url filter from Liquid to build sizes when available. We’ll pass original URL from JSON as fallback. 
        els.img.src = chosenImage.src;
        els.img.alt = product.title;
      }
    };

    const updatePrice = (variant) => {
      if (!variant) return;
      els.priceCurrent.textContent = formatMoney(variant.price);
      const hasCompare = variant.compare_at_price && variant.compare_at_price > variant.price;
      els.priceCompare.hidden = !hasCompare;
      if (hasCompare) {
        els.priceCompare.textContent = formatMoney(variant.compare_at_price);
      }
      // Sale badge + discount %
      if (hasCompare) {
        const pct = Math.round((1 - variant.price / variant.compare_at_price) * 100);
        els.badgeSale.hidden = false;
        els.discount.hidden = false;
        els.discount.textContent = `-${pct}%`;
      } else {
        els.badgeSale.hidden = true;
        els.discount.hidden = true;
        els.discount.textContent = "";
      }
      // Availability
      els.addBtn.disabled = !variant.available;
      if (els.buyNowForm) {
        els.buyNowForm.querySelector('input[name="id"]').value = variant.id;
      }
    };

    const populateSelect = (product) => {
      els.select.innerHTML = "";
      product.variants.forEach((v) => {
        const opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = `${v.title} — ${formatMoney(v.price)}`;
        opt.disabled = !v.available;
        els.select.appendChild(opt);
      });
    };

    const getVariantById = (product, id) =>
      product.variants.find((v) => String(v.id) === String(id));

    const syncQtyToBuyNow = () => {
      if (els.buyNowForm) {
        els.buyNowForm.querySelector('input[name="quantity"]').value = Math.max(1, parseInt(els.qtyInput.value || "1", 10));
      }
    };

    const attachQtyHandlers = () => {
      els.qtyInc.addEventListener("click", () => {
        els.qtyInput.value = (parseInt(els.qtyInput.value || "1", 10) + 1);
        syncQtyToBuyNow();
      });
      els.qtyDec.addEventListener("click", () => {
        const next = Math.max(1, parseInt(els.qtyInput.value || "1", 10) - 1);
        els.qtyInput.value = next;
        syncQtyToBuyNow();
      });
      els.qtyInput.addEventListener("input", syncQtyToBuyNow);
    };

    const attachVariantHandler = (product) => {
      els.select.addEventListener("change", () => {
        const variant = getVariantById(product, els.select.value);
        updateMedia(product, variant);
        updatePrice(variant);
      });
    };

    const attachAddToCart = () => {
      els.addBtn.addEventListener("click", async () => {
        const id = els.select.value;
        const quantity = Math.max(1, parseInt(els.qtyInput.value || "1", 10));
        if (!id) return;

        els.addBtn.disabled = true;
        els.addBtn.dataset.state = "loading";
        try {
          const res = await fetch("/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, quantity })
          });
          if (!res.ok) throw new Error("Add failed");
          setStatus("Added to cart ✔");
        } catch (e) {
          setStatus("Couldn’t add to cart", false);
        } finally {
          els.addBtn.disabled = false;
          els.addBtn.dataset.state = "idle";
        }
      });
    };

    // Load product JSON
    fetch(`/products/${handle}.js`)
      .then((r) => r.json())
      .then((product) => {
        els.title.textContent = product.title;
        els.desc.innerHTML = product.description ? product.description : "";
        populateSelect(product);
        // Default to first available variant
        const initial = product.variants.find((v) => v.available) || product.variants[0];
        els.select.value = initial.id;
        updateMedia(product, initial);
        updatePrice(initial);
        syncQtyToBuyNow();
        attachVariantHandler(product);
        attachQtyHandlers();
        attachAddToCart();
      })
      .catch(() => {
        root.innerHTML = '<p class="sidebar-product__status">Product not found.</p>';
      });
  };

  document.addEventListener("DOMContentLoaded", () => {
    document
      .querySelectorAll(".sidebar-product[data-product-handle]")
      .forEach(initSidebar);
  });
})();
