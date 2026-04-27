import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord } from '../db';
import { STATUS_COLORS, STATUS_LABELS, type AppointmentStatus } from '../lib/appointmentLogic';

export default function Today() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord|null>(null);
  const [appointments, setAppointments] = useState<(AppointmentRecord&{clientName?:string})[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if(!stored){navigate('/register');return;}
    db.users.get(stored).then(u => {
      if(!u){navigate('/register');return;}
      setUser(u);
      loadTodayAppointments(u);
    });
  }, [navigate]);

  async function loadTodayAppointments(u: UserRecord) {
    const today = new Date().toISOString().slice(0,10);
    let query = db.appointments.where('date').equals(today);
    if(u.role==='artist' && u.artistId) query = query.and(a => a.artistId===u.artistId);
    const apps = await query.toArray();
    const enriched = await Promise.all(apps.map(async a => {
      const client = await db.clients.get(a.clientId);
      return {...a, clientName: client?.name || '未知客户'};
    }));
    setAppointments(enriched.sort((a,b) => a.time.localeCompare(b.time)));
  }

  if(!user) return <div style={{padding:24,color:'white'}}>加载中...</div>;
  return (
    <div style={{padding:24,color:'white'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:'bold'}}>今天 · {new Date().toLocaleDateString('zh',{month:'long',day:'numeric'})}</h2>
        <button onClick={() => navigate('/appointment/new')} style={{width:44,height:44,borderRadius:22,border:'none',background:'#e11d48',color:'white',fontSize:24,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
      </div>
      {appointments.length===0 ? (
        <div style={{textAlign:'center',marginTop:60}}>
          <p style={{fontSize:48,marginBottom:16}}>📅</p>
          <p style={{fontSize:16,color:'#94a3b8'}}>今天没有预约</p>
          <p style={{fontSize:14,color:'#64748b',marginTop:8}}>点击右上角 + 创建预约</p>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {appointments.map(app => <AppointmentCard key={app.id} appointment={app} />)}
        </div>
      )}
    </div>
  );
}

function AppointmentCard({appointment}:{appointment:AppointmentRecord&{clientName?:string}}) {
  const color = STATUS_COLORS[appointment.status]||'#9ca3af';
  return (
    <div style={{background:'#1e293b',borderRadius:14,padding:14,borderLeft:'4px solid '+color,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{flex:1}}>
        <p style={{fontSize:16,fontWeight:600,marginBottom:4}}>{appointment.clientName}</p>
        <p style={{fontSize:13,color:'#94a3b8'}}>{appointment.time} · {appointment.duration}分钟{appointment.type&&' · '+appointment.type}</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
        <span style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:color+'33',color:color,fontWeight:600}}>{STATUS_LABELS[appointment.status]||appointment.status}</span>
        {appointment.status==='ready' && <button style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'none',background:'#34d399',color:'#0f172a',fontWeight:600,cursor:'pointer'}}>开始</button>}
      </div>
    </div>
  );
}
