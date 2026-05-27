// Amazon Product Data Extractor for amazon-product-excavate
// Use via chrome-devtools_evaluate_script on a product page
// Returns: { success, asin, brand, price, color }

() => {
  const result = { success: false, asin: '', brand: 'N/A', price: 'N/A', color: 'N/A' };

  // --- Page readiness check ---
  // Wait for core product elements to be present
  const hasTitle = document.getElementById('productTitle') || document.querySelector('#titleSection h1');
  const hasPrice = document.querySelector('.a-price, #price, #corePriceDisplay_desktop');
  const hasBuyBox = document.getElementById('buybox') || document.querySelector('#addToCart');
  if (!hasTitle && !hasPrice && !hasBuyBox) {
    result.error = 'page_not_loaded';
    return result;
  }

  // --- ASIN ---
  const asinInput = document.getElementById('ASIN');
  if (asinInput && asinInput.value) {
    result.asin = asinInput.value.trim();
  }
  if (!result.asin) {
    const m = window.location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (m) result.asin = m[1].toUpperCase();
  }
  if (!result.asin) {
    result.error = 'asin_not_found';
    return result;
  }

  // --- Brand ---
  const byline = document.getElementById('bylineInfo');
  if (byline) {
    let text = byline.innerText.trim();
    text = text
      .replace(/^Visit\s+the\s+/i, '')
      .replace(/\s+Store$/i, '')
      .replace(/\s+Brand$/i, '')
      .replace(/^Brand:\s*/i, '')
      .trim();
    if (text) result.brand = text;
  }
  if (result.brand === 'N/A') {
    const brandLink = document.querySelector('a#bylineInfo, #brandByLine a, a[data-brand]');
    if (brandLink) {
      const text = (brandLink.getAttribute('data-brand') || brandLink.textContent || '').trim();
      if (text) result.brand = text;
    }
  }

  // --- Price: List Price first, fallback to sale price ---
  // 1. List Price (strikethrough price)
  const listPriceEl = document.querySelector(
    '.a-price.a-text-price span.a-offscreen, ' +
    '#listPrice span.a-offscreen, ' +
    '.a-text-strike span.a-offscreen'
  );
  if (listPriceEl) {
    const val = listPriceEl.innerText.trim();
    if (val) result.price = val;
  }

  // 2. Current sale price
  if (result.price === 'N/A') {
    const currentPriceEl = document.querySelector(
      '.a-price .a-offscreen, ' +
      '#priceblock_ourprice, ' +
      '#priceblock_dealprice, ' +
      '#corePriceDisplay_desktop .a-offscreen'
    );
    if (currentPriceEl) {
      const val = currentPriceEl.innerText.trim();
      if (val) result.price = val;
    }
  }

  // 3. Split whole + fraction fallback
  if (result.price === 'N/A') {
    const whole = document.querySelector('.a-price .a-price-whole');
    const fraction = document.querySelector('.a-price .a-price-fraction');
    if (whole) {
      let p = (whole.innerText || '').trim();
      if (fraction) p += (fraction.innerText || '').trim();
      if (p) result.price = '$' + p;
    }
  }

  // --- Color ---
  // Strategy 1: #variation_color_name .selection text (standard layout)
  const colorSelection = document.querySelector(
    '#variation_color_name .selection, ' +
    '[id*="color_name"] .selection, ' +
    '[id*="color_name"] [class*="selection"]'
  );
  if (colorSelection) {
    const val = colorSelection.innerText.trim();
    if (val) result.color = val;
  }

  // Strategy 2: Selected swatch button aria-label
  if (result.color === 'N/A') {
    const swatch = document.querySelector(
      '#variation_color_name li.selected .a-button-text, ' +
      '#variation_color_name li.swatchHover .a-button-text'
    );
    if (swatch) {
      const label = swatch.getAttribute('aria-label');
      if (label) {
        result.color = label.trim();
      } else {
        const text = swatch.innerText.trim();
        if (text) result.color = text;
      }
    }
  }

  // Strategy 3: ARIA radio with aria-labelledby -> img[alt]
  if (result.color === 'N/A') {
    const checkedInput = document.querySelector(
      '[id*="color_name"] [aria-checked="true"], ' +
      '#variation_color_name [aria-checked="true"]'
    );
    if (checkedInput) {
      const labelledby = checkedInput.getAttribute('aria-labelledby');
      if (labelledby) {
        const labelEl = document.getElementById(labelledby);
        if (labelEl) {
          const img = labelEl.querySelector('img');
          if (img) {
            const alt = img.getAttribute('alt');
            if (alt) result.color = alt.trim();
          }
          if (result.color === 'N/A') {
            const text = labelEl.innerText.trim();
            if (text) result.color = text;
          }
        }
      }
    }
  }

  // Strategy 4: radio:checked -> closest li text
  if (result.color === 'N/A') {
    const checkedRadio = document.querySelector(
      '#variation_color_name input[type="radio"]:checked, ' +
      '[id*="color_name"] input[type="radio"]:checked'
    );
    if (checkedRadio) {
      const li = checkedRadio.closest('li');
      if (li) {
        const text = li.innerText.trim();
        const m = text.match(/^([A-Za-z\s\u00C0-\u024F]+?)(?:\s*\$|$)/);
        if (m) result.color = m[1].trim();
        else if (text) result.color = text.split('\n')[0].trim();
      }
    }
  }

  // Strategy 5: Product information table fallback
  if (result.color === 'N/A') {
    const rows = document.querySelectorAll('#productOverview_feature_div tr, #product-details-tech-specs-table tr');
    for (const row of rows) {
      const label = row.querySelector('th, td:first-child');
      if (label && /color/i.test(label.innerText)) {
        const value = row.querySelector('td:last-child, td:nth-child(2)');
        if (value) {
          const text = value.innerText.trim();
          if (text) { result.color = text; break; }
        }
      }
    }
  }

  result.success = true;
  return result;
};