# ระบบบันทึกนักเรียนมาสาย

ชุดไฟล์นี้ทำมาเพื่อใช้กับ Google Sheets + Google Form + Apps Script + Looker Studio

## ไฟล์ที่สำคัญ

- `outputs/student_late_system_template.xlsx` - template สำหรับ import เป็น Google Sheets
- `apps-script/late-check-system.gs` - โค้ด Apps Script สำหรับดึงข้อมูลนักเรียนและสร้าง transaction
- `scripts/build_late_student_system.mjs` - script สำหรับสร้างไฟล์ template ใหม่ หากต้องแก้โครงในอนาคต

## โครงระบบ

1. `Students` เป็นฐานข้อมูลนักเรียน
2. Google Form ให้ครูเวรกรอก `รหัสนักเรียน`, เลือก `เหตุผล`, และเลือก `ผู้บันทึก`
3. Apps Script รับ form submission แล้วค้นข้อมูลจาก `Students`
4. Script append แถวใหม่ลง `Late_Transactions`
5. `Dashboard`, `Student_Summary`, `Daily_Summary` อัปเดตจาก transaction
6. Looker Studio ต่อกับ `Late_Transactions` เพื่อทำ dashboard จริงและ embed ใน Google Sites ได้

## วิธีติดตั้งใน Google

1. เปิด Google Drive แล้ว upload `outputs/student_late_system_template.xlsx`
2. เปิดไฟล์ด้วย Google Sheets
3. ไปที่ชีต `Students` แล้วแทนข้อมูลตัวอย่างด้วยรายชื่อนักเรียนจริง
4. ไปที่ชีต `Settings` แล้วแก้คอลัมน์ `Teachers` ให้เป็นรายชื่อครูที่ต้องการให้เลือกใน Form
5. ไปที่ `Extensions > Apps Script`
6. ลบโค้ดเดิมออก แล้ววางโค้ดจาก `apps-script/late-check-system.gs`
7. กด Save
8. เลือก function `setupLateSystem` แล้วกด Run หนึ่งครั้ง จากนั้น authorize
9. ถ้าต้องการให้ระบบสร้าง Form ให้ เลือก function `createLateCheckForm` แล้วกด Run
10. ถ้าใช้ Form ที่มีอยู่แล้ว ให้ link Form นั้นกับ Google Sheet นี้ และตั้งชื่อคำถามเป็น:
   - `รหัสนักเรียน`
   - `เหตุผล`
   - `ผู้บันทึก`

## โครง Google Form ที่แนะนำ

- `รหัสนักเรียน` เป็นช่องกรอกข้อความ ไม่ใช้ dropdown เพราะรายชื่อนักเรียนมีจำนวนมาก
- `เหตุผล` เป็นตัวเลือกจากคอลัมน์ `Reasons` ในชีต `Settings`
- `ผู้บันทึก` เป็น dropdown จากคอลัมน์ `Teachers` ในชีต `Settings`

## หมายเหตุการนับข้อมูล

- Dashboard นับเฉพาะ `Late_Transactions.status = Recorded`
- ถ้านักเรียนคนเดิมถูกส่งซ้ำในวันเดียวกัน จะได้สถานะ `Duplicate` และไม่ถูกนับใน dashboard
- ถ้ารหัสนักเรียนไม่พบในฐาน `Students` จะได้สถานะ `Student not found`
- แถวตัวอย่างใน `Late_Transactions` ลบได้หลังจากทดสอบระบบ

## ตั้งค่า Looker Studio

ต่อ data source ไปที่ชีต `Late_Transactions` แล้วใช้ filter หลัก:

```text
status = Recorded
```

กราฟที่แนะนำ:

- Scorecard: จำนวนมาสายทั้งหมด
- Scorecard: จำนวนมาสายวันนี้
- Time series: `late_date` กับ count ของ `transaction_id`
- Bar chart: `room`
- Bar chart: `full_name` สำหรับนักเรียนที่มาสายบ่อย
- Bar/Pie chart: `reason`
- Table: รายการล่าสุด `submitted_at`, `student_id`, `full_name`, `room`, `reason`, `recorder`

หลังทำรายงานเสร็จ สามารถ embed Looker Studio report ใน Google Sites ได้
