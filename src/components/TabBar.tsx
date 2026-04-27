import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

interface Tab {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
}

export default function TabBar({ tabs, activeTab }: TabBarProps) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center justify-around bg-ink-900 border-t border-ink-700" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.path;
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 py-2 min-h-[48px] min-w-[48px] active:scale-95 transition-transform ${
              isActive ? 'text-white' : 'text-ink-400'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
