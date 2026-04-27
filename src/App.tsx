import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, User } from 'lucide-react';
import TabBar from './components/TabBar';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import Today from './pages/Today';
import Clients from './pages/Clients';
import Me from './pages/Me';

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/today', { replace: true });
    }
  }, [location.pathname, navigate]);

  const tabs = [
    { path: '/today', label: 'Today', icon: Calendar },
    { path: '/clients', label: 'Clients', icon: Users },
    { path: '/me', label: 'Me', icon: User },
  ];

  const activeTab = tabs.find((t) => location.pathname.startsWith(t.path))?.path || '/today';

  return (
    <ErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', backgroundColor: '#0f172a', color: 'white' }}>
        {!isOnline && <OfflineBanner />}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/today" element={<Today />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/me" element={<Me />} />
          </Routes>
        </div>
        <TabBar tabs={tabs} activeTab={activeTab} />
      </div>
    </ErrorBoundary>
  );
}
