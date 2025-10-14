// Generate and persist a unique device ID
export function getDeviceId(): string {
  const DEVICE_ID_KEY = 'neurulae-device-id';
  
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = `device-${crypto.randomUUID()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}
