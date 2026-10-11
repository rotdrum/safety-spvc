import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const rootDir = path.resolve(".");
const outputDir = path.join(rootDir, "outputs");
const outputPath = path.join(outputDir, "student_late_system_template.xlsx");

const palette = {
  navy: "#1F3A5F",
  blue: "#2F6F9F",
  lightBlue: "#EAF3F8",
  surface: "#F7FAFC",
  border: "#CBD5E1",
  green: "#DCFCE7",
  yellow: "#FEF3C7",
  red: "#FEE2E2",
  text: "#172033",
  muted: "#64748B",
  white: "#FFFFFF",
};

const workbook = Workbook.create();

function sheet(name) {
  return workbook.worksheets.add(name);
}

function setTitle(ws, range, title, subtitle) {
  const titleRange = ws.getRange(range);
  titleRange.values = [[title]];
  titleRange.format = {
    fill: palette.navy,
    font: { color: palette.white, bold: true, size: 18 },
    horizontalAlignment: "left",
    verticalAlignment: "center",
  };
  titleRange.format.rowHeight = 34;
  if (subtitle) {
    const row = Number(range.match(/\d+/)?.[0] ?? 1) + 1;
    const subtitleRange = ws.getRange(`A${row}:H${row}`);
    subtitleRange.values = [[subtitle, null, null, null, null, null, null, null]];
    subtitleRange.format = {
      fill: palette.lightBlue,
      font: { color: palette.text, italic: true, size: 10 },
      verticalAlignment: "center",
    };
  }
}

function styleHeader(range) {
  range.format = {
    fill: palette.blue,
    font: { color: palette.white, bold: true, size: 10 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: palette.border },
  };
}

function styleBody(range) {
  range.format = {
    fill: palette.white,
    font: { color: palette.text, size: 10 },
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: "#E2E8F0" },
  };
}

function setWidths(ws, widths) {
  for (const [col, px] of Object.entries(widths)) {
    ws.getRange(`${col}:${col}`).format.columnWidthPx = px;
  }
}

function addTable(ws, address, name) {
  try {
    const table = ws.tables.add(address, true);
    table.name = name;
    return table;
  } catch {
    return null;
  }
}

const start = sheet("START_HERE");
setTitle(
  start,
  "A1:H1",
  "ระบบบันทึกนักเรียนมาสาย",
  "ใช้ Google Form รับข้อมูลรายวัน แล้วให้ Apps Script เติมข้อมูลนักเรียนลง transaction อัตโนมัติ"
);
start.getRange("A4:H4").values = [["ขั้นตอนติดตั้ง", "รายละเอียด", null, null, null, null, null, null]];
styleHeader(start.getRange("A4:H4"));
start.getRange("A5:H13").values = [
  ["1", "นำไฟล์นี้ไป import เป็น Google Sheets", null, null, null, null, null, null],
  ["2", "ใส่ฐานข้อมูลนักเรียนจริงในชีต Students โดยคงชื่อหัวคอลัมน์เดิม", null, null, null, null, null, null],
  ["3", "เปิด Extensions > Apps Script แล้ววางโค้ดจากไฟล์ apps-script/late-check-system.gs", null, null, null, null, null, null],
  ["4", "รัน setupLateSystem() หนึ่งครั้งเพื่อสร้าง trigger และตรวจหัวตาราง", null, null, null, null, null, null],
  ["5", "สร้าง/ผูก Google Form ให้กรอกรหัสนักเรียน และให้เลือกเหตุผล/ผู้บันทึกจาก Settings", null, null, null, null, null, null],
  ["6", "ข้อมูลที่ส่งจาก Form จะเข้า Late_Transactions แบบ enriched อัตโนมัติ", null, null, null, null, null, null],
  ["7", "Dashboard และ Summary จะอัปเดตตาม transaction ที่เพิ่มขึ้นเรื่อย ๆ", null, null, null, null, null, null],
  ["8", "เชื่อม Looker Studio กับชีต Late_Transactions และกรอง status = Recorded", null, null, null, null, null, null],
  ["หมายเหตุ", "แถวตัวอย่างใน Late_Transactions ลบได้หลังทดสอบระบบ", null, null, null, null, null, null],
];
styleBody(start.getRange("A5:H13"));
start.getRange("A5:A13").format.horizontalAlignment = "center";
start.getRange("B5:B13").format.wrapText = true;
setWidths(start, { A: 80, B: 640, C: 30, D: 30, E: 30, F: 30, G: 30, H: 30 });
start.freezePanes.freezeRows(4);

const settings = sheet("Settings");
setTitle(settings, "A1:H1", "Settings", "แก้รายการห้อง/เหตุผล/ครูได้จากชีตนี้ Dashboard และ Google Form จะดึงรายการไปใช้");
settings.getRange("A4:C4").values = [["Rooms", "Reasons", "Teachers"]];
styleHeader(settings.getRange("A4:C4"));
const rooms = ["ม.1/1", "ม.1/2", "ม.2/1", "ม.2/2", "ม.3/1", "ม.3/2", "ม.4/1", "ม.4/2", "ม.5/1", "ม.5/2", "ม.6/1", "ม.6/2"];
const reasons = [
  "ตื่นสาย",
  "รถติด",
  "ฝนตก",
  "ป่วย/ไม่สบาย",
  "ภารกิจครอบครัว",
  "ภารกิจส่วนตัว",
  "ลืมสัมภาระ",
  "บ้านไกล",
  "อื่น ๆ",
];
const teachers = [
  "นางสาวปัทมพร แสงศรี",
  "นางสาวทิพย์รัตน์ อาจนะชัย",
  "นายคมสัน เกตุโต",
  "นางสาวประภัสสร ชูวัฒนา",
  "นางสาวดวงพร เวียงนนท์",
  "นายอานันท์ชัย มณีโชติ",
  "นายเอกลักษณ์ พุ่มโต",
  "นางสาวณันดา นาคอ่วม",
  "นางสาวกนกวรรณ เติมเพ็ชร",
];
const maxSettingsRows = 20;
settings.getRange(`A5:C${4 + maxSettingsRows}`).values = Array.from({ length: maxSettingsRows }, (_, i) => [
  rooms[i] ?? "",
  reasons[i] ?? "",
  teachers[i] ?? "",
]);
styleBody(settings.getRange(`A5:C${4 + maxSettingsRows}`));
setWidths(settings, { A: 140, B: 180, C: 180 });
settings.freezePanes.freezeRows(4);

const students = sheet("Students");
const studentHeaders = [
  "student_id",
  "student_no",
  "prefix",
  "first_name",
  "last_name",
  "full_name",
  "grade",
  "room",
  "homeroom_teacher",
  "status",
  "card_code",
  "notes",
];
students.getRange("A1:L1").values = [studentHeaders];
styleHeader(students.getRange("A1:L1"));
const sampleStudents = [
  ["66001", "1", "ด.ช.", "กิตติ", "ใจดี", "ด.ช.กิตติ ใจดี", "ม.1", "ม.1/1", "ครูอร", "Active", "CARD66001", ""],
  ["66002", "2", "ด.ญ.", "ปวีณา", "สุขใจ", "ด.ญ.ปวีณา สุขใจ", "ม.1", "ม.1/1", "ครูอร", "Active", "CARD66002", ""],
  ["66003", "3", "ด.ช.", "ธนกร", "ตั้งใจ", "ด.ช.ธนกร ตั้งใจ", "ม.1", "ม.1/2", "ครูพิม", "Active", "CARD66003", ""],
  ["66004", "4", "ด.ญ.", "วรัญญา", "แสงดี", "ด.ญ.วรัญญา แสงดี", "ม.1", "ม.1/2", "ครูพิม", "Active", "CARD66004", ""],
  ["65001", "1", "ด.ช.", "ภาคิน", "มั่นคง", "ด.ช.ภาคิน มั่นคง", "ม.2", "ม.2/1", "ครูเมย์", "Active", "CARD65001", ""],
  ["65002", "2", "ด.ญ.", "นันท์นภัส", "เรียนดี", "ด.ญ.นันท์นภัส เรียนดี", "ม.2", "ม.2/1", "ครูเมย์", "Active", "CARD65002", ""],
  ["65003", "3", "ด.ช.", "ชยพล", "เพียรดี", "ด.ช.ชยพล เพียรดี", "ม.2", "ม.2/2", "ครูบอย", "Active", "CARD65003", ""],
  ["65004", "4", "ด.ญ.", "สุชาดา", "สว่าง", "ด.ญ.สุชาดา สว่าง", "ม.2", "ม.2/2", "ครูบอย", "Active", "CARD65004", ""],
  ["64001", "1", "นาย", "ปรเมศวร์", "ตั้งตรง", "นายปรเมศวร์ ตั้งตรง", "ม.3", "ม.3/1", "ครูฝน", "Active", "CARD64001", ""],
  ["64002", "2", "น.ส.", "รินรดา", "อ่อนโยน", "น.ส.รินรดา อ่อนโยน", "ม.3", "ม.3/1", "ครูฝน", "Active", "CARD64002", ""],
  ["64003", "3", "นาย", "ณัฐวุฒิ", "สดใส", "นายณัฐวุฒิ สดใส", "ม.3", "ม.3/2", "ครูตาล", "Active", "CARD64003", ""],
  ["64004", "4", "น.ส.", "พิชชาภา", "ใฝ่รู้", "น.ส.พิชชาภา ใฝ่รู้", "ม.3", "ม.3/2", "ครูตาล", "Active", "CARD64004", ""],
];
students.getRange(`A2:L${1 + sampleStudents.length}`).values = sampleStudents;
styleBody(students.getRange("A2:L1001"));
students.getRange("J2:J1001").dataValidation = {
  allowBlank: true,
  list: { inCellDropDown: true, source: ["Active", "Transferred", "Inactive"] },
};
students.freezePanes.freezeRows(1);
setWidths(students, {
  A: 110,
  B: 85,
  C: 80,
  D: 120,
  E: 140,
  F: 210,
  G: 80,
  H: 90,
  I: 150,
  J: 110,
  K: 130,
  L: 180,
});
addTable(students, "A1:L1001", "StudentsTable");

const tx = sheet("Late_Transactions");
const txHeaders = [
  "transaction_id",
  "submitted_at",
  "late_date",
  "time_in",
  "student_id",
  "full_name",
  "grade",
  "room",
  "reason",
  "recorder",
  "status",
  "duplicate_key",
  "source_sheet",
  "raw_row",
  "notes",
];
tx.getRange("A1:O1").values = [txHeaders];
styleHeader(tx.getRange("A1:O1"));
const sampleTx = [
  ["TX-001", new Date(2026, 4, 20, 7, 53), new Date(2026, 4, 20), "07:53", "66001", "ด.ช.กิตติ ใจดี", "ม.1", "ม.1/1", "รถติด", "ครูเวรเช้า", "Recorded", "2026-05-20|66001", "Sample", 2, "ตัวอย่าง ลบได้"],
  ["TX-002", new Date(2026, 4, 20, 8, 4), new Date(2026, 4, 20), "08:04", "65001", "ด.ช.ภาคิน มั่นคง", "ม.2", "ม.2/1", "ตื่นสาย", "ครูเวรเช้า", "Recorded", "2026-05-20|65001", "Sample", 3, "ตัวอย่าง ลบได้"],
  ["TX-003", new Date(2026, 4, 21, 7, 58), new Date(2026, 4, 21), "07:58", "66002", "ด.ญ.ปวีณา สุขใจ", "ม.1", "ม.1/1", "ฝนตก", "ครูเวรเช้า", "Recorded", "2026-05-21|66002", "Sample", 4, "ตัวอย่าง ลบได้"],
  ["TX-004", new Date(2026, 4, 21, 8, 6), new Date(2026, 4, 21), "08:06", "65003", "ด.ช.ชยพล เพียรดี", "ม.2", "ม.2/2", "รถติด", "ครูเวรเช้า", "Recorded", "2026-05-21|65003", "Sample", 5, "ตัวอย่าง ลบได้"],
  ["TX-005", new Date(2026, 4, 22, 7, 51), new Date(2026, 4, 22), "07:51", "64001", "นายปรเมศวร์ ตั้งตรง", "ม.3", "ม.3/1", "ภารกิจครอบครัว", "ครูเวรเช้า", "Recorded", "2026-05-22|64001", "Sample", 6, "ตัวอย่าง ลบได้"],
  ["TX-006", new Date(2026, 4, 22, 8, 2), new Date(2026, 4, 22), "08:02", "66001", "ด.ช.กิตติ ใจดี", "ม.1", "ม.1/1", "รถติด", "ครูเวรเช้า", "Recorded", "2026-05-22|66001", "Sample", 7, "ตัวอย่าง ลบได้"],
  ["TX-007", new Date(2026, 4, 23, 7, 59), new Date(2026, 4, 23), "07:59", "64003", "นายณัฐวุฒิ สดใส", "ม.3", "ม.3/2", "ตื่นสาย", "ครูเวรเช้า", "Recorded", "2026-05-23|64003", "Sample", 8, "ตัวอย่าง ลบได้"],
  ["TX-008", new Date(2026, 4, 23, 8, 7), new Date(2026, 4, 23), "08:07", "65002", "ด.ญ.นันท์นภัส เรียนดี", "ม.2", "ม.2/1", "อื่น ๆ", "ครูเวรเช้า", "Recorded", "2026-05-23|65002", "Sample", 9, "ตัวอย่าง ลบได้"],
  ["TX-009", new Date(2026, 4, 24, 7, 56), new Date(2026, 4, 24), "07:56", "66001", "ด.ช.กิตติ ใจดี", "ม.1", "ม.1/1", "รถติด", "ครูเวรเช้า", "Recorded", "2026-05-24|66001", "Sample", 10, "ตัวอย่าง ลบได้"],
  ["TX-010", new Date(2026, 4, 24, 8, 1), new Date(2026, 4, 24), "08:01", "99999", "", "", "", "อื่น ๆ", "ครูเวรเช้า", "Student not found", "2026-05-24|99999", "Sample", 11, "ตัวอย่าง student_id ไม่พบ"],
  ["TX-011", new Date(2026, 4, 25, 8, 3), new Date(2026, 4, 25), "08:03", "66001", "ด.ช.กิตติ ใจดี", "ม.1", "ม.1/1", "รถติด", "ครูเวรเช้า", "Recorded", "2026-05-25|66001", "Sample", 12, "ตัวอย่าง ลบได้"],
  ["TX-012", new Date(2026, 4, 25, 8, 5), new Date(2026, 4, 25), "08:05", "66001", "ด.ช.กิตติ ใจดี", "ม.1", "ม.1/1", "รถติด", "ครูเวรเช้า", "Duplicate", "2026-05-25|66001", "Sample", 13, "ตัวอย่างซ้ำ ไม่นับใน Dashboard"],
];
tx.getRange(`A2:O${1 + sampleTx.length}`).values = sampleTx;
styleBody(tx.getRange("A2:O2001"));
tx.getRange("B2:C2001").format.numberFormat = "yyyy-mm-dd hh:mm";
tx.getRange("C2:C2001").format.numberFormat = "yyyy-mm-dd";
tx.getRange("N2:N2001").format.numberFormat = "0";
tx.getRange("K2:K2001").dataValidation = {
  allowBlank: true,
  list: { inCellDropDown: true, source: ["Recorded", "Duplicate", "Student not found"] },
};
tx.freezePanes.freezeRows(1);
setWidths(tx, {
  A: 120,
  B: 150,
  C: 110,
  D: 80,
  E: 110,
  F: 210,
  G: 80,
  H: 90,
  I: 150,
  J: 130,
  K: 130,
  L: 160,
  M: 110,
  N: 80,
  O: 180,
});
addTable(tx, "A1:O2001", "LateTransactionsTable");

const studentSummary = sheet("Student_Summary");
studentSummary.getRange("A1:G1").values = [["student_id", "full_name", "grade", "room", "late_count", "last_late_date", "risk"]];
styleHeader(studentSummary.getRange("A1:G1"));
const rows = 1000;
const formulas = [];
for (let i = 2; i <= rows + 1; i += 1) {
  formulas.push([
    `=IF(Students!A${i}="","",Students!A${i})`,
    `=IF(A${i}="","",Students!F${i})`,
    `=IF(A${i}="","",Students!G${i})`,
    `=IF(A${i}="","",Students!H${i})`,
    `=IF(A${i}="","",COUNTIFS(Late_Transactions!E:E,A${i},Late_Transactions!K:K,"Recorded"))`,
    `=IFERROR(MAXIFS(Late_Transactions!C:C,Late_Transactions!E:E,A${i},Late_Transactions!K:K,"Recorded"),"")`,
    `=IF(E${i}="","",IF(E${i}>=5,"High",IF(E${i}>=3,"Watch","OK")))`,
  ]);
}
studentSummary.getRange(`A2:G${rows + 1}`).formulas = formulas;
styleBody(studentSummary.getRange(`A2:G${rows + 1}`));
studentSummary.getRange(`F2:F${rows + 1}`).format.numberFormat = "yyyy-mm-dd";
studentSummary.getRange(`E2:E${rows + 1}`).format.numberFormat = "0";
studentSummary.getRange(`G2:G${rows + 1}`).conditionalFormats.add("containsText", {
  text: "High",
  format: { fill: palette.red, font: { color: "#991B1B", bold: true } },
});
studentSummary.getRange(`G2:G${rows + 1}`).conditionalFormats.add("containsText", {
  text: "Watch",
  format: { fill: palette.yellow, font: { color: "#92400E", bold: true } },
});
studentSummary.getRange(`G2:G${rows + 1}`).conditionalFormats.add("containsText", {
  text: "OK",
  format: { fill: palette.green, font: { color: "#166534", bold: true } },
});
studentSummary.freezePanes.freezeRows(1);
setWidths(studentSummary, { A: 110, B: 210, C: 80, D: 90, E: 100, F: 120, G: 100 });
addTable(studentSummary, "A1:G1001", "StudentSummaryTable");

const daily = sheet("Daily_Summary");
daily.getRange("A1:E1").values = [["date", "recorded_late", "duplicate", "student_not_found", "total_submissions"]];
styleHeader(daily.getRange("A1:E1"));
const dailyFormulas = [];
for (let i = 2; i <= 61; i += 1) {
  if (i === 2) {
    dailyFormulas.push(["=TODAY()-59", '=COUNTIFS(Late_Transactions!C:C,A2,Late_Transactions!K:K,"Recorded")', '=COUNTIFS(Late_Transactions!C:C,A2,Late_Transactions!K:K,"Duplicate")', '=COUNTIFS(Late_Transactions!C:C,A2,Late_Transactions!K:K,"Student not found")', "=SUM(B2:D2)"]);
  } else {
    dailyFormulas.push([`=A${i - 1}+1`, `=COUNTIFS(Late_Transactions!C:C,A${i},Late_Transactions!K:K,"Recorded")`, `=COUNTIFS(Late_Transactions!C:C,A${i},Late_Transactions!K:K,"Duplicate")`, `=COUNTIFS(Late_Transactions!C:C,A${i},Late_Transactions!K:K,"Student not found")`, `=SUM(B${i}:D${i})`]);
  }
}
daily.getRange("A2:E61").formulas = dailyFormulas;
styleBody(daily.getRange("A2:E61"));
daily.getRange("A2:A61").format.numberFormat = "yyyy-mm-dd";
daily.getRange("B2:E61").format.numberFormat = "0";
daily.freezePanes.freezeRows(1);
setWidths(daily, { A: 120, B: 120, C: 100, D: 140, E: 130 });
addTable(daily, "A1:E61", "DailySummaryTable");

const dash = sheet("Dashboard");
dash.getRange("A1:I1").values = [["Late Student Dashboard", null, null, null, null, null, null, null, null]];
dash.getRange("A1:I1").format = {
  fill: palette.navy,
  font: { color: palette.white, bold: true, size: 18 },
  verticalAlignment: "center",
};
dash.getRange("A2:I2").values = [["Transaction เพิ่มได้เรื่อย ๆ กราฟและตัวเลขนับจาก Late_Transactions เฉพาะ status = Recorded", null, null, null, null, null, null, null, null]];
dash.getRange("A2:I2").format = { fill: palette.lightBlue, font: { color: palette.text, size: 10, italic: true } };
dash.getRange("A4:B5").values = [["Recorded ทั้งหมด", null], [null, null]];
dash.getRange("D4:E5").values = [["วันนี้", null], [null, null]];
dash.getRange("G4:H5").values = [["เดือนนี้", null], [null, null]];
dash.getRange("J4:K5").values = [["นักเรียนไม่ซ้ำ", null], [null, null]];
dash.getRange("A5").formulas = [['=COUNTIF(Late_Transactions!K:K,"Recorded")']];
dash.getRange("D5").formulas = [['=COUNTIFS(Late_Transactions!C:C,TODAY(),Late_Transactions!K:K,"Recorded")']];
dash.getRange("G5").formulas = [['=COUNTIFS(Late_Transactions!C:C,">="&EOMONTH(TODAY(),-1)+1,Late_Transactions!C:C,"<="&EOMONTH(TODAY(),0),Late_Transactions!K:K,"Recorded")']];
dash.getRange("J5").formulas = [['=IFERROR(COUNTA(UNIQUE(FILTER(Late_Transactions!E2:E2001,Late_Transactions!K2:K2001="Recorded"))),0)']];
for (const card of ["A4:B5", "D4:E5", "G4:H5", "J4:K5"]) {
  dash.getRange(card).format = {
    fill: palette.white,
    font: { color: palette.text, bold: true, size: 10 },
    borders: { preset: "outside", style: "thin", color: palette.border },
    verticalAlignment: "center",
  };
  dash.getRange(card).getRow(1).format.font = { color: palette.blue, bold: true, size: 20 };
}

dash.getRange("A8:B8").values = [["14 วันล่าสุด", "จำนวน"]];
styleHeader(dash.getRange("A8:B8"));
const trendFormulas = [];
for (let i = 9; i <= 22; i += 1) {
  if (i === 9) {
    trendFormulas.push(["=TODAY()-13", '=COUNTIFS(Late_Transactions!C:C,A9,Late_Transactions!K:K,"Recorded")']);
  } else {
    trendFormulas.push([`=A${i - 1}+1`, `=COUNTIFS(Late_Transactions!C:C,A${i},Late_Transactions!K:K,"Recorded")`]);
  }
}
dash.getRange("A9:B22").formulas = trendFormulas;
styleBody(dash.getRange("A9:B22"));
dash.getRange("A9:A22").format.numberFormat = "yyyy-mm-dd";
dash.getRange("B9:B22").format.numberFormat = "0";

dash.getRange("D8:E8").values = [["ห้อง", "จำนวน"]];
styleHeader(dash.getRange("D8:E8"));
const roomFormulas = [];
for (let i = 9; i <= 28; i += 1) {
  const settingsRow = i - 4;
  roomFormulas.push([`=IF(Settings!A${settingsRow}="","",Settings!A${settingsRow})`, `=IF(D${i}="","",COUNTIFS(Late_Transactions!H:H,D${i},Late_Transactions!K:K,"Recorded"))`]);
}
dash.getRange("D9:E28").formulas = roomFormulas;
styleBody(dash.getRange("D9:E28"));
dash.getRange("E9:E28").format.numberFormat = "0";

dash.getRange("G8:H8").values = [["เหตุผล", "จำนวน"]];
styleHeader(dash.getRange("G8:H8"));
const reasonFormulas = [];
for (let i = 9; i <= 18; i += 1) {
  const settingsRow = i - 4;
  reasonFormulas.push([`=IF(Settings!B${settingsRow}="","",Settings!B${settingsRow})`, `=IF(G${i}="","",COUNTIFS(Late_Transactions!I:I,G${i},Late_Transactions!K:K,"Recorded"))`]);
}
dash.getRange("G9:H18").formulas = reasonFormulas;
styleBody(dash.getRange("G9:H18"));
dash.getRange("H9:H18").format.numberFormat = "0";

dash.getRange("A25:G25").values = [["จำนวนครั้งรายนักเรียน", null, null, null, null, null, null]];
dash.getRange("A26:G26").values = [["student_id", "full_name", "grade", "room", "late_count", "last_late_date", "risk"]];
styleHeader(dash.getRange("A26:G26"));
const watchFormulas = [];
for (let i = 27; i <= 38; i += 1) {
  const sourceRow = i - 25;
  watchFormulas.push([
    `=IF(Student_Summary!A${sourceRow}="","",Student_Summary!A${sourceRow})`,
    `=IF(Student_Summary!A${sourceRow}="","",Student_Summary!B${sourceRow})`,
    `=IF(Student_Summary!A${sourceRow}="","",Student_Summary!C${sourceRow})`,
    `=IF(Student_Summary!A${sourceRow}="","",Student_Summary!D${sourceRow})`,
    `=IF(Student_Summary!A${sourceRow}="","",Student_Summary!E${sourceRow})`,
    `=IF(Student_Summary!A${sourceRow}="","",Student_Summary!F${sourceRow})`,
    `=IF(Student_Summary!A${sourceRow}="","",Student_Summary!G${sourceRow})`,
  ]);
}
dash.getRange("A27:G38").formulas = watchFormulas;
styleBody(dash.getRange("A27:G38"));
dash.getRange("F27:F38").format.numberFormat = "yyyy-mm-dd";
dash.getRange("E27:E38").format.numberFormat = "0";
dash.getRange("A25:G25").format = {
  fill: palette.lightBlue,
  font: { color: palette.navy, bold: true, size: 12 },
};
dash.freezePanes.freezeRows(2);
setWidths(dash, {
  A: 120,
  B: 90,
  C: 24,
  D: 100,
  E: 90,
  F: 24,
  G: 160,
  H: 90,
  I: 24,
  J: 140,
  K: 120,
  L: 24,
  M: 160,
  N: 160,
  O: 160,
});

try {
  const trendChart = dash.charts.add("Line", dash.getRange("A8:B22"), "Auto");
  trendChart.title.text = "แนวโน้มมาสาย 14 วันล่าสุด";
  trendChart.setPosition(dash.getRange("J8:O21"));
  trendChart.width = 560;
  trendChart.height = 260;

  const roomChart = dash.charts.add("ColumnClustered", dash.getRange("D8:E28"), "Auto");
  roomChart.title.text = "จำนวนมาสายแยกตามห้อง";
  roomChart.setPosition(dash.getRange("J23:O38"));
  roomChart.width = 560;
  roomChart.height = 300;
} catch (error) {
  console.warn(`Chart creation skipped: ${error.message}`);
}

const looker = sheet("Looker_Config");
setTitle(looker, "A1:H1", "Looker Studio Setup", "ต่อ Looker Studio กับ Late_Transactions แล้วใช้ status = Recorded เป็น filter หลัก");
looker.getRange("A4:D4").values = [["Chart", "Dimension", "Metric", "Filter"]];
styleHeader(looker.getRange("A4:D4"));
looker.getRange("A5:D12").values = [
  ["Scorecard: มาสายทั้งหมด", "-", "COUNT(transaction_id)", "status = Recorded"],
  ["Scorecard: วันนี้", "late_date", "COUNT(transaction_id)", "late_date = Today AND status = Recorded"],
  ["Time series", "late_date", "COUNT(transaction_id)", "status = Recorded"],
  ["Bar chart: ห้อง", "room", "COUNT(transaction_id)", "status = Recorded"],
  ["Bar chart: Top นักเรียน", "full_name", "COUNT(transaction_id)", "status = Recorded"],
  ["Pie/Bar: เหตุผล", "reason", "COUNT(transaction_id)", "status = Recorded"],
  ["Table: รายการล่าสุด", "submitted_at, student_id, full_name, room, reason", "Record count", "status = Recorded"],
  ["Control", "late_date / room / grade", "-", "ใช้เป็น date range และ filter"],
];
styleBody(looker.getRange("A5:D12"));
setWidths(looker, { A: 210, B: 260, C: 180, D: 260 });
looker.freezePanes.freezeRows(4);

for (const ws of workbook.worksheets.items) {
  try {
    ws.showGridlines = false;
  } catch {
    // Optional visual property, ignored if the runtime does not support it.
  }
}

const dashboardPreview = await workbook.inspect({
  kind: "table",
  range: "Dashboard!A1:K15",
  include: "values,formulas",
  tableMaxRows: 15,
  tableMaxCols: 11,
});
console.log(dashboardPreview.ndjson);

const formulaErrors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(formulaErrors.ndjson);

for (const [name, range] of [
  ["Dashboard", "A1:O38"],
  ["Students", "A1:L18"],
  ["Late_Transactions", "A1:O16"],
  ["Student_Summary", "A1:G18"],
  ["Daily_Summary", "A1:E20"],
]) {
  try {
    await workbook.render({ sheetName: name, range, scale: 1 });
    console.log(`Rendered ${name}!${range}`);
  } catch (error) {
    console.warn(`Render warning for ${name}: ${error.message}`);
  }
}

await fs.mkdir(outputDir, { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(`Saved ${outputPath}`);
