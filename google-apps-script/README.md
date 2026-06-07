# Google Sheets + Drive CRUD

ระบบพฤติกรรมและระบบข้อมูลเพศภาพใช้ Apps Script API ชุดเดียว โดยเก็บข้อมูลใน Spreadsheet เดิมและไฟล์ใน Google Drive

## ติดตั้ง

1. เปิด Spreadsheet Master เดิม
2. ไปที่ `ส่วนขยาย > Apps Script`
3. เพิ่มไฟล์สคริปต์ใหม่ แล้ววาง `student-affairs-data-api.gs`
4. รัน `setupStudentAffairsDataApi()` หนึ่งครั้ง และอนุญาตสิทธิ์ Sheets/Drive
5. ดู Execution log เพื่อเก็บ `API token` และ URL โฟลเดอร์ Drive
6. Deploy เป็น Web app:
   - Execute as: Me
   - เว็บ static ที่เรียกข้ามโดเมนต้องใช้ `Who has access: Anyone` และตรวจ token ทุกคำขอ
7. ใส่ Deployment URL และ token ใน `systems/data-api-config.js`

ไฟล์ `systems/data-api-config.js` ถูก ignore จาก Git เพราะมี token จริง ให้ใช้
`systems/data-api-config.example.js` เป็นแม่แบบเมื่อย้ายเครื่องหรือ deploy ใหม่

## ชีตที่ระบบสร้าง

- `Behavior_Cases`
- `Behavior_Timeline`
- `Gender_Requests`
- `Gender_Timeline`
- `Student_Affairs_Documents`
- `Student_Affairs_Audit`

การลบเป็น soft delete เพื่อรักษาประวัติการตรวจสอบ เอกสารใน Drive ไม่ถูกลบอัตโนมัติ

## ความปลอดภัย

ข้อมูลสองระบบนี้เป็นข้อมูลจำกัดสิทธิ์ ไม่ควรเผยแพร่ Spreadsheet, โฟลเดอร์ Drive,
Deployment URL หรือ token ต่อสาธารณะ การ deploy แบบ `Anyone` เหมาะกับเว็บภายในที่
เก็บไฟล์ config ไว้เฉพาะเครื่อง/เซิร์ฟเวอร์ที่ควบคุมได้เท่านั้น ห้ามนำ token ไปฝังใน
repository หรือเว็บ public และควรหมุน token ด้วย `rotateStudentAffairsApiToken()`
เมื่อสงสัยว่ารั่วไหล
