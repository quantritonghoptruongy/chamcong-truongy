
export interface WifiConfig {
  name: string;
  ip: string;
  createdAt: number;
}

const WIFI_KEY = 'khcn_wifi_configs';

// Get public IP using a third-party service
export const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Failed to fetch IP", error);
    throw new Error("Không thể xác định địa chỉ IP mạng.");
  }
};

export const getWifiConfigs = (): WifiConfig[] => {
  try {
    const data = localStorage.getItem(WIFI_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveWifiConfig = (name: string, ip: string): void => {
  const list = getWifiConfigs();
  // Remove existing config with same name or IP to avoid duplicates
  const filtered = list.filter(w => w.name !== name && w.ip !== ip);
  filtered.push({ name, ip, createdAt: Date.now() });
  localStorage.setItem(WIFI_KEY, JSON.stringify(filtered));
};

export const removeWifiConfig = (name: string): void => {
  const list = getWifiConfigs().filter(w => w.name !== name);
  localStorage.setItem(WIFI_KEY, JSON.stringify(list));
};

// Check if current network connection type is likely Wifi (Chrome/Android only feature)
// Note: This is a heuristic, as many browsers don't support this API fully.
export const isWifiConnection = (): boolean => {
  const nav = navigator as any;
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  if (conn) {
    // If we can determine type, and it's cellular, return false. 
    // If it's wifi or unknown (desktop often returns unknown), we permit IP check.
    if (conn.type === 'cellular') return false;
  }
  return true;
};
