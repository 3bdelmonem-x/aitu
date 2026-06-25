import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, initials, avColor, attStats, monthName, todayStr, pillHtml } from '../../utils/helpers';

const SvAttendance = () => {
  const { userDoc } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({
    place: '',
    month: new Date().toISOString().slice(0, 7),
    q: ''
  });
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
  }, [loading, filters]);

  const loadStudents = () => {
    const myPlaceIds = DB.place_supervisors
      .filter(ps => ps.supervisorId === userDoc?.supervisorId)
      .map(ps => ps.placeId);
    
    const filterPlaceId = parseInt(filters.place) || null;
    const myEnrolls = DB.enrollments.filter(e => 
      myPlaceIds.includes(e.placeId) && (!filterPlaceId || e.placeId === filterPlaceId)
    );
    const myStuIds = [...new Set(myEnrolls.map(e => e.studentId))];
    
    let filtered = DB.students.filter(s => 
      myStuIds.includes(s.id) && 
      (!filters.q || s.name.toLowerCase().includes(filters.q.toLowerCase()))
    );
    
    setStudents(filtered);
    setFilteredStudents(filtered);
  };

  const renderAttDetail = (student) => {
    if (!student) {
      return (
        <div className="card">
          <div className="empty">
            <i className="bi bi-person-lines-fill"></i>
            <div className="empty-title">اختر طالباً</div>
          </div>
        </div>
      );
    }

    const filterPlaceId = parseInt(filters.place) || null;
    const st = attStats(student.id, null, filterPlaceId, filters.month);
    const m = filters.month;
    const pc = st.pct >= 75 ? 'var(--green)' : st.pct >= 50 ? 'var(--amber)' : 'var(--red)';
    const pcBg = st.pct >= 75 ? 'var(--green-l)' : st.pct >= 50 ? 'var(--amber-l)' : 'var(--red-l)';

    // Build calendar (simplified)
    const [y, mn] = m.split('-').map(Number);
    const daysInM = new Date(y, mn, 0).getDate();
    const dayNamesAr = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
    let weeks = [[]];
    for (let blank = 0; blank < new Date(y, mn - 1, 1).getDay(); blank++) weeks[0].push(null);
    for (let d = 1; d <= daysInM; d++) {
      if (weeks[weeks.length - 1].length === 7) weeks.push([]);
      weeks[weeks.length - 1].push(d);
    }
    while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

    return (
      <div className="card">
        <div style={{ padding: '16px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="av" style={{ background: '#3b82f622', color: '#3b82f6', width: '42px', height: '42px', fontSize: '14px' }}>
              {initials(student.name)}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>{student.name}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{student.dept}</div>
            </div>
          </div>
          <div style={{ background: pcBg, borderRadius: 'var(--r)', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: pc }}>{st.pct}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>نسبة الحضور</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text2)', marginBottom: '8px' }}>
            <i className="bi bi-calendar3"></i> {monthName(m)}
          </div>
          <div className="att-table-wrap">
            <table className="att-table-cal">
              <thead><tr>{dayNamesAr.map(d => <th key={d}>{d}</th>)}</tr></thead>
              <tbody>
                {weeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((d, di) => {
                      if (!d) return <td key={di}><div className="day-cell empty-cell">·</div></td>;
                      const ds = `${m}-${String(d).padStart(2, '0')}`;
                      const isToday = ds === todayStr();
                      const rec = st.recs.find(r => r.date === ds);
                      let cls = 'day-cell';
                      if (rec) cls += rec.status === 'present' ? ' present' : rec.status === 'excused' ? ' excused' : rec.status === 'pending' ? ' pending' : ' absent';
                      if (isToday) cls += ' today-cell';
                      return <td key={di}><div className={cls}>{d}</div></td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
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
          <label>الشهر</label>
          <input type="month" className="fc" value={filters.month} onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))} />
        </div>
        <div className="fg">
          <label>بحث</label>
          <input type="text" className="fc" placeholder="اسم الطالب..." value={filters.q} onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))} />
        </div>
      </div>

      <div className="att-layout">
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>الطلاب</span>
            <span className="pill pill-gray">{students.length} طالب</span>
          </div>
          <div id="sv-att-list" style={{ maxHeight: '580px', overflowY: 'auto' }}>
            {students.map((s, i) => {
              const filterPlaceId = parseInt(filters.place) || null;
              const st = attStats(s.id, null, filterPlaceId, filters.month);
              const pc = st.pct >= 75 ? '#16a34a' : st.pct >= 50 ? '#d97706' : '#dc2626';
              const color = avColor(i);
              
              return (
                <div 
                  key={s.id} 
                  className={`att-row ${selectedStudent?.id === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedStudent(s)}
                >
                  <div className="av" style={{ background: `${color}22`, color, width: '34px', height: '34px', fontSize: '11px' }}>
                    {initials(s.name)}
                  </div>
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.dept}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: '0' }}>
                    <span className="stat-chip ok"><i className="bi bi-check-circle-fill"></i>{st.present}</span>
                    <span className="stat-chip bad"><i className="bi bi-x-circle-fill"></i>{st.absent}</span>
                    {st.pending > 0 && <span className="stat-chip wait"><i className="bi bi-hourglass-split"></i>{st.pending}</span>}
                    <span style={{ fontSize: '12px', fontWeight: '800', color: pc, minWidth: '36px', textAlign: 'center' }}>{st.pct}%</span>
                  </div>
                </div>
              );
            })}
            {students.length === 0 && (
              <div className="empty"><i className="bi bi-people"></i><div className="empty-title">لا توجد طلاب</div></div>
            )}
          </div>
        </div>
        <div id="sv-att-detail">
          {renderAttDetail(selectedStudent)}
        </div>
      </div>
    </div>
  );
};

export default SvAttendance;