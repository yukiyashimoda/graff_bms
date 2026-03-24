ALTER TABLE wine_details
  ADD COLUMN wine_type text NOT NULL DEFAULT 'other'
  CHECK (wine_type IN ('white', 'red', 'rosé', 'sparkling', 'champagne', 'other'));
