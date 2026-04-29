import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type InventoryRecord } from '../db';
import { getInventoryGuide, speakGuide, tryOCR, addInventoryFromPhoto, shouldShowGuide, markScanComplete } from '../lib/inventoryCamera';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InventoryRecord[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reorderLevel, setReorderLevel] = useState(5);
  const [unit, setUnit] = useState('pcs');
  const [message, setMessage] = useState('');
  const [guideStep, setGuideStep] = useState(0);
  const [photoData, setPhotoData] = useState('');
  const [ocrResult, setOcrResult] = useState('');
  const [showGuide, setShowGuide] = useState(shouldShowGuide());
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const guide = getInventoryGuide();

  const loadItems = () => db.inventory.orderBy('name').toArray().then(setItems);
  useEffect(() => { loadItems(); }, []);

  const resetForm = () => {
    setName(''); setCategory(''); setQuantity(1); setReorderLevel(5); setUnit('pcs');
    setEditId(null); setShowAdd(false); setPhotoData(''); setOcrResult(''); setGuideStep(0);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const now = Date.now();
    if (editId) {
      await db.inventory.update(editId, { name: name.trim(), category: category.trim() || undefined, quantity, reorderLevel, unit });
      setMessage('Item updated.');
    } else {
      if (photoData) {
        await addInventoryFromPhoto(photoData, name.trim(), category, quantity, unit);
      } else {
        const id = 'inv_' + now + '_' + Math.random().toString(36).slice(2, 6);
        await db.inventory.add({ id, name: name.trim(), category: category.trim() || 'General', quantity, reorderLevel, unit, createdAt: now });
      }
      setMessage('Item added.');
      markScanComplete();
    }
    resetForm();
    loadItems();
  };

  const handleEdit = (item: InventoryRecord) => {
    setEditId(item.id); setName(item.name); setCategory(item.category || '');
    setQuantity(item.quantity); setReorderLevel(item.reorderLevel); setUnit(item.unit);
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await db.inventory.delete(id);
    loadItems();
  };

  const handleQuickAdd = async (item: InventoryRecord, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    await db.inventory.update(item.id, { quantity: newQty });
    loadItems();
  };

  const startCamera = async () => {
    const showDetailedGuide = shouldShowGuide();
    setShowGuide(showDetailedGuide);
    setShowCamera(true);
    setGuideStep(1);
    if (showDetailedGuide) {
      speakGuide(guide.step1, true);
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          if (showDetailedGuide) {
            setTimeout(() => { setGuideStep(2); speakGuide(guide.step2, true); }, 2000);
          }
        };
      }
    } catch {
      setMessage('Camera access denied');
      setShowCamera(false);
      setGuideStep(0);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setGuideStep(0);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const data = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoData(data);
    stopCamera();

    setGuideStep(3);
    if (shouldShowGuide()) {
      speakGuide(guide.step4, true);
    }
    tryOCR(data).then(text => {
      if (text && text.length > 2) {
        setName(text.slice(0, 60));
        setOcrResult(text.slice(0, 60));
        if (shouldShowGuide()) speakGuide(guide.success, true);
      } else {
        setOcrResult('');
        if (shouldShowGuide()) speakGuide(guide.ocrFailed, true);
      }
    });

    setShowAdd(true);
  };

  const remainingScans = Math.max(0, 3 - parseInt(localStorage.getItem('inkflow_scan_guide_count') || '0', 10));

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>Inventory</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={startCamera}
            style={{ padding: '8px 16px', borderRadius: 22, border: 'none', background: '#2563eb', color: 'white', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            📷 Scan
          </button>
          <button onClick={() => { resetForm(); setShowAdd(!showAdd); }}
            style={{ width: 44, height: 44, borderRadius: 22, border: 'none', background: '#e11d48', color: 'white', fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      </div>

      {showCamera && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: '#000', marginBottom: 10 }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button onClick={capturePhoto}
                style={{ padding: '12px 32px', borderRadius: 12, border: '3px solid white', background: 'rgba(225,29,72,0.9)', color: 'white', fontSize: 16, fontWeight: 700 }}>
                Capture
              </button>
              <button onClick={stopCamera}
                style={{ padding: '12px 20px', borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.7)', color: 'white', fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </div>
          {showGuide ? (
            <div style={{ background: '#1e293b', borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 13, color: guideStep >= 1 ? '#e2e8f0' : '#64748b' }}>
                {guideStep >= 1 ? '✅ ' : '① '}{guide.step1}
              </p>
              <p style={{ fontSize: 13, color: guideStep >= 2 ? '#e2e8f0' : '#64748b' }}>
                {guideStep >= 2 ? '✅ ' : '② '}{guide.step2}
              </p>
              <p style={{ fontSize: 13, color: guideStep >= 3 ? '#e2e8f0' : '#64748b' }}>
                {guideStep >= 3 ? '✅ ' : '③ '}{guide.step3}
              </p>
              <p style={{ fontSize: 13, color: '#64748b' }}>
                ④ {guide.step4}
              </p>
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                Guide auto-hides after {remainingScans} more scan{remainingScans === 1 ? '' : 's'}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>
              Aim at product label and tap Capture
            </p>
          )}
        </div>
      )}

      {showAdd && !showCamera && (
        <div style={{ background: '#1e293b', padding: 14, borderRadius: 12, marginBottom: 16 }}>
          {photoData && (
            <div style={{ borderRadius: 10, overflow: 'hidden', marginBottom: 10, maxHeight: 180 }}>
              <img src={photoData} alt="product" style={{ width: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {ocrResult && (
            <div style={{ background: '#14532d', padding: '6px 10px', borderRadius: 8, marginBottom: 8 }}>
              <p style={{ fontSize: 12, color: '#86efac' }}>📝 Recognized: {ocrResult}</p>
            </div>
          )}
          <input placeholder="Product name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          <input placeholder="Category (e.g. Ink, Needles)" value={category} onChange={e => setCategory(e.target.value)} style={inputStyle} />
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
            <input type="number" placeholder="Reorder at" value={reorderLevel} onChange={e => setReorderLevel(Number(e.target.value))} style={{ ...inputStyle, flex: 1 }} />
            <input placeholder="Unit" value={unit} onChange={e => setUnit(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleSave} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: '#22c55e', color: 'white', fontSize: 14, fontWeight: 600 }}>
              {editId ? 'Update' : 'Add to Inventory'}
            </button>
            <button onClick={resetForm} style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>Cancel</button>
          </div>
        </div>
      )}

      {message && (
        <div style={{ background: '#1e293b', padding: 10, borderRadius: 8, marginBottom: 12, border: '1px solid #22c55e' }}>
          <p style={{ fontSize: 13, color: '#34d399' }}>{message}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div key={item.id} style={{ background: item.quantity <= item.reorderLevel ? '#3b1117' : '#1e293b', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</p>
              <p style={{ fontSize: 12, color: '#94a3b8' }}>{item.category} · {item.quantity} {item.unit} · Reorder at {item.reorderLevel}</p>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button onClick={() => handleQuickAdd(item, -1)} style={qtyBtn}>−</button>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
              <button onClick={() => handleQuickAdd(item, 1)} style={qtyBtn}>+</button>
              <button onClick={() => handleEdit(item)} style={actionBtn}>✎</button>
              <button onClick={() => handleDelete(item.id)} style={actionBtn}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => navigate('/me')} style={{ marginTop: 16, width: '100%', padding: 12, borderRadius: 10, border: '1px solid #334155', background: 'transparent', color: '#94a3b8' }}>
        ← Back to Settings
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginBottom: 8,
  borderRadius: 10, border: '1px solid #334155', background: '#0f172a',
  color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};
const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 14, border: '1px solid #334155',
  background: 'transparent', color: 'white', fontSize: 16, display: 'flex',
  alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};
const actionBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 8, border: 'none',
  background: '#334155', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
};
