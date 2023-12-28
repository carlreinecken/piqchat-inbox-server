-- UP

CREATE TABLE IF NOT EXISTS config (
    name TEXT,
    value TEXT
);

-- DOWN

DROP TABLE config;
