-- Qamber Mini Store: products + orders
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  category TEXT NOT NULL DEFAULT 'General',
  image_url TEXT NOT NULL DEFAULT '',
  in_stock BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code TEXT NOT NULL UNIQUE DEFAULT 'QMS-' || upper(substr(md5(random()::text), 1, 6)),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL,
  total INTEGER NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grants (required for Data API access)
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;

-- Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Anyone can place an order"
  ON public.orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Seed products (demo catalog for the storefront)
INSERT INTO public.products (name, description, price, category, image_url, sort_order) VALUES
('Steel Kettle (2L)', 'Rust-proof stainless steel kettle — chai ke liye perfect. 2 litre.', 1850, 'Ghar Ka Saman', '/images/kettle.jpg', 1),
('Wireless Earbuds', 'Bluetooth 5.3 earbuds, 24-hour battery, HD sound.', 2450, 'Electronics', '/images/earbuds.jpg', 2),
('LED Table Lamp', 'Touch-control desk lamp, 3 light modes, energy-saving LED.', 1200, 'Electronics', '/images/lamp.jpg', 3),
('Ladies Handbag', 'Premium leather handbag with gold clasp — stylish aur durable.', 1650, 'Fashion', '/images/handbag.jpg', 4),
('Kids Toy Car', 'Remote control racing car, rechargeable battery included.', 899, 'Kids & Toys', '/images/toy-car.jpg', 5),
('Desk Stationery Set', 'Complete desk set — pen holder, notebook, aur organizer.', 750, 'Stationery', '/images/stationery.jpg', 6);