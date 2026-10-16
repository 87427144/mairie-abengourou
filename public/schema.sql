CREATE TABLE IF NOT EXISTS actualites (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  image_key TEXT NOT NULL UNIQUE,
  image_type TEXT NOT NULL,
  audio_key TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS actualites_created_at_idx
  ON actualites (created_at DESC);
