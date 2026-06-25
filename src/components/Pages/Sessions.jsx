import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast } from '../../utils/helpers';

const Sessions = () => {
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['sessions', 'enrollments', 'attendance', 'places']);
      setSessions(DB.sessions || []);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {isAdmin && (
          <button className="btn btn-primary"><i className="bi bi-plus-circle"></i> فترة جديدة</button>
        )}
      </div>
      <div className="grid-sessions">
        {sessions.map(s => {
          const enrolled = DB.enrollments.filter(e => e.sessionId === s.id).length;
          const assigned = DB.enrollments.filter(e => e.sessionId === s.id && e.placeId).length;
          const placesInSess = DB.places.filter(p => {
            const cap = p.sessionCaps?.[String(s.id)] || p.capacity || 0;
            return cap > 0;
          }).length;
          const icon = s.type === 'online' ? 'bi-globe' : s.type === 'offline' ? 'bi-building-fill' : 'bi-shuffle';
          const iconBg = s.type === 'online' ? '#ecfeff;color:#0891b2' : s.type === 'offline' ? '#fef3c7;color:#b45309' : '#f5f3ff;color:#6d28d9';
          
          return (
            <div key={s.id} className="session-card">
              <div className="session-top">
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: '0', background: iconBg }}>
                  <i className={`bi ${icon}`}></i>
                </div>
                <div style={{ flex: '1' }}>
                  <div className="session-name">{s.name}</div>
                  <div className="session-meta">
                    <span><i className="bi bi-calendar3"></i> {s.start}</span>
                    <span>→ {s.end}</span>
                    {s.academicYear && <span className="pill pill-blue" style={{ fontSize: '10px' }}>{s.academicYear}</span>}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <span dangerouslySetInnerHTML={{ __html: s.status === 'active' ? '<span class="pill pill-green"><i class="bi bi-play-circle-fill"></i> جارية</span>' : s.status === 'upcoming' ? '<span class="pill pill-blue"><i class="bi bi-calendar-event"></i> قادمة</span>' : '<span class="pill pill-gray"><i class="bi bi-lock-fill"></i> منتهية</span>' }} />
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button className="btn-icon"><i className="bi bi-pencil" style={{ fontSize: '12px' }}></i></button>
                    <button className="btn-icon danger"><i className="bi bi-trash3" style={{ fontSize: '12px' }}></i></button>
                  </div>
                )}
              </div>
              <div className="session-stats">
                <div className="session-stat"><div className="sv">{enrolled}</div><div className="sl">طالب</div></div>
                <div className="session-stat"><div className="sv">{assigned}</div><div className="sl">موزع</div></div>
                <div className="session-stat"><div className="sv">{placesInSess}</div><div className="sl">مكان</div></div>
                <div className="session-stat"><div className="sv">{DB.attendance.filter(r => r.sessionId === s.id).length}</div><div className="sl">سجل</div></div>
              </div>
              {s.notes && <div style={{ padding: '0 18px 12px', fontSize: '12px', color: 'var(--text3)' }}>{s.notes}</div>}
              <div className="session-actions">
                <button className="btn btn-secondary btn-sm"><i className="bi bi-diagram-3"></i> التوزيع</button>
                <button className="btn btn-secondary btn-sm"><i className="bi bi-calendar-check"></i> الحضور</button>
              </div>
            </div>
          );
        })}
        {sessions.length === 0 && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <i className="bi bi-calendar-x"></i>
            <div className="empty-title">لا توجد فترات تدريب</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sessions;
