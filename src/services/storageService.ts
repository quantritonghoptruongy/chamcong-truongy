import { Employee, AttendanceRecord } from '../types';

const EMP_KEY = 'khcn_employees';
const LOG_KEY = 'khcn_logs';

export const getEmployees = (): Employee[] => {
  try {
    const data = localStorage.getItem(EMP_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveEmployee = (employee: Employee): void => {
  const list = getEmployees();
  list.push(employee);
  localStorage.setItem(EMP_KEY, JSON.stringify(list));
};

export const deleteEmployee = (id: string): void => {
  const list = getEmployees().filter(e => e.id !== id);
  localStorage.setItem(EMP_KEY, JSON.stringify(list));
};

export const getAttendanceLogs = (): AttendanceRecord[] => {
  try {
    const data = localStorage.getItem(LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveAttendanceLog = (log: AttendanceRecord): void => {
  const list = getAttendanceLogs();
  // Keep last 500 logs to prevent storage overflow
  if (list.length > 500) list.shift();
  list.push(log);
  localStorage.setItem(LOG_KEY, JSON.stringify(list));
};