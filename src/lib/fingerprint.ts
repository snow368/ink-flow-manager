/**
 * 设备指纹采集工具
 * 基于浏览器特征生成唯一设备标识
 * 不依赖任何第三方 API，完全本地运行
 */

export interface DeviceFingerprint {
  hash: string;
  signals: Record<string, string>;
  createdAt: number;
}

export async function collectDeviceFingerprint(): Promise<DeviceFingerprint> {
  const signals: Record<string, string> = {};
  signals.screen = `${window.screen.width}x${window.screen.height}x${window.devicePixelRatio}`;
  signals.colorDepth = String(window.screen.colorDepth);
  signals.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  signals.language = navigator.language;
  signals.platform = navigator.platform || 'unknown';
  signals.userAgent = navigator.userAgent;
  signals.hardwareConcurrency = String(navigator.hardwareConcurrency || 0);
  signals.deviceMemory = String((navigator as any).deviceMemory || 0);
  signals.plugins = Array.from(navigator.plugins || [])
    .map(p => p.name)
    .sort()
    .join(',');
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('InkFlow Device Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('InkFlow Device Fingerprint', 4, 17);
      signals.canvas = canvas.toDataURL().slice(0, 120);
    }
  } catch {
    signals.canvas = 'blocked';
  }
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    if (gl) {
      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      signals.webglVendor = debugInfo
        ? (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
        : 'unknown';
      signals.webglRenderer = debugInfo
        ? (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : 'unknown';
    }
  } catch {
    signals.webglVendor = 'blocked';
    signals.webglRenderer = 'blocked';
  }
  signals.maxTouchPoints = String(navigator.maxTouchPoints || 0);
  const payload = Object.keys(signals)
    .sort()
    .map(k => `${k}=${signals[k]}`)
    .join('|');
  const hash = djb2Hash(payload);
  return { hash, signals, createdAt: Date.now() };
}

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, '0').slice(0, 8);
}

export async function checkDeviceBinding(deviceId: string): Promise<string | null> {
  const { db } = await import('../db');
  const user = await db.users.where('deviceId').equals(deviceId).first();
  return user ? user.id : null;
}

export function checkIPRegistrationLimit(): { allowed: boolean; count: number; max: number } {
  const MAX_PER_IP = 5;
  const stored = localStorage.getItem('inkflow_ip_reg_count');
  const count = stored ? parseInt(stored, 10) : 0;
  return { allowed: count < MAX_PER_IP, count, max: MAX_PER_IP };
}

export function incrementIPRegistrationCount(): void {
  const stored = localStorage.getItem('inkflow_ip_reg_count');
  const count = stored ? parseInt(stored, 10) : 0;
  localStorage.setItem('inkflow_ip_reg_count', String(count + 1));
}
