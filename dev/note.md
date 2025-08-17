# Price

Base call shape:

{% render 'product-price', product: product, ...options... %}

1) Only price (no compare-at, no badges, no discount)
{% render 'product-price', product: product, show_badges: false, show_compare: false, show_discount: false %}

2) Only first available variant price (Defaults to mode: 'variant' and no compare-at.)
{% render 'product-price', product: product %}

3) Min to max price (range)
{% render 'product-price', product: product, mode: 'range' %}

4) compare_style (how compare-at shows when on sale + show_compare:true)

Strike-through:
{% render 'product-price', product: product, show_compare: true, compare_style: 'strike' %}

Plain (no strike):
{% render 'product-price', product: product, show_compare: true, compare_style: 'plain' %}

Hidden (don’t show compare-at at all):
{% render 'product-price', product: product, show_compare: true, compare_style: 'hidden' %}

5) show_discount (turn on/off discount text)
{% render 'product-price', product: product, show_compare: true, show_discount: true %}

6) discount_format (requires show_discount:true)

Percent:
{% render 'product-price', product: product, show_compare: true, show_discount: true, discount_format: 'percent' %}

Amount:
{% render 'product-price', product: product, show_compare: true, show_discount: true, discount_format: 'amount' %}

Both:
{% render 'product-price', product: product, show_compare: true, show_discount: true, discount_format: 'both' %}

7) show_from label (range mode only)
{% render 'product-price', product: product, mode: 'range', show_from: true %}

8) show_badges (Sale / Sold Out container on/off)

Hide all badges:
{% render 'product-price', product: product, show_badges: false %}

Show badges (default):
{% render 'product-price', product: product, show_badges: true %}

9) show_sale_badge (only Sale badge toggle)

{% render 'product-price', product: product, show_sale_badge: false %}
Show (default):

{% render 'product-price', product: product, show_sale_badge: true %}

10) show_sold_out_badge (only Sold Out badge toggle)

{% render 'product-price', product: product, show_sold_out_badge: false %}

Show (default):
{% render 'product-price', product: product, show_sold_out_badge: true %}

If you want, I can bundle these into a tiny README comment you can paste at the top of the snippet.