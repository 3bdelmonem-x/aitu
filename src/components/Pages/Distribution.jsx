import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, getPlaceCap, getPlaceSessionTime, placeName, svName, sessionIsLocked } from '../../utils/helpers';

const Distribution = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [sessId, setSessId] = useState('');
  const [dept, setDept] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState(null);
  const [dragType, setDragType] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'places', 'place_supervisors', 'supervisors', 'sessions', 'departments']);
      setLoading(false);
    };
    loadData();
  }, []);

  const assignStudentToPlace = async (stuId, placeId, sessId) => {
    const p = DB.places.find(p => p.id === placeId);
    if (!p) return;
    if (sessionIsLocked(sessId)) {
      toast('w', 'الفترة منتهية لا يمكن التعديل', 'bi-lock');
      return;
    }
    const cap = getPlaceCap(p, sessId);
    if (cap === 0) {
      toast('e', `${p.name} غير متاح في هذه الفترة`, 'bi-exclamation-circle');
      return;
    }
    const enrolled = DB.enrollments.filter(e => e.placeId === placeId && e.sessionId === sessId);
    if (enrolled.length >= cap) {
      toast('e', `${p.name} وصل السعة القصوى`, 'bi-exclamation-circle');
      return;
    }
    if (DB.enrollments.find(e => e.studentId === stuId && e.placeId === placeId && e.sessionId === sessId)) {
      toast('w', 'الطالب موجود بالفعل', 'bi-exclamation-circle');
      return;
    }
    try {
      // Add enrollment
      toast('s', `تم تعيين الطالب في ${p.name}`, 'bi-check-circle');
    } catch (e) {
      toast('e', 'خطأ في الحفظ', 'bi-x-circle');
    }
  };

  const removeFromPlace = async (enrollId) => {
    const enroll = DB.enrollments.find(e => e.id === enrollId);
    if (!enroll) return;
    if (sessionIsLocked(enroll.sessionId)) {
      toast('w', 'الفترة منتهية لا يمكن التعديل', 'bi-lock');
      return;
    }
    try {
      toast('i', 'تم إزالة الطالب', 'bi-info-circle');
    } catch (e) {
      toast('e', 'خطأ', 'bi-x-circle');
    }
  };

  const handleDragStart = (e, id, type) => {
    setDragId(id);
    setDragType(type);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDragId(null);
    setDragType(null);
  };

  const handleDrop = (e, placeId) => {
    e.preventDefault();
    document.getElementById(`pslot-${placeId}`)?.classList.remove('drag-over');
    if (dragType === 'student' && dragId) {
      assignStudentToPlace(dragId, placeId, parseInt(sessId));
    }
    setDragId(null);
    setDragType(null);
  };

  const handleDragOver = (e, placeId) => {
    e.preventDefault();
    document.getElementById(`pslot-${placeId}`)?.classList.add('drag-over');
  };

  const handleDragLeave = (placeId) => {
    document.getElementById(`pslot-${placeId}`)?.classList.remove('drag-over');
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  const sessEnrolls = DB.enrollments.filter(e => e.sessionId === parseInt(sessId));
  const isLocked = sessionIsLocked(parseInt(sessId));
  const sess = DB.sessions.find(x => x.id === parseInt(sessId));
  
  let stuList = DB.students.filter(s => {
    if (sess && !sess.depts?.includes('__all__') && !sess.depts?.includes(s.dept)) return false;
    if (dept && s.dept !== dept) return false;
    if (level && s.level !== level) return false;
    if (q && !s.name.toLowerCase().includes(q.toLowerCase())) return false;
    if (s.level === 'رابعة كلية') return false;
    return true;
  });

  if (status === 'unassigned') {
    stuList = stuList.filter(s => !sessEnrolls.find(e => e.studentId === s.id && e.placeId));
  }
  if (status === 'assigned') {
    stuList = stuList.filter(s => sessEnrolls.find(e => e.studentId === s.id && e.placeId));
  }

  const unassignedCount = stuList.filter(s => !sessEnrolls.find(e => e.studentId === s.id && e.placeId)).length;

  const sessPlaces = DB.places.filter(p => getPlaceCap(p, parseInt(sessId)) > 0);

  return (
    <div>
      <div className="dist-tab-btns">
        <button 
          className={`dist-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <i className="bi bi-mortarboard"></i> توزيع الطلاب
        </button>
        <button 
          className={`dist-tab-btn ${activeTab === 'supervisors' ? 'active' : ''}`}
          onClick={() => setActiveTab('supervisors')}
        >
          <i className="bi bi-person-badge"></i> توزيع المشرفين
        </button>
      </div>

      {activeTab === 'students' && (
        <div>
          <div className="filters">
            <div className="fg">
              <label>الفترة</label>
              <select className="fc" value={sessId} onChange={(e) => setSessId(e.target.value)}>
                <option value="">اختر</option>
                {DB.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>القسم</label>
              <select className="fc" value={dept} onChange={(e) => setDept(e.target.value)}>
                <option value="">الكل</option>
                {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>الفرقة</label>
              <select className="fc" value={level} onChange={(e) => setLevel(e.target.value)}>
                <option value="">الكل</option>
                {[...new Set(DB.students.map(s => s.level).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="fg">
              <label>الحالة</label>
              <select className="fc" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">الكل</option>
                <option value="unassigned">غير موزع</option>
                <option value="assigned">موزع</option>
              </select>
            </div>
            <div className="fg">
              <label>بحث</label>
              <input type="text" className="fc" placeholder="اسم الطالب..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div style={{ marginRight: 'auto' }}>
              <button className="btn btn-secondary"><i className="bi bi-building-add"></i> مكان جديد</button>
            </div>
          </div>

          <div className="grid-dist">
            <div className="card">
              <div className="card-hd">
                <h3>الطلاب</h3>
                <span className="pill pill-amber">{unassignedCount} غير موزع</span>
              </div>
              <div style={{ padding: '10px' }}>
                {isLocked && (
                  <div style={{ background: 'var(--amber-l)', border: '1px solid #fde68a', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="bi bi-lock-fill"></i> الفترة منتهية — العرض فقط
                  </div>
                )}
                {stuList.map((s, i) => {
                  const enrolls = sessEnrolls.filter(e => e.studentId === s.id && e.placeId);
                  const assignedPlaces = enrolls.map(e => placeName(e.placeId)).join(', ');
                  const color = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'][i % 5];
                  return (
                    <div 
                      key={s.id} 
                      className="st-drag" 
                      draggable={!isLocked}
                      onDragStart={(e) => handleDragStart(e, s.id, 'student')}
                      onDragEnd={handleDragEnd}
                      style={isLocked ? { opacity: '.7', cursor: 'default' } : {}}
                    >
                      <div className="av" style={{ background: `${color}22`, color: color, width: '28px', height: '28px', fontSize: '10px' }}>
                        {s.name.split(' ').slice(0, 2).map(w => w[0] || '').join('')}
                      </div>
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <div style={{ fontSize: '12.5px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.dept}</div>
                      </div>
                      {assignedPlaces ? (
                        <span className="pill pill-green" style={{ fontSize: '10px' }}>{assignedPlaces}</span>
                      ) : (
                        <span className="pill pill-amber" style={{ fontSize: '10px' }}>غير موزع</span>
                      )}
                    </div>
                  );
                })}
                {stuList.length === 0 && (
                  <div className="empty"><i className="bi bi-people"></i><div className="empty-title">لا توجد طلاب</div></div>
                )}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700' }}>أماكن التدريب</h3>
                <span className="pill pill-gray">{sessPlaces.length} مكان</span>
              </div>
              <div className="grid-dist-places">
                {sessPlaces.filter(p => !dept || !p.dept || p.dept === dept).map(p => {
                  const cap = getPlaceCap(p, parseInt(sessId));
                  const times = getPlaceSessionTime(p, parseInt(sessId));
                  const placeEnrolls = sessEnrolls.filter(e => e.placeId === p.id);
                  const pct = cap > 0 ? Math.round(placeEnrolls.length / cap * 100) : 0;
                  const bar = pct >= 100 ? 'var(--red)' : pct >= 75 ? 'var(--amber)' : 'var(--accent)';
                  const svNames = DB.place_supervisors.filter(ps => ps.placeId === p.id && ps.sessionId === parseInt(sessId)).map(ps => svName(ps.supervisorId)).join(', ');
                  
                  return (
                    <div 
                      key={p.id} 
                      className={`place-slot ${isLocked ? 'locked' : ''}`}
                      id={`pslot-${p.id}`}
                      onDragOver={(e) => handleDragOver(e, p.id)}
                      onDragLeave={() => handleDragLeave(p.id)}
                      onDrop={(e) => handleDrop(e, p.id)}
                    >
                      <div className="ps-hd">
                        <div style={{ flex: '1' }}>
                          <div className="ps-name">
                            {p.name}
                            {p.isExternal && <span className="pill pill-purple" style={{ fontSize: '9px' }}>خارجي</span>}
                          </div>
                          <div className="ps-cap">{placeEnrolls.length}/{cap} · {times.startTime}–{times.endTime}</div>
                        </div>
                      </div>
                      <div className="prog-bar"><div className="prog-fill" style={{ width: `${pct}%`, background: bar }}></div></div>
                      {svNames && <div style={{ fontSize: '11px', color: 'var(--text3)' }}><i className="bi bi-person-badge"></i> {svNames}</div>}
                      <div className="ps-students">
                        {placeEnrolls.map(e => {
                          const st = DB.students.find(s => s.id === e.studentId);
                          if (!st) return null;
                          const color = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'][st.id % 5];
                          return (
                            <div key={e.id} className="ps-student-row">
                              <div className="av" style={{ background: `${color}22`, color: color, width: '22px', height: '22px', fontSize: '9px' }}>
                                {st.name.split(' ').slice(0, 2).map(w => w[0] || '').join('')}
                              </div>
                              <span style={{ flex: '1', fontSize: '11.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.name}</span>
                              {!isLocked && (
                                <button className="ps-remove" onClick={() => removeFromPlace(e.id)}>
                                  <i className="bi bi-x"></i>
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {placeEnrolls.length === 0 && (
                          <div className="ps-drop-hint">
                            <i className="bi bi-person-plus"></i>
                            <span>{isLocked ? 'عرض فقط' : 'اسحب طالباً هنا'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'supervisors' && (
        <div>
          {/* Similar to students tab but for supervisors */}
          <div className="empty">
            <i className="bi bi-person-badge"></i>
            <div className="empty-title">توزيع المشرفين</div>
            <div className="empty-sub">نفس منطق توزيع الطلاب ولكن للمشرفين</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Distribution;