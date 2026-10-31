/* Datos de ejemplo: se muestran solo si aún no configuraste Supabase */
window.KT = window.KT || {};
KT.demo = {
  categories: [
    { id: 'c1', name: 'iPhone', type: 'celular' },
    { id: 'c2', name: 'Samsung', type: 'celular' },
    { id: 'c3', name: 'Xiaomi', type: 'celular' },
    { id: 'c4', name: 'Estuches', type: 'estuche' },
    { id: 'c5', name: 'Cargadores', type: 'estuche' },
    { id: 'c6', name: 'Audífonos', type: 'estuche' },
    { id: 'c7', name: 'Cables', type: 'estuche' }
  ],
  products: [
    { id: 'p1', type: 'celular', category_id: 'c1', brand: 'Apple', name: 'iPhone 13 128GB', price: 1850000, description: 'Equipo de segunda mano en buen estado.', specs: '128 GB\nBatería 89%\nAzul', image_url: '', featured: true },
    { id: 'p2', type: 'celular', category_id: 'c2', brand: 'Samsung', name: 'Galaxy S21 128GB', price: 1100000, description: '', specs: '128 GB\nPantalla AMOLED 120Hz', image_url: '' },
    { id: 'p3', type: 'celular', category_id: 'c3', brand: 'Xiaomi', name: 'Redmi Note 11 128GB', price: 520000, description: '', specs: '128 GB\n6 GB RAM', image_url: '' },
    { id: 'p4', type: 'estuche', category_id: 'c4', brand: 'Genérico', name: 'Estuche silicona iPhone 13', price: 25000, description: 'Suave y ligero.', specs: '', image_url: '', stock: 12 },
    { id: 'p5', type: 'estuche', category_id: 'c5', brand: 'Genérico', name: 'Cargador USB-C 20W', price: 35000, description: 'Carga rápida.', specs: '', image_url: '', stock: 8 },
    { id: 'p6', type: 'estuche', category_id: 'c6', brand: 'Genérico', name: 'Audífonos con cable', price: 15000, description: '', specs: '', image_url: '', stock: 0 },
    { id: 'p7', type: 'estuche', category_id: 'c7', brand: 'Genérico', name: 'Cable USB-C a USB-C 1m', price: 18000, description: '', specs: '', image_url: '', stock: 20 },
    { id: 'p8', type: 'estuche', category_id: 'c4', brand: 'Genérico', name: 'Estuche antigolpes Galaxy S21', price: 30000, description: '', specs: '', image_url: '', stock: 6 }
  ]
};
