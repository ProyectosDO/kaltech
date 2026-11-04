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
│       ├── admin.js            ← Login + publicar productos del POS, fotos y ajustes
│       └── image-compressor.js ← Compresión de imágenes (WebP)
└── supabase/catalogo-web.sql ← Migración 0009 del POS (vistas públicas, ajustes, bucket de fotos)
```

## Cómo se conecta con el POS

La página **no tiene base de datos propia**: lee el inventario del sistema de ventas (POS), que vive en **un solo proyecto de Supabase**.

- El POS maneja productos, precios y existencias. Al vender o registrar una compra, la tienda se actualiza sola (**En stock / Agotado**).
- La página solo lee dos **vistas públicas** (`public_products`, `public_categories`) y los ajustes (`web_settings`). Ahí no hay costos, ventas, clientes ni proveedores.
- La tienda **no muestra cuántas unidades hay**: solo "En stock" o "Agotado". La cantidad real tampoco sale de la base de datos (la vista entrega 0 o 10). En el carrito el tope es 10 por producto; para más, el cliente escribe por WhatsApp.
- Un producto nuevo del POS **no se publica solo**: aparece en el panel (`gestion-kt`) y tú decides cuándo mostrarlo, con foto y descripción.
- Las categorías son las del POS (Estuches, Cargadores, Audífonos, Cables…). Solo se muestran las que tengan productos publicados. Los repuestos de servicio técnico nunca se publican.

## Puesta en marcha

1. **Base de datos:** en el Supabase del POS corre las migraciones del POS en orden (las últimas, `0009_catalogo_web.sql` y `0010_catalogo_sin_cantidad.sql`, son las de la página; también están aquí como `supabase/catalogo-web.sql` y `supabase/sin-cantidad.sql`).
2. **Claves:** Project Settings → API → copia *Project URL* y *anon public key* **del proyecto del POS** en `js/config.js`. Cambia también `WHATSAPP_DEFAULT`. La anon key es pública por diseño; la seguridad está en las políticas RLS.
3. **Logo:** guarda tu logo como `assets/img/logo.png`.
4. **Usuarios:** el panel usa los mismos usuarios del POS (Authentication → Users). Para publicar productos el usuario necesita el permiso *Crear/editar/desactivar productos* (la administradora lo tiene).
5. **Probar en local:** `python3 -m http.server 8000` dentro de la carpeta y abre http://localhost:8000.
6. **Publicar:** sube la carpeta completa a Netlify, Vercel, Cloudflare Pages o GitHub Pages (es HTML estático, sin build).

## Panel de administración

- Entra desde `https://tu-sitio/gestion-kt/` o haciendo **5 clics rápidos sobre el logo** de la página, con tu correo y contraseña del POS.
- **Productos:** lista el inventario del POS. Con el interruptor **En la web** publicas u ocultas un producto; con **Foto y detalles** le pones imagen, descripción y lo marcas como destacado. Precio y existencias son solo de lectura: se cambian en el POS.
- **Ajustes:** WhatsApp, redes sociales y texto de Reparaciones.
- Crear, borrar productos y categorías se hace **en el POS**, no aquí.
- No está en el menú y tiene `noindex`. La seguridad real está en el login y en las políticas RLS.

## Imágenes

Al elegir una foto, el navegador la **redimensiona (máx. 900 px), la convierte a WebP y ajusta la calidad** hasta pesar unos 80 KB antes de subirla a Supabase Storage. Al reemplazar o borrar un producto, la imagen anterior se elimina del bucket.

## Accesorios (activos)

La sección **Accesorios** (estuches, cargadores, audífonos, etc.) está activa con `SHOW_CASES: true` en `js/config.js`. Si algún día quieres ocultarla, pon `false` y desaparece del menú, la portada, el pie y el panel.

- Los accesorios se crean en el POS y se publican desde el panel. Internamente la página los llama `estuche`; la vista `public_products` ya los entrega con ese nombre.

## Categorías de accesorios

En la tienda, los accesorios se filtran con **botones de categoría con icono** (Estuches, Cargadores, Audífonos, Cables…). Solo aparecen las categorías que tengan productos.

- Las categorías se crean y asignan en el POS. En la tienda solo aparecen las que tengan productos publicados.
- El icono se asigna solo según el nombre (estuche/funda, cargador, audífonos, cable); las demás usan un icono de caja.

## Celulares de segunda mano (oculta por ahora)

> Con la conexión al POS, la lista de celulares **no tiene datos todavía**: el POS maneja accesorios. Antes de reactivarla (`SHOW_PHONES: true`) hay que decidir dónde se guardan los celulares bajo pedido. `supabase/celulares.sql` es del esquema anterior y ya no se debe correr.

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
