const INSTALL_EVENT_KEY = 'inkflow_install_event';
const APPT_COUNT_KEY = 'inkflow_appt_count';
const DISMISSED_KEY = 'inkflow_install_dismissed';
const THRESHOLD = 3;

let deferredPrompt: any = null;
let listeners: Array<(available: boolean) => void> = [];

function notify() {
  const available = !!deferredPrompt;
  listeners.forEach(fn => fn(available));
}

export function captureInstallEvent(e: Event) {
  e.preventDefault();
  deferredPrompt = e;
  notify();
}

export function getInstallPrompt(): any {
  return deferredPrompt;
}

export function isInstallAvailable(): boolean {
  return !!deferredPrompt;
}

export function onInstallAvailableChange(fn: (available: boolean) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter(f => f !== fn);
  };
}

export async function triggerInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return result.outcome === 'accepted';
}

export function incrementApptCount() {
  const count = getApptCount() + 1;
  localStorage.setItem(APPT_COUNT_KEY, String(count));
}

export function getApptCount(): number {
  return Number(localStorage.getItem(APPT_COUNT_KEY) || '0');
}

export function shouldShowInstallBanner(): boolean {
  if (!deferredPrompt) return false;
  if (localStorage.getItem(DISMISSED_KEY)) return false;
  return getApptCount() >= THRESHOLD;
}

export function dismissInstallBanner() {
  localStorage.setItem(DISMISSED_KEY, '1');
}
