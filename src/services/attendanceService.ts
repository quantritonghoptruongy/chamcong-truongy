// src/services/attendanceService.ts

export interface AttendanceLog {
  timestamp?: string;
  employeeId: string;
  employeeName: string;
  status: string;
  note?: string;
  ip?: string;
}

export interface FeedbackLog {
  timestamp?: string;
  rating: number; // 1-5
  scope: "GENERAL" | "EMPLOYEE";
  employeeId?: string;
  employeeName?: string;
  comment?: string;
  ip?: string;
  userAgent?: string;
  source?: string; // "QR"
}

const API_URL = process.env.ATTENDANCE_API_URL || "";

if (!API_URL) {
  console.warn("ATTENDANCE_API_URL chưa được cấu hình trong .env / Vercel Env.");
}

function toFormBody(obj: Record<string, any>): string {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    p.append(k, String(v));
  });
  return p.toString();
}

/** Gửi 1 bản ghi chấm công lên Google Sheet (sheet Logs) */
export async function logAttendance(log: AttendanceLog): Promise<boolean> {
  if (!API_URL) return false;

  try {
    // 1. Thử gọi qua Proxy (Ưu tiên Production)
    const res = await fetch('/api/log', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "attendance",
        employeeId: log.employeeId,
        employeeName: log.employeeName,
        status: log.status,
        note: log.note || "",
        ip: log.ip || ""
      })
    });

    if (res.status === 404) throw new Error("Proxy 404");
    return res.ok;

  } catch (proxyErr) {
    console.warn("⚠️ Proxy log failed, falling back to Direct Call...", proxyErr);
    // 2. Fallback: Gọi trực tiếp Google Apps Script (cho Localhost)
    return await logAttendanceDirect(log);
  }
}

async function logAttendanceDirect(log: AttendanceLog): Promise<boolean> {
  const body = toFormBody({
    kind: "attendance",
    employeeId: log.employeeId,
    employeeName: log.employeeName,
    status: log.status,
    note: log.note || "",
    ip: log.ip || ""
  });

  try {
    // @ts-ignore
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors", // Quan trọng: Bỏ qua kiểm tra CORS để đảm bảo request được gửi đi
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });
    console.log("✅ Sent direct log request (Fire & Forget)");
    return true;
  } catch (e) {
    console.error("Direct log failed:", e);
    return false;
  }
}

/** Lấy toàn bộ lịch sử chấm công (Admin) */
export async function fetchAllAttendance(): Promise<any[]> {
  if (!API_URL) return [];

  try {
    const url = API_URL.includes("?")
      ? `${API_URL}&kind=attendance`
      : `${API_URL}?kind=attendance`;

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("fetchAllAttendance error:", err);
    return [];
  }
}

/** Gửi 1 feedback lên Google Sheet (sheet Feedback) */
export async function logFeedback(log: FeedbackLog): Promise<boolean> {
  if (!API_URL) return false;

  try {
    const body = toFormBody({
      kind: "feedback",
      rating: log.rating,
      scope: log.scope,
      employeeId: log.employeeId || "",
      employeeName: log.employeeName || "",
      comment: log.comment || "",
      ip: log.ip || "",
      userAgent: log.userAgent || "",
      source: log.source || "QR"
    });

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body
    });

    return res.ok;
  } catch (err) {
    console.error("logFeedback error:", err);
    return false;
  }
}

/** Lấy toàn bộ feedback (Admin) */
export async function fetchAllFeedback(): Promise<any[]> {
  if (!API_URL) return [];

  try {
    const url = API_URL.includes("?")
      ? `${API_URL}&kind=feedback`
      : `${API_URL}?kind=feedback`;

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("fetchAllFeedback error:", err);
    return [];
  }
}
