# Kaltech · Reparación y Tecnología

Sitio web con **accesorios en tienda** (estuches, cargadores y más), lista de **celulares de segunda mano bajo pedido**, lista de **reparaciones** y un **panel de administración oculto** conectado a Supabase.

## Estructura

```
kaltech/
├── index.html              ← Sitio público
├── css/styles.css          ← Estilos del sitio
├── js/
│   ├── config.js           ← ⚙️ AQUÍ van tus claves de Supabase y tu WhatsApp
│   ├── utils.js            ← Funciones compartidas
│   ├── icons.js            ← Iconos SVG (WhatsApp, reparación, etc.)
│   ├── supabase.js         ← Cliente y consultas públicas
│   ├── demo-data.js        ← Datos de ejemplo (solo si no hay Supabase)
│   └── catalog.js          ← Lógica del catálogo
├── assets/img/logo.png     ← 🖼️ Pon aquí tu logo (con ese nombre)
├── gestion-kt/             ← Panel admin (no aparece en el menú)
│   ├── index.html
│   ├── admin.css
│   └── js/
│       ├── admin.js            ← Login + CRUD productos/categorías/ajustes
│       └── image-compressor.js ← Compresión de imágenes (WebP)
└── supabase/schema.sql     ← Tablas, seguridad y bucket de imágenes
```

## Puesta en marcha

1. **Logo:** guarda tu logo como `assets/img/logo.png`.
2. **Supabase:** crea un proyecto en https://supabase.com.
3. **Base de datos:** SQL Editor → pega `supabase/schema.sql` → Run. Crea las tablas, las políticas de seguridad y el bucket público `productos`.
4. **Claves:** Project Settings → API → copia *Project URL* y *anon public key* en `js/config.js`. Cambia también `WHATSAPP_DEFAULT`.
5. **Usuario admin:** Authentication → Users → *Add user* (correo + contraseña). Luego, en Authentication → Providers → Email, **desactiva "Allow new users to sign up"** para que nadie más pueda registrarse.
6. **Probar en local:** `python3 -m http.server 8000` dentro de la carpeta y abre http://localhost:8000.
7. **Publicar:** sube la carpeta completa a Netlify, Vercel, Cloudflare Pages o GitHub Pages (es HTML estático, sin build).

## Panel de administración

- Entra desde `https://tu-sitio/gestion-kt/` o haciendo **5 clics rápidos sobre el logo** de la página.
- No está en el menú, tiene `noindex` y no aparece en `robots.txt` (para no revelar la ruta). Puedes renombrar la carpeta `gestion-kt` por algo más difícil de adivinar y actualizar `ADMIN_PATH` en `js/config.js`.
- **La seguridad real** está en el login de Supabase y en las políticas RLS: aunque alguien encuentre la URL, sin usuario y contraseña no puede modificar nada.
- Desde el panel puedes: crear/editar/borrar productos y categorías, activar/ocultar productos, marcar destacados, controlar el stock de accesorios y editar el WhatsApp y los textos de Reparaciones y Contacto.

## Imágenes

Al elegir una foto, el navegador la **redimensiona (máx. 1200 px), la convierte a WebP y ajusta la calidad** hasta pesar ~200 KB antes de subirla a Supabase Storage. Al reemplazar o borrar un producto, la imagen anterior se elimina del bucket.

## Accesorios (activos)

La sección **Accesorios** (estuches, cargadores, audífonos, etc.) está activa con `SHOW_CASES: true` en `js/config.js`. Si algún día quieres ocultarla, pon `false` y desaparece del menú, la portada, el pie y el panel.

- En el panel, los accesorios se crean con tipo **Accesorio**. Crea antes las categorías (Estuches, Cargadores…) en la pestaña *Categorías*, con tipo *Accesorios*.
- Internamente el tipo se sigue llamando `estuche` en la base de datos, así que **no hace falta cambiar nada en Supabase**.

## Categorías de accesorios

En la tienda, los accesorios se filtran con **botones de categoría con icono** (Estuches, Cargadores, Audífonos, Cables…). Solo aparecen las categorías que tengan productos.

- En el panel → pestaña **Categorías** hay botones para agregar de un toque las sugeridas (Estuches, Cargadores, Audífonos, Cables) y el botón **Nueva categoría** para crear cualquier otra (tipo *Accesorios*).
- Al crear o editar un producto, elige su categoría en el selector.
- El icono se asigna solo según el nombre (estuche/funda, cargador, audífonos, cable); las demás usan un icono de caja.

## Celulares de segunda mano (oculta por ahora)

La lista de celulares está **oculta** con `SHOW_PHONES: false` en `js/config.js` (desaparece la sección, la tarjeta de la portada y el enlace del pie). Para mostrarla de nuevo, pon `SHOW_PHONES: true`. Los celulares cargados siguen guardados en el panel.

## Carrito y redes sociales

- **Carrito:** el icono del carrito (arriba a la derecha) es solo para **accesorios**. Cada tarjeta tiene un botón para agregar; el cliente ajusta cantidades (no más que el stock) y envía el pedido por WhatsApp con el detalle y el total. Se guarda en su navegador.
- **Redes sociales:** botones de Instagram, Facebook y TikTok arriba. Pon los enlaces en el panel → **Ajustes** (o en `js/config.js`). Si un enlace está vacío, el botón se ve pero muestra "muy pronto" al tocarlo.

## Diseño

El sitio usa únicamente el **tema oscuro** (azul noche con acentos morados).

## Reglas del negocio reflejadas en el sitio

- Productos tipo **celular** → fila en una **lista sin imágenes** (marca, modelo, especificaciones, precio), marcados como "Segunda mano" y "Bajo pedido", con botón "Pedir" por WhatsApp. Van debajo de los accesorios.
- Productos tipo **accesorio** → tarjetas con imagen y etiqueta "En stock / Agotado" según el stock.
- Sección **Reparaciones** como lista de servicios y botón directo a WhatsApp.
