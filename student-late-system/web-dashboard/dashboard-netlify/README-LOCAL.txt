Student Late Dashboard - Local package

วิธีเปิดบนเครื่อง Mac:
1. แตกไฟล์ zip หรือคัดลอกทั้งโฟลเดอร์ web-dashboard ไปไว้ในเครื่อง
2. ดับเบิลคลิก start-dashboard.command
3. Browser จะเปิด dashboard อัตโนมัติ

วิธีใส่ข้อมูลจริง:
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
- ข้อมูลอยู่ในเครื่องเท่านั้น ไม่มี public endpoint
- ถ้า data/late_transactions.json ยังว่าง dashboard จะแสดง 0 รายการ
