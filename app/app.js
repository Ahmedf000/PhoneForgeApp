// app.js — formatter + A→Z sort + type-to-scroll
document.addEventListener('DOMContentLoaded', () => {
  const input     = document.getElementById('phone-input');
  const output    = document.getElementById('output');
  const select    = document.getElementById('country-select');
  const formatBtn = document.getElementById('format-btn');
  const clearBtn  = document.getElementById('clear-btn');

  if (!select || !formatBtn) return;

  /* -----------------------------------------
   * Helpers
   * ----------------------------------------- */

  // Normalize Arabic-Indic & Eastern Arabic-Indic digits → ASCII 0–9
  const normalizeDigits = (s) =>
    s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, d => '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹'.indexOf(d) % 10);

  // Collect unique numeric country codes from the <select> (no '+'),
  // sorted by length desc so longest code matches first.
  const dialCodes = (() => {
    const uniq = new Set(
      Array.from(select.options)
        .map(o => (o.value || '').trim().replace('+', ''))
        .filter(v => /^\d+$/.test(v))
    );
    return Array.from(uniq).sort((a, b) => b.length - a.length);
  })();

  // Visible label for sorting / type-to-scroll (strip flag/emoji/punct)
  const getLabel = (opt) =>
    (opt.textContent || '').replace(/^[^A-Za-z]+/, '').trim();

  // Basic E.164 guard: total digits (without '+') must be 4..15
  const withinE164 = (digits) => digits.length >= 4 && digits.length <= 15;

  /* -----------------------------------------
   * Sort countries A→Z once (keep current pick)
   * ----------------------------------------- */
  (() => {
    const current = select.value;
    const opts = Array.from(select.querySelectorAll('option'));
    opts.sort((a, b) => getLabel(a).localeCompare(getLabel(b), undefined, { sensitivity: 'base' }));
    const frag = document.createDocumentFragment();
    opts.forEach(o => frag.appendChild(o));
    select.appendChild(frag);
    if (current) select.value = current;
  })();

  /* -----------------------------------------
   * Type-to-scroll (multi-letter with timeout)
   * ----------------------------------------- */
  let buffer = '';
  let timer  = null;
  const TYPE_TIMEOUT_MS = 700;

  function jumpToPrefix(prefix) {
    const options = Array.from(select.options);
    const start = Math.max(select.selectedIndex, 0);
    const ring  = options.slice(start + 1).concat(options.slice(0, start + 1));
    const found = ring.find(o => getLabel(o).toLowerCase().startsWith(prefix.toLowerCase()));
    if (found) {
      select.value = found.value;
      select.dispatchEvent(new Event('change'));
    }
  }

  document.addEventListener('keydown', (e) => {
    const typingInField = ['INPUT','TEXTAREA'].includes(e.target.tagName) && e.target !== select;
    if (typingInField) return;

    if (e.key.length === 1 && /[a-zA-Z\s]/.test(e.key)) {
      buffer += e.key;
    } else if (e.key === 'Backspace') {
      buffer = buffer.slice(0, -1);
    } else {
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (buffer = ''), TYPE_TIMEOUT_MS);
    if (buffer) jumpToPrefix(buffer);
  });

  /* -----------------------------------------
   * Formatter
   * ----------------------------------------- */
  function formatNumber(raw) {
    if (!raw) return '';

    // Keep an early copy to detect explicit international format
    const original = normalizeDigits(String(raw)).trim();
    const explicitIntl = /^\s*(\+|00)/.test(original);

    let s = original;

    // Text noise like "tel:", "mobile:", etc.
    s = s.replace(/\b(?:tel|phone|mobile|mob|call|fax)\b[:\s-]*/gi, '');

    // Remove parentheses that contain only zeros, e.g. (0), (00), (000)
    s = s.replace(/\(\s*0+\s*\)/g, '');

    // Convert 00 prefix to +
    s = s.replace(/^\s*00/, '+');

    // Remove obvious separators/punctuation (keep '+' for now)
    s = s.replace(/[\/._\-–—\s\\]+/g, '');

    // Remove any remaining brackets but KEEP their digits (e.g. "(202)" -> "202")
    s = s.replace(/[(){}\[\]]/g, '');

    // Remove duplicate '+' (only allow at start)
    s = s.replace(/(?!^)\+/g, '');

    // Case 1: Already "+digits" → standardize zeros after CC
    if (/^\+\d+$/.test(s)) {
      let d = s.slice(1);
      const cc = dialCodes.find(code => d.startsWith(code));
      if (cc) {
        // Drop trunk zeros immediately after the country code
        d = cc + d.slice(cc.length).replace(/^0+/, '');
      } else {
        // No known CC match → drop leading zeros from the whole sequence
        d = d.replace(/^0+/, '');
      }
      return withinE164(d) ? ('+' + d) : '';
    }

    // Remove all non-digits for subsequent branches
    const digitsOnly = s.replace(/\D/g, '');
    if (!digitsOnly) return '';

    // Case 2: User typed + or 00, but plus got normalized away earlier
    if (explicitIntl) {
      let d = digitsOnly;
      const cc = dialCodes.find(code => d.startsWith(code));
      if (cc) {
        const local = d.slice(cc.length).replace(/^0+/, ''); // drop trunk zeros after CC
        const full  = cc + local;
        return withinE164(full) ? ('+' + full) : '';
      }
      d = d.replace(/^0+/, '');
      return withinE164(d) ? ('+' + d) : '';
    }

    // Case 3: Treat as national for the *selected* country.
    // Remove *all* leading zeros, then prefix selected country code.
    const selCode = (select.value || '').replace('+','');
    const local   = digitsOnly.replace(/^0+/, '');
    const full    = selCode ? (selCode + local) : local;

    return withinE164(full) ? ('+' + full) : '';
  }

  /* -----------------------------------------
   * Wire buttons
   * ----------------------------------------- */
  function doFormat() {
    const val = input.value;
    const result = formatNumber(val);
    output.value = result;
  }

  formatBtn.addEventListener('click', doFormat);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doFormat(); });
  clearBtn && clearBtn.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    input.focus();
  });
});
