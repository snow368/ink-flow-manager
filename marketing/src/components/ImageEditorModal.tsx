import { useState, useRef, useEffect } from 'react';

const FILTERS = [
  { label: 'Normal', style: 'none' },
  { label: 'Grayscale', style: 'grayscale(1)' },
  { label: 'Sepia', style: 'sepia(0.8)' },
  { label: 'Vintage', style: 'sepia(0.4) contrast(1.1) brightness(0.9)' },
  { label: 'Contrast+', style: 'contrast(1.3) saturate(1.2)' },
  { label: 'Cool', style: 'hue-rotate(180deg) saturate(0.8)' },
  { label: 'Warm', style: 'sepia(0.2) saturate(1.4)' },
];

export default function ImageEditorModal({
  imageUrl, onSave, onClose,
}: {
  imageUrl: string;
  onSave: (editedDataUrl: string) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [cropMode, setCropMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      drawImage();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = activeFilter === 'none' ? 'none' : FILTERS.find(f => f.style === activeFilter)?.style || 'none';
    ctx.filter += ` brightness(${brightness / 100}) contrast(${contrast / 100})`;
    ctx.drawImage(img, 0, 0);
  };

  useEffect(() => {
    drawImage();
  }, [activeFilter, brightness, contrast]);

  const applyFilter = (style: string) => {
    setActiveFilter(style);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSave(dataUrl);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000', zIndex: 300,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 16px', background: '#0f172a',
      }}>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer' }}>
          Cancel
        </button>
        <span style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>Edit Photo</span>
        <button onClick={handleSave} disabled={saving}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: saving ? '#4b5563' : '#2563eb', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
        <canvas ref={canvasRef}
          style={{
            maxWidth: '100%', maxHeight: '100%', borderRadius: 8,
            objectFit: 'contain',
          }} />
      </div>

      {/* Filters row */}
      <div style={{ padding: '8px 16px', background: '#0f172a' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {FILTERS.map(f => (
            <button key={f.label} onClick={() => applyFilter(f.style)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                background: activeFilter === f.style ? '#2563eb' : '#1e293b',
                color: activeFilter === f.style ? 'white' : '#94a3b8',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brightness / Contrast sliders */}
      <div style={{ padding: '8px 16px 16px', background: '#0f172a', display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 4 }}>
            Brightness {brightness}%
          </label>
          <input type="range" min="20" max="200" value={brightness}
            onChange={e => setBrightness(Number(e.target.value))}
            style={{ width: '100%' }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 4 }}>
            Contrast {contrast}%
          </label>
          <input type="range" min="20" max="200" value={contrast}
            onChange={e => setContrast(Number(e.target.value))}
            style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
