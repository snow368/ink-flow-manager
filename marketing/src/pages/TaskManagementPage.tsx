import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import type { TaskRecord, UserRecord } from '../db';
import { createTask, updateTaskStatus, deleteTask, getOverdueTasks, getTasksByStatus } from '../lib/taskLogic';
import { detectInitialLanguage, t } from '../lib/i18n';
import { THEME } from '../lib/theme';

const PRIORITY_COLORS: Record<string, string> = { low: '#64748b', medium: '#fbbf24', high: '#f97316', urgent: '#ef4444' };
const CATEGORY_COLORS: Record<string, string> = { general: '#64748b', inventory: '#22c55e', marketing: '#a855f7', client: '#3b82f6', admin: '#f59e0b' };
const STATUS_ORDER: TaskRecord['status'][] = ['pending', 'in_progress', 'done'];

export default function TaskManagementPage() {
  const navigate = useNavigate();
  const lang = detectInitialLanguage();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [filter, setFilter] = useState<TaskRecord['status'] | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as TaskRecord['priority'], category: 'general' as TaskRecord['category'], dueDate: '', assigneeId: '' });

  useEffect(() => {
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) { navigate('/register'); return; }
    const load = async () => {
      const user = await db.users.get(uid);
      if (!user) return;
      const artistIds = user.roles?.includes('owner')
        ? (await db.users.toArray()).map(u => u.id)
        : [user.artistId || user.id];
      const allUsers = await db.users.toArray();
      setUsers(allUsers);

      let result: TaskRecord[];
      if (filter === 'all') {
        result = await db.tasks.where('artistId').anyOf(artistIds).toArray();
      } else {
        result = await getTasksByStatus(artistIds, filter);
      }
      result.sort((a, b) => b.createdAt - a.createdAt);
      setTasks(result);
    };
    load();
  }, [filter]);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    const uid = localStorage.getItem('inkflow_current_user');
    if (!uid) return;
    const id = await createTask(uid, {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      category: form.category,
      dueDate: form.dueDate ? new Date(form.dueDate).getTime() : undefined,
      assigneeId: form.assigneeId || undefined,
    });
    setShowForm(false);
    setForm({ title: '', description: '', priority: 'medium', category: 'general', dueDate: '', assigneeId: '' });
    // Reload tasks
    const user = await db.users.get(uid);
    if (user) {
      const artistIds = user.roles?.includes('owner')
        ? (await db.users.toArray()).map(u => u.id)
        : [user.artistId || user.id];
      const result = await db.tasks.where('artistId').anyOf(artistIds).toArray();
      result.sort((a, b) => b.createdAt - a.createdAt);
      setTasks(result);
    }
  };

  const handleStatusChange = async (id: string, status: TaskRecord['status']) => {
    await updateTaskStatus(id, status);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, completedAt: status === 'done' ? Date.now() : t.completedAt } : t));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const countByStatus = (status: TaskRecord['status']) => tasks.filter(t => t.status === status).length;
  const getUserName = (id?: string) => id ? users.find(u => u.id === id)?.name || id.slice(0, 8) : '—';

  return (
    <div style={{ padding: 24, color: 'white', paddingBottom: 80 }}>
      <button onClick={() => navigate('/me')} style={{ background: 'none', border: 'none', color: '#60a5fa', fontSize: 14, cursor: 'pointer', marginBottom: 16 }}>← {t(lang, 'back')}</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 'bold' }}>{t(lang, 'task_manager')}</h2>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: showForm ? '#64748b' : '#2563eb', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : t(lang, 'task_new')}
        </button>
      </div>

      {/* New Task Form */}
      {showForm && (
        <div style={{ background: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input placeholder={t(lang, 'task_title') + ' *'} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 14 }} />
          <textarea placeholder={t(lang, 'task_description')} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13, minHeight: 60, resize: 'vertical' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskRecord['priority'] }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13 }}>
              <option value="low">{t(lang, 'priority_low')}</option>
              <option value="medium">{t(lang, 'priority_medium')}</option>
              <option value="high">{t(lang, 'priority_high')}</option>
              <option value="urgent">{t(lang, 'priority_urgent')}</option>
            </select>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TaskRecord['category'] }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13 }}>
              <option value="general">General</option>
              <option value="inventory">Inventory</option>
              <option value="marketing">Marketing</option>
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13 }} />
            <select value={form.assigneeId} onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: 13 }}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={!form.title.trim()}
            style={{ padding: 10, borderRadius: 8, border: 'none', background: form.title.trim() ? '#2563eb' : '#334155', color: 'white', fontSize: 14, fontWeight: 600, cursor: form.title.trim() ? 'pointer' : 'not-allowed' }}>
            {t(lang, 'create_appointment')}
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {(['all', ...STATUS_ORDER] as const).map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{
              padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', whiteSpace: 'nowrap',
              background: filter === s ? '#2563eb' : '#0f172a', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: filter === s ? 600 : 400,
            }}>
            {s === 'all' ? 'All' : t(lang, 'task_' + s)} {s !== 'all' && `(${countByStatus(s)})`}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {tasks.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>No tasks found</p>
        ) : tasks.map(task => (
          <div key={task.id} style={{ background: '#1e293b', borderRadius: 12, overflow: 'hidden' }}>
            <div onClick={() => setExpandedId(expandedId === task.id ? null : task.id)} style={{ padding: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" checked={task.status === 'done'} onChange={() => handleStatusChange(task.id, task.status === 'done' ? 'pending' : 'done')}
                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#22c55e' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? '#64748b' : 'white' }}>{task.title}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: (PRIORITY_COLORS[task.priority] || '#64748b') + '30', color: PRIORITY_COLORS[task.priority] || '#64748b' }}>{task.priority}</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: (CATEGORY_COLORS[task.category] || '#64748b') + '30', color: CATEGORY_COLORS[task.category] || '#64748b' }}>{task.category}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                  {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                  <span>{getUserName(task.assigneeId)}</span>
                </div>
              </div>
              {task.status !== 'done' && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: task.status === 'in_progress' ? '#2563eb30' : '#fbbf2420', color: task.status === 'in_progress' ? '#60a5fa' : '#fbbf24' }}>
                  {task.status === 'in_progress' ? 'In Progress' : 'Pending'}
                </span>
              )}
            </div>
            {expandedId === task.id && (
              <div style={{ padding: '0 14px 14px 14px', borderTop: '1px solid #334155', paddingTop: 10 }}>
                {task.description && <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>{task.description}</p>}
                <div style={{ display: 'flex', gap: 6 }}>
                  {task.status !== 'done' && (
                    <button onClick={() => handleStatusChange(task.id, task.status === 'pending' ? 'in_progress' : 'done')}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#2563eb', color: 'white', fontSize: 12, cursor: 'pointer' }}>
                      {task.status === 'pending' ? 'Start' : 'Complete'}
                    </button>
                  )}
                  <button onClick={() => handleDelete(task.id)}
                    style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>{t(lang, 'del')}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
