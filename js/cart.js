/* Carrito de accesorios: se guarda en el navegador y se envía como pedido por WhatsApp */
window.KT = window.KT || {};
KT.cart = (function () {
  var KEY = 'kt-cart';
  var items = {};      // { productId: cantidad }
  var products = [];   // accesorios disponibles (los pasa catalog.js)
  var wa = '';
  var $ = function (id) { return document.getElementById(id); };

  function load() { try { items = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { items = {}; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} }
  function prod(id) { return products.find(function (p) { return String(p.id) === String(id); }); }
  function maxQty(p) { return Math.max(0, Number(p.stock || 0)); }

  function lines() {
    return Object.keys(items).map(function (id) {
      var p = prod(id); return p ? { p: p, q: items[id] } : null;
    }).filter(Boolean);
  }
  function totalCount() { return lines().reduce(function (n, l) { return n + l.q; }, 0); }
  function totalPrice() {
    return lines().reduce(function (t, l) { return t + (l.p.price != null && l.p.price !== '' ? Number(l.p.price) * l.q : 0); }, 0);
  }

  // Quita del carrito lo que ya no existe o excede el stock
  function clean() {
    Object.keys(items).forEach(function (id) {
      var p = prod(id);
      if (!p || maxQty(p) < 1) { delete items[id]; return; }
      items[id] = Math.min(Math.max(1, items[id] | 0), maxQty(p));
    });
    save();
  }

  function badge() {
    var n = totalCount(), el = $('cartCount');
    if (!el) return;
    el.textContent = n > 99 ? '99+' : n;
    el.hidden = n === 0;
  }

  function message() {
    var ls = lines();
    var txt = 'Hola Kaltech, quiero apartar estos accesorios:\n\n' + ls.map(function (l) {
      var sub = l.p.price != null && l.p.price !== '' ? KT.money(Number(l.p.price) * l.q) : 'Consultar';
      return '• ' + l.q + ' x ' + l.p.name + ' — ' + sub;
    }).join('\n');
    txt += '\n\nTotal: ' + KT.money(totalPrice());
    return txt;
  }

  function render() {
    badge();
    var d = $('cartDrawer'); if (!d) return;
    var ls = lines();
    var body;
    if (!ls.length) {
      body = '<div class="cart-empty">' + KT.icon('cart') +
        '<p><strong>Tu carrito está vacío</strong></p><p>Agrega accesorios y envíanos tu pedido por WhatsApp.</p></div>';
    } else {
      body = ls.map(function (l) {
        var p = l.p;
        var img = p.image_url ? '<img src="' + KT.esc(p.image_url) + '" alt="">' : KT.icon('image');
        var unit = p.price != null && p.price !== '' ? KT.money(p.price) : 'Consultar';
        var sub = p.price != null && p.price !== '' ? KT.money(Number(p.price) * l.q) : '';
        return '<div class="cart-item" data-id="' + KT.esc(p.id) + '">' +
          '<div class="ci-img">' + img + '</div>' +
          '<div class="ci-info"><b>' + KT.esc(p.name) + '</b><small>' + unit + '</small>' +
            '<div class="qty"><button data-act="dec" aria-label="Quitar uno">' + KT.icon('minus') + '</button>' +
            '<span>' + l.q + '</span>' +
            '<button data-act="inc" aria-label="Agregar uno"' + (l.q >= maxQty(p) ? ' disabled' : '') + '>' + KT.icon('plus') + '</button></div></div>' +
          '<div class="ci-side"><span class="ci-sub">' + sub + '</span>' +
            '<button class="ci-rm" data-act="rm" aria-label="Quitar del carrito">' + KT.icon('trash') + '</button></div></div>';
      }).join('');
    }
    var foot = ls.length
      ? '<div class="cart-total"><span>Total</span><strong>' + KT.money(totalPrice()) + '</strong></div>' +
        '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + KT.waLink(wa, message()) + '">' + KT.icon('whatsapp') + 'Enviar pedido por WhatsApp</a>' +
        '<button class="cart-clear" data-act="clear">Vaciar carrito</button>'
      : '';
    d.innerHTML = '<div class="drawer-head"><h3>' + KT.icon('cart') + 'Tu carrito</h3>' +
      '<button class="drawer-close" data-act="close" aria-label="Cerrar">' + KT.icon('x') + '</button></div>' +
      '<div class="drawer-body">' + body + '</div>' +
      (foot ? '<div class="drawer-foot">' + foot + '</div>' : '');
  }

  function add(id, silent) {
    var p = prod(id); if (!p) return;
    var cur = items[id] || 0, max = maxQty(p);
    if (max < 1) return KT.toast('Este accesorio está agotado', 'error');
    if (cur >= max) return KT.toast('Para pedir más unidades escríbenos por WhatsApp', 'error');
    items[id] = cur + 1; save(); render();
    if (!silent) KT.toast('Agregado al carrito');
    var b = $('cartBtn'); if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  }

  function open() { render(); var d = $('cartDrawer'); if (d && !d.open) d.showModal(); }
  function close() { var d = $('cartDrawer'); if (d && d.open) d.close(); }

  function bind() {
    var btn = $('cartBtn'); if (btn) btn.addEventListener('click', open);
    $('cartDrawer').addEventListener('click', function (e) {
      var d = $('cartDrawer');
      if (e.target === d) return close();
      var b = e.target.closest('[data-act]'); if (!b) return;
      var act = b.dataset.act;
      if (act === 'close') return close();
      if (act === 'clear') { items = {}; save(); return render(); }
      var row = b.closest('.cart-item'); if (!row) return;
      var id = row.dataset.id, p = prod(id); if (!p) return;
      if (act === 'inc') { items[id] = Math.min((items[id] || 0) + 1, maxQty(p)); }
      if (act === 'dec') { items[id] = (items[id] || 1) - 1; if (items[id] < 1) delete items[id]; }
      if (act === 'rm') { delete items[id]; }
      save(); render();
    });
  }

  var bound = false;
  return {
    // Se llama desde catalog.js cuando ya cargaron los productos
    init: function (opts) {
      products = opts.products || []; wa = opts.wa || '';
      load(); clean();
      if (!bound) { bind(); bound = true; }
      render();
    },
    setWhatsapp: function (n) { wa = n; },
    add: add, open: open, close: close
  };
})();
