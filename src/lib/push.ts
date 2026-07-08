const VAPID_PUBLIC_KEY = 'BENZqGq0VyHMmCgGHGq0VyHMmCgGHGq0VyHMmCg'; // Placeholder, replaced by Worker at runtime

let cachedPublicKey: string | null = null;

export async function getVapidPublicKey(backendUrl: string): Promise<string | null> {
  if (cachedPublicKey) return cachedPublicKey;
  try {
    const res = await fetch(`${backendUrl}/api/push/vapid-key`);
    const data = await res.json() as { publicKey: string };
    if (data.publicKey) {
      cachedPublicKey = data.publicKey;
      return data.publicKey;
    }
  } catch {}
  return null;
}

export async function subscribe(backendUrl: string): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const publicKey = await getVapidPublicKey(backendUrl);
  if (!publicKey) return null;

  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  return sub;
}

export async function unsubscribe(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  if (sub) {
    await sub.unsubscribe();
    return true;
  }
  return false;
}

export async function isSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  const registration = await navigator.serviceWorker.ready;
  const sub = await registration.pushManager.getSubscription();
  return sub !== null;
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = self.atob ? self.atob(base64) : atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
