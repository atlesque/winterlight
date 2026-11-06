-- Runbook ticks and expense switches, shared by every device.
-- kind 'done': value '1' (ticked) or '0' (unticked). A missing row means the
-- runbook's own default (src/runbook/runbook.js PRESET, e.g. already ordered).
-- kind 'expense': value 'private' or 'business', overriding a purchase's default.
CREATE TABLE IF NOT EXISTS runbook_state (
  kind TEXT NOT NULL CHECK (kind IN ('done', 'expense')),
  id TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (kind, id)
);
