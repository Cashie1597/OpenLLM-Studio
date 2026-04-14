-- Hardware information cache table
CREATE TABLE IF NOT EXISTS hardware_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gpu_name TEXT NOT NULL,
    gpu_backend TEXT NOT NULL,
    vram_gb REAL NOT NULL,
    ram_gb REAL NOT NULL,
    cpu_cores INTEGER NOT NULL,
    disk_space_gb REAL,
    scanned_at INTEGER NOT NULL
);

-- Index for efficient lookup
CREATE INDEX IF NOT EXISTS idx_hardware_info_scanned_at ON hardware_info(scanned_at);
