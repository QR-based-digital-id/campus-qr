const request = require('supertest');
const app = require('./server'); // Imports your express app

describe('Campus QR Gate Control API Tests (SRS V2.0)', () => {

    // ---------------------------------------------------------
    // FR-1: Unified App - GenerateQR() & ValidateQR() Integration
    // Reason: Database verification added for real-time identity confirmation
    // ---------------------------------------------------------
    describe('FR-1: QR Generation Integration', () => {
        it('should successfully generate a QR code with database validation for a valid student', async () => {
            const response = await request(app).get('/api/generateQR/B24CS1110');
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('qrImage');
            expect(response.body.roll_number).toBe('B24CS1110');
            expect(response.body.name).toBe('Aarushi');
        });
    });

    // ---------------------------------------------------------
    // FR-2: DatabaseManager - Get() Exception Handling
    // Reason: To improve response time and avoid null-pointer errors during invalid scans
    // ---------------------------------------------------------
    describe('FR-2: Invalid Scan Handling', () => {
        it('should safely handle an unregistered QR hash without crashing the server', async () => {
            const response = await request(app)
                .post('/api/scanQR')
                .send({ 
                    qrHash: 'FAKE_HASH_XYZ', 
                    gateAction: 'Entry',
                    location: 'Campus'
                });
            
            expect(response.statusCode).toBe(200); 
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('INVALID QR: User not found');
        });
    });

    // ---------------------------------------------------------
    // FR-3: Guard View - Data Access Layer (Photo rendering)
    // Reason: Photo display was missing; linked UI rendering to database response
    // ---------------------------------------------------------
    describe('FR-3: Guard UI Photo Payload', () => {
        it('should return the user photo attribute upon successful Entry scan', async () => {
            // Using Aarushi's hash for a valid Entry
            const response = await request(app)
                .post('/api/scanQR')
                .send({ 
                    qrHash: 'HASH_AARUSHI', 
                    gateAction: 'Entry',
                    location: 'Campus'
                });
            
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.user).toHaveProperty('photo');
            expect(response.body.user.photo).toBe('images/aarushi.jpg');
        });
    });

    // ---------------------------------------------------------
    // FR-4: Auth Service - QRCodeService uniqueness
    // Reason: Prevent regeneration of multiple QR codes for the same user
    // ---------------------------------------------------------
    describe('FR-4: QR Uniqueness Constraint', () => {
        it('should return the exact same QR image data for the same user on consecutive requests', async () => {
            const firstRequest = await request(app).get('/api/generateQR/B24CS1110');
            const secondRequest = await request(app).get('/api/generateQR/B24CS1110');
            
            expect(firstRequest.statusCode).toBe(200);
            expect(firstRequest.body.qrImage).toEqual(secondRequest.body.qrImage);
        });
    });

    // ---------------------------------------------------------
    // FR-5 & FR-6: Auth & Sync Service - AccountStatus Validation
    // Reason: Blocked users were logging in; QR remained valid after graduation
    // ---------------------------------------------------------
    describe('FR-5 & FR-6: Graduated Account Blocking', () => {
        it('should deny gate access if the user accountStatus is Graduated', async () => {
            const response = await request(app)
                .post('/api/scanQR')
                .send({ 
                    qrHash: 'HASH_GRADUATED', 
                    gateAction: 'Entry',
                    location: 'Campus'
                });
            
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('ACCESS DENIED: User is Graduated');
        });
    });

    // ---------------------------------------------------------
    // FR-7: AntipassbackEngine - readLastStatus()
    // Reason: Anti-passback logic needed log reference for last IN/OUT state
    // ---------------------------------------------------------
    describe('FR-7: Anti-Passback Rules', () => {
        it('should deny Entry if the user is already marked as Inside', async () => {
            // Step 1: Mark Riya as Inside
            await request(app)
                .post('/api/scanQR')
                .send({ qrHash: 'HASH_RIYA', gateAction: 'Entry', location: 'Campus' });
            
            // Step 2: Try to mark Riya as Inside AGAIN
            const response = await request(app)
                .post('/api/scanQR')
                .send({ qrHash: 'HASH_RIYA', gateAction: 'Entry', location: 'Campus' });
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('PASSBACK VIOLATION: Already Inside Campus');
        });

        it('should deny Exit if the user is currently marked as Outside', async () => {
            // Riddhi starts as 'Outside' by default in our seed data
            const response = await request(app)
                .post('/api/scanQR')
                .send({ qrHash: 'HASH_RIDDHI', gateAction: 'Exit', location: 'Market' });
            
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('PASSBACK VIOLATION: User is not currently Inside');
        });
    });

    // ---------------------------------------------------------
    // FR-8: AccessLogs - createLog() & state reset
    // Reason: User state was not resetting correctly after exit
    // ---------------------------------------------------------
    describe('FR-8: Database State Update on Valid Exit', () => {
        it('should grant access, record the destination, and update state to Outside on a valid OUT scan', async () => {
            // Step 1: Archie Enters the campus
            await request(app)
                .post('/api/scanQR')
                .send({ qrHash: 'HASH_ARCHIE', gateAction: 'Entry', location: 'Campus' });
            
            // Step 2: Archie Exits the campus to go to the Market
            const response = await request(app)
                .post('/api/scanQR')
                .send({ qrHash: 'HASH_ARCHIE', gateAction: 'Exit', location: 'Market' });
            
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.location).toBe('Market');
            expect(response.body.message).toBe('ACCESS GRANTED');
            
            // At this point, Archie's current_status in the DB is successfully reset to 'Outside'
        });
    });

});

// ---------------------------------------------------------
    // FR-9: Manual Guard Override (TR-02 Fallback)
    // Reason: Allows guards to force entry/exit if scanner fails
    // ---------------------------------------------------------
    describe('FR-9: Manual Guard Override', () => {
        it('should force entry and bypass anti-passback for a valid roll number', async () => {
            const response = await request(app)
                .post('/api/manual-override')
                .send({
                    roll_number: 'B24CS1012', // Archie's ID
                    gateAction: 'Entry',
                    reason: 'Damaged ID Card',
                    guardId: 'GUARD_99'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('MANUAL OVERRIDE SUCCESS');
        });

        it('should return an error if the manual override roll number does not exist', async () => {
            const response = await request(app)
                .post('/api/manual-override')
                .send({
                    roll_number: 'INVALID_ROLL_999',
                    gateAction: 'Exit',
                    reason: 'Testing',
                    guardId: 'GUARD_99'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Student not found in database.');
        });
    });

describe('Attendance System API Tests', () => {

    // ---------------------------------------------------------
    // FR-11: Course Mapping (subject -> table)
    // ---------------------------------------------------------
    describe('FR-11: Subject Mapping', () => {
        it('should mark attendance in correct subject table', async () => {
            const response = await request(app)
                .post('/mark-attendance')
                .send({
                    qr_hash: 'HASH_AARUSHI',
                    subject: 'Software_Engineering'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('student');
            expect(response.body.success).toBe(true);
        });
    });

    // ---------------------------------------------------------
    // FR-13: Duplicate Attendance Prevention
    // ---------------------------------------------------------
    describe('FR-13: Duplicate Attendance', () => {
        it('should not allow marking attendance twice in same session', async () => {

            await request(app)
                .post('/mark-attendance')
                .send({
                    qr_hash: 'HASH_AARUSHI',
                    subject: 'PRML'
                });

            const response = await request(app)
                .post('/mark-attendance')
                .send({
                    qr_hash: 'HASH_AARUSHI',
                    subject: 'PRML'
                });

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('already marked');
        });
    });

    // ---------------------------------------------------------
    // FR-14: Attendance Record Creation
    // ---------------------------------------------------------
    describe('FR-14: Attendance Logging', () => {
        it('should successfully create a new attendance record', async () => {
            const response = await request(app)
                .post('/mark-attendance')
                .send({
                    qr_hash: 'HASH_RIDDHI',
                    subject: 'Thermodynamics'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Present');
        });
    });
// FACULTY FEATURES TESTING 

describe('Faculty Features API Tests (FR-15 to FR-17)', () => {

    // FR-15: Faculty Dashboard (View Attendance)
    describe('FR-15: Faculty Dashboard', () => {
        it('should fetch attendance records for a subject', async () => {

            const res = await request(app)
                .get('/api/attendance/PRML');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('data');
        });
    });

    // FR-16: Modify Attendance
    describe('FR-16: Modify Attendance', () => {
        it('should update attendance with a valid reason', async () => {

            const today = new Date().toISOString().split('T')[0];

            const res = await request(app)
                .post('/api/updateAttendance')
                .send({
                    roll_number: 'B24CS1110',
                    subject: 'PRML',
                    date: today,
                    status: 1,
                    reason: 'Medical'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Attendance updated successfully');
        });

        it('should fail update without reason', async () => {

            const today = new Date().toISOString().split('T')[0];

            const res = await request(app)
                .post('/api/updateAttendance')
                .send({
                    roll_number: 'B24CS1110',
                    subject: 'PRML',
                    date: today,
                    status: 1
                });

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Reason is required for modification');
        });
    });

    // FR-17: Attendance Percentage
    describe('FR-17: Attendance Percentage', () => {
        it('should calculate attendance percentage correctly', async () => {

            const res = await request(app)
                .get('/api/attendancePercentage/B24CS1110/PRML');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body).toHaveProperty('percentage');
        });

        it('should return 0% for student with no records', async () => {

            const res = await request(app)
                .get('/api/attendancePercentage/FAKE_ID/PRML');

            expect(res.body.success).toBe(true);
            expect(res.body.percentage).toBe(0);
        });
    });
describe('FR-18: Attendance Report Generation', () => {

    test('should return attendance report for a course', async () => {
        const response = await request(app)
            .get('/api/attendance/report?courseId=CS101');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('report');
        expect(Array.isArray(response.body.report)).toBe(true);
    });

    test('should fail if courseId missing', async () => {
        const response = await request(app)
            .get('/api/attendance/report');

        expect(response.statusCode).toBe(400);
    });

});
describe('FR-19: Attendance Search and Filter', () => {

    test('should filter attendance by studentId', async () => {
        const response = await request(app)
            .get('/api/attendance/search?studentId=B24CS1063');

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('should return empty if no match found', async () => {
        const response = await request(app)
            .get('/api/attendance/search?studentId=INVALID');

        expect(response.statusCode).toBe(200);
    });

});
describe('FR-20: Error Handling for Invalid QR', () => {

    test('should return error for invalid QR', async () => {
        const response = await request(app)
            .post('/api/scanQR')
            .send({
                qrHash: 'INVALID_HASH',
                gateAction: 'Entry',
                location: 'Campus'
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

});
});
});
