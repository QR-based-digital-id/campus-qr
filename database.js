const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.resolve(__dirname, 'campus.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS Users (
        roll_number TEXT PRIMARY KEY,
        name TEXT,
        department TEXT,
        photo TEXT,            -- This name worked in your previous code
        qr_hash TEXT UNIQUE,
        current_status TEXT DEFAULT 'Outside'
    )`);

    db.get("SELECT COUNT(*) as count FROM Users", (err, row) => {
        if (row && row.count === 0) {
            const insertQuery = `INSERT INTO Users (roll_number, name, department, photo, qr_hash) VALUES (?, ?, ?, ?, ?)`;
            
            // Note: We use 'images/name.jpg' (No leading slash or /public)
            db.run(insertQuery, ['B24CS1012', 'Archie Singh', 'Computer Science & Engineering', 'images/archie.jpg', 'HASH_B24CS1012']);
            db.run(insertQuery, ['B24CS1110', 'Aarushi Singh', 'Computer Science & Engineering', 'images/aarushi.jpg', 'HASH_B24CS1110']);
            db.run(insertQuery, ['B24CS1066', 'Riya Dhyawna', 'Computer Science & Engineering', 'images/riya.jpg', 'HASH_B24CS1066']);
            db.run(insertQuery, ['B24CS1063', 'Riddhi Jain', 'Computer Science & Engineering', 'images/riddhi.jpg', 'HASH_B24CS1063']);
        }
    });
});

module.exports = db;