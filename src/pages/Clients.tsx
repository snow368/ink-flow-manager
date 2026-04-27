import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type ClientRecord } from '../db';

export default function Clients() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord|null>(null);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if(!stored){navigate('/register');return;}
    db.users.get(stored).then(u => {
      if(!u){navigate('/register');return;}
      setUser(u);
      loadClients(u);
    });
  }, [navigate]);

  async function loadClients(u:UserRecord) {
    let query = db.clients.orderBy('createdAt').reverse();
    if(u.role==='artist' && u.artistId) query = query.filter(c => c.artistId===u.artistId);
    setClients(await query.toArray());
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone&&c.phone.includes(search))
  );

  return (
    <div style={{ padding: 24, color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>客户</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="file" accept=".csv,.xlsx,.xls,.json" ref={fileInputRef} style={{ display: 'none' }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const text = await file.text();
                const lines = text.split('\n').filter(l => l.trim());
                const headers = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim().replace(/"/g,''));
                const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nombre') || h.includes('名字') || h.includes('nome'));
                const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('tel') || h.includes('电话') || h.includes('telefono'));
                const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail') || h.includes('correo'));
                for (let i = 1; i < lines.length; i++) {
                  const cols = lines[i].split(/[,;]/).map(c => c.trim().replace(/"/g,''));
                  if (cols[nameIdx]) {
                    const now = Date.now();
                    const id = 'client_' + now + '_' + Math.random().toString(36).slice(2, 6);
                    await db.clients.add({ id, name: cols[nameIdx], phone: cols[phoneIdx] || undefined, email: cols[emailIdx] || undefined, createdAt: now });
                  }
                }
                loadClients(user!);
              } catch (e) {
                console.error('导入失败', e);
                alert('导入失败，请检查文件格式');
              }
            }
          }} />
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#334155', color: 'white', fontSize: 13 }}>
            📥 导入
          </button>
          <button onClick={() => navigate('/client/new')} style={{ width: 36, height: 36, borderRadius: 18, border: 'none', background: '#e11d48', color: 'white', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            +
          </button>
        </div>
      </div>
      <input placeholder="搜索客户..." value={search} onChange={e=>setSearch(e.target.value)} style={{ width:'100%', padding:10, borderRadius:10, border:'1px solid #334155', background:'#1e293b', color:'white', fontSize:14, marginBottom:16, outline:'none' }} />
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(client => (
          <div key={client.id} onClick={()=>navigate('/client/'+client.id)} style={{ background:'#1e293b', borderRadius:12, padding:14, cursor:'pointer' }}>
            <p style={{ fontSize:16, fontWeight:600 }}>{client.name}</p>
            <p style={{ fontSize:13, color:'#94a3b8', marginTop:4 }}>{client.phone||'无电话'} · {client.email||'无邮箱'}</p>
            {client.allergies&&client.allergies.length>0&&(
              <div style={{ marginTop:6, display:'flex', gap:4 }}>
                {client.allergies.map((a,i)=><span key={i} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#7f1d1d', color:'#fca5a5' }}>⚠ {a}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
