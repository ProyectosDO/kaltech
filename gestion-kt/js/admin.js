/* Panel de administración Kaltech: login, CRUD de productos/categorías, ajustes */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var db = null;
  var state = { cats: [], products: [], editing: null, editingCat: null, newImage: null, removeImage: false };

  /* ---------- Inicio / Auth ---------- */
  function init() {
    // Si SHOW_CASES es false, se quitan los accesorios de los selectores (js/config.js)
    if (!KT_CONFIG.SHOW_CASES) {
      document.querySelectorAll('#fType option[value="estuche"], #pType option[value="estuche"], #cType option[value="estuche"]')
        .forEach(function (o) { o.remove(); });
    }
    if (!KT_CONFIG.SHOW_CASES) $('quickCats').hidden = true;
    var ok =KT_CONFIG.SUPABASE_URL && KT_CONFIG.SUPABASE_ANON_KEY && window.supabase;
    if (!ok) { $('cfgWarn').hidden = false; bindStatic(); return; }
    db = window.supabase.createClient(KT_CONFIG.SUPABASE_URL, KT_CONFIG.SUPABASE_ANON_KEY);
    bindStatic();
    db.auth.getSession().then(function (r) { r.data.session ? showApp() : showLogin(); });
    db.auth.onAuthStateChange(function (_e, session) { session ? showApp() : showLogin(); });
  }

  function showLogin() { $('appView').hidden = true; $('loginView').hidden = false; }
  var loaded = false;
  function showApp() {
    $('loginView').hidden = true; $('appView').hidden = false;
    if (!loaded) { loaded = true; loadAll(); }
  }

  async function loadAll() {
    try {
      var r = await Promise.all([
        db.from('categories').select('*').order('name'),
        db.from('products').select('*').order('created_at', { ascending: false }),
        db.from('settings').select('*')
      ]);
      if (r[0].error) throw r[0].error;
      if (r[1].error) throw r[1].error;
      state.cats = r[0].data; state.products = r[1].data;
      var s = {}; (r[2].data || []).forEach(function (x) { s[x.key] = x.value; });
      $('sWhatsapp').value = s.whatsapp || '';
      $('sInstagram').value = s.instagram || '';
      $('sFacebook').value = s.facebook || '';
      $('sTiktok').value = s.tiktok || '';
      $('sRepair').value = s.repair_text || '';
      renderProducts(); renderCategories();
    } catch (e) { KT.toast('Error cargando datos: ' + e.message, 'error'); }
  }

  /* ---------- Helpers ---------- */
  function catName(id) { var c = state.cats.find(function (x) { return x.id === id; }); return c ? c.name : '—'; }
  function fillCatSelect(type, selected) {
    var list = state.cats.filter(function (c) { return c.type === type; });
    $('pCat').innerHTML = '<option value="">Sin categoría</option>' + list.map(function (c) {
      return '<option value="' + KT.esc(c.id) + '"' + (c.id === selected ? ' selected' : '') + '>' + KT.esc(c.name) + '</option>';
    }).join('');
  }
  function storagePath(url) {
    if (!url) return null;
    var marker = '/object/public/' + KT_CONFIG.BUCKET + '/';
    var i = url.indexOf(marker);
    return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length).split('?')[0]);
  }
  function kb(n) { return (n / 1024).toFixed(0) + ' KB'; }

  /* ---------- Productos ---------- */
  function renderProducts() {
    var t = $('fType').value, q = $('fSearch').value.trim().toLowerCase();
    var list = state.products.filter(function (p) {
      return (!t || p.type === t) && (!q || (p.name + ' ' + (p.brand || '')).toLowerCase().indexOf(q) !== -1);
    });
    $('productRows').innerHTML = list.length ? list.map(function (p) {
      return '<tr data-id="' + KT.esc(p.id) + '">' +
        '<td>' + (p.image_url ? '<img class="thumb" src="' + KT.esc(p.image_url) + '" alt="">' : '<div class="thumb">' + KT.icon(p.type === 'celular' ? 'smartphone' : 'shield-check') + '</div>') + '</td>' +
        '<td>' + KT.esc(p.name) + (p.featured ? ' <span style="color:#fbbf24">' + KT.icon('star') + '</span>' : '') + '</td>' +
        '<td><span class="badge ' + p.type + '">' + (p.type === 'celular' ? 'Bajo pedido' : 'En tienda') + '</span></td>' +
        '<td>' + KT.esc(catName(p.category_id)) + '</td>' +
        '<td>' + KT.money(p.price) + '</td>' +
        '<td>' + (p.type === 'estuche' ? KT.esc(p.stock || 0) : '—') + '</td>' +
        '<td><label class="switch"><input type="checkbox" data-act="toggle"' + (p.active ? ' checked' : '') + '><span></span></label></td>' +
        '<td class="actions-td"><button class="btn btn-ghost btn-sm" data-act="edit">Editar</button>' +
        '<button class="btn btn-danger btn-sm" data-act="del">Borrar</button></td></tr>';
    }).join('') : '<tr><td colspan="8" class="empty-row">No hay productos todavía.</td></tr>';
  }

  function openProduct(p) {
    state.editing = p || null; state.newImage = null; state.removeImage = false;
    $('pTitle').textContent = p ? 'Editar producto' : 'Nuevo producto';
    $('pType').value = p ? p.type : 'celular';
    fillCatSelect($('pType').value, p && p.category_id);
    $('pName').value = p ? p.name : '';
    $('pBrand').value = p ? p.brand || '' : '';
    $('pPrice').value = p && p.price != null ? p.price : '';
    $('pStock').value = p ? p.stock || 0 : 0;
    $('pDesc').value = p ? p.description || '' : '';
    $('pSpecs').value = p ? p.specs || '' : '';
    $('pActive').checked = p ? !!p.active : true;
    $('pFeatured').checked = p ? !!p.featured : false;
    $('pFile').value = '';
    var img = $('pPreview');
    if (p && p.image_url) { img.src = p.image_url; img.hidden = false; } else { img.hidden = true; img.removeAttribute('src'); }
    $('pInfo').textContent = '';
    $('stockWrap').hidden = $('pType').value !== 'estuche';
    $('productDialog').showModal();
  }

  async function uploadImage(blob, type) {
    var path = type + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.webp';
    var up = await db.storage.from(KT_CONFIG.BUCKET).upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
    if (up.error) throw up.error;
    return db.storage.from(KT_CONFIG.BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function saveProduct(e) {
    e.preventDefault();
    var btn = $('pSave'); btn.disabled = true; btn.textContent = 'Guardando…';
    try {
      var type = $('pType').value;
      var old = state.editing;
      var image_url = old ? old.image_url : null;
      var oldPath = storagePath(image_url);

      if (state.newImage) {
        image_url = await uploadImage(state.newImage.blob, type);
        if (oldPath) await db.storage.from(KT_CONFIG.BUCKET).remove([oldPath]);
      } else if (state.removeImage) {
        image_url = null;
        if (oldPath) await db.storage.from(KT_CONFIG.BUCKET).remove([oldPath]);
      }

      var row = {
        name: $('pName').value.trim(),
        type: type,
        category_id: $('pCat').value || null,
        brand: $('pBrand').value.trim() || null,
        price: $('pPrice').value === '' ? null : Number($('pPrice').value),
        stock: type === 'estuche' ? Number($('pStock').value || 0) : 0,
        description: $('pDesc').value.trim() || null,
        specs: $('pSpecs').value.trim() || null,
        active: $('pActive').checked,
        featured: $('pFeatured').checked,
        image_url: image_url
      };
      var res = old
        ? await db.from('products').update(row).eq('id', old.id)
        : await db.from('products').insert(row);
      if (res.error) throw res.error;
      $('productDialog').close();
      KT.toast('Producto guardado');
      await loadAll();
    } catch (err) {
      KT.toast('No se pudo guardar: ' + err.message, 'error');
    } finally { btn.disabled = false; btn.textContent = 'Guardar'; }
  }

  async function deleteProduct(p) {
    if (!confirm('¿Borrar "' + p.name + '"? Esta acción no se puede deshacer.')) return;
    var path = storagePath(p.image_url);
    var r = await db.from('products').delete().eq('id', p.id);
    if (r.error) return KT.toast(r.error.message, 'error');
    if (path) await db.storage.from(KT_CONFIG.BUCKET).remove([path]);
    KT.toast('Producto eliminado');
    loadAll();
  }

  /* ---------- Categorías ---------- */
  function renderCategories() {
    $('categoryRows').innerHTML = state.cats.length ? state.cats.map(function (c) {
      var n = state.products.filter(function (p) { return p.category_id === c.id; }).length;
      return '<tr data-id="' + KT.esc(c.id) + '"><td>' + KT.esc(c.name) + '</td>' +
        '<td><span class="badge ' + c.type + '">' + (c.type === 'celular' ? 'Celulares' : 'Accesorios') + '</span></td>' +
        '<td>' + n + '</td>' +
        '<td class="actions-td"><button class="btn btn-ghost btn-sm" data-act="edit">Editar</button>' +
        '<button class="btn btn-danger btn-sm" data-act="del">Borrar</button></td></tr>';
    }).join('') : '<tr><td colspan="4" class="empty-row">Aún no hay categorías.</td></tr>';
    markQuick();
  }

  // Deshabilita las sugeridas que ya existen
  function markQuick() {
    document.querySelectorAll('#quickBtns [data-quick]').forEach(function (b) {
      var exists = state.cats.some(function (c) {
        return c.type === 'estuche' && KT.slug(c.name) === KT.slug(b.dataset.quick);
      });
      b.disabled = exists;
      b.title = exists ? 'Ya existe' : 'Agregar categoría';
    });
  }

  async function quickAddCategory(name) {
    var r = await db.from('categories').insert({ name: name, type: 'estuche', slug: KT.slug(name) });
    if (r.error) return KT.toast(r.error.message, 'error');
    KT.toast('Categoría "' + name + '" agregada'); loadAll();
  }

  function openCategory(c) {
    state.editingCat = c || null;
    $('cTitle').textContent = c ? 'Editar categoría' : 'Nueva categoría';
    $('cName').value = c ? c.name : '';
    $('cType').value = c ? c.type : 'celular';
    $('categoryDialog').showModal();
  }

  async function saveCategory(e) {
    e.preventDefault();
    var row = { name: $('cName').value.trim(), type: $('cType').value, slug: KT.slug($('cName').value) };
    var r = state.editingCat
      ? await db.from('categories').update(row).eq('id', state.editingCat.id)
      : await db.from('categories').insert(row);
    if (r.error) return KT.toast(r.error.message, 'error');
    $('categoryDialog').close(); KT.toast('Categoría guardada'); loadAll();
  }

  async function deleteCategory(c) {
    var n = state.products.filter(function (p) { return p.category_id === c.id; }).length;
    var msg = '¿Borrar la categoría "' + c.name + '"?' + (n ? ' Sus ' + n + ' productos quedarán sin categoría.' : '');
    if (!confirm(msg)) return;
    var r = await db.from('categories').delete().eq('id', c.id);
    if (r.error) return KT.toast(r.error.message, 'error');
    KT.toast('Categoría eliminada'); loadAll();
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
    var r = await db.from('settings').upsert(rows);
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

    $('fType').addEventListener('change', renderProducts);
    $('fSearch').addEventListener('input', renderProducts);
    $('newProduct').addEventListener('click', function () { openProduct(null); });
    $('newCategory').addEventListener('click', function () { openCategory(null); });

    $('productRows').addEventListener('click', async function (e) {
      var tr = e.target.closest('tr'); var act = e.target.dataset.act; if (!tr || !act) return;
      var p = state.products.find(function (x) { return x.id === tr.dataset.id; });
      if (act === 'edit') openProduct(p);
      if (act === 'del') deleteProduct(p);
      if (act === 'toggle') {
        var r = await db.from('products').update({ active: e.target.checked }).eq('id', p.id);
        if (r.error) { KT.toast(r.error.message, 'error'); e.target.checked = !e.target.checked; } else p.active = e.target.checked;
      }
    });
    $('quickBtns').addEventListener('click', function (e) {
      var b = e.target.closest('[data-quick]');
      if (b && !b.disabled && db) quickAddCategory(b.dataset.quick);
    });
    $('categoryRows').addEventListener('click', function (e) {
      var tr = e.target.closest('tr'); var act = e.target.dataset.act; if (!tr || !act) return;
      var c = state.cats.find(function (x) { return x.id === tr.dataset.id; });
      if (act === 'edit') openCategory(c);
      if (act === 'del') deleteCategory(c);
    });

    $('pType').addEventListener('change', function () {
      fillCatSelect($('pType').value, null);
      $('stockWrap').hidden = $('pType').value !== 'estuche';
    });

    $('pFile').addEventListener('change', async function (e) {
      var f = e.target.files[0]; if (!f) return;
      $('pInfo').textContent = 'Comprimiendo…';
      try {
        var r = await KT.compressImage(f);
        state.newImage = r; state.removeImage = false;
        $('pPreview').src = URL.createObjectURL(r.blob); $('pPreview').hidden = false;
        $('pInfo').textContent = kb(r.originalSize) + ' → ' + kb(r.size) + ' (' + r.width + '×' + r.height + ', WebP)';
      } catch (err) { $('pInfo').textContent = ''; KT.toast(err.message, 'error'); e.target.value = ''; }
    });

    $('productForm').addEventListener('submit', saveProduct);
    $('categoryForm').addEventListener('submit', saveCategory);
    $('settingsForm').addEventListener('submit', saveSettings);

    document.querySelectorAll('dialog [data-close]').forEach(function (b) {
      b.addEventListener('click', function () { b.closest('dialog').close(); });
    });
  }

  init();
})();
