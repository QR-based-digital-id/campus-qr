const express = require('express');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Serves the public folder so images and HTML files work
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. STUDENT FEATURE: Generate QR Code ---
// (Kept from your previous code so student.html works)
app.get('/api/generateQR/:roll_number', (req, res) => {
    const rollNumber = req.params.roll_number;
    
    // We select name, role, and qr_hash to confirm identity
    db.get(`SELECT qr_hash, name, role, accountStatus FROM Users WHERE roll_number = ?`, [rollNumber], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Student not found" });
        
        // If the student is Graduated, we can still show the QR, but warn them
        if (user.accountStatus !== 'Active') {
            return res.json({ 
                name: user.name, 
                warning: `Status: ${user.accountStatus}`, 
                qrImage: null // Optional: Don't generate QR if graduated
            });
        }

        // Generate the QR image from the hash
        const qrImageContent = await QRCode.toDataURL(user.qr_hash);
        res.json({ name: user.name, qrImage: qrImageContent });
    });
});

// --- 2. GUARD FEATURE: Scan & Verify ---
// (Updated with SRS V2.0 Logic: Photos, Status, Logs)
app.post('/api/scanQR', (req, res) => {
    const { qrHash, gateAction } = req.body; // gateAction is 'Entry' or 'Exit'
    
    // 1. Find User by Hash
    db.get(`SELECT * FROM Users WHERE qr_hash = ?`, [qrHash], (err, user) => {
        if (!user) return res.json({ success: false, message: "INVALID QR: User not found" });

        // 2. CHECK: Is the student Active? (SRS FR-5)
        if (user.accountStatus !== 'Active') {
            return res.json({ success: false, message: `ACCESS DENIED: User is ${user.accountStatus}` });
        }

        // 3. CHECK: Anti-Passback (SRS FR-7)
        // If trying to Enter, they must be 'Outside'. 
        // If trying to Exit, they must be 'Inside'.
        if (gateAction === 'Entry' && user.current_status === 'Inside') {
            return res.json({ success: false, message: "PASSBACK VIOLATION: Already Inside Campus" });
        }
        if (gateAction === 'Exit' && user.current_status === 'Outside') {
            return res.json({ success: false, message: "PASSBACK VIOLATION: User is not currently Inside" });
        }

        // 4. ACTION: Update Status & Log It
        const newStatus = gateAction === 'Entry' ? 'Inside' : 'Outside';
        const location = gateAction === 'Entry' ? 'Campus Main Gate' : 'Main Gate (Leaving)';

        db.serialize(() => {
            // Update the user's current location status
            db.run(`UPDATE Users SET current_status = ? WHERE roll_number = ?`, [newStatus, user.roll_number]);
            
            // Add a new log entry
            db.run(`INSERT INTO AccessLogs (roll_number, scan_type, location) VALUES (?, ?, ?)`, 
                   [user.roll_number, gateAction, location]);
        });

        // 5. SUCCESS: Return details + PHOTO to the Guard UI (SRS FR-3)
        res.json({ 
            success: true, 
            message: `ACCESS GRANTED`,
            user: {
                name: user.name,
                roll_number: user.roll_number,
                photo: user.photo,        // Sends the image path (e.g., 'images/aarushi.jpg')
                accountStatus: user.accountStatus
            }
        });
    });
});

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));