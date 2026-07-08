import { WifiOff } from 'lucide-react';
import { t, type AppLanguage } from '../lib/i18n';
import { THEME } from '../lib/theme';

export default function OfflineBanner({ lang }: { lang: AppLanguage }) {
  return (
    <div className="flex items-center justify-center gap-2 text-white text-xs font-medium py-1.5 px-4" style={{ backgroundColor: THEME.brand.warning }}>
      <WifiOff size={14} />
      <span>{t(lang, 'offline_banner')}</span>
    </div>
  );
}
