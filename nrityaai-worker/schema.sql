CREATE TABLE IF NOT EXISTS dance_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  style TEXT NOT NULL,
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_style_level ON dance_resources(style, level);
CREate INDEX IF NOT EXISTS idx_style ON dance_resources(style);