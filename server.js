const express = require('express');
const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');
const db = require('./database');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fetch Student Data and Generate QR
app.get('/api/generateQR/:rollNumber', (req, res) => {
    const roll = req.params.rollNumber.toUpperCase();
    
    db.get("SELECT * FROM Users WHERE roll_number = ?", [roll], async (err, row) => {
        if (err) return res.status(500).json({ error: "DB Error" });
        if (!row) return res.status(404).json({ error: "Student not found" });

        try {
            const qrImage = await QRCode.toDataURL(row.qr_hash);
            
            // KEY SYNC: We map 'row.photo' and 'row.department' to the JSON keys
            res.json({
                name: row.name,
                rollNumber: row.roll_number,
                department: row.department,
                photoUrl: row.photo, // Maps database 'photo' to frontend 'photoUrl'
                qrImage: qrImage
            });
        } catch (e) {
            res.status(500).json({ error: "QR Error" });
        }
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});