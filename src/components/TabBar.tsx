import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

interface Tab {
  path: string;
  label: string;
  icon: any;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
}

export default function TabBar({ tabs, activeTab }: TabBarProps) {
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: THEME.bg.panel,
      borderTop: `1px solid ${THEME.border.default}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
      minHeight: '64px',
      fontSize: '16px',
      fontWeight: 'bold',
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              color: isActive ? THEME.text.primary : THEME.text.muted,
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
