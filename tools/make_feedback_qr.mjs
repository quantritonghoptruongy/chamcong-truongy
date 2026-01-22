import QRCode from "qrcode";
import fs from "fs";

const url = "https://khcn-attendance.vercel.app/?mode=feedback";

const out = "feedback_qr.png";
const buf = await QRCode.toBuffer(url, { width: 800, margin: 2 });

fs.writeFileSync(out, buf);
console.log("QR created:", out);
