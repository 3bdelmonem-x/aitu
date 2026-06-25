import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, initials, avColor, computeAttendanceEvalScore, getEvalCriteriaForPlace, sessionIsLocked } from '../../utils/helpers';

const Evaluations = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sess: '',
    place: '',
    dept: '',
    level: '',
    q: ''
  });
  const [evaluationData, setEvaluationData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'evaluations', 'eval_templates', 'places', 'sessions', 'departments']);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadEvaluations();
    }
  }, [loading, filters]);

  const loadEvaluations = () => {
    const { sess, place, dept, level, q } = filters;
    
    let enrolls = DB.enrollments.filter(e => e.placeId);
    if (sess) enrolls = enrolls.filter(e => e.sessionId === parseInt(sess));
    if (place) enrolls = enrolls.filter(e => e.placeId === parseInt(place));
    
    const placesToShow = [...new Set(enrolls.map(e => e.placeId))].map(pid => DB.places.find(p => p.id === pid)).filter(Boolean);
    
    const data = placesToShow.map(p => {
      const placeEnrolls = enrolls.filter(e => e.placeId === p.id);
      const students = placeEnrolls.map(e => {
        const s = DB.students.find(st => st.id === e.studentId);
        return { ...s, _sessId: e.sessionId };
      }).filter(s => s && s.id);
      
      let filtered = students;
      if (dept) filtered = filtered.filter(s => s.dept === dept);
      if (level) filtered = filtered.filter(s => s.level === level);
      if (q) filtered = filtered.filter(s => s.name?.toLowerCase().includes(q.toLowerCase()));
      
      const criteria = getEvalCriteriaForPlace(p.id);
      
      return {
        place: p,
        students: filtered,
        criteria: criteria,
        sessionId: placeEnrolls[0]?.sessionId
      };
    }).filter(d => d.students.length > 0);
    
    setEvaluationData(data);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div>
      <div className="filters">
        <div className="fg">
          <label>الفترة</label>
          <select className="fc" value={filters.sess} onChange={(e) => handleFilterChange('sess', e.target.value)}>
            <option value="">الكل</option>
            {DB.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>المكان</label>
          <select className="fc" value={filters.place} onChange={(e) => handleFilterChange('place', e.target.value)}>
            <option value="">الكل</option>
            {DB.places.filter(p => !filters.sess || getPlaceCap(p, parseInt(filters.sess)) > 0).map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>القسم</label>
          <select className="fc" value={filters.dept} onChange={(e) => handleFilterChange('dept', e.target.value)}>
            <option value="">الكل</option>
            {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>الفرقة</label>
          <select className="fc" value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}>
            <option value="">الكل</option>
            {[...new Set(DB.students.map(s => s.level).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>بحث</label>
          <input type="text" className="fc" placeholder="اسم الطالب..." value={filters.q} onChange={(e) => handleFilterChange('q', e.target.value)} />
        </div>
      </div>

      <div id="evaluations-content">
        {evaluationData.map((item) => {
          const isLocked = sessionIsLocked(item.sessionId);
          
          return (
            <div key={item.place.id} className="eval-section">
              <div className="eval-place-header">
                <div>
                  <div className="eval-place-title">{item.place.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                    {item.students.length} طالب
                    {isLocked && <span className="pill pill-gray" style={{ marginRight: '8px' }}>منتهية</span>}
                  </div>
                </div>
                {isAdmin && (
                  <button className="btn btn-secondary btn-sm">
                    <i className="bi bi-star"></i> معايير
                  </button>
                )}
              </div>

              {item.students.length > 0 ? (
                <div className="eval-grid">
                  {item.students.map((s, i) => {
                    const ev = DB.evaluations.find(e => 
                      e.studentId === s.id && 
                      e.placeId === item.place.id && 
                      e.sessionId === s._sessId
                    );
                    
                    const scoreRows = item.criteria.map((c, ci) => {
                      if (c.fixed || c.id === '__attendance_fixed__') {
                        const att = computeAttendanceEvalScore(s.id, s._sessId, item.place.id);
                        return { score: att.score, maxScore: c.maxScore, name: c.name };
                      }
                      return { 
                        score: ev?.scores?.[ci]?.score || 0, 
                        maxScore: c.maxScore, 
                        name: c.name 
                      };
                    });
                    
                    const maxTotal = scoreRows.reduce((a, c) => a + c.maxScore, 0);
                    const total = scoreRows.reduce((a, c) => a + c.score, 0);
                    const pct = maxTotal > 0 ? Math.round(total / maxTotal * 100) : 0;
                    const pcC = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
                    const color = avColor(i);
                    
                    return (
                      <div key={s.id} className="eval-student-card">
                        <div className="eval-card-top">
                          <div className="av" style={{ background: `${color}22`, color, width: '38px', height: '38px', fontSize: '13px' }}>
                            {initials(s.name)}
                          </div>
                          <div style={{ flex: '1' }}>
                            <div style={{ fontWeight: '700', fontSize: '13px' }}>{s.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.dept} · {s.level || ''}</div>
                          </div>
                          {!isLocked && (
                            <button className={`btn btn-${ev ? 'success' : 'primary'} btn-sm`}>
                              <i className={`bi ${ev ? 'pencil' : 'plus-lg'}`}></i>
                            </button>
                          )}
                        </div>
                        <div className="eval-card-body">
                          {scoreRows.length > 0 ? (
                            <>
                              <div className="eval-criteria-mini">
                                {scoreRows.map((c, ci) => {
                                  const p2 = c.maxScore > 0 ? Math.round(c.score / c.maxScore * 100) : 0;
                                  return (
                                    <div key={ci}>
                                      <div className="eval-crit-row">
                                        <span className="eval-crit-name">{c.name}</span>
                                        <span className="eval-crit-score">{c.score}/{c.maxScore}</span>
                                      </div>
                                      <div className="eval-score-bar">
                                        <div className="eval-score-fill" style={{ 
                                          width: `${p2}%`, 
                                          background: p2 >= 75 ? 'var(--green)' : p2 >= 50 ? 'var(--amber)' : 'var(--red)' 
                                        }}></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="eval-total-badge">
                                <span className="eval-total-label">المجموع</span>
                                <span className="eval-total-val" style={{ color: pcC }}>{total}/{maxTotal} ({pct}%)</span>
                              </div>
                            </>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text3)', fontSize: '12px' }}>
                              <i className="bi bi-star" style={{ fontSize: '24px', display: 'block', marginBottom: '8px', opacity: '.4' }}></i>
                              {ev ? 'تم التقييم' : 'لم يتم التقييم بعد'}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty">
                  <i className="bi bi-people"></i>
                  <div className="empty-sub">لا توجد طلاب</div>
                </div>
              )}
            </div>
          );
        })}
        {evaluationData.length === 0 && (
          <div className="empty">
            <i className="bi bi-star"></i>
            <div className="empty-title">اختر فترة أو مكان</div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function
const getPlaceCap = (place, sessId) => {
  if (!place) return 0;
  if (place.sessionCaps && place.sessionCaps[String(sessId)] !== undefined) {
    return parseInt(place.sessionCaps[String(sessId)]) || 0;
  }
  if (place.capacity) return parseInt(place.capacity) || 0;
  return 0;
};

export default Evaluations;