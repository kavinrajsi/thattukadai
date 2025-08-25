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


# Add dropdowns to config/settings_schema.json
{
  "name": "Typography (Custom)",
  "settings": [
    {
      "type": "select",
      "id": "custom_body_font",
      "label": "Body font",
      "options": [
        { "value": "MyCustomFont", "label": "My Custom Font" },
        { "value": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", "label": "System Sans (fallback)" }
      ],
      "default": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    },
    {
      "type": "select",
      "id": "custom_heading_font",
      "label": "Headings font",
      "options": [
        { "value": "MyCustomFont", "label": "My Custom Font" },
        { "value": "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif", "label": "System Sans (fallback)" }
      ],
      "default": "MyCustomFont"
    }
  ]
}

{{ 'custom-fonts.css' | asset_url | stylesheet_tag }}

<style>
  :root {
    --font-body: {{ settings.custom_body_font | json }};
    --font-heading: {{ settings.custom_heading_font | json }};
  }
</style>
body {
  font-family: var(--font-body);
}

h1, h2, h3, .h1, .h2, .h3 {
  font-family: var(--font-heading);
}
<link rel="preload" as="font" type="font/woff2" href="{{ 'mycustomfont-regular.woff2' | asset_url }}" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="{{ 'mycustomfont-bold.woff2'    | asset_url }}" crossorigin>



--
{%- comment -%}
Snippet: collection-filters.liquid
Renders filters, price range, availability pills, active filter chips, and sort dropdown.
Works with Shopify OS 2.0 collection.filters API.
{%- endcomment -%}

{%- comment -%} Compute fallback min/max prices in this collection (cents) {%- endcomment -%}
{% assign _min_price_fallback = blank %}
{% assign _max_price_fallback = 0 %}
{% for product in collection.products %}
  {% if product.available %}
    {% if _min_price_fallback == blank or product.price_min < _min_price_fallback %}
      {% assign _min_price_fallback = product.price_min %}
    {% endif %}
    {% if product.price_max > _max_price_fallback %}
      {% assign _max_price_fallback = product.price_max %}
    {% endif %}
  {% endif %}
{% endfor %}
{% if _min_price_fallback == blank %}
  {% assign _min_price_fallback = 0 %}
  {% assign _max_price_fallback = 0 %}
{% endif %}

<form id="collection-filters" class="collection-facets" method="get" action="{{ collection.url }}#main-collection">
  <!-- Active filters -->
  {% if collection.filters.size > 0 %}
    <div class="facets__active">
      {% assign has_active = false %}
      {% for filter in collection.filters %}
        {% for value in filter.active_values %}
          {% assign has_active = true %}
          <a class="facet-chip" href="{{ value.url_to_remove }}">
            {{ filter.label }}: {{ value.label }} ✕
          </a>
        {% endfor %}

        {% if filter.type == 'price_range' %}
          {% if filter.min_value.value or filter.max_value.value %}
            {% assign has_active = true %}
            <a class="facet-chip" href="{{ filter.url_to_remove }}">
              {{ filter.label }}:
              {% if filter.min_value.value %}{{ filter.min_value.value | money }}{% else %}{{ 0 | money }}{% endif %}
              –
              {% if filter.max_value.value %}{{ filter.max_value.value | money }}{% else %}{{ filter.range_max | money }}{% endif %}
              ✕
            </a>
          {% endif %}
        {% endif %}
      {% endfor %}
      {% if has_active %}
        <a class="facet-chip facet-chip--clear" href="{{ collection.url }}#main-collection">Clear all</a>
      {% endif %}
    </div>
  {% endif %}

  <div class="facets__bar">
    <!-- Facet groups -->
    <div class="facets__groups">
      {% for filter in collection.filters %}
        <details class="facet" {% if filter.active_values.size > 0 %}open{% endif %}>
          <summary class="facet__summary">{{ filter.label }}</summary>

          <div class="facet__body">
            {% case filter.type %}

              {% when 'list' %}
                <ul class="facet__list" role="list">
                  {% for value in filter.values %}
                    <li class="facet__item">
                      <label>
                        <input
                          type="checkbox"
                          name="{{ value.param_name }}"
                          value="{{ value.value }}"
                          {% if value.active %}checked{% endif %}
                          {% if value.count == 0 and value.active == false %}disabled{% endif %}
                        >
                        <span>{{ value.label }}</span>
                        <small aria-hidden="true">({{ value.count }})</small>
                      </label>
                    </li>
                  {% endfor %}
                </ul>

              {% when 'price_range' %}
                <div class="facet__price">
                  {%- assign _ph_min = _min_price_fallback | money_without_currency | replace: ',', '' -%}
                  {%- assign _ph_max = _max_price_fallback | money_without_currency | replace: ',', '' -%}
                  {%- if filter.range_max and filter.range_max > 0 -%}
                    {%- assign _ph_max = filter.range_max | money_without_currency | replace: ',', '' -%}
                  {%- endif -%}

                  <div class="price-inputs">
                    <label>
                      Min
                      <input
                        name="{{ filter.min_value.param_name }}"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        {% if filter.min_value.value %}value="{{ filter.min_value.value | money_without_currency | replace: ',', '' }}"{% endif %}
                        placeholder="{{ _ph_min }}"
                      >
                    </label>
                    <span class="price-sep">–</span>
                    <label>
                      Max
                      <input
                        name="{{ filter.max_value.param_name }}"
                        type="number"
                        inputmode="numeric"
                        min="0"
                        {% if filter.max_value.value %}value="{{ filter.max_value.value | money_without_currency | replace: ',', '' }}"{% endif %}
                        placeholder="{{ _ph_max }}"
                      >
                    </label>
                  </div>
                  <small class="price-hint">
                    Range:
                    {{ _min_price_fallback | money }}
                    –
                    {% if filter.range_max and filter.range_max > 0 %}
                      {{ filter.range_max | money }}
                    {% else %}
                      {{ _max_price_fallback | money }}
                    {% endif %}
                  </small>
                </div>

              {% when 'boolean' %}
                {% if filter.label | downcase | strip == 'availability' %}
                  <!-- Availability: pill toggles -->
                  <div class="facet__availability">
                    {% for value in filter.values %}
                      {% assign active = value.active %}
                      {% assign disabled = value.count == 0 and value.active == false %}
                      <label class="avail-pill {% if active %}is-active{% endif %} {% if disabled %}is-disabled{% endif %}">
                        <input
                          type="checkbox"
                          class="visually-hidden"
                          name="{{ value.param_name }}"
                          value="{{ value.value }}"
                          {% if active %}checked{% endif %}
                          {% if disabled %}disabled{% endif %}
                        >
                        <span class="avail-pill__label">
                          {{ value.label }}
                          <small aria-hidden="true">({{ value.count }})</small>
                        </span>
                      </label>
                    {% endfor %}
                  </div>
                {% else %}
                  <!-- Other boolean filters: checkboxes -->
                  <div class="facet__boolean">
                    {% for value in filter.values %}
                      <label>
                        <input
                          type="checkbox"
                          name="{{ value.param_name }}"
                          value="{{ value.value }}"
                          {% if value.active %}checked{% endif %}
                          {% if value.count == 0 and value.active == false %}disabled{% endif %}
                        >
                        {{ value.label }} <small aria-hidden="true">({{ value.count }})</small>
                      </label>
                    {% endfor %}
                  </div>
                {% endif %}

            {% endcase %}
          </div>
        </details>
      {% endfor %}
    </div>

    <!-- Sort -->
    {% if collection.sort_options.size > 1 %}
      <div class="facets__sort">
        <label for="sort-by" class="visually-hidden">Sort by</label>
        <select id="sort-by" name="sort_by">
          {% for option in collection.sort_options %}
            <option value="{{ option.value }}" {% if option.value == collection.sort_by %}selected{% endif %}>
              {{ option.name }}
            </option>
          {% endfor %}
        </select>
      </div>
    {% endif %}

    <div class="facets__actions">
      <button type="submit" class="button">Apply</button>
      <a class="button button--secondary" href="{{ collection.url }}#main-collection">Reset</a>
    </div>
  </div>
</form>

{% javascript %}
  // Auto-submit on change for snappier UX
  (function() {
    var form = document.getElementById('collection-filters');
    if (!form) return;
    form.addEventListener('change', function(e) {
      var tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'select') {
        form.requestSubmit();
      }
    });
  })();
{% endjavascript %}

{% style %}
  .collection-facets{display:flex;gap:1rem;align-items:flex-start;justify-content:space-between;margin:1rem 0;}
  .facets__bar{display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;width:100%}
  .facets__groups{display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start}
  .facet{border:1px solid #eee;border-radius:6px;padding:.5rem 1rem;background:#fafafa}
  .facet__summary{cursor:pointer;font-weight:600}
  .facet__list{max-height:220px;overflow:auto;margin:.5rem 0 0;padding:0;list-style:none}
  .facet__item{margin:.25rem 0}
  .facet-chip{display:inline-flex;align-items:center;gap:.25rem;background:#f0f0f0;border-radius:999px;padding:.25rem .5rem;margin:.25rem .25rem 0 0;text-decoration:none;color:inherit}
  .facet-chip--clear{background:#e8e8e8}
  .facets__sort select{min-width:180px}
  .facets__actions .button{margin-right:.5rem}
  .price-inputs{display:flex;align-items:center;gap:.5rem}
  .price-sep{opacity:.6}
  .visually-hidden{position:absolute!important;clip:rect(1px,1px,1px,1px);width:1px;height:1px;overflow:hidden;white-space:nowrap}

  /* Availability pills */
  .facet__availability{display:flex;gap:.5rem;flex-wrap:wrap}
  .avail-pill{display:inline-flex;align-items:center;border:1px solid #e1e1e1;border-radius:999px;padding:.35rem .75rem;cursor:pointer;user-select:none;background:#fff;transition:all .15s ease}
  .avail-pill:hover{border-color:#cfcfcf}
  .avail-pill.is-active{border-color:#111;background:#f5f5f5}
  .avail-pill.is-disabled{opacity:.45;cursor:not-allowed}
  .avail-pill input{margin:0}
  .avail-pill__label{display:inline-flex;gap:.35rem;align-items:baseline}
{% endstyle %}
