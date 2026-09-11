-- Cloudflare D1: npx wrangler d1 execute memolead-fukuoka-osechi --remote --file=schema.sql
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  zip TEXT,
  address TEXT,
  tel TEXT NOT NULL,
  email TEXT NOT NULL,
  facility_id TEXT,
  facility TEXT NOT NULL,
  tier TEXT,
  total INTEGER NOT NULL DEFAULT 0,
  total_tax INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  orders_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '未対応'
);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_facility ON orders(facility);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
