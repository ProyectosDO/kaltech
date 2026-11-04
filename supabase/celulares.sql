-- =====================================================================
-- KALTECH · Carga de celulares (segunda mano, bajo pedido)
-- Pega TODO esto en Supabase → SQL Editor → New query → Run.
-- Ejecútalo UNA sola vez (si lo repites no duplica productos con el mismo nombre y precio).
-- Crea las categorías Samsung, Google Pixel e iPhone si no existen y agrega los celulares.
-- =====================================================================

insert into public.categories (name, slug, type)
select v.name, v.slug, 'celular'
from (values ('Samsung','samsung'), ('Google Pixel','google-pixel'), ('iPhone','iphone')) as v(name, slug)
where not exists (select 1 from public.categories c where c.type = 'celular' and c.slug = v.slug);

insert into public.products (name, type, category_id, brand, price, specs, active, created_at)
select v.name, 'celular',
       (select c.id from public.categories c where c.type = 'celular' and c.slug = v.cat limit 1),
       v.brand, v.price, v.specs, true,
       now() - v.ord * interval '1 second'   -- mantiene el orden de tu lista
from (values
    (0, 'Samsung S22 8/256', 'samsung', 'Samsung', 700000, E'Color: Negro'),
    (1, 'Samsung S23 Ultra 8/256', 'samsung', 'Samsung', 1650000, E'Color: Negro'),
    (2, 'Samsung S23 Ultra 12/512', 'samsung', 'Samsung', 1800000, E'Color: Negro'),
    (3, 'Samsung S25 Ultra 12/256', 'samsung', 'Samsung', 2400000, E'Color: Negro'),
    (4, 'Samsung S25 Ultra 12/512', 'samsung', 'Samsung', 2650000, E'Colores: Silver Blue, negro, gris'),
    (5, 'Samsung S26 Ultra 12/256', 'samsung', 'Samsung', 3000000, E'Colores: Violeta, azul'),
    (6, 'Samsung S26 Ultra 12/512', 'samsung', 'Samsung', 3250000, E'Colores: Negro, azul'),
    (7, 'Google Pixel 10 Pro 16/128', 'google-pixel', 'Google', 2100000, E'Color: Azul'),
    (8, 'Google Pixel 10 Pro 16/256', 'google-pixel', 'Google', 2300000, E'Colores: Negro, azul'),
    (9, 'Google Pixel 10 Pro XL 16/256', 'google-pixel', 'Google', 2700000, E'Color: Azul'),
    (10, 'iPhone 13 128 GB', 'iphone', 'Apple', 1000000, E'Blanco · batería 88%\nNegro · batería 87%'),
    (11, 'iPhone 13 128 GB', 'iphone', 'Apple', 1050000, E'Negro · batería 90%, 91%, 94%, 95%, 96%, 97%\nAzul · batería 92%, 93%, 94%, 95%, 96%, 97%, 98%'),
    (12, 'iPhone 13 Pro 256 GB', 'iphone', 'Apple', 1500000, E'Negro · batería 84%'),
    (13, 'iPhone 13 Pro Max 128 GB', 'iphone', 'Apple', 1600000, E'Verde · batería 85%, 86%'),
    (14, 'iPhone 14 128 GB eSIM', 'iphone', 'Apple', 1200000, E'Azul · batería 85%'),
    (15, 'iPhone 14 128 GB eSIM', 'iphone', 'Apple', 1230000, E'Negro · batería 90%, 91%, 92%, 94%, 95%, 97%, 99%')
) as v(ord, name, cat, brand, price, specs)
where not exists (select 1 from public.products p where p.name = v.name and p.price = v.price);
