const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const QRCode = require('qrcode');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
// Serves the public folder so images and HTML files work
app.use(express.static(path.join(__dirname, 'public')));

// --- 1. STUDENT FEATURE: Generate QR Code ---
app.get('/api/generateQR/:roll_number', (req, res) => {
    const rollNumber = req.params.roll_number;
    
    // Select ALL columns (*) to ensure the photo and roll_number are retrieved
    db.get(`SELECT * FROM Users WHERE roll_number = ?`, [rollNumber], async (err, user) => {
        if (err || !user) return res.status(404).json({ error: "Student not found" });
        
        // If the student is Graduated, we can still show the QR, but warn them
        if (user.accountStatus !== 'Active') {
            return res.json({ 
                name: user.name, 
                warning: `Status: ${user.accountStatus}`, 
                qrImage: null // Optional: Don't generate QR if graduated
            });
        }

        try {
            // Generate the QR image from the hash
            const qrImageContent = await QRCode.toDataURL(user.qr_hash);
            
            // Deliver all necessary data to the frontend
            res.json({ 
                name: user.name,
                roll_number: user.roll_number,
                photo: user.photo,
                department: "Computer Science",
                qrImage: qrImageContent 
            });
        } catch (qrErr) {
            res.status(500).json({ error: "Failed to generate QR" });
        }
    });
});

// --- 2. GUARD FEATURE: Scan & Verify ---
app.post('/api/scanQR', (req, res) => {
    // MODIFIED: Extracted 'location' from the incoming frontend request
    const { qrHash, gateAction, location } = req.body; 
    
    // 1. Find User by Hash
    db.get(`SELECT * FROM Users WHERE qr_hash = ?`, [qrHash], (err, user) => {
        if (!user) return res.json({ success: false, message: "INVALID QR: User not found" });

        // 2. CHECK: Is the student Active? (SRS FR-5)
        if (user.accountStatus !== 'Active') {
            return res.json({ success: false, message: `ACCESS DENIED: User is ${user.accountStatus}` });
        }

        // 3. CHECK: Anti-Passback (SRS FR-7)
        if (gateAction === 'Entry' && user.current_status === 'Inside') {
            return res.json({ success: false, message: "PASSBACK VIOLATION: Already Inside Campus" });
        }
        if (gateAction === 'Exit' && user.current_status === 'Outside') {
            return res.json({ success: false, message: "PASSBACK VIOLATION: User is not currently Inside" });
        }

        // 4. ACTION: Update Status & Log It
        const newStatus = gateAction === 'Entry' ? 'Inside' : 'Outside';
        
        // MODIFIED: Use the location sent from the dropdown, fallback to 'Campus' if undefined
        const logLocation = location || 'Campus'; 

        db.serialize(() => {
            // Update the user's current location status
            db.run(`UPDATE Users SET current_status = ? WHERE roll_number = ?`, [newStatus, user.roll_number]);
            
            // Add a new log entry using the extracted location
            db.run(`INSERT INTO AccessLogs (roll_number, scan_type, location) VALUES (?, ?, ?)`, 
                   [user.roll_number, gateAction, logLocation]);
        });

        // 5. SUCCESS: Return details + PHOTO to the Guard UI (SRS FR-3)
        res.json({ 
            success: true, 
            message: `ACCESS GRANTED`,
            location: logLocation, // MODIFIED: Send location back so the UI can display it
            user: {
                name: user.name,
                roll_number: user.roll_number,
                photo: user.photo,        
                accountStatus: user.accountStatus
            }
        });
    });
});

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));