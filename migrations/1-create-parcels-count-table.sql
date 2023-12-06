-- UP

CREATE TABLE IF NOT EXISTS parcels_count (
    date TEXT,
    type TEXT
);

-- DOWN

DROP TABLE parcels_count;
