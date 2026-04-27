import { useNavigate } from 'react-router-dom';

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
      backgroundColor: '#1e293b',
      borderTop: '1px solid #334155',
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
              color: isActive ? '#ffffff' : '#94a3b8',
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
