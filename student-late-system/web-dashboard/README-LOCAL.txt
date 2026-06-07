Student Late Dashboard - Local package

วิธีเปิดบนเครื่อง Mac:
1. แตกไฟล์ zip หรือคัดลอกทั้งโฟลเดอร์ web-dashboard ไปไว้ในเครื่อง
2. ดับเบิลคลิก start-dashboard.command
3. Browser จะเปิด dashboard อัตโนมัติ

การเชื่อมข้อมูลจริง:
- Dashboard จะโหลดข้อมูลจาก Google Sheet ตัวจริงก่อน:
  https://docs.google.com/spreadsheets/d/1HmcqFHIQDiWZ2CWtxBC4XJjzp4cXTd3hZOrGunwA8tw/edit?gid=1977681832
- เครื่องที่เปิด dashboard ต้องมีสิทธิ์อ่าน Google Sheet นี้ เช่นล็อกอินบัญชี Google ที่ถูกแชร์ชีตไว้
- ถ้าโหลด Google Sheet ไม่ได้ ระบบจะ fallback ไปอ่านไฟล์ในโฟลเดอร์ data

ข้อมูลสำรองแบบ local:
- วางข้อมูล transaction ไว้ที่ data/late_transactions.json ในรูปแบบ:
  {
    "rows": [
      {
        "submitted_at": "2026-06-03 07:55",
        "late_date": "2026-06-03",
        "time_in": "07:55",
        "student_id": "65001",
        "full_name": "ชื่อ นักเรียน",
        "grade": "ปวช.1",
        "room": "ปวช.1/1",
        "reason": "รถติด",
        "recorder": "ครูเวรเช้า",
        "status": "Recorded",
        "notes": ""
      }
    ]
  }
- หรือเปิดหน้าเว็บแล้วกด "นำเข้า CSV" เพื่อเลือกไฟล์ CSV ที่ export จากชีต Late_Transactions

หมายเหตุ:
- ไม่มี Apps Script public endpoint
- ถ้า Google Sheet โหลดไม่ได้ และ data/late_transactions.json ยังว่าง dashboard จะแสดง 0 รายการ
