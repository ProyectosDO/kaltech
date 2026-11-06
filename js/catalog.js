/* Lógica del catálogo público */
(function () {
  var state = {
    cats: [], products: [], settings: {},
    filter: { celular: 'all', estuche: 'all' },
    search: { celular: '', estuche: '' }
  };
  var wa = String(KT_CONFIG.WHATSAPP_DEFAULT || '').replace(/\D/g, '');

  var $ = function (id) { return document.getElementById(id); };
  // Secciones que se pueden activar/ocultar desde js/config.js
  var SHOW_CASES = !!KT_CONFIG.SHOW_CASES;
  var SHOW_PHONES = !!KT_CONFIG.SHOW_PHONES;
  var TYPES = [];
  if (SHOW_CASES) TYPES.push('estuche');
  if (SHOW_PHONES) TYPES.push('celular');
  function removeFeature(name) {
    document.querySelectorAll('[data-feature="' + name + '"]').forEach(function (n) { n.remove(); });
  }
  if (!SHOW_CASES) removeFeature('cases');
  if (!SHOW_PHONES) {
    removeFeature('phones');
    $('brandSub').textContent = 'Accesorios · Reparaciones';
  }

  // Alterna los fondos de las secciones que quedan visibles
  Array.prototype.forEach.call(document.querySelectorAll('main > section.section'), function (sec, i) {
    sec.classList.toggle('section-alt', i % 2 === 1);
  });

  var els = {};
  if (SHOW_PHONES) els.celular = { grid: $('gridPhones'), chips: $('chipsPhones'), search: $('searchPhones') };
  if (SHOW_CASES) els.estuche = { grid: $('gridCases'), chips: $('chipsCases'), search: $('searchCases') };

  function catName(id) {
    var c = state.cats.find(function (x) { return x.id === id; });
    return c ? c.name : '';
  }

  function placeholder() { return KT.icon('image', 'ph'); }

  function tagFor(p) {
    var s = Number(p.stock || 0);
    return s > 0
      ? '<span class="tag stock">' + KT.icon('check-circle') + 'En stock</span>'
      : '<span class="tag out">Agotado</span>';
  }

  // Accesorios: tarjeta con imagen
  function cardHTML(p) {
    var img = p.image_url
      ? '<img loading="lazy" decoding="async" src="' + KT.esc(p.image_url) + '" alt="' + KT.esc(p.name) + '">'
      : placeholder();
    return '<article class="card" data-id="' + KT.esc(p.id) + '" tabindex="0" role="button" aria-label="Ver ' + KT.esc(p.name) + '">' +
      '<div class="card-img">' + img + tagFor(p) + '</div>' +
      '<div class="card-body">' +
        '<span class="card-brand">' + KT.esc(p.brand || catName(p.category_id)) + '</span>' +
        '<h3 class="card-title">' + KT.esc(p.name) + '</h3>' +
        '<div class="card-foot"><div class="card-price">' + KT.money(p.price) + '</div>' +
          '<button class="add-btn" data-add="' + KT.esc(p.id) + '" aria-label="Agregar ' + KT.esc(p.name) + ' al carrito"' +
          (Number(p.stock || 0) > 0 ? '' : ' disabled') + '>' + KT.icon('cart') + '</button></div>' +
      '</div></article>';
  }

  // Celulares: fila de lista, solo información (sin imagen)
  function phoneRowHTML(p) {
    var specs = (p.specs || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var specsHTML = specs.length
      ? '<ul class="phone-specs">' + specs.map(function (l) { return '<li>' + KT.esc(l) + '</li>'; }).join('') + '</ul>'
      : '';
    var msg = 'Hola Kaltech, quiero pedir el celular: ' + p.name;
    return '<article class="phone-row">' +
      '<div class="phone-main">' +
        '<div class="phone-top"><span class="card-brand">' + KT.esc(p.brand || catName(p.category_id)) + '</span>' +
          '<span class="pill">Segunda mano</span></div>' +
        '<h3 class="phone-name">' + KT.esc(p.name) + '</h3>' +
        specsHTML +
        (p.description ? '<p class="phone-desc">' + KT.esc(p.description) + '</p>' : '') +
      '</div>' +
      '<div class="phone-side">' +
        '<div class="card-price">' + KT.money(p.price) + '<small>Bajo pedido</small></div>' +
        '<a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="' + KT.waLink(wa, msg) + '">' +
          KT.icon('whatsapp') + 'Pedir</a>' +
      '</div></article>';
  }

  // Icono según el nombre de la categoría (estuches, cargadores, audífonos, cables...)
  function catIcon(name) {
    var n = KT.slug(name || '');
    if (/estuche|funda|case|protector|vidrio|mica/.test(n)) return 'shield-check';
    if (/cargador|carga|power|bateria/.test(n)) return 'zap';
    if (/audifon|auricular|manos-libres|diadema|parlante|bocina|sonido/.test(n)) return 'headphones';
    if (/cable|adaptador|conector/.test(n)) return 'cable';
    return 'package';
  }

  function count(type, catId) {
    return state.products.filter(function (p) {
      return p.type === type && (catId === 'all' || p.category_id === catId);
    }).length;
  }

  function renderChips(type) {
    // Solo se muestran categorías que tengan productos
    var cats = state.cats.filter(function (c) { return c.type === type && count(type, c.id) > 0; });
    var cur = state.filter[type];
    if (cur !== 'all' && !cats.some(function (c) { return c.id === cur; })) cur = state.filter[type] = 'all';
    var box = els[type].chips;

    // Categorías: botones pequeños (chips)
    box.hidden = !cats.length;
    var h = '<button class="chip' + (cur === 'all' ? ' active' : '') + '" data-cat="all">Todos</button>';
    cats.forEach(function (c) {
      h += '<button class="chip' + (cur === c.id ? ' active' : '') + '" data-cat="' + KT.esc(c.id) + '">' + KT.esc(c.name) + '</button>';
    });
    box.innerHTML = h;
  }

  function renderGrid(type) {
    var q = state.search[type].trim().toLowerCase();
    var list = state.products.filter(function (p) {
      if (p.type !== type) return false;
      if (state.filter[type] !== 'all' && p.category_id !== state.filter[type]) return false;
      if (q && (p.name + ' ' + (p.brand || '')).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
    var render = type === 'celular' ? phoneRowHTML : cardHTML;
    els[type].grid.innerHTML = list.length
      ? list.map(render).join('')
      : '<p class="empty">' + (type === 'celular'
          ? 'Aún no hay celulares en la lista. Escríbenos y te conseguimos el modelo que buscas.'
          : 'No hay accesorios para mostrar por ahora.') + '</p>';
  }

  // Detalle de un accesorio (los celulares van en lista y no abren modal)
  function openModal(id) {
    var p = state.products.find(function (x) { return x.id === id; });
    if (!p) return;
    var msg = 'Hola Kaltech, me interesa el accesorio: ' + p.name;
    var img = p.image_url ? '<img src="' + KT.esc(p.image_url) + '" alt="' + KT.esc(p.name) + '">' : KT.icon('image');
    var note = '<p class="notice ok">' + KT.icon('check-circle') + '<span>' +
      (p.stock > 0 ? 'Disponible' : 'Actualmente agotado') + '.</span></p>';
    var specs = (p.specs || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var specsHTML = specs.length
      ? '<ul class="specs">' + specs.map(function (l) { return '<li>' + KT.icon('check-circle') + KT.esc(l) + '</li>'; }).join('') + '</ul>'
      : '';

    var m = $('productModal');
    m.innerHTML = '<button class="modal-close" aria-label="Cerrar">' + KT.icon('x') + '</button>' +
      '<div class="modal-img">' + img + '</div>' +
      '<div class="modal-body">' +
        '<span class="card-brand">' + KT.esc(p.brand || catName(p.category_id)) + '</span>' +
        '<h3>' + KT.esc(p.name) + '</h3>' +
        '<div class="card-price">' + KT.money(p.price) + '</div>' +
        (p.description ? '<p class="desc">' + KT.esc(p.description) + '</p>' : '') +
        specsHTML + note +
        '<button class="btn btn-primary" data-add="' + KT.esc(p.id) + '"' + (Number(p.stock || 0) > 0 ? '' : ' disabled') + '>' +
          KT.icon('cart') + 'Agregar al carrito</button>' +
        '<a class="btn btn-wa" target="_blank" rel="noopener" href="' + KT.waLink(wa, msg) + '">' +
          KT.icon('whatsapp') + 'Consultar por WhatsApp</a>' +
      '</div>';
    m.showModal();
  }

  function setNav(open) {
    $('mainNav').classList.toggle('open', open);
    $('navToggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('navToggle').innerHTML = KT.icon(open ? 'x' : 'menu');
  }

  function bind() {
    TYPES.forEach(function (type) {
      els[type].chips.addEventListener('click', function (e) {
        var b = e.target.closest('.chip'); if (!b) return;
        state.filter[type] = b.dataset.cat;
        renderChips(type); renderGrid(type);
      });
      els[type].search.addEventListener('input', function (e) {
        state.search[type] = e.target.value; renderGrid(type);
      });
      els[type].grid.addEventListener('click', function (e) {
        var a = e.target.closest('[data-add]');
        if (a) { e.stopPropagation(); if (!a.disabled) KT.cart.add(a.dataset.add); return; }
        var c = e.target.closest('.card'); if (c) openModal(c.dataset.id);
      });
      els[type].grid.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.closest('[data-add]')) return;
        var c = e.target.closest('.card'); if (c) { e.preventDefault(); openModal(c.dataset.id); }
      });
    });

    $('socials').addEventListener('click', function (e) {
      var a = e.target.closest('.social-btn.pending');
      if (a) { e.preventDefault(); KT.toast('Muy pronto: estamos preparando esta red.'); }
    });

    var modal = $('productModal');
    modal.addEventListener('click', function (e) {
      var a = e.target.closest('[data-add]');
      if (a) { if (!a.disabled) { KT.cart.add(a.dataset.add); modal.close(); } return; }
      if (e.target === modal || e.target.closest('.modal-close')) modal.close();
    });

    $('navToggle').addEventListener('click', function () {
      setNav(!$('mainNav').classList.contains('open'));
    });
    $('mainNav').addEventListener('click', function (e) {
      if (e.target.closest('a')) setNav(false);
    });

    // Acceso discreto al panel: 5 toques rápidos sobre el logo/nombre
    var taps = 0, timer;
    $('brandLogo').parentElement.addEventListener('click', function () {
      taps++; clearTimeout(timer);
      timer = setTimeout(function () { taps = 0; }, 2500);
      if (taps >= 5) { taps = 0; location.href = KT_CONFIG.ADMIN_PATH + '/'; }
    });
  }

  function applySettings() {
    var s = state.settings;
    // El número de js/config.js manda; el de Supabase (web_settings) solo se usa si config.js está vacío
    if (!wa && s.whatsapp) wa = String(s.whatsapp).replace(/\D/g, '');
    if (s.repair_text) $('repairText').textContent = s.repair_text;
    var general = KT.waLink(wa, 'Hola Kaltech, quiero más información.');
    ['waFloat', 'navWa'].forEach(function (id) { $(id).href = general; });
    $('repairWa').href = KT.waLink(wa, 'Hola Kaltech, quiero consultar una reparación de mi celular.');

    // Redes sociales: siempre visibles; si aún no hay enlace, avisan "muy pronto"
    var nets = { soIg: 'instagram', soFb: 'facebook', soTt: 'tiktok' };
    Object.keys(nets).forEach(function (id) {
      var url = (s[nets[id]] || KT_CONFIG[nets[id].toUpperCase() + '_URL'] || '').trim();
      var ok = /^https?:\/\//i.test(url);
      $(id).classList.toggle('pending', !ok);
      $(id).href = ok ? url : '#';
    });
  }


  // Resalta en el menú la sección que se está viendo
  function spy() {
    var links = {};
    document.querySelectorAll('[data-spy]').forEach(function (a) { links[a.dataset.spy] = a; });
    var ids = Object.keys(links).filter(function (id) { return document.getElementById(id); });
    function mark(id) {
      ids.forEach(function (k) { links[k].classList.toggle('active', k === id); });
    }
    mark('inicio');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) mark(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ids.forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  // Carrusel del hero: las fotos de los accesorios hacen de imagen de fondo (si no hay ninguna con imagen, queda el fondo estático)
  function initHero() {
    var box = $('heroCarousel'), hero = $('inicio');
    if (!box || !hero) return;
    var withImg = state.products.filter(function (p) { return p.type === 'estuche' && p.image_url; });
    var inStock = withImg.filter(function (p) { return p.stock > 0; });
    var list = (inStock.length ? inStock : withImg).slice(0, 8);
    if (!list.length) return;

    box.innerHTML =
      list.map(function (p, i) {
        var u = KT.esc(p.image_url);
        return '<div class="hc-slide" role="img" aria-label="' + KT.esc(p.name) + '">' +
          '<img class="hc-bg" src="' + u + '" alt="" aria-hidden="true"' + (i === 0 ? '' : ' loading="lazy"') + ' decoding="async" draggable="false">' +
          '<img class="hc-fg" src="' + u + '" alt=""' + (i === 0 ? '' : ' loading="lazy"') + ' decoding="async" draggable="false"></div>';
      }).join('') +
      (list.length > 1 ? '<div class="hc-dots">' + list.map(function (p, i) {
        return '<button type="button" class="hc-dot" data-i="' + i + '" aria-label="Foto ' + (i + 1) + '"></button>';
      }).join('') + '</div>' : '');
    hero.classList.add('has-carousel');

    var slides = box.querySelectorAll('.hc-slide'), dots = box.querySelectorAll('.hc-dot');
    var idx = 0, timer = null, down = null;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, k) { s.classList.toggle('on', k === idx); });
      Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle('on', k === idx); });
    }
    function stop() { clearInterval(timer); timer = null; }
    function play() {
      stop();
      if (slides.length > 1 && !reduce && !document.hidden) timer = setInterval(function () { show(idx + 1); }, 5000);
    }

    box.addEventListener('click', function (e) {
      var d = e.target.closest('.hc-dot');
      if (d) { show(+d.dataset.i); play(); }
    });
    // Deslizar con el dedo (móvil)
    box.addEventListener('pointerdown', function (e) { down = e.clientX; });
    box.addEventListener('pointerup', function (e) {
      if (down === null) return;
      var dx = e.clientX - down; down = null;
      if (Math.abs(dx) > 40) { show(idx + (dx < 0 ? 1 : -1)); play(); }
    });
    box.addEventListener('pointercancel', function () { down = null; });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : play(); });

    show(0); play();
  }

  async function init() {
    $('year').textContent = new Date().getFullYear();
    bind();
    spy();
    applySettings(); // los botones de WhatsApp funcionan desde el primer momento
    try {
      var res = await Promise.all([KT.api.getCategories(), KT.api.getProducts(), KT.api.getSettings()]);
      state.cats = res[0]; state.products = res[1]; state.settings = res[2];
    } catch (err) {
      console.error(err);
      KT.toast('No se pudo cargar el catálogo. Intenta de nuevo.', 'error');
    }
    applySettings();
    TYPES.forEach(function (t) { renderChips(t); renderGrid(t); });
    if (SHOW_CASES) initHero();
    if (SHOW_CASES) {
      KT.cart.init({ wa: wa, products: state.products.filter(function (p) { return p.type === 'estuche'; }) });
    }
  }

  init();
})();
