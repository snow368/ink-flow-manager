import { useNavigate } from 'react-router-dom';
import { THEME } from '../lib/theme';

interface Tab {
  path: string;
  label: string;
  icon?: any;
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
      alignItems: 'stretch',
      backgroundColor: THEME.bg.panel,
      borderTop: `1px solid ${THEME.border.default}`,
      paddingBottom: 'env(safe-area-inset-bottom)',
      minHeight: 56,
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1,
              padding: '14px 0 10px',
              background: 'none',
              border: 'none',
              borderTop: isActive ? `3px solid ${THEME.brand.primary}` : `3px solid transparent`,
              color: isActive ? THEME.text.primary : THEME.text.subtle,
              cursor: 'pointer',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: isActive ? 600 : 500,
              letterSpacing: '0.02em',
              transition: 'color 0.15s, border-color 0.15s',
              position: 'relative',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
