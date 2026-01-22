// src/pages/Feedback.tsx
import React, { useEffect, useMemo, useState } from "react";
import { getPublicIP } from "../services/networkService";
import { logFeedback } from "../services/attendanceService";
import { EMPLOYEE_DIRECTORY, EMPLOYEE_MAP } from "../data/employeeDirectory";

type Scope = "GENERAL" | "EMPLOYEE";

const FeedbackPage: React.FC = () => {
  const [scope, setScope] = useState<Scope>("GENERAL");
  const [employeeId, setEmployeeId] = useState<string>("");
  const [employeeName, setEmployeeName] = useState<string>("");
  const [rating, setRating] = useState<number>(0); // 1-5
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string>("");

  // Danh sách cố định trong code để ai quét QR cũng thấy
  const employees = useMemo(() => EMPLOYEE_DIRECTORY, []);

  // Nếu QR có emp=KHCN-0001 thì preselect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emp = params.get("emp"); // KHCN-0001...
    if (emp) {
      setScope("EMPLOYEE");
      setEmployeeId(emp);
      setEmployeeName(EMPLOYEE_MAP[emp] || "");
    }
  }, []);

  useEffect(() => {
    if (scope === "GENERAL") {
      setEmployeeId("");
      setEmployeeName("");
    }
  }, [scope]);

  const selectRating = (v: number) => setRating(v);

  const handleSubmit = async () => {
    setDone("");

    if (!rating || rating < 1 || rating > 5) {
      setDone("Vui lòng chọn mức đánh giá (1–5).");
      return;
    }

    if (scope === "EMPLOYEE" && !employeeId) {
      setDone("Bạn đang chọn đánh giá theo nhân viên, vui lòng chọn nhân viên.");
      return;
    }

    setSubmitting(true);
    try {
      const ip = await getPublicIP().catch(() => "");

      const empName =
        employeeName ||
        (employeeId ? EMPLOYEE_MAP[employeeId] || "" : "");

      const ok = await logFeedback({
        rating,
        scope,
        employeeId: scope === "EMPLOYEE" ? employeeId : "",
        employeeName: scope === "EMPLOYEE" ? empName : "",
        comment: comment || "",
        ip,
        userAgent: navigator.userAgent,
        source: "QR",
      });

      if (ok) {
        setDone("✅ Cảm ơn bạn! Đánh giá đã được ghi nhận.");
        setRating(0);
        setComment("");
        setScope("GENERAL");
      } else {
        setDone("❌ Không gửi được đánh giá. Vui lòng thử lại.");
      }
    } catch (e) {
      setDone("❌ Có lỗi khi gửi đánh giá. Vui lòng thử lại.");
      // eslint-disable-next-line no-console
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800">Đánh giá chất lượng phục vụ</h2>
        <p className="text-sm text-gray-500 mt-1">
          Đánh giá ẩn danh. Bạn có thể chọn <b>đánh giá chung</b> hoặc <b>theo nhân viên</b> (tùy chọn).
        </p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
            Loại đánh giá
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setScope("GENERAL")}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                scope === "GENERAL"
                  ? "border-brand-600 text-brand-600 bg-brand-50"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              Đánh giá chung
            </button>
            <button
              onClick={() => setScope("EMPLOYEE")}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                scope === "EMPLOYEE"
                  ? "border-brand-600 text-brand-600 bg-brand-50"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              Theo nhân viên (tùy chọn)
            </button>
          </div>
        </div>

        {scope === "EMPLOYEE" && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
              Chọn nhân viên
            </label>

            <select
              value={employeeId}
              onChange={(e) => {
                const id = e.target.value;
                setEmployeeId(id);
                setEmployeeName(EMPLOYEE_MAP[id] || "");
              }}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- Chọn nhân viên --</option>
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeName} ({emp.employeeId})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
            Mức hài lòng
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                onClick={() => selectRating(v)}
                className={`py-3 rounded-lg border text-sm font-bold ${
                  rating === v
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            1 = không hài lòng, 5 = rất hài lòng
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">
            Góp ý (tùy chọn)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="Ví dụ: thái độ phục vụ, thời gian xử lý, hướng dẫn thủ tục..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-brand-600 text-white font-semibold disabled:opacity-50"
        >
          {submitting ? "Đang gửi..." : "Gửi đánh giá"}
        </button>

        {done && (
          <div className="text-sm mt-2 text-gray-700 bg-gray-50 border border-gray-100 rounded-lg p-3">
            {done}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
