import { useEffect, useState } from 'react';
import { db, type ProjectRecord, type SessionRecord, type ConsumableUsage } from '../db';
import { THEME } from '../lib/theme';

interface Props {
  projectId?: string;
  clientId: string;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'empty' | 'error';

export default function ProjectProgressPanel({ projectId, clientId }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>('idle');
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [lastSession, setLastSession] = useState<SessionRecord | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [materials, setMaterials] = useState<string[]>([]);

  useEffect(() => {
    if (!projectId) { setState('empty'); return; }
    setState('loading');
    (async () => {
      try {
        const proj = await db.projects.get(projectId);
        if (!proj) { setState('empty'); return; }
        setProject(proj);

        // Get all sessions for this project, ordered by startedAt desc
        const allSessions = await db.sessions
          .where('projectId')
          .equals(projectId)
          .reverse()
          .sortBy('startedAt');

        setSessionCount(allSessions.length);

        // Find the last session that has photos
        const lastWithPhoto = allSessions.find(s => s.photos && s.photos.length > 0);
        if (lastWithPhoto) {
          setLastSession(lastWithPhoto);
          // Resolve consumable names
          if (lastWithPhoto.consumables && lastWithPhoto.consumables.length > 0) {
            const invItems = await db.inventory.toArray();
            const invMap = new Map(invItems.map(i => [i.id, i.name]));
            const names = lastWithPhoto.consumables
              .map(c => invMap.get(c.itemId) || c.itemId)
              .slice(0, 5);
            setMaterials(names);
          }
        }

        setState('loaded');
      } catch {
        setState('error');
      }
    })();
  }, [projectId]);

  // Not a multi-session project — don't render anything
  if (!projectId || state === 'empty' || state === 'error') return null;
  // Show a minimal loading indicator
  if (state === 'loading' || state === 'idle') {
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ height: 4, width: '40%', background: '#1e293b', borderRadius: 2 }} />
      </div>
    );
  }

  const planned = project?.plannedSessions || 0;
  const completed = project?.completedSessions || 0;
  const progressLabel = planned > 0
    ? `第${Math.min(completed + 1, planned)}次 / 共${planned}次`
    : `已完成${completed}次`;

  // If there's nothing interesting to show (no reference images, no sessions)
  if (!project?.referenceImages?.length && !lastSession && !materials.length && !planned) {
    return null;
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* Toggle bar */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          padding: '5px 0', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 10, color: '#64748b', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
          ▶
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#c084fc' }}>
          {project?.title || 'Project'}
        </span>
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>
          {progressLabel}
        </span>
        {!open && lastSession && lastSession.photos.length > 0 && (
          <span style={{ fontSize: 10, color: '#475569', marginLeft: 'auto' }}>
            {lastSession.photos.length}张进度照
          </span>
        )}
      </div>

      {open && (
        <div style={{
          background: '#0f172a', borderRadius: 10, padding: 10,
          border: '1px solid #1e293b', marginTop: 2,
        }}>
          {/* Side-by-side: target vs current */}
          {(project?.referenceImages?.length || lastSession?.photos?.length) ? (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {project?.referenceImages?.[0] && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    🎯 目标效果
                  </p>
                  <img
                    src={project.referenceImages[0]}
                    alt="Reference design"
                    style={{
                      width: '100%', aspectRatio: '1/1', objectFit: 'cover',
                      borderRadius: 6, background: '#1e293b',
                    }}
                    loading="lazy"
                  />
                </div>
              )}
              {lastSession?.photos?.length ? (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    📸 上次进度
                  </p>
                  <img
                    src={lastSession.photos[lastSession.photos.length - 1]}
                    alt="Last session progress"
                    style={{
                      width: '100%', aspectRatio: '1/1', objectFit: 'cover',
                      borderRadius: 6, background: '#1e293b',
                    }}
                    loading="lazy"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Session checklist */}
          {planned > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                进度 {completed}/{planned}
              </p>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: planned }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1, height: 4, borderRadius: 2,
                      background: i < completed ? '#22c55e' : '#1e293b',
                      transition: 'background 0.2s',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Last materials */}
          {materials.length > 0 && (
            <div>
              <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                📦 上次材料
              </p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {materials.map((name, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 4,
                      background: '#1e293b', color: '#94a3b8',
                      border: '1px solid #334155',
                    }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
