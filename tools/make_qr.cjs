const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const QRCode = require("qrcode");

const INPUT = path.join(__dirname, "..", "KHCN_QR_List-KHCN.xlsx"); // đổi tên nếu khác
const OUTDIR = path.join(__dirname, "..", "qr_out");
const BASE = "https://khcn-attendance.vercel.app/feedback";

function encode(str="") {
  return encodeURIComponent(String(str).trim());
}

(async () => {
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR);

  const wb = XLSX.readFile(INPUT);
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  // Bạn chỉnh key theo đúng tên cột trong Excel của bạn:
  // ví dụ: "employeeId", "employeeName"
  for (const r of rows) {
    const empId = r.employeeId || r.empId || r["Mã NV"] || r["ma"] || r["id"];
    const name  = r.employeeName || r.name || r["Họ tên"] || r["ten"];

    if (!empId) continue;

    const url = `${BASE}?empId=${encode(empId)}&name=${encode(name)}`;
    const file = path.join(OUTDIR, `${empId}.png`);

    await QRCode.toFile(file, url, { margin: 1, width: 512 });
    console.log("Created:", file, "->", url);
  }

  console.log("Done. QR saved in:", OUTDIR);
})();
