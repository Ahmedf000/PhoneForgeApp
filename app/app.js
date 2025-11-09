document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('phone-input');
  const output = document.getElementById('output');
  const select = document.getElementById('country-select');
  const formatBtn = document.getElementById('format-btn');
  const clearBtn = document.getElementById('clear-btn');

  if (!select || !formatBtn) return;

  const normalizeDigits = (s) =>
    s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, d => '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹'.indexOf(d) % 10);

  const dialCodes = (() => {
    const uniq = new Set(
      Array.from(select.options)
        .map(o => (o.value || '').trim().replace('+', ''))
        .filter(v => /^\d+$/.test(v))
    );
    return Array.from(uniq).sort((a, b) => b.length - a.length);
  })();

  const getLabel = (opt) =>
    (opt.textContent || '').replace(/^[^A-Za-z]+/, '').trim();

  const withinE164 = (digits) =>
    digits.length >= 4 && digits.length <= 15;

  (() => {
    const current = select.value;
    const opts = Array.from(select.querySelectorAll('option'));
    opts.sort((a, b) =>
      getLabel(a).localeCompare(getLabel(b), undefined, { sensitivity: 'base' })
    );
    const frag = document.createDocumentFragment();
    opts.forEach(o => frag.appendChild(o));
    select.appendChild(frag);
    if (current) select.value = current;
  })();

  let buffer = '';
  let timer = null;
  const TYPE_TIMEOUT_MS = 700;

  function jumpToPrefix(prefix) {
    const options = Array.from(select.options);
    const start = Math.max(select.selectedIndex, 0);
    const ring = options.slice(start + 1).concat(options.slice(0, start + 1));
    const found = ring.find(o =>
      getLabel(o).toLowerCase().startsWith(prefix.toLowerCase())
    );
    if (found) {
      select.value = found.value;
      select.dispatchEvent(new Event('change'));
    }
  }

  document.addEventListener('keydown', (e) => {
    const typingInField =
      ['INPUT', 'TEXTAREA'].includes(e.target.tagName) && e.target !== select;
    if (typingInField) return;

    if (e.key.length === 1 && /[a-zA-Z\s]/.test(e.key)) {
      buffer += e.key;
    } else if (e.key === 'Backspace') {
      buffer = buffer.slice(0, -1);
    } else {
      return;
    }

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { buffer = ''; }, TYPE_TIMEOUT_MS);

    if (buffer) jumpToPrefix(buffer);
  });

  function formatNumber(raw) {
    if (!raw) return '';

    let s = normalizeDigits(String(raw)).trim();

    s = s.replace(/\b(?:tel|phone|mobile|mob|call|fax)\b[:\s-]*/gi, '');
    s = s.replace(/\(\s*0+\s*\)/g, '');
    s = s.replace(/^\s*00/, '+');
    s = s.replace(/[\/._\-–—\s\\]+/g, '');
    s = s.replace(/[(){}\[\]]/g, '');
    s = s.replace(/(?!^)\+/g, '');

    if (/^\+\d+$/.test(s)) {
      let d = s.slice(1);
      const cc = dialCodes.find(code => d.startsWith(code));
      if (cc) {
        d = cc + d.slice(cc.length).replace(/^0+/, '');
      } else {
        d = d.replace(/^0+/, '');
      }
      return withinE164(d) ? '+' + d : '';
    }

    const digitsOnly = s.replace(/\D/g, '');
    if (!digitsOnly) return '';

    let digits = digitsOnly.replace(/^0+/, '');
    if (!digits) return '';

    const hasKnownCode = dialCodes.find(code => digits.startsWith(code));
    if (hasKnownCode) {
      const local = digits.slice(hasKnownCode.length).replace(/^0+/, '');
      const full = hasKnownCode + local;
      return withinE164(full) ? '+' + full : '';
    }

    const selCode = (select.value || '').replace('+', '');
    const fullDigits = (selCode || '') + digits;

    return withinE164(fullDigits) ? '+' + fullDigits : '';
  }

  function doFormat() {
    const val = input.value;
    const result = formatNumber(val);
    output.value = result;
  }

  formatBtn.addEventListener('click', doFormat);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doFormat();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      output.value = '';
      input.focus();
    });
  }
});
