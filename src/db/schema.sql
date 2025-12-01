CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  tool_slug TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  input_size_bytes INTEGER,
  output_size_bytes INTEGER,
  duration_ms INTEGER,
  ip_hash TEXT,
  status TEXT NOT NULL,
  error_code TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tool_slug TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  status TEXT NOT NULL
);
