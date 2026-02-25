const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'campus.db'));

db.serialize(() => {
    // Updated Users Table with SRS V2.0 requirements
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        roll_number TEXT PRIMARY KEY,
        name TEXT,
        role TEXT,                   -- Student, Guard, Faculty, Admin
        photo TEXT,                  -- URL/Path for visual verification
        qr_hash TEXT UNIQUE,
        accountStatus TEXT,          -- Active, Graduated, Blocked
        current_status TEXT DEFAULT 'Outside'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS AccessLogs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        roll_number TEXT,
        scan_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        location TEXT                -- Location indicator (Market, Home, etc.)
    )`);

    // Insert Alpha Team members
    db.get("SELECT COUNT(*) as count FROM Users", (err, row) => {
        if (row.count === 0) {
            const stmt = db.prepare(`INSERT INTO Users (roll_number, name, role, photo, qr_hash, accountStatus, current_status) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?)`);

            // Adding team members from your SRS [cite: 55, 56, 57]
            stmt.run("B24CS1110", "Aarushi", "Student", "images/aarushi.jpg", "HASH_AARUSHI", "Active", "Outside");
            stmt.run("B24CS1066", "Riya", "Student", "images/riya.jpg", "HASH_RIYA", "Active", "Outside");
            stmt.run("B24CS1012", "Archie", "Student", "images/archie.jpg", "HASH_ARCHIE", "Active", "Outside");
            stmt.run("B24CS1063", "Riddhi", "Student", "images/riddhi.jpg", "HASH_RIDDHI", "Active", "Outside");
            stmt.run("B20CS0999", "Ex-Student", "Student", null, "HASH_GRADUATED", "Graduated", "Outside");

            stmt.finalize();
            console.log("Database seeded with Alpha Team members.");
        }
    });
});

module.exports = db;