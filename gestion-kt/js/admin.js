/*
 * Panel de la página Kaltech.
 * Los productos, precios y existencias vienen del POS (mismo Supabase). Aquí solo se decide
 * qué se publica en la tienda y se le pone foto, descripción y "destacado".
 * Entras con el mismo correo y contraseña que usas en el POS (necesita permiso para gestionar productos).
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var db = null;
  var state = { cats: [], products: [], editing: null, newImage: null, removeImage: false };

  /* ---------- Inicio / Auth ---------- */
  function init() {
    var ok = KT_CONFIG.SUPABASE_URL && KT_CONFIG.SUPABASE_ANON_KEY && window.supabase;
    if (!ok) { $('cfgWarn').hidden = false; bindStatic(); return; }
    db = window.supabase.createClient(KT_CONFIG.SUPABASE_URL, KT_CONFIG.SUPABASE_ANON_KEY);
    bindStatic();
    db.auth.getSession().then(function (r) { r.data.session ? showApp() : showLogin(); });
    db.auth.onAuthStateChange(function (_e, session) { session ? showApp() : showLogin(); });
  }

  function showLogin() { loaded = false; $('appView').hidden = true; $('loginView').hidden = false; }
  var loaded = false;
  function showApp() {
    $('loginView').hidden = true; $('appView').hidden = false;
    if (!loaded) { loaded = true; loadAll(); }
  }

  function webOf(p) {
    var w = p && p.product_web;
    if (Array.isArray(w)) w = w[0];
    return w || null;
  }

  async function loadAll() {
    try {
      var r = await Promise.all([
        db.from('categories').select('id,name').order('name'),
        db.from('products')
          .select('id,code,name,brand,category_id,price_cop,stock_qty,active,is_part,product_web(visible,featured,image_url,description)')
          .eq('active', true).eq('is_part', false).order('name'),
        db.from('web_settings').select('*')
      ]);
      if (r[0].error) throw r[0].error;
      if (r[1].error) throw r[1].error;
      state.cats = r[0].data;
      state.products = r[1].data;
      var s = {}; (r[2].data || []).forEach(function (x) { s[x.key] = x.value; });
      $('sWhatsapp').value = s.whatsapp || '';
      $('sInstagram').value = s.instagram || '';
      $('sFacebook').value = s.facebook || '';
      $('sTiktok').value = s.tiktok || '';
      $('sRepair').value = s.repair_text || '';
      renderProducts();
    } catch (e) {
      KT.toast('No se pudieron cargar los productos: ' + e.message + '. ¿Tu usuario tiene permiso en el POS?', 'error');
    }
  }

  /* ---------- Helpers ---------- */
  function catName(id) { var c = state.cats.find(function (x) { return x.id === id; }); return c ? c.name : '—'; }
  function storagePath(url) {
    if (!url) return null;
    var marker = '/object/public/' + KT_CONFIG.BUCKET + '/';
    var i = url.indexOf(marker);
    return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
  }
  function kb(n) { return (n / 1024).toFixed(0) + ' KB'; }

  /* ---------- Productos ---------- */
  function renderProducts() {
    var v = $('fView').value, q = $('fSearch').value.trim().toLowerCase();
    var list = state.products.filter(function (p) {
      var w = webOf(p);
      if (v === 'web' && !(w && w.visible)) return false;
      if (v === 'hidden' && w && w.visible) return false;
      if (v === 'nophoto' && w && w.image_url) return false;
      return !q || (p.name + ' ' + (p.brand || '') + ' ' + p.code).toLowerCase().indexOf(q) !== -1;
    });
    $('productRows').innerHTML = list.length ? list.map(function (p) {
      var w = webOf(p) || {};
      var stock = Number(p.stock_qty) > 0
        ? KT.esc(p.stock_qty)
        : '<span class="badge celular">Agotado</span>';
      return '<tr data-id="' + KT.esc(p.id) + '">' +
        '<td>' + (w.image_url ? '<img class="thumb" src="' + KT.esc(w.image_url) + '" alt="">' : '<div class="thumb">' + KT.icon('shield-check') + '</div>') + '</td>' +
        '<td>' + KT.esc(p.name) + (w.featured ? ' <span style="color:#fbbf24">' + KT.icon('star') + '</span>' : '') +
          '<br><small>' + KT.esc(p.code) + (p.brand ? ' · ' + KT.esc(p.brand) : '') + '</small></td>' +
        '<td>' + KT.esc(catName(p.category_id)) + '</td>' +
        '<td>' + KT.money(p.price_cop) + '</td>' +
        '<td>' + stock + '</td>' +
        '<td><label class="switch"><input type="checkbox" data-act="toggle"' + (w.visible ? ' checked' : '') + '><span></span></label></td>' +
        '<td class="actions-td"><button class="btn btn-ghost btn-sm" data-act="edit">Foto y detalles</button></td></tr>';
    }).join('') : '<tr><td colspan="7" class="empty-row">No hay productos con ese filtro. Los productos se crean en el POS.</td></tr>';
  }

  function openProduct(p) {
    var w = webOf(p) || {};
    state.editing = p; state.newImage = null; state.removeImage = false;
    $('pTitle').textContent = p.name;
    $('pPos').textContent = p.code + ' · ' + catName(p.category_id) + ' · ' + KT.money(p.price_cop) + ' · Existencias: ' + (p.stock_qty || 0) + ' (se cambian en el POS)';
    $('pDesc').value = w.description || '';
    $('pVisible').checked = !!w.visible;
    $('pFeatured').checked = !!w.featured;
    $('pFile').value = '';
    var img = $('pPreview');
    if (w.image_url) { img.src = w.image_url; img.hidden = false; } else { img.hidden = true; img.removeAttribute('src'); }
    $('pRemoveImg').hidden = !w.image_url;
    $('pInfo').textContent = '';
    $('productDialog').showModal();
  }

  async function uploadImage(blob, productId) {
    var ext = blob.type === 'image/jpeg' ? 'jpg' : 'webp';
    var path = productId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    var up = await db.storage.from(KT_CONFIG.BUCKET).upload(path, blob, { contentType: blob.type || 'image/webp', cacheControl: '31536000', upsert: false });
    if (up.error) throw up.error;
    return db.storage.from(KT_CONFIG.BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function saveProduct(e) {
    e.preventDefault();
    var btn = $('pSave'); btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      var p = state.editing;
      var w = webOf(p) || {};
      var image_url = w.image_url || null;
      var oldPath = storagePath(image_url);

      if (state.newImage) {
        image_url = await uploadImage(state.newImage.blob, p.id);
        if (oldPath) await db.storage.from(KT_CONFIG.BUCKET).remove([oldPath]);
      } else if (state.removeImage) {
        image_url = null;
        if (oldPath) await db.storage.from(KT_CONFIG.BUCKET).remove([oldPath]);
      }

      var row = {
        product_id: p.id,
        visible: $('pVisible').checked,
        featured: $('pFeatured').checked,
        description: $('pDesc').value.trim() || null,
        image_url: image_url,
        updated_at: new Date().toISOString()
      };
      var res = await db.from('product_web').upsert(row, { onConflict: 'product_id' });
      if (res.error) throw res.error;
      $('productDialog').close();
      KT.toast('Guardado');
      await loadAll();
    } catch (err) {
      KT.toast('No se pudo guardar: ' + err.message, 'error');
    } finally { btn.disabled = false; btn.textContent = 'Guardar'; }
  }

  /* ---------- Ajustes ---------- */
  async function saveSettings(e) {
    e.preventDefault();
    var rows = [
      { key: 'whatsapp', value: $('sWhatsapp').value.replace(/\D/g, '') },
      { key: 'instagram', value: $('sInstagram').value.trim() },
      { key: 'facebook', value: $('sFacebook').value.trim() },
      { key: 'tiktok', value: $('sTiktok').value.trim() },
      { key: 'repair_text', value: $('sRepair').value.trim() }
    ];
    var r = await db.from('web_settings').upsert(rows, { onConflict: 'key' });
    r.error ? KT.toast(r.error.message, 'error') : KT.toast('Ajustes guardados');
  }

  /* ---------- Eventos ---------- */
  function bindStatic() {
    $('loginForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!db) return;
      $('loginErr').hidden = true;
      var r = await db.auth.signInWithPassword({ email: $('loginEmail').value.trim(), password: $('loginPass').value });
      if (r.error) { $('loginErr').textContent = 'Correo o contraseña incorrectos.'; $('loginErr').hidden = false; }
    });
    $('logoutBtn').addEventListener('click', function () { loaded = false; db.auth.signOut(); });

    $('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      document.querySelectorAll('#tabs button').forEach(function (x) { x.classList.toggle('active', x === b); });
      document.querySelectorAll('.tab').forEach(function (t) { t.hidden = t.id !== 'tab-' + b.dataset.tab; });
    });

    $('fView').addEventListener('change', renderProducts);
    $('fSearch').addEventListener('input', renderProducts);

    $('productRows').addEventListener('click', async function (e) {
      var tr = e.target.closest('tr'); var act = e.target.dataset.act; if (!tr || !act) return;
      var p = state.products.find(function (x) { return x.id === tr.dataset.id; });
      if (act === 'edit') openProduct(p);
      if (act === 'toggle') {
        var on = e.target.checked;
        var r = await db.from('product_web').upsert({ product_id: p.id, visible: on, updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
        if (r.error) { KT.toast(r.error.message, 'error'); e.target.checked = !on; return; }
        var w = webOf(p) || {};
        w.visible = on;
        p.product_web = w;
        KT.toast(on ? (w.image_url ? 'Publicado en la tienda' : 'Publicado (sin foto todavía)') : 'Ocultado de la tienda');
      }
    });

    $('pFile').addEventListener('change', async function (e) {
      var f = e.target.files[0]; if (!f) return;
      $('pInfo').textContent = 'Comprimiendo…';
      try {
        var r = await KT.compressImage(f);
        state.newImage = r; state.removeImage = false;
        $('pPreview').src = URL.createObjectURL(r.blob); $('pPreview').hidden = false;
        $('pRemoveImg').hidden = false;
        $('pInfo').textContent = kb(r.originalSize) + ' → ' + kb(r.size) + ' (' + r.width + '×' + r.height + ', ' + (r.type === 'image/jpeg' ? 'JPG' : 'WebP') + ')';
      } catch (err) { $('pInfo').textContent = ''; KT.toast(err.message, 'error'); e.target.value = ''; }
    });
    $('pRemoveImg').addEventListener('click', function () {
      state.newImage = null; state.removeImage = true;
      $('pFile').value = ''; $('pPreview').hidden = true; $('pPreview').removeAttribute('src');
      $('pRemoveImg').hidden = true; $('pInfo').textContent = 'La foto se quitará al guardar.';
    });

    $('productForm').addEventListener('submit', saveProduct);
    $('settingsForm').addEventListener('submit', saveSettings);

    document.querySelectorAll('dialog [data-close]').forEach(function (b) {
      b.addEventListener('click', function () { b.closest('dialog').close(); });
    });
  }

  init();
})();
