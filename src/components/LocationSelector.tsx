import { useState, useEffect } from 'react';
import { db, type StudioLocationRecord, type UserRecord } from '../db';
import { getLocationArtistIds } from '../lib/locationLogic';
import { THEME } from '../lib/theme';
import { detectInitialLanguage, t } from '../lib/i18n';

export default function LocationSelector({
  user, onChange,
}: {
  user: UserRecord | null;
  onChange?: (locationId: string | null) => void;
}) {
  const [locations, setLocations] = useState<StudioLocationRecord[]>([]);
  const [selected, setSelected] = useState(localStorage.getItem('inkflow_current_location') || 'all');
  const lang = detectInitialLanguage();

  useEffect(() => {
    if (!user) return;
    if (user.roles?.includes('owner')) {
      db.studioLocations.where('ownerId').equals(user.id).toArray().then(setLocations);
    } else if (user.assignedLocationIds?.length) {
      db.studioLocations.where('id').anyOf(user.assignedLocationIds).toArray().then(setLocations);
    }
  }, [user]);

  if (!user || locations.length === 0) return null;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelected(val);
    localStorage.setItem('inkflow_current_location', val === 'all' ? '' : val);
    onChange?.(val === 'all' ? null : val);
    window.location.reload();
  };

  return (
    <select value={selected}
      onChange={handleChange}
      style={{
        width: '100%', padding: '8px 12px', borderRadius: 8,
        border: '1px solid #334155', background: THEME.bg.panel,
        color: THEME.text.primary, fontSize: 13, fontWeight: 500,
        marginBottom: 2,
      }}>
      {user.roles?.includes('owner') && <option value="all">All Locations</option>}
      {locations.map(loc => (
        <option key={loc.id} value={loc.id}>{loc.name}</option>
      ))}
    </select>
  );
}
