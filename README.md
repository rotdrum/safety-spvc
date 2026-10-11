# SPVC Student Affairs Information System

ระบบข้อมูลสารสนเทศ งานปกครองและความปลอดภัยนักเรียน นักศึกษา

วิทยาลัยอาชีวศึกษาสุพรรณบุรี

เว็บไซต์ใช้งานจริง: [https://safety-spvc.com/](https://safety-spvc.com/)

ระบบนี้เป็นเว็บแบบ static ที่เชื่อม Google Apps Script, Google Sheets และ Google
Drive สำหรับจัดการข้อมูลของงานปกครอง ปัจจุบันตั้งค่าการแสดงผลเป็นภาคเรียนที่
`2/2569`

## ระบบที่มีในโครงการ

| ระบบ | Path | การเข้าใช้งาน |
| --- | --- | --- |
| ศูนย์ข้อมูลกลาง | `/index.html` | สาธารณะ แสดงเฉพาะข้อมูลภาพรวม |
| พื้นที่นักเรียน | `/student-portal/` | ตรวจสอบจากรหัสนักเรียนใน Master Student |
| พื้นที่ครู | `/teacher-portal/` | เลือกชื่อจาก Master Teacher |
| นักเรียนมาสาย | `/student-late-system/web-dashboard/` | Gmail ที่ได้รับสิทธิ์ |
| พฤติกรรมนักเรียน | `/behavior-system/` | Gmail ที่ได้รับสิทธิ์ |
| ข้อมูลเพศภาพและการดูแลที่เท่าเทียม | `/gender-identity-system/` | Gmail ที่ได้รับสิทธิ์ |
| ขอออกนอกสถานศึกษา | `/off-campus-system/` | Gmail ที่ได้รับสิทธิ์ |
| นักเรียนแจ้งเหตุ | `/behavior-report/` | สาธารณะ |

พื้นที่นักเรียนและหน้าแจ้งเหตุเปิดให้ใช้งานจากโทรศัพท์ได้โดยตรง ส่วนพื้นที่ครู
ใช้การเลือกตัวตนจาก Master Teacher และไม่ได้ใช้ Gmail authentication จึงควรเผยแพร่
URL เฉพาะกลุ่มผู้ปฏิบัติงานที่เกี่ยวข้อง

## สถาปัตยกรรม

```text
Static HTML/CSS/JavaScript
        |
        v
Google Apps Script Web App
        |
        +-- Google Sheets: master และข้อมูลธุรกรรม
        +-- Google Drive: เอกสารและหลักฐานแนบ
```

ไฟล์ backend หลักอยู่ที่
`google-apps-script/student-affairs-data-api.gs` และใช้ร่วมกันทุกระบบ

## โครงสร้างสำคัญ

```text
assets/                         รูปภาพ ข่าว ตราสัญลักษณ์ และ QR code
behavior-report/                หน้านักเรียนแจ้งเหตุ
behavior-system/                ระบบบริหารจัดการพฤติกรรม
gender-identity-system/         ระบบข้อมูลเพศภาพ
off-campus-system/              Dashboard ขอออกนอกสถานศึกษา
student-late-system/            ระบบมาสาย แบบฟอร์ม และรายงาน
student-portal/                 พื้นที่บริการตนเองของนักเรียน
teacher-portal/                 พื้นที่ปฏิบัติงานสำหรับครู
systems/                        API client, auth guard และ shared styles
google-apps-script/             Backend Google Apps Script
index.html                      ศูนย์ข้อมูลกลาง
```

## เปิดใช้งานในเครื่อง

ต้องเปิดผ่าน HTTP server เพราะหน้าเว็บเรียก API และไฟล์ข้ามโฟลเดอร์

```bash
cd /path/to/safety-spvc
python3 -m http.server 4173 --bind 127.0.0.1
```

จากนั้นเปิด `http://127.0.0.1:4173/` หรือบน macOS ใช้
`start-portal.command`

## ตั้งค่า API ฝั่งเว็บ

1. คัดลอก `systems/data-api-config.example.js` เป็น
   `systems/data-api-config.js`
2. ใส่ Apps Script deployment URL, API token และ Google OAuth Client ID
3. ห้าม commit ไฟล์จริง เนื่องจากมี API token

`data-api-config.js` ทุกตำแหน่งถูก ignore จาก Git แล้ว

## ตั้งค่า Google Apps Script

1. เปิด Apps Script ที่เชื่อมกับ Spreadsheet กลาง
2. วางโค้ดจาก `google-apps-script/student-affairs-data-api.gs`
3. รัน `setupStudentAffairsDataApi()` ครั้งแรกเพื่อสร้างชีตและโฟลเดอร์
4. รัน `setStudentAffairsGoogleClientId("CLIENT_ID")`
5. รัน `setStudentAffairsDisciplinePassword("PASSWORD")` โดยใช้รหัสอย่างน้อย 8 ตัวอักษร
6. Deploy เป็น Web app โดยเลือก `Execute as: Me` และ `Who has access: Anyone`
7. นำ deployment URL และ token ไปใส่ในไฟล์ config ฝั่งเว็บ

เมื่อแก้ backend ให้ใช้ `Deploy > Manage deployments > Edit > New version`
เพื่อรักษา URL เดิม รายละเอียดเพิ่มเติมอยู่ใน
[`google-apps-script/README.md`](google-apps-script/README.md)

## Deploy เว็บไซต์

อัปโหลดเนื้อหาทั้ง repository ไปยัง document root ของ `safety-spvc.com` โดยไม่รวม
`.git` จากนั้นสร้าง `systems/data-api-config.js` บน server แยกต่างหาก

ก่อนเผยแพร่ให้ตรวจอย่างน้อย:

- หน้าแรกโหลด Integrated Dashboard ได้
- หน้า Gmail-protected เปิด auth guard ถูกต้อง
- Student Portal ค้นหา Master Student และส่งคำขอได้
- Teacher Portal โหลด Master Teacher และบันทึกมาสายได้
- เวลาแสดงเป็น `HH:mm` ไม่ใช่วันที่ฐานปี 1899
- การสร้าง PDF และเอกสารแนบทำงานบน browser ที่ใช้งานจริง

## ข้อมูลและความปลอดภัย

- ห้าม commit `systems/data-api-config.js`, API token หรือไฟล์ credential
- รหัสฝ่ายปกครองตรวจที่ Apps Script ผ่าน Script Properties เท่านั้น
- เอกสารนักเรียนและข้อมูลส่วนบุคคลต้องเก็บใน Drive/Sheets ที่จำกัดสิทธิ์
- การลบข้อมูลระบบหลักเป็น soft delete เพื่อรักษาประวัติการตรวจสอบ
- หาก token รั่ว ให้รัน `rotateStudentAffairsApiToken()` แล้วอัปเดต config บน server
