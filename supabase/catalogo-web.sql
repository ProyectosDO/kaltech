-- =====================================================================
-- 0009 · Catálogo web conectado al inventario del POS
--   La página de Kaltech lee sus productos DIRECTO del inventario del POS (un solo Supabase):
--   cuando el POS vende o registra una compra, el stock de la página cambia solo
--   (En stock / Agotado) y los precios son siempre los del POS.
--
--   · product_web      : lo que solo existe en la web (foto, descripción, destacado, ¿se publica?)
--   · web_settings     : WhatsApp, redes y textos del sitio
--   · public_products  : lo ÚNICO que ve el público (sin costos, sin ventas, sin clientes)
--   · public_categories: categorías que tienen productos publicados
--   · bucket "productos": fotos
--   Un producto nuevo del POS NO aparece en la web hasta que lo publicas desde el panel
--   de la página (gestion-kt). Es seguro correrlo más de una vez.
-- =====================================================================

-- ---------- Datos propios de la web ----------
create table if not exists public.product_web (
  product_id  uuid primary key references public.products(id) on delete cascade,
  visible     boolean not null default false,
  featured    boolean not null default false,
  image_url   text,
  description text,
  updated_at  timestamptz not null default now()
);

alter table public.product_web enable row level security;
drop policy if exists product_web_select on public.product_web;
drop policy if exists product_web_write  on public.product_web;
create policy product_web_select on public.product_web for select to authenticated
  using (has_perm('products.view'));
create policy product_web_write on public.product_web for all to authenticated
  using (has_perm('products.manage')) with check (has_perm('products.manage'));
revoke all on public.product_web from anon;
grant select, insert, update, delete on public.product_web to authenticated;

-- ---------- Ajustes del sitio ----------
create table if not exists public.web_settings (
  key   text primary key,
  value text
);

alter table public.web_settings enable row level security;
drop policy if exists web_settings_read  on public.web_settings;
drop policy if exists web_settings_write on public.web_settings;
create policy web_settings_read on public.web_settings for select to anon, authenticated using (true);
create policy web_settings_write on public.web_settings for all to authenticated
  using (has_perm('products.manage')) with check (has_perm('products.manage'));
revoke all on public.web_settings from anon;
grant select on public.web_settings to anon;
grant select, insert, update, delete on public.web_settings to authenticated;

insert into public.web_settings (key, value) values
  ('whatsapp',     '573000000000'),
  ('repair_text',  'Además de vender, en Kaltech reparamos tu celular. Diagnóstico rápido y trabajo garantizado.'),
  ('contact_text', 'Escríbenos por WhatsApp para pedidos de celulares o reparaciones.')
on conflict (key) do nothing;

-- ---------- Lo que ve el público ----------
-- Vistas con los mismos nombres de columna que usa la página (type 'estuche' = accesorio).
-- Corren con los permisos del dueño a propósito: así el público lee SOLO estas columnas y
-- nunca las tablas del POS. No incluyen costos, proveedores, ventas ni clientes.
create or replace view public.public_products as
select p.id,
       p.name,
       'estuche'::text           as type,
       p.category_id,
       p.brand,
       p.price_cop               as price,
       case when p.stock_qty > 0 then 10 else 0 end as stock,   -- NO se publica la cantidad real: 0 = agotado, 10 = hay (tope por pedido)
       w.description,
       null::text                as specs,
       w.image_url,
       true                      as active,
       w.featured,
       p.created_at
  from public.products p
  join public.product_web w on w.product_id = p.id
 where p.active and not p.is_part and w.visible;

create or replace view public.public_categories as
select c.id,
       c.name,
       regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g') as slug,
       'estuche'::text as type
  from public.categories c
 where c.active
   and exists (select 1 from public.public_products pp where pp.category_id = c.id);

revoke all on public.public_products, public.public_categories from anon, authenticated;
grant select on public.public_products, public.public_categories to anon, authenticated;

-- ---------- Fotos ----------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do update set public = true;

drop policy if exists "productos_public_read"  on storage.objects;
drop policy if exists "productos_admin_insert" on storage.objects;
drop policy if exists "productos_admin_update" on storage.objects;
drop policy if exists "productos_admin_delete" on storage.objects;
create policy "productos_public_read"  on storage.objects for select using (bucket_id = 'productos');
create policy "productos_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.has_perm('products.manage'));
create policy "productos_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'productos' and public.has_perm('products.manage'));
create policy "productos_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and public.has_perm('products.manage'));
