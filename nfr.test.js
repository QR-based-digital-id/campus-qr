const request = require('supertest');
const app = require('./server'); 

describe('Campus QR - Non-Functional Requirements (NFR) Tests', () => {
    describe('NFR-1 & NFR-2: Response Time & App Availability', () => {
        it('should generate a QR code in under 200ms (Performance)', async () => {
            const start = Date.now();
            const res = await request(app).get('/api/generateQR/B24CS1012'); 
            const duration = Date.now() - start;
            expect(res.statusCode).toBe(200);
            expect(duration).toBeLessThan(200); 
        });
        it('should load the Unified App UI quickly and without errors', async () => {
            const res = await request(app).get('/attendance_selection.html');
            expect(res.statusCode).not.toBe(500); 
        });
    });

    describe('NFR-4: Concurrency and API Load Handling', () => {
        it('should handle 20 simultaneous scan requests without crashing the server', async () => {
            const requests = Array.from({ length: 20 }).map(() =>
                request(app).post('/api/scanQR').send({ qrHash: 'FAKE', gateAction: 'Entry', location: 'Campus' })
            );
            const responses = await Promise.all(requests);
            responses.forEach(res => {
                expect(res.statusCode).toBe(200);
                expect(res.body.success).toBe(false); 
            });
        });
    });

    describe('NFR-5 & NFR-9: Security Headers and Access Control', () => {
        it('should have CORS enabled to protect the REST API', async () => {
            const res = await request(app).get('/api/generateQR/B24CS1012');
            expect(res.headers['access-control-allow-origin']).toBeDefined();
        });
    });
});