-- Development-only catalogue data. Do not use these records as production inventory.
insert into public.categories (name, slug, display_order)
values
  ('Cement', 'cement', 10),
  ('TMT Bar', 'tmt-bar', 20),
  ('Bricks', 'bricks', 30),
  ('Sand & Aggregate', 'sand-aggregate', 40),
  ('PVC Pipe', 'pvc-pipe', 50),
  ('Electrical', 'electrical', 60),
  ('Plumbing', 'plumbing', 70),
  ('Paints', 'paints', 80),
  ('Tools', 'tools', 90),
  ('Hardware', 'hardware', 100),
  ('Adhesives', 'adhesives', 110)
on conflict (slug) do update set name = excluded.name, display_order = excluded.display_order, is_active = true;

insert into public.products (sku, slug, name, description, category_id, selling_price, default_purchase_cost, unit, hsn_sac, gst_rate, minimum_stock)
select seed.sku, seed.slug, seed.name, seed.description, categories.id, seed.selling_price, seed.default_purchase_cost, seed.unit, seed.hsn_sac, seed.gst_rate, seed.minimum_stock
from (values
  ('104', 'cement-ultratech-50kg', 'Cement', 'UltraTech cement, 50 kg bag.', 'cement', 520.00, 438.0000, '50 kg', '2523', 28.00, 20),
  ('101', 'cement-acc-50kg', 'Cement', 'ACC cement, 50 kg bag.', 'cement', 480.00, 405.0000, '50 kg', '2523', 28.00, 20),
  ('109', 'cement-ambuja-50kg', 'Cement', 'Ambuja cement, 50 kg bag.', 'cement', 450.00, 382.0000, '50 kg', '2523', 28.00, 20),
  ('103', 'cement-dalmia-50kg', 'Cement', 'Dalmia cement, 50 kg bag.', 'cement', 410.00, 350.0000, '50 kg', '2523', 28.00, 20),
  ('201', 'tmt-tata-tiscon-12mm', 'TMT Bar', 'Tata Tiscon Fe 500D reinforcement bar.', 'tmt-bar', 780.00, 704.0000, '12 mm', '7214', 18.00, 100),
  ('202', 'tmt-jsw-12mm', 'TMT Bar', 'JSW Fe 500D reinforcement bar.', 'tmt-bar', 750.00, 678.0000, '12 mm', '7214', 18.00, 100),
  ('203', 'tmt-rashtriya-12mm', 'TMT Bar', 'Rashtriya brand reinforcement bar.', 'tmt-bar', 720.00, 650.0000, '12 mm', '7214', 18.00, 100),
  ('204', 'tmt-jindal-12mm', 'TMT Bar', 'Jindal Panther reinforcement bar.', 'tmt-bar', 690.00, 625.0000, '12 mm', '7214', 18.00, 100),
  ('401', 'brick-red-common', 'Bricks', 'Standard red clay brick.', 'bricks', 12.00, 8.0000, '1 pc', '6901', 5.00, 500),
  ('402', 'brick-red-hollow', 'Bricks', 'Red hollow brick for lightweight walls.', 'bricks', 11.00, 7.5000, '1 pc', '6901', 5.00, 500),
  ('403', 'brick-perforated', 'Bricks', 'Perforated clay brick.', 'bricks', 10.00, 7.0000, '1 pc', '6901', 5.00, 500),
  ('404', 'brick-fly-ash', 'Bricks', 'Dense fly-ash brick.', 'bricks', 9.00, 6.5000, '1 pc', '6815', 5.00, 500),
  ('301', 'pvc-pipe-4-inch-heavy', 'PVC Pipe', 'Heavy-duty PVC plumbing pipe.', 'pvc-pipe', 550.00, 448.0000, '4 inch', '3917', 18.00, 30),
  ('302', 'pvc-pipe-4-inch-medium', 'PVC Pipe', 'Medium-duty PVC plumbing pipe.', 'pvc-pipe', 500.00, 405.0000, '4 inch', '3917', 18.00, 30),
  ('303', 'pvc-pipe-4-inch-agri', 'PVC Pipe', 'Agricultural PVC plumbing pipe.', 'pvc-pipe', 470.00, 380.0000, '4 inch', '3917', 18.00, 30),
  ('304', 'pvc-pipe-4-inch-light', 'PVC Pipe', 'Light-duty PVC plumbing pipe.', 'pvc-pipe', 420.00, 340.0000, '4 inch', '3917', 18.00, 30),
  ('501', 'switch-6a-modular', 'Electrical', '6A modular wall switch.', 'electrical', 85.00, 55.0000, '1 pc', '8536', 18.00, 50),
  ('502', 'wire-1-5mm-90m', 'Electrical', '1.5 mm copper house wire roll.', 'electrical', 2650.00, 2220.0000, '90 m', '8544', 18.00, 10),
  ('601', 'tap-bibcock-brass', 'Plumbing', 'Chrome-plated brass bibcock tap.', 'plumbing', 320.00, 250.0000, '1 pc', '8481', 18.00, 20),
  ('701', 'paint-interior-20l', 'Paints', 'Interior emulsion paint.', 'paints', 3450.00, 2900.0000, '20 L', '3209', 18.00, 10),
  ('801', 'hammer-claw-16oz', 'Tools', 'Forged steel claw hammer.', 'tools', 540.00, 410.0000, '1 pc', '8205', 18.00, 15),
  ('901', 'screw-wood-40mm', 'Hardware', 'Zinc-plated wood screws.', 'hardware', 180.00, 125.0000, '100 pc', '7318', 18.00, 25),
  ('1001', 'adhesive-pvc-100ml', 'Adhesives', 'PVC solvent cement.', 'adhesives', 95.00, 68.0000, '100 ml', '3506', 18.00, 20)
) as seed(sku, slug, name, description, category_slug, selling_price, default_purchase_cost, unit, hsn_sac, gst_rate, minimum_stock)
join public.categories on categories.slug = seed.category_slug
on conflict (sku) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  category_id = excluded.category_id,
  selling_price = excluded.selling_price,
  default_purchase_cost = excluded.default_purchase_cost,
  unit = excluded.unit,
  hsn_sac = excluded.hsn_sac,
  gst_rate = excluded.gst_rate,
  minimum_stock = excluded.minimum_stock,
  is_active = true;