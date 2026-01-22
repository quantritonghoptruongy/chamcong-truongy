// src/data/employeeDirectory.ts
// Danh sách nhân viên để hiển thị trên trang Feedback (ai quét QR cũng thấy)
// Bạn cập nhật theo file Excel KHCN_QR_List-KHCN.xlsx

export type EmployeeDirectoryItem = {
  employeeId: string;     // ví dụ: KHCN-0001
  employeeName: string;   // ví dụ: Hoàng Thị Phương
};

export const EMPLOYEE_DIRECTORY: EmployeeDirectoryItem[] = [
  { employeeId: "KHCN-0001", employeeName: "Hoàng Thị Phương" },
  { employeeId: "KHCN-0002", employeeName: "Hoàng Thị Cẩm Chương" },
  { employeeId: "KHCN-0003", employeeName: "Tại Thị Thanh Huyền" },
  { employeeId: "KHCN-0004", employeeName: "Lê Đình Bảo Châu" },
  { employeeId: "KHCN-0005", employeeName: "Lại Thanh Ngoan" },
  { employeeId: "KHCN-0006", employeeName: "Đỗ Quốc Vũ" },
  { employeeId: "KHCN-0007", employeeName: "Nguyễn Thị Thu Thảo" },
  { employeeId: "KHCN-0008", employeeName: "Nguyễn Thị Thương" },
  { employeeId: "KHCN-0009", employeeName: "Nguyễn Ngọc Hải" },
  { employeeId: "KHCN-0010", employeeName: "Trần Thịnh" },
  { employeeId: "KHCN-0011", employeeName: "Ngọc Trâm" },
  { employeeId: "KHCN-0012", employeeName: "Trâm Anh" },
];

export const EMPLOYEE_MAP: Record<string, string> = EMPLOYEE_DIRECTORY.reduce(
  (acc, item) => {
    acc[item.employeeId] = item.employeeName;
    return acc;
  },
  {} as Record<string, string>
);
