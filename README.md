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

**Testing Instructions**  
-Test Active Student: Use Roll Number B24CS1110 / B24CS1012 / B24CS1063/ B24CS1066 to see a successful ID generation.  
-Test Graduated Student: Use Roll Number B20CS0999 to verify the "Access Denied" security trigger.  
-Simulate Scan: Open the Guard Portal console and run onScanSuccess("HASH_AARUSHI") / onScanSuccess("HASH_ARCHIE") / onScanSuccess("HASH_Riddhi") / onScanSuccess("HASH_RIYA") / onScanSuccess("HASH_GRADUATED") to verify the verification panel.  
  
**Contributors**  
-Aarushi Atul Singh  
-Archie Singh
