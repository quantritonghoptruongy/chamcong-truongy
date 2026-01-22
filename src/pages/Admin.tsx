import React, { useMemo, useState } from 'react';
import { AttendanceLog, FeedbackLog } from '../types';
import { fetchAllAttendance, fetchAllFeedback } from '../services/attendanceService';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KHCN2025!';

function formatHanoi(ts: any) {
  try {
    const d = ts instanceof Date ? ts : new Date(ts);
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  } catch {
    return String(ts);
  }
}

const AdminPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  
  // Config state
  const [enableFace, setEnableFace] = useState(false);

  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [feedback, setFeedback] = useState<FeedbackLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const feedbackSummary = useMemo(() => {
    const map = new Map<string, { count: number; sum: number }>();
    feedback.forEach((f) => {
      const key = f.employeeId;
      const cur = map.get(key) || { count: 0, sum: 0 };
      map.set(key, { count: cur.count + 1, sum: cur.sum + (Number(f.rating) || 0) });
    });
    return Array.from(map.entries())
      .map(([employeeId, v]) => ({
        employeeId,
        count: v.count,
        avg: v.count ? v.sum / v.count : 0,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [feedback]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError(null);
      // Load config on login success
      const current = localStorage.getItem('ENABLE_FACE_ATTENDANCE') === 'true';
      setEnableFace(current);
    } else {
      setError('Mật khẩu admin không đúng.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, f] = await Promise.all([fetchAllAttendance(), fetchAllFeedback()]);
      setAttendance(a);
      setFeedback(f);
    } catch (e: any) {
      setError(e?.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div style={{ maxWidth: 420, margin: '40px auto' }}>
        <h2>Đăng nhập Admin</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <label>Mật khẩu admin:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: 10, marginTop: 6 }}
            />
          </div>
          {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
          <button type="submit" style={{ padding: '10px 16px' }}>
            Đăng nhập
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Admin – Chấm công & Feedback</h2>

      <button onClick={loadData} style={{ marginBottom: 16, padding: '10px 16px' }}>
        Tải dữ liệu
      </button>

      <div style={{ marginBottom: 20, padding: 12, border: '1px solid #ccc', borderRadius: 8, background: '#fafafa' }}>
        <h3>Cấu hình hệ thống (trên thiết bị này)</h3>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
          <input
            type="checkbox"
            checked={enableFace}
            onChange={(e) => {
              const newVal = e.target.checked;
              setEnableFace(newVal);
              localStorage.setItem('ENABLE_FACE_ATTENDANCE', String(newVal));
            }}
          />
          <strong>Bật tính năng Chấm công Khuôn mặt</strong>
        </label>
        <p style={{ margin: '4px 0 0 24px', fontSize: '0.85em', color: '#666' }}>
          Khi bật, nhân viên sẽ cần chụp ảnh để xác thực (Wifi vẫn được kiểm tra). Khi tắt, chỉ check Wifi.
        </p>
      </div>

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3 style={{ marginTop: 18 }}>A) Lịch sử chấm công</h3>
      {attendance.length === 0 && !loading && <p>Chưa có dữ liệu chấm công.</p>}
      {attendance.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 800, background: '#fff' }}>
            <thead style={{ background: '#f2f2f2' }}>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Thời gian (HN)</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Mã NV</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Họ tên</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Trạng thái</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>IP Wifi</th>
                <th style={{ border: '1px solid #ddd', padding: 8 }}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((l, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{formatHanoi((l as any).timestamp)}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{l.employeeId}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{l.employeeName}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{l.status}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{(l as any).ip || ''}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>{l.note || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>B) Feedback khách hàng</h3>
      {feedback.length === 0 && !loading && <p>Chưa có feedback.</p>}

      {feedbackSummary.length > 0 && (
        <>
          <h4>Tóm tắt theo nhân viên</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520, background: '#fff' }}>
              <thead style={{ background: '#f2f2f2' }}>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>Mã NV</th>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>Số lượt</th>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>Điểm TB (1–5)</th>
                </tr>
              </thead>
              <tbody>
                {feedbackSummary.map((r) => (
                  <tr key={r.employeeId}>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.employeeId}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.count}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{r.avg.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 style={{ marginTop: 14 }}>Chi tiết feedback</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 900, background: '#fff' }}>
              <thead style={{ background: '#f2f2f2' }}>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>Thời gian (HN)</th>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>Mã NV</th>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>Điểm</th>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>Góp ý</th>
                  <th style={{ border: '1px solid #ddd', padding: 8 }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {feedback.map((f, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{formatHanoi((f as any).timestamp)}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{f.employeeId}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{f.rating}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{f.comment || ''}</td>
                    <td style={{ border: '1px solid #ddd', padding: 8 }}>{f.ip || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPage;
