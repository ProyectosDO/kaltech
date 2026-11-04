-- =====================================================================
-- 0010 · La página ya NO publica cuántas unidades hay
--   public_products.stock entrega solo 0 (agotado) o 10 (hay disponible; es el tope por pedido
--   en el carrito). La cantidad real queda solo en el POS. Si ya corriste la 0009, corre esta.
--   Es seguro correrlo más de una vez.
-- =====================================================================
create or replace view public.public_products as
select p.id,
       p.name,
       'estuche'::text           as type,
       p.category_id,
       p.brand,
       p.price_cop               as price,
       case when p.stock_qty > 0 then 10 else 0 end as stock,
       w.description,
       null::text                as specs,
       w.image_url,
       true                      as active,
       w.featured,
       p.created_at
  from public.products p
  join public.product_web w on w.product_id = p.id
 where p.active and not p.is_part and w.visible;

grant select on public.public_products to anon, authenticated;
