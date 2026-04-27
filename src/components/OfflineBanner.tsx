import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-amber-600 text-white text-xs font-medium py-1.5 px-4">
      <WifiOff size={14} />
      <span>You&apos;re offline. Changes will sync when reconnected.</span>
    </div>
  );
}
