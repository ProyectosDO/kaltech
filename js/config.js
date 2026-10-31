/**
 * CONFIGURACIÓN DE KALTECH
 * 1. Crea tu proyecto en https://supabase.com
 * 2. Copia aquí la "Project URL" y la "anon public key"
 *    (Project Settings → API). La anon key es pública por diseño;
 *    la seguridad la dan las políticas RLS de supabase/schema.sql.
 */
window.KT_CONFIG = {
  SUPABASE_URL: '',        // ej: https://abcdxyz.supabase.co
  SUPABASE_ANON_KEY: '',   // ej: eyJhbGciOi...
  BUCKET: 'productos',     // bucket de Storage para imágenes
  ADMIN_PATH: 'gestion-kt',// carpeta del panel (cámbiala y renombra la carpeta /admin si quieres)
  WHATSAPP_DEFAULT: '573000000000', // número con código de país, sin + ni espacios
  CURRENCY: 'COP',
  // Redes sociales (también se pueden cambiar desde el panel → Ajustes). Si está vacío, el botón se ve pero todavía no abre nada
  INSTAGRAM_URL: '',       // ej: https://www.instagram.com/tu_usuario
  FACEBOOK_URL: '',        // ej: https://www.facebook.com/tu_pagina
  TIKTOK_URL: '',          // ej: https://www.tiktok.com/@tu_usuario
  SHOW_CASES: true,        // true = muestra la sección de Accesorios (estuches, cargadores, etc.). false = la oculta
  SHOW_PHONES: false       // true = muestra la lista de Celulares de segunda mano. false = la oculta (por ahora)
};
