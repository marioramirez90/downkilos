-- =============================================================================
-- DOWN KILOS: PostgreSQL / Supabase Schema für Netto Marken-Discount Produkte
-- Version: 1.0.0
-- Lizenz: Gemäß Datenquellen (ODbL Open Food Facts, Open Prices, Netto Marken-Discount)
-- =============================================================================

-- Erweiterung für UUID-Generierung aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tabelle: netto_products (Echte Netto-Produktdatenbank)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS netto_products (
    id VARCHAR(64) PRIMARY KEY,                         -- Eindeutige Kennung (z.B. 'netto-chicken-400' oder UUID)
    ean VARCHAR(14) UNIQUE,                              -- Barcode / EAN-13
    name VARCHAR(255) NOT NULL,                          -- Produktname
    brand VARCHAR(100) NOT NULL,                         -- Marke (z.B. 'BioBio', 'Gut Ponholz', 'Gutes Land')
    retailer_scope VARCHAR(50) DEFAULT 'netto_marken_discount' NOT NULL, -- Strikte Trennung von Netto mit dem Hund
    category VARCHAR(50) NOT NULL,                       -- 'fruits_veg' | 'meat_fish' | 'dairy' | 'grains' | 'pantry'
    package_amount NUMERIC(10, 2) NOT NULL,              -- Menge (z.B. 400, 1, 500)
    package_unit VARCHAR(20) NOT NULL,                   -- 'g', 'kg', 'ml', 'l', 'Stück'
    package_weight_grams NUMERIC(10, 2) NOT NULL,        -- Für Rezept- und Nährwertberechnung in Gramm
    
    -- Bilddaten
    image_url TEXT,                                      -- Tatsächliches Verpackungsfoto oder neutraler Platzhalter
    image_source VARCHAR(100) DEFAULT 'open_food_facts', -- Quelle (z.B. 'open_food_facts', 'verified_studio')
    image_license VARCHAR(100) DEFAULT 'CC-BY-SA 3.0',  -- Lizenz (z.B. 'ODbL / CC-BY-SA 3.0', 'Proprietary')
    
    -- Nährwerte je 100 g
    calories_per_100g NUMERIC(8, 2) NOT NULL,
    protein_per_100g NUMERIC(8, 2) NOT NULL,
    carbs_per_100g NUMERIC(8, 2) NOT NULL,
    fat_per_100g NUMERIC(8, 2) NOT NULL,
    fiber_per_100g NUMERIC(8, 2) DEFAULT 0,
    allergens TEXT[] DEFAULT '{}',
    ingredients_text TEXT,

    -- Preislogik (Keine Fantasiepreise, 5 definierte Status)
    price NUMERIC(10, 2),                                -- Aktueller Preis in Euro (NULL wenn unbekannt)
    price_unit VARCHAR(50),                              -- z.B. '€ (7,48 € / kg)'
    price_status VARCHAR(50) NOT NULL DEFAULT 'unknown'  -- 'confirmed_offer' | 'last_observed' | 'user_reported' | 'licensed_data' | 'unknown'
        CHECK (price_status IN ('confirmed_offer', 'last_observed', 'user_reported', 'licensed_data', 'unknown')),
    price_source VARCHAR(100) NOT NULL,                  -- 'netto_official_offer' | 'open_prices' | 'user_input' | 'licensed_feed' | 'verified_catalog'
    price_date DATE NOT NULL,                            -- Datum der letzten Beobachtung
    valid_from DATE,                                     -- Gültigkeitsbeginn bei Aktionsangeboten
    valid_until DATE,                                    -- Gültigkeitsende (abgelaufene Angebote werden zu 'last_observed')
    region_branch VARCHAR(100) DEFAULT 'Bundesweit',     -- Filialbezug oder Region

    -- Datenqualitätsstatus
    data_quality_status VARCHAR(50) NOT NULL DEFAULT 'pending'
        CHECK (data_quality_status IN ('verified', 'partial', 'pending')),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_netto_products_ean ON netto_products(ean);
CREATE INDEX IF NOT EXISTS idx_netto_products_category ON netto_products(category);
CREATE INDEX IF NOT EXISTS idx_netto_products_retailer ON netto_products(retailer_scope);
CREATE INDEX IF NOT EXISTS idx_netto_products_price_status ON netto_products(price_status);

-- -----------------------------------------------------------------------------
-- 2. Tabelle: price_history (Preisverlauf zur lückenlosen Nachvollziehbarkeit)
-- Ein neuer Preis darf vorherige Daten nicht unkontrolliert überschreiben!
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id VARCHAR(64) REFERENCES netto_products(id) ON DELETE CASCADE,
    ean VARCHAR(14),
    price NUMERIC(10, 2) NOT NULL,
    price_status VARCHAR(50) NOT NULL,
    price_source VARCHAR(100) NOT NULL,
    observed_date DATE NOT NULL,
    valid_from DATE,
    valid_until DATE,
    region_branch VARCHAR(100),
    recorded_by VARCHAR(100) DEFAULT 'system_adapter',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_observed_date ON price_history(observed_date DESC);

-- -----------------------------------------------------------------------------
-- 3. Tabelle: import_logs (Protokollierung automatischer Aktualisierungen)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_adapter VARCHAR(50) NOT NULL,                 -- 'OpenFoodFactsAdapter' | 'OpenPricesAdapter' | 'NettoOfferImportAdapter' | etc.
    run_timestamp TIMESTAMPTZ DEFAULT NOW(),
    items_scanned INTEGER DEFAULT 0,
    items_imported INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
    log_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_logs_timestamp ON import_logs(run_timestamp DESC);

-- -----------------------------------------------------------------------------
-- 4. Trigger: Automatischer Preisverlauf bei Preisänderung in netto_products
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_netto_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.price IS DISTINCT FROM NEW.price OR OLD.price_status IS DISTINCT FROM NEW.price_status) THEN
        INSERT INTO price_history (
            product_id,
            ean,
            price,
            price_status,
            price_source,
            observed_date,
            valid_from,
            valid_until,
            region_branch,
            recorded_by,
            notes
        ) VALUES (
            NEW.id,
            NEW.ean,
            COALESCE(NEW.price, 0),
            NEW.price_status,
            NEW.price_source,
            NEW.price_date,
            NEW.valid_from,
            NEW.valid_until,
            NEW.region_branch,
            'trigger_auto_log',
            'Automatischer Snapshot bei Aktualisierung'
        );
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_netto_price_change ON netto_products;
CREATE TRIGGER trg_log_netto_price_change
BEFORE UPDATE ON netto_products
FOR EACH ROW
EXECUTE FUNCTION log_netto_price_change();

-- -----------------------------------------------------------------------------
-- 5. Row Level Security (RLS) für Supabase
-- Gastzugriff: Lesen für jedermann erlaubt
-- Schreibzugriff: Nur für autorisierte Administratoren
-- -----------------------------------------------------------------------------
ALTER TABLE netto_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Gast-Lese-Policy
CREATE POLICY "Public read access for verified products"
    ON netto_products FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Public read access for price history"
    ON price_history FOR SELECT
    USING (TRUE);

-- Admin Schreib-Policy
CREATE POLICY "Admin write access for products"
    ON netto_products FOR ALL
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin write access for import logs"
    ON import_logs FOR ALL
    USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');
