import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, initials, avColor } from '../../utils/helpers';

const SvEvaluations = () => {
  const { userDoc } = useAuth();
  const [evaluations, setEvaluations] = useState([]);
  const [filteredEvals, setFilteredEvals] = useState([]);
  const [filters, setFilters] = useState({
    place: '',
    q: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'evaluations', 'eval_templates', 'place_supervisors', 'places']);
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
    const myPlaceIds = DB.place_supervisors
      .filter(ps => ps.supervisorId === userDoc?.supervisorId)
      .map(ps => ps.placeId);
    
    const filterPlaceId = parseInt(filters.place) || null;
    const myEnrolls = DB.enrollments.filter(e => 
      myPlaceIds.includes(e.placeId) && (!filterPlaceId || e.placeId === filterPlaceId)
    );
    
    const evalData = myEnrolls.map(e => {
      const student = DB.students.find(s => s.id === e.studentId);
      const place = DB.places.find(p => p.id === e.placeId);
      const ev = DB.evaluations.find(ev => 
        ev.studentId === e.studentId && ev.placeId === e.placeId && ev.sessionId === e.sessionId
      );
      const tpl = DB.eval_templates.find(t => t.placeId === e.placeId);
      
      return { enrollment: e, student, place, evaluation: ev, template: tpl };
    }).filter(d => d.student && d.place);
    
    let filtered = evalData;
    if (filters.q) {
      filtered = filtered.filter(d => 
        d.student.name.toLowerCase().includes(filters.q.toLowerCase())
      );
    }
    
    setEvaluations(evalData);
    setFilteredEvals(filtered);
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  const myPlaceIds = DB.place_supervisors
    .filter(ps => ps.supervisorId === userDoc?.supervisorId)
    .map(ps => ps.placeId);
  const myPlaces = DB.places.filter(p => myPlaceIds.includes(p.id));

  return (
    <div>
      <div className="filters">
        <div className="fg">
          <label>المكان</label>
          <select className="fc" value={filters.place} onChange={(e) => setFilters(prev => ({ ...prev, place: e.target.value }))}>
            <option value="">الكل</option>
            {myPlaces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>بحث</label>
          <input type="text" className="fc" placeholder="اسم الطالب..." value={filters.q} onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))} />
        </div>
      </div>

      <div id="sv-evaluations-content">
        {filteredEvals.map((item, i) => {
          const color = avColor(i);
          const maxTotal = item.template?.criteria?.reduce((sum, c) => sum + c.maxScore, 0) || 0;
          const total = item.evaluation?.scores?.reduce((sum, s) => sum + s.score, 0) || 0;
          const pct = maxTotal > 0 ? Math.round(total / maxTotal * 100) : 0;
          const pcC = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
          
          return (
            <div key={i} className="eval-student-card">
              <div className="eval-card-top">
                <div className="av" style={{ background: `${color}22`, color, width: '38px', height: '38px', fontSize: '13px' }}>
                  {initials(item.student.name)}
                </div>
                <div style={{ flex: '1' }}>
                  <div style={{ fontWeight: '700', fontSize: '13px' }}>{item.student.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{item.student.dept}</div>
                </div>
              </div>
              <div className="eval-card-body">
                {item.evaluation && item.template?.criteria?.length ? (
                  <>
                    <div className="eval-criteria-mini">
                      {item.template.criteria.map((c, ci) => {
                        const sc = item.evaluation.scores?.[ci]?.score || 0;
                        const p2 = c.maxScore > 0 ? Math.round(sc / c.maxScore * 100) : 0;
                        return (
                          <div key={ci}>
                            <div className="eval-crit-row">
                              <span className="eval-crit-name">{c.name}</span>
                              <span className="eval-crit-score">{sc}/{c.maxScore}</span>
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
                    لم يتم التقييم
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredEvals.length === 0 && (
          <div className="empty">
            <i className="bi bi-star"></i>
            <div className="empty-title">لا توجد تقييمات</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SvEvaluations;