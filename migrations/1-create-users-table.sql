-- UP

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY NOT NULL,
    uuid TEXT UNIQUE,
    push_subscription_json TEXT NOT NULL, /* json object of endpoint and keys */
    contacts_json TEXT NOT NULL, /* JSON array of uuids */
    client_id TEXT,
    client_version TEXT,
    client_last_seen_at TEXT,
    created_at TEXT,
    created_by TEXT
);

-- DOWN

DROP TABLE users;
