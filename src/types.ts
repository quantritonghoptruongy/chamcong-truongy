export interface Employee {
  id: string;
  name: string;
  position: string;
  avatar: string; // Base64 image (nếu vẫn dùng)
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timestamp: number;
  type: 'CHECK_IN' | 'CHECK_OUT';
  confidence: number;
  status: 'SUCCESS' | 'FAILED';
  snapshot: string;
}

export type ViewState = 'DASHBOARD' | 'HISTORY' | 'ENROLL' | 'ADMIN' | 'FEEDBACK';

export enum VerificationResult {
  MATCH = 'MATCH',
  NO_MATCH = 'NO_MATCH',
  ERROR = 'ERROR'
}
