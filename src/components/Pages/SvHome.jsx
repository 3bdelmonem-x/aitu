import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, initials, avColor, attStats, todayStr, pillHtml } from '../../utils/helpers';

const SvHome = () => {
  const { userDoc } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [placeFilter, setPlaceFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'attendance', 'place_supervisors', 'places']);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadStudents();
    }
  }, [loading, placeFilter]);

  const loadStudents = () => {
    const myPlaceIds = DB.place_supervisors
      .filter(ps => ps.supervisorId === userDoc?.supervisorId)
      .map(ps => ps.placeId);
    
    const myEnrolls = DB.enrollments.filter(e => myPlaceIds.includes(e.placeId));
    const myStuIds = [...new Set(myEnrolls.map(e => e.studentId))];
    
    let filtered = DB.students.filter(s => myStuIds.includes(s.id));
    
    if (placeFilter) {
      filtered = filtered.filter(s => 
        myEnrolls.some(e => e.studentId === s.id && e.placeId === parseInt(placeFilter))
      );
    }
    
    setStudents(filtered);
    setFilteredStudents(filtered);
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  const myPlaceIds = DB.place_supervisors
    .filter(ps => ps.supervisorId === userDoc?.supervisorId)
    .map(ps => ps.placeId);
  
  const myPlaces = DB.places.filter(p => myPlaceIds.includes(p.id));
  const today = todayStr();
  const todayAtt = DB.attendance.filter(r => r.date === today && students.some(s => s.id === r.studentId));

  return (
    <div>
      <div id="sv-today-banner">
        {/* Will contain any announcements */}
      </div>

      <div className="metrics">
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-people-fill"></i></div>
          <div>
            <div className="m-label">إجمالي طلابي</div>
            <div className="m-value">{students.length}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><i className="bi bi-check-circle-fill"></i></div>
          <div>
            <div className="m-label">حضور اليوم</div>
            <div className="m-value">{todayAtt.filter(r => r.status === 'present').length}</div>
            <div className="m-sub">{today}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#fde8e8', color: '#e02424' }}><i className="bi bi-x-circle-fill"></i></div>
          <div>
            <div className="m-label">غياب اليوم</div>
            <div className="m-value">{todayAtt.filter(r => r.status === 'absent').length}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#edebfe', color: '#7c3aed' }}><i className="bi bi-building-fill"></i></div>
          <div>
            <div className="m-label">أماكني</div>
            <div className="m-value">{myPlaces.length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <h3>طلابي</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="pill pill-gray">{students.length} طالب</span>
            <select 
              className="fc" 
              value={placeFilter} 
              onChange={(e) => setPlaceFilter(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}
            >
              <option value="">كل الأماكن</option>
              {myPlaces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>الاسم</th><th>القسم</th><th>المستوى</th><th>المكان</th>
                <th>حضور كلي</th><th>حضور اليوم</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const enroll = DB.enrollments.find(e => e.studentId === s.id);
                const st = attStats(s.id, enroll?.sessionId, enroll?.placeId, null);
                const todayRec = DB.attendance.find(r => r.studentId === s.id && r.date === today);
                const pc = st.pct >= 75 ? 'var(--green)' : st.pct >= 50 ? 'var(--amber)' : 'var(--red)';
                const color = avColor(i);
                
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="av" style={{ background: `${color}22`, color }}>
                          {initials(s.name)}
                        </div>
                        <div style={{ fontWeight: '600' }}>{s.name}</div>
                      </div>
                    </td>
                    <td><span className="pill pill-gray">{s.dept}</span></td>
                    <td><span style={{ fontSize: '12px', color: 'var(--text3)' }}>{s.level || '—'}</span></td>
                    <td><span style={{ fontSize: '12px' }}>{enroll?.placeId ? DB.places.find(p => p.id === enroll.placeId)?.name : '—'}</span></td>
                    <td><span style={{ fontWeight: '700', color: pc }}>{st.pct}% ({st.present} {st.absent})</span></td>
                    <td dangerouslySetInnerHTML={{ __html: todayRec ? pillHtml(todayRec.status) : '<span class="pill pill-gray"><i class="bi bi-dash-circle"></i> لم يُسجل</span>' }} />
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan="6"><div className="empty"><i className="bi bi-people"></i><div className="empty-title">لا توجد طلاب</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SvHome;