const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'campus.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        roll_number TEXT PRIMARY KEY,
        name TEXT,
        qr_hash TEXT UNIQUE,
        current_status TEXT DEFAULT 'Outside'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS AccessLogs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_number TEXT,
        scan_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Insert a test student 
    db.get("SELECT COUNT(*) as count FROM Users", (err, row) => {
        if (row.count === 0) {
            db.run(`INSERT INTO Users (roll_number, name, qr_hash, current_status) 
                    VALUES ('2026CS01', 'ABC', 'SECURE_HASH_123', 'Outside')`);
        }
    });
});

module.exports = db;