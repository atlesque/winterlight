-- Tape measurements entered on the measure page (src/measures/measures.js),
-- in metres. A missing row means not measured yet: the model's guess stands.
CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  value REAL NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
