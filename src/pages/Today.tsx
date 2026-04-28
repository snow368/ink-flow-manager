import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, type UserRecord, type AppointmentRecord } from '../db';
import { STATUS_COLORS, STATUS_LABELS } from '../lib/appointmentLogic';

export default function Today() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserRecord|null>(null);
  const [appointments, setAppointments] = useState<(AppointmentRecord&{clientName?:string})[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateAppointmentCounts, setDateAppointmentCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const stored = localStorage.getItem('inkflow_current_user');
    if(!stored){navigate('/register');return;}
    db.users.get(stored).then(u => {
      if(!u){navigate('/register');return;}
      setUser(u);
      loadAppointmentsForDate(u, selectedDate);
      loadFutureDateCounts(u);
    });
  }, [navigate, selectedDate]);

  async function loadAppointmentsForDate(u: UserRecord, date: string) {
    let query = db.appointments.where('date').equals(date);
    if(u.role==='artist' && u.artistId) query = query.and(a => a.artistId===u.artistId);
    const apps = await query.toArray();
    const enriched = await Promise.all(apps.map(async a => {
      const client = await db.clients.get(a.clientId);
      return {...a, clientName: client?.name || 'Unknown'};
    }));
    setAppointments(enriched.sort((a,b) => a.time.localeCompare(b.time)));
  }

  async function loadFutureDateCounts(u: UserRecord) {
    const today = new Date().toISOString().slice(0, 10);
    const endDate = new Date(); endDate.setMonth(endDate.getMonth() + 3);
    let query = db.appointments.where('date').between(today, endDate.toISOString().slice(0, 10));
    if(u.role==='artist' && u.artistId) query = query.and(a => a.artistId===u.artistId);
    const futureApps = await query.toArray();
    const counts = new Map<string, number>();
    futureApps.forEach(a => counts.set(a.date, (counts.get(a.date) || 0) + 1));
    setDateAppointmentCounts(counts);
  }

  const weekDays = (() => {
    const days: { date: Date; label: string; dateStr: string; count: number }[] = [];
    const today = new Date();
    for(let i = 0; i < 14; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
      days.push({ date: d, label: dayNames[d.getDay()], dateStr, count: dateAppointmentCounts.get(dateStr) || 0 });
    }
    return days;
  })();

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);
  if(!user) return <div style={{padding:24,color:'white'}}>Loading...</div>;

  return (
    <div style={{padding:24,color:'white',paddingBottom:12}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2 style={{fontSize:20,fontWeight:'bold'}}>{isToday ? 'Today' : selectedDate} · {new Date(selectedDate).toLocaleDateString('en',{month:'long',day:'numeric'})}</h2>
        <button onClick={() => navigate('/appointment/new')} style={{width:44,height:44,borderRadius:22,border:'none',background:'#e11d48',color:'white',fontSize:24,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
      </div>

      <div style={{display:'flex',gap:8,paddingBottom:14,marginBottom:14,borderBottom:'1px solid #1e293b',overflowX:'auto',scrollbarWidth:'none',msOverflowStyle:'none'}}>
        {weekDays.map(day => {
          const selected = day.dateStr === selectedDate;
          const count = day.count;
          return (
            <button key={day.dateStr} onClick={() => setSelectedDate(day.dateStr)} style={{
              display:'flex',flexDirection:'column',alignItems:'center',gap:2,
              padding:'8px 10px',borderRadius:14,border:'none',
              background: selected ? '#e11d48' : 'transparent',
              color: selected ? 'white' : count > 0 ? '#e2e8f0' : '#64748b',
              fontSize:12,fontWeight:500,cursor:'pointer',minWidth:50,transition:'background 0.15s',position:'relative',
            }}>
              <span style={{fontSize:10,opacity:0.6}}>{day.label}</span>
              <span style={{fontSize:16,fontWeight:selected ? 700 : 500}}>{day.date.getDate()}</span>
              {count > 0 && !selected ? (
                count === 1 ? (
                  <div style={{width:5,height:5,borderRadius:3,background:'#e11d48',boxShadow:'0 0 4px rgba(225,29,72,0.6)'}} />
                ) : (
                  <span style={{fontSize:10,fontWeight:700,color:'#fbbf24',marginTop:2,textShadow:'0 0 6px rgba(0,0,0,0.8)'}}>{count >= 4 ? '4+' : count}</span>
                )
              ) : selected && (
                <div style={{width:5,height:5,borderRadius:3,background:'white',boxShadow:'0 0 4px rgba(255,255,255,0.5)'}} />
              )}
            </button>
          );
        })}
      </div>

      {appointments.length===0 ? (
        <div style={{textAlign:'center',marginTop:60}}>
          <p style={{fontSize:48,marginBottom:16}}>📅</p>
          <p style={{fontSize:16,color:'#94a3b8'}}>No appointments on this day</p>
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
  const navigate = useNavigate();
  const color = STATUS_COLORS[appointment.status]||'#9ca3af';
  const needsWaiver = !appointment.waiverCompleted && appointment.status !== 'done' && appointment.status !== 'cancelled';

  return (
    <div style={{background:'#1e293b',borderRadius:14,padding:14,borderLeft:'4px solid '+color,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
      <div style={{flex:1}}>
        <p style={{fontSize:16,fontWeight:600,marginBottom:4}}><span style={{color:'#64748b',marginRight:6}}>{appointment.time}</span>{appointment.clientName}</p>
        <p style={{fontSize:13,color:'#94a3b8'}}>{appointment.duration}min{appointment.type&&' · '+appointment.type.replace('_',' ')}</p>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
        <span style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:color+'33',color:color,fontWeight:600}}>{STATUS_LABELS[appointment.status]||appointment.status}</span>
        {needsWaiver && (
          <button onClick={() => navigate('/waiver/' + appointment.id)} style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'none',background:'#f59e0b',color:'#0f172a',fontWeight:600,cursor:'pointer'}}>Sign</button>
        )}
        {appointment.status==='ready' && (
          <button onClick={() => navigate('/session/' + appointment.id)} style={{fontSize:11,padding:'4px 10px',borderRadius:6,border:'none',background:'#34d399',color:'#0f172a',fontWeight:600,cursor:'pointer'}}>Start</button>
        )}
      </div>
    </div>
  );
}
