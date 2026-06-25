import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, initials, avColor, attStats, monthName, pillHtml, todayStr } from '../../utils/helpers';
import Filters from '../Shared/Filters';
import AttModal from '../Modals/AttModal';

const Attendance = () => {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filters, setFilters] = useState({
    sess: '',
    place: '',
    dept: '',
    level: '',
    month: new Date().toISOString().slice(0, 7),
    q: ''
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'attendance', 'sessions', 'places', 'departments']);
      setStudents(DB.students || []);
      setLoading(false);
    };
    loadData();
  }, []);

  const getFilteredStudents = () => {
    const { sess, place, dept, level, q, month } = filters;
    const enrollsFilter = DB.enrollments.filter(e => 
      e.placeId && 
      (!sess || e.sessionId === parseInt(sess)) &&
      (!place || e.placeId === parseInt(place))
    );
    const enrolledIds = [...new Set(enrollsFilter.map(e => e.studentId))];
    return students.filter(s => 
      enrolledIds.includes(s.id) &&
      (!dept || s.dept === dept) &&
      (!level || s.level === level) &&
      (!q || s.name.toLowerCase().includes(q.toLowerCase()))
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setSelectedStudent(null);
  };

  const renderAttDetail = (student) => {
    if (!student) return (
      <div className="card">
        <div className="empty">
          <i className="bi bi-person-lines-fill"></i>
          <div className="empty-title">اختر طالباً</div>
          <div className="empty-sub">لعرض سجل حضوره</div>
        </div>
      </div>
    );

    const st = attStats(student.id, parseInt(filters.sess) || null, parseInt(filters.place) || null, filters.month);
    const m = filters.month;
    const pc = st.pct >= 75 ? 'var(--green)' : st.pct >= 50 ? 'var(--amber)' : 'var(--red)';
    const pcBg = st.pct >= 75 ? 'var(--green-l)' : st.pct >= 50 ? 'var(--amber-l)' : 'var(--red-l)';

    // Build calendar
    const [y, mn] = m.split('-').map(Number);
    const daysInM = new Date(y, mn, 0).getDate();
    const recs = DB.attendance.filter(r => 
      r.studentId === student.id && 
      (!filters.sess || r.sessionId === parseInt(filters.sess)) &&
      (!filters.place || r.placeId === parseInt(filters.place)) &&
      r.date.startsWith(m)
    );
    const dayMap = {};
    recs.forEach(r => { const d = parseInt(r.date.slice(8)); dayMap[d] = r; });
    const dayNamesAr = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];
    let weeks = [[]];
    for (let blank = 0; blank < new Date(y, mn - 1, 1).getDay(); blank++) weeks[0].push(null);
    for (let d = 1; d <= daysInM; d++) {
      if (weeks[weeks.length - 1].length === 7) weeks.push([]);
      weeks[weeks.length - 1].push(d);
    }
    while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

    const sorted = [...st.recs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15);

    return (
      <div className="card">
        <div style={{ padding: '16px 20px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="av" style={{ background: '#3b82f622', color: '#3b82f6', width: '42px', height: '42px', fontSize: '14px' }}>
              {initials(student.name)}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '15px' }}>{student.name}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text3)' }}>{student.dept} · {student.level || ''}</div>
            </div>
          </div>
          <div style={{ background: pcBg, borderRadius: 'var(--r)', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: pc }}>{st.pct}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>نسبة الحضور</div>
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text2)', marginBottom: '8px' }}>
            <i className="bi bi-calendar3"></i> {monthName(m)}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '11px', flexWrap: 'wrap' }}>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--green-l)', border: '1px solid #a7f3d0', borderRadius: '3px', marginLeft: '4px' }}></span>حاضر</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--red-l)', border: '1px solid #fca5a5', borderRadius: '3px', marginLeft: '4px' }}></span>غائب</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--amber-l)', border: '1px solid #fde68a', borderRadius: '3px', marginLeft: '4px' }}></span>غياب بعذر</span>
            <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: 'var(--purple-l)', border: '1px solid #c4b5fd', borderRadius: '3px', marginLeft: '4px' }}></span>انتظار</span>
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
                      const rec = dayMap[d];
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
        <div style={{ padding: '14px 20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text2)', marginBottom: '10px' }}>
            <i className="bi bi-clock-history"></i> آخر السجلات
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>التاريخ</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>المكان</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>الحالة</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>الوقت</th>
                {isAdmin && <th style={{ borderBottom: '1px solid var(--border)' }}></th>}
              </tr>
            </thead>
            <tbody>
              {sorted.map(r => {
                const isToday = r.date === todayStr();
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', ...(isToday ? { background: 'var(--accent-l)' } : {}) }}>
                    <td style={{ padding: '9px 12px', fontFamily: 'monospace' }}>
                      {r.date}{isToday && <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700' }}> (اليوم)</span>}
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: '11px', color: 'var(--text3)' }}>
                      {DB.places.find(p => p.id === r.placeId)?.name || '—'}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span dangerouslySetInnerHTML={{ __html: pillHtml(r.status) }} />
                    </td>
                    <td style={{ padding: '9px 12px' }}>{r.checkIn || '—'}{r.checkOut ? ` - ${r.checkOut}` : ''}</td>
                    {isAdmin && (
                      <td style={{ padding: '9px 12px' }}>
                        <button className="btn-icon danger" style={{ width: '24px', height: '24px' }}>
                          <i className="bi bi-trash3" style={{ fontSize: '10px' }}></i>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan="5"><div className="empty"><i className="bi bi-calendar-x"></i><div className="empty-sub">لا توجد سجلات</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const filteredStudents = getFilteredStudents();

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div>
      <Filters
        filters={{
          sess: { label: 'الفترة', type: 'select', value: filters.sess, options: DB.sessions.map(s => ({ value: s.id, label: s.name })) },
          place: { label: 'المكان', type: 'select', value: filters.place, options: DB.places.filter(p => !filters.sess || getPlaceCap(p, parseInt(filters.sess)) > 0).map(p => ({ value: p.id, label: p.name })) },
          dept: { label: 'القسم', type: 'select', value: filters.dept, options: DB.departments.map(d => ({ value: d.name, label: d.name })) },
          level: { label: 'الفرقة', type: 'select', value: filters.level, options: [...new Set(students.map(s => s.level).filter(Boolean))].map(l => ({ value: l, label: l })) },
          month: { label: 'الشهر', type: 'month', value: filters.month },
          q: { label: 'بحث', type: 'text', value: filters.q, placeholder: 'اسم الطالب...' }
        }}
        onChange={handleFilterChange}
      >
        {isAdmin && (
          <div style={{ marginRight: 'auto', display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <i className="bi bi-plus-lg"></i> تسجيل يدوي
            </button>
          </div>
        )}
      </Filters>

      <div className="att-layout">
        <div>
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>الطلاب الموزعين</span>
            <span className="pill pill-gray">{filteredStudents.length} طالب</span>
          </div>
          <div id="att-list" style={{ maxHeight: '580px', overflowY: 'auto' }}>
            {filteredStudents.map((s, i) => {
              const st = attStats(s.id, parseInt(filters.sess) || null, parseInt(filters.place) || null, filters.month);
              const pc = st.pct >= 75 ? '#16a34a' : st.pct >= 50 ? '#d97706' : '#dc2626';
              const color = avColor(i);
              return (
                <div 
                  key={s.id} 
                  className={`att-row ${selectedStudent?.id === s.id ? 'active' : ''}`}
                  onClick={() => setSelectedStudent(s)}
                >
                  <div className="av" style={{ background: `${color}22`, color: color, width: '34px', height: '34px', fontSize: '11px' }}>
                    {initials(s.name)}
                  </div>
                  <div style={{ flex: '1', minWidth: '0' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.dept}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: '0' }}>
                    <span className={`stat-chip ok`}><i className="bi bi-check-circle-fill"></i>{st.present}</span>
                    <span className={`stat-chip bad`}><i className="bi bi-x-circle-fill"></i>{st.absent}</span>
                    {st.pending > 0 && <span className={`stat-chip wait`}><i className="bi bi-hourglass-split"></i>{st.pending}</span>}
                    <span style={{ fontSize: '12px', fontWeight: '800', color: pc, minWidth: '36px', textAlign: 'center' }}>{st.pct}%</span>
                  </div>
                </div>
              );
            })}
            {filteredStudents.length === 0 && (
              <div className="empty"><i className="bi bi-people"></i><div className="empty-title">لا توجد طلاب موزعين</div></div>
            )}
          </div>
        </div>
        <div id="att-detail">
          {renderAttDetail(selectedStudent)}
        </div>
      </div>

      <AttModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => {}}
      />
    </div>
  );
};

// Helper function for getPlaceCap
const getPlaceCap = (place, sessId) => {
  if (!place) return 0;
  if (place.sessionCaps && place.sessionCaps[String(sessId)] !== undefined) {
    return parseInt(place.sessionCaps[String(sessId)]) || 0;
  }
  if (place.capacity) return parseInt(place.capacity) || 0;
  return 0;
};

export default Attendance;