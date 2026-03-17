**Install Dependencies:**  
Make sure you have the necessary tools for the server and CORS handling.

**Initialize the Database:**  
You must run node database.js to create the V2.0 schema, add the photo and accountStatus columns, and seed the test data.

**New Features in V2.0**  
Official UI: Integrated the yellow IITJ ID card design with real-time QR generation.

Security Logic (SRS FR-5/7):  
-Anti-Passback: Prevents users from entering if they are already "Inside" or exiting if they are "Outside".  
-Status Check: Automatically blocks access for Graduated students.  
-Media Support: Fixed API data-flow to ensure student photos (.jpg) load correctly from the /public/images folder.

# Testing & Quality Assurance

The system is verified through both manual simulation and automated unit testing suites to ensure 100% compliance with Functional (FR) and Non-Functional Requirements (NFR).

# Automated Testing (Jest)

To run the full suite of automated tests (including security logic, anti-passback, and performance benchmarks):

### Navigate to the project folder
`cd campus-qr`

### Run all tests
`npm test`

# Manual Testing Instructions

Active Student ID Generation: Use Roll Numbers B24CS1110, B24CS1012, B24CS1063, or B24CS1066 to verify successful QR generation.

Security Trigger (Graduated): Use Roll Number B20CS0999 to verify the "Access Denied" account status blocking.

Guard Portal Simulation: Open the Guard Portal console and execute the following commands to test the verification panel:

onScanSuccess("HASH_AARUSHI") / onScanSuccess("HASH_ARCHIE") - Valid Entry

onScanSuccess("HASH_GRADUATED") - Security Alert 
  
**Contributors**  
-Aarushi Atul Singh  
-Archie Singh

**For Attendance**

**Install Dependencies:**  
Make sure you have the necessary tools for running the server and handling QR generation and scanning.

**Initialize the Database:**  
Run `node database.js` to create the attendance database schema and seed the test student data required for the system.

**New Features in V2.0**  
Official UI: Integrated a clean attendance dashboard with real-time QR code generation for each class session.

Security Logic:  
- **Duplicate Scan Prevention:** Prevents students from marking attendance more than once for the same session.  
- **Session Validation:** Ensures that attendance is recorded only for the currently active class session.  
- **Student Verification:** Validates roll numbers before marking attendance to avoid unauthorized entries.  
- **QR Code Integration:** Generates unique QR codes for each session to ensure secure attendance marking.

