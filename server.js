const express = require('express');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Generate QR Code Endpoint
app.get('/api/generateQR/:roll_number', (req, res) => {
    const rollNumber = req.params.roll_number;
    db.get(`SELECT qr_hash, name FROM Users WHERE roll_number = ?`, [rollNumber], async (err, user) => {
        if (!user) return res.status(404).json({ error: "Student not found" });
        const qrImageContent = await QRCode.toDataURL(user.qr_hash);
        res.json({ name: user.name, qrImage: qrImageContent });
    });
});

// Guard Scan Endpoint (Anti-Passback Logic)
app.post('/api/scanQR', (req, res) => {
    const { qrHash, gateAction } = req.body; 
    
    db.get(`SELECT * FROM Users WHERE qr_hash = ?`, [qrHash], (err, user) => {
        if (!user) return res.json({ success: false, message: "INVALID ID" });

        if (gateAction === 'Entry' && user.current_status === 'Inside') {
            return res.json({ success: false, message: "PASSBACK VIOLATION: Already Inside" });
        }
        if (gateAction === 'Exit' && user.current_status === 'Outside') {
            return res.json({ success: false, message: "VIOLATION: User is not Inside" });
        }

        const newStatus = gateAction === 'Entry' ? 'Inside' : 'Outside';

        db.run(`UPDATE Users SET current_status = ? WHERE roll_number = ?`, [newStatus, user.roll_number], () => {
            db.run(`INSERT INTO AccessLogs (roll_number, scan_type) VALUES (?, ?)`, [user.roll_number, gateAction], () => {
                res.json({ success: true, message: `ACCESS GRANTED: ${user.name}` });
            });
        });
    });
});

app.listen(3000, () => console.log('Server is running on http://localhost:3000'));