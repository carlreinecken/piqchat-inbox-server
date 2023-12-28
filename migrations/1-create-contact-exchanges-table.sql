-- UP

CREATE TABLE IF NOT EXISTS contact_exchanges (
    id INTEGER PRIMARY KEY NOT NULL,
    state TEXT NOT NULL,
    one_time_token TEXT NOT NULL,
    encrypted_contact TEXT,
    created_at TEXT NOT NULL,
    created_by INTEGER
);

-- DOWN

DROP TABLE contact_exchanges;
