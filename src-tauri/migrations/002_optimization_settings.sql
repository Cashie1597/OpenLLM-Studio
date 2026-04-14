-- Create optimization_settings table with singleton pattern
CREATE TABLE IF NOT EXISTS optimization_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    num_ctx INTEGER NOT NULL DEFAULT 8192,
    num_gpu INTEGER NOT NULL DEFAULT 1,
    num_batch INTEGER NOT NULL DEFAULT 512,
    num_thread INTEGER NOT NULL DEFAULT 8,
    flash_attention BOOLEAN NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Insert default row
INSERT OR IGNORE INTO optimization_settings (
    id,
    num_ctx,
    num_gpu,
    num_batch,
    num_thread,
    flash_attention,
    created_at,
    updated_at
) VALUES (
    1,
    8192,
    1,
    512,
    8,
    0,
    datetime('now'),
    datetime('now')
);
