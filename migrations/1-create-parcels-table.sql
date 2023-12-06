-- UP

CREATE TABLE IF NOT EXISTS parcels (
    id INTEGER PRIMARY KEY NOT NULL,
    uuid TEXT NOT NULL,
    recipient_uuid TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    attachment_filename TEXT,
    uploaded_by TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_parcel_uuid ON parcels (uuid);

-- DOWN

DROP INDEX idx_parcel_uuid;
DROP TABLE parcels;
