// Amazon Variant ASIN Extractor for amazon-product-excavate
// Use via chrome-devtools_evaluate_script on a product page
// Returns: { success, currentAsin, variants: [{name, asin}] }
// Note: This script ONLY extracts all variant ASINs from the page.
//       Filtering of same-type-different-color is handled in the SKILL.md workflow.

() => {
  const result = { success: false, currentAsin: '', variants: [] };

  // --- Get current ASIN ---
  const asinInput = document.getElementById('ASIN');
  if (asinInput && asinInput.value) {
    result.currentAsin = asinInput.value.trim();
  }
  if (!result.currentAsin) {
    const m = window.location.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
    if (m) result.currentAsin = m[1].toUpperCase();
  }

  // --- Strategy 1: Primary twister container ---
  const container = document.querySelector('#tp-inline-twister-dim-values-container');
  if (container) {
    const items = container.querySelectorAll('li[data-asin]');
    if (items.length > 0) {
      result.variants = Array.from(items).map(li => {
        const img = li.querySelector('img');
        return {
          name: img ? img.getAttribute('alt').trim() : li.textContent.trim().replace(/\s+/g, ' '),
          asin: li.getAttribute('data-asin')
        };
      });
      result.success = true;
      return result;
    }
  }

  // --- Strategy 2: Color variation section ---
  const colorSection = document.querySelector(
    '#variation_color_name, ' +
    '[id*="color_name"]:not(#variation_color_name_value)'
  );
  if (colorSection) {
    // Try li[data-default-asin] first
    const colorItems = colorSection.querySelectorAll('li[data-default-asin]');
    if (colorItems.length > 0) {
      result.variants = Array.from(colorItems).map(li => {
        const img = li.querySelector('img');
        return {
          name: img ? img.getAttribute('alt').trim() : li.innerText.trim().replace(/\s+/g, ' '),
          asin: li.getAttribute('data-default-asin')
        };
      });
      result.success = true;
      return result;
    }

    // Try li[data-asin]
    const colorItems2 = colorSection.querySelectorAll('li[data-asin]');
    if (colorItems2.length > 0) {
      result.variants = Array.from(colorItems2).map(li => {
        const img = li.querySelector('img');
        return {
          name: img ? img.getAttribute('alt').trim() : li.innerText.trim().replace(/\s+/g, ' '),
          asin: li.getAttribute('data-asin')
        };
      });
      result.success = true;
      return result;
    }
  }

  // --- Strategy 3: Other variation sections (style, size, etc.) ---
  const otherSections = document.querySelectorAll(
    '#variation_style_name, ' +
    '#variation_size_name, ' +
    '[id*="inline-twister"] li[data-asin]'
  );
  for (const section of otherSections) {
    const items = section.querySelectorAll
      ? section.querySelectorAll('li[data-asin], li[data-default-asin]')
      : [];
    if (items.length > 0) {
      result.variants = Array.from(items).map(li => {
        const img = li.querySelector('img');
        const asin = li.getAttribute('data-asin') || li.getAttribute('data-default-asin');
        return {
          name: img ? img.getAttribute('alt').trim() : li.innerText.trim().replace(/\s+/g, ' '),
          asin: asin
        };
      });
      result.success = true;
      return result;
    }
  }

  // --- Strategy 4: Generic scan for any twister/swatch container ---
  const allTwisterContainers = document.querySelectorAll(
    '[id*="inline-twister"] li[data-asin], ' +
    '[id*="twister"] li[data-asin], ' +
    '.a-section li[data-default-asin]'
  );
  if (allTwisterContainers.length > 0) {
    result.variants = Array.from(allTwisterContainers).map(li => {
      const img = li.querySelector('img');
      const asin = li.getAttribute('data-asin') || li.getAttribute('data-default-asin');
      return {
        name: img ? img.getAttribute('alt').trim() : li.innerText.trim().replace(/\s+/g, ' '),
        asin: asin
      };
    });
    result.success = true;
    return result;
  }

  // No variants found - product may have no variations
  result.success = true;
  result.variants = [];
  return result;
};