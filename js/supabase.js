/* Cliente de Supabase + consultas públicas (solo lectura) */
window.KT = window.KT || {};

KT.configured = !!(KT_CONFIG.SUPABASE_URL && KT_CONFIG.SUPABASE_ANON_KEY && window.supabase);

KT.db = KT.configured
  ? window.supabase.createClient(KT_CONFIG.SUPABASE_URL, KT_CONFIG.SUPABASE_ANON_KEY)
  : null;

KT.api = {
  async getCategories() {
    if (!KT.db) return KT.demo.categories;
    const { data, error } = await KT.db.from('categories').select('*').order('name');
    if (error) throw error;
    return data;
  },
  async getProducts() {
    if (!KT.db) return KT.demo.products;
    const { data, error } = await KT.db.from('products').select('*')
      .eq('active', true).order('featured', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async getSettings() {
    if (!KT.db) return {};
    const { data, error } = await KT.db.from('settings').select('*');
    if (error) return {};
    const out = {};
    data.forEach(function (r) { out[r.key] = r.value; });
    return out;
  }
};
