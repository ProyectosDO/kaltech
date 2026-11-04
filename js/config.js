/**
 * CONFIGURACIÓN DE KALTECH
 * La página lee el inventario del POS: usa el MISMO proyecto de Supabase del POS.
 * 1. Corre las migraciones del POS (la última, 0009, es la de la página: supabase/catalogo-web.sql)
 * 2. Copia aquí la "Project URL" y la "anon public key" de ESE proyecto
 *    (Project Settings → API). La anon key es pública por diseño;
 *    la seguridad la dan las políticas RLS.
 */
window.KT_CONFIG = {
  SUPABASE_URL: 'https://fkhvejwgjbgalmprossx.supabase.co',        // ej: https://abcdxyz.supabase.co
  SUPABASE_ANON_KEY: 'sb_publishable_rllILQ6bbg6c53E1wCpSBA_nmL-z_bp',   // ej: eyJhbGciOi...
  BUCKET: 'productos',     // bucket de Storage para imágenes
  ADMIN_PATH: 'gestion-kt',// carpeta del panel (cámbiala y renombra la carpeta /admin si quieres)
  WHATSAPP_DEFAULT: '573125687760', // número con código de país, sin + ni espacios
  CURRENCY: 'COP',
  // Redes sociales (también se pueden cambiar desde el panel → Ajustes). Si está vacío, el botón se ve pero todavía no abre nada
  INSTAGRAM_URL: 'https://www.instagram.com/kaltech.orito?dlrf=emZtMzFmbXZsMWVh&utm_source=qr',       // ej: https://www.instagram.com/tu_usuario
  FACEBOOK_URL: 'https://www.facebook.com/share/1GgT7bXoPo/?mibextid=wwXIfr',        // ej: https://www.facebook.com/tu_pagina
  TIKTOK_URL: 'https://www.tiktok.com/@kaltech_orito?_r=1&_t=ZS-9B8I79jh7is',          // ej: https://www.tiktok.com/@tu_usuario
  SHOW_CASES: true,        // true = muestra la sección de Accesorios (estuches, cargadores, etc.). false = la oculta
  SHOW_PHONES: false       // true = muestra la lista de Celulares de segunda mano. false = la oculta (por ahora)
};
