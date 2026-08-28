CREATE TABLE IF NOT EXISTS stress_test_locations (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  zip TEXT NOT NULL,
  address TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  service TEXT NOT NULL,
  match_text TEXT NOT NULL,
  access TEXT NOT NULL,
  tier TEXT NOT NULL,
  source_url TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  fax TEXT,
  email TEXT,
  footprint_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, city, state, zip, service, price)
);

CREATE INDEX IF NOT EXISTS idx_stress_test_locations_state
  ON stress_test_locations(state);

CREATE INDEX IF NOT EXISTS idx_stress_test_locations_price
  ON stress_test_locations(price);

CREATE INDEX IF NOT EXISTS idx_stress_test_locations_provider
  ON stress_test_locations(provider);
