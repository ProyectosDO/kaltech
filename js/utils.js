/* Utilidades compartidas (sitio público y panel admin) */
window.KT = window.KT || {};

KT.esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};

KT.money = function (n) {
  if (n == null || n === '') return 'Consultar';
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: (window.KT_CONFIG && KT_CONFIG.CURRENCY) || 'COP', maximumFractionDigits: 0
    }).format(Number(n));
  } catch (e) { return '$' + n; }
};

KT.slug = function (s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
};

KT.waLink = function (number, text) {
  return 'https://wa.me/' + String(number).replace(/\D/g, '') + '?text=' + encodeURIComponent(text || '');
};

KT.toast = function (msg, type) {
  var el = document.createElement('div');
  el.className = 'kt-toast ' + (type || '');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:' +
    (type === 'error' ? '#b91c1c' : '#6d28d9') +
    ';color:#fff;padding:12px 22px;border-radius:999px;z-index:9999;font:500 14px Poppins,sans-serif;box-shadow:0 0 20px rgba(0,0,0,.5)';
  document.body.appendChild(el);
  setTimeout(function () { el.remove(); }, 3200);
};
