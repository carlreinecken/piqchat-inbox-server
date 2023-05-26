CREATE TABLE IF NOT EXISTS profile_backups (
    id INTEGER PRIMARY KEY NOT NULL,
    user_uuid TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_read_at TEXT
);
