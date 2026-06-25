import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { 
  toast, initials, avColor, todayStr, 
  normalizeStudentStatus, studentDistLabel, attStats 
} from '../../utils/helpers';
import { CHART_COLORS } from '../../utils/constants';
import Pagination from '../Shared/Pagination';

const Dashboard = () => {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filters, setFilters] = useState({
    dept: '',
    level: '',
    sess: '',
    status: '',
    q: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'attendance', 'excuse_requests', 'sessions', 'departments']);
      setStudents(DB.students || []);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [students, filters]);

  const applyFilters = () => {
    const { dept, level, sess, status, q } = filters;
    const filtered = students.filter(s => {
      const enrolls = DB.enrollments.filter(e => e.studentId === s.id && (!sess || e.sessionId === parseInt(sess)));
      if (status === 'assigned' && !enrolls.some(e => e.placeId)) return false;
      if (status === 'unassigned' && enrolls.some(e => e.placeId)) return false;
      if (dept && s.dept !== dept) return false;
      if (level && s.level !== level) return false;
      if (q && !s.name.toLowerCase().includes(q.toLowerCase()) && !String(s.code || '').includes(q)) return false;
      return true;
    });
    setFilteredStudents(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const exportCSV = () => {
    const headers = ['الكود', 'اسم الطالب', 'حالة الطالب', 'التخصص', 'الفرقة', 'الرقم القومي', 'عنوان الطالب', 'التليفون', 'الديانة', 'النوع'];
    const rows = students.map(s => {
      const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      return [q(s.code), q(s.name), q(normalizeStudentStatus(s.studentStatus || s.status)), q(s.dept), q(s.level || ''), q(s.nationalId || ''), q(s.address || ''), q(s.phone || ''), q(s.religion || ''), q(s.gender || '')];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = 'AITU_students.csv';
    a.click();
    toast('s', 'تم تصدير البيانات', 'bi-download');
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  const activeList = DB.sessions.filter(s => s.status === 'active');
  const allAtt = DB.attendance;
  const present = allAtt.filter(r => r.status === 'present').length;
  const pct = allAtt.length > 0 ? Math.round(present / allAtt.length * 100) : 0;
  const pendingExc = DB.excuse_requests.filter(r => r.status === 'pending').length;

  const pageSize = 20;
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div id="dash-banner">
        {activeList.length > 0 ? (
          <div className="active-session-banner">
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', opacity: '.7', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '8px' }}>
                الفترات الجارية ({activeList.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeList.map(s => {
                  const se = DB.enrollments.filter(e => e.sessionId === s.id);
                  const days = Math.ceil((new Date(s.end) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,.1)', padding: '10px 14px', borderRadius: '10px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>{s.name}</div>
                        <div style={{ fontSize: '11px', opacity: '.7', marginTop: '2px' }}>{s.start} ← {s.end}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '14px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700' }}>{se.length}</div>
                          <div style={{ fontSize: '10px', opacity: '.65' }}>طالب</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700' }}>{se.filter(e => e.placeId).length}</div>
                          <div style={{ fontSize: '10px', opacity: '.65' }}>موزع</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '20px', fontWeight: '700' }}>{days > 0 ? days : 'انتهت'}</div>
                          <div style={{ fontSize: '10px', opacity: '.65' }}>متبقي</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--amber-l)', border: '1px solid #fde68a', borderRadius: 'var(--r-lg)', padding: '16px 20px', marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--amber)' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '20px' }}></i>
            <span>لا توجد فترة تدريب جارية. <strong style={{ cursor: 'pointer', textDecoration: 'underline' }}>أضف فترة جديدة</strong></span>
          </div>
        )}
      </div>

      <div className="metrics">
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-mortarboard-fill"></i></div>
          <div>
            <div className="m-label">إجمالي الطلاب</div>
            <div className="m-value">{students.length}</div>
            <div className="m-sub good"><i className="bi bi-arrow-up"></i>{DB.enrollments.filter(e => e.placeId).length} موزع</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><i className="bi bi-calendar-week-fill"></i></div>
          <div>
            <div className="m-label">فترات التدريب</div>
            <div className="m-value">{DB.sessions.length}</div>
            <div className="m-sub">{activeList.length} جارية</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#edebfe', color: '#7c3aed' }}><i className="bi bi-person-badge-fill"></i></div>
          <div>
            <div className="m-label">المشرفون</div>
            <div className="m-value">{DB.supervisors.length}</div>
            <div className="m-sub">{DB.places.length} مكان</div>
          </div>
        </div>
        <div className="metric-card" style={pendingExc > 0 ? { cursor: 'pointer', borderColor: 'var(--amber)' } : {}}>
          <div className="m-icon" style={{ background: pendingExc > 0 ? 'var(--amber-l)' : '#dcfce7', color: pendingExc > 0 ? 'var(--amber)' : '#16a34a' }}>
            <i className={`bi ${pendingExc > 0 ? 'envelope-exclamation' : 'graph-up-arrow'}`}></i>
          </div>
          <div>
            <div className="m-label">{pendingExc > 0 ? 'أعذار في الانتظار' : 'متوسط الحضور'}</div>
            <div className="m-value">{pendingExc > 0 ? pendingExc : pct + '%'}</div>
            <div className={`m-sub ${pct >= 75 ? 'good' : pct >= 50 ? 'warn' : ''}`}>
              {pendingExc > 0 ? <span style={{ color: 'var(--amber)' }}>تحتاج مراجعة</span> : present + ' من ' + allAtt.length + ' سجل'}
            </div>
          </div>
        </div>
      </div>

      <div className="page-head" style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700' }}>جميع الطلاب</h3>
        <div className="dash-toolbar">
          <div className="fg">
            <select className="fc" value={filters.dept} onChange={(e) => handleFilterChange('dept', e.target.value)} style={{ padding: '7px 10px', fontSize: '13px' }}>
              <option value="">كل الأقسام</option>
              {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <select className="fc" value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)} style={{ padding: '7px 10px', fontSize: '13px' }}>
              <option value="">كل الفرق</option>
              {[...new Set(students.map(s => s.level).filter(Boolean))].map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="fg">
            <select className="fc" value={filters.sess} onChange={(e) => handleFilterChange('sess', e.target.value)} style={{ padding: '7px 10px', fontSize: '13px' }}>
              <option value="">كل الفترات</option>
              {DB.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <select className="fc" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} style={{ padding: '7px 10px', fontSize: '13px' }}>
              <option value="">كل الحالات</option>
              <option value="assigned">موزع</option>
              <option value="unassigned">غير موزع</option>
            </select>
          </div>
          <div className="fg">
            <input type="text" className="fc" placeholder="بحث بالاسم أو الكود..." value={filters.q} onChange={(e) => handleFilterChange('q', e.target.value)} style={{ padding: '7px 10px', fontSize: '13px' }} />
          </div>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><i className="bi bi-download"></i> CSV</button>
          {isAdmin && <button className="btn btn-primary btn-sm"><i className="bi bi-person-plus"></i> إضافة</button>}
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>الكود</th><th>اسم الطالب</th><th>حالة الطالب</th><th>نوع التدريب</th>
                <th>التخصص</th><th>الفرقة</th><th>الرقم القومي</th><th>عنوان الطالب</th>
                <th>التليفون</th><th>الديانة</th><th>النوع</th><th>المكان</th><th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((s, i) => {
                const activeEnroll = DB.enrollments.find(e => e.studentId === s.id && e.placeId && (!filters.sess || e.sessionId === parseInt(filters.sess)));
                const distLabel = () => {
                  const mode = s.distribution_type;
                  const enrolled = DB.enrollments.some(e => e.studentId === s.id && e.placeId);
                  if (mode === 'external') return enrolled ? { text: 'خارجي · موزع', pill: 'pill-purple' } : { text: 'خارجي · بانتظار', pill: 'pill-amber' };
                  if (mode === 'college' || mode === 'internal') return enrolled ? { text: 'داخلي · موزع', pill: 'pill-green' } : { text: 'داخلي · غير موزع', pill: 'pill-blue' };
                  return enrolled ? { text: 'موزع', pill: 'pill-gray' } : { text: 'غير موزع', pill: 'pill-gray' };
                };
                const dl = distLabel();
                return (
                  <tr key={s.id}>
                    <td className="mono">{s.code || '—'}</td>
                    <td style={{ fontWeight: '600' }}>{s.name}</td>
                    <td><span className="pill pill-gray">{normalizeStudentStatus(s.studentStatus || s.status)}</span></td>
                    <td><span className={`pill ${dl.pill}`}>{dl.text}</span></td>
                    <td>{s.dept || '—'}</td>
                    <td>{s.level || '—'}</td>
                    <td className="mono" style={{ fontSize: '11px' }}>{s.nationalId || '—'}</td>
                    <td style={{ fontSize: '11px', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.address || ''}>{s.address || '—'}</td>
                    <td>{s.phone || '—'}</td>
                    <td>{s.religion || '—'}</td>
                    <td>{s.gender || '—'}</td>
                    <td>{activeEnroll?.placeId ? DB.places.find(p => p.id === activeEnroll.placeId)?.name : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn-icon"><i className="bi bi-pencil" style={{ fontSize: '12px' }}></i></button>
                        <button className="btn-icon danger"><i className="bi bi-trash3" style={{ fontSize: '12px' }}></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedStudents.length === 0 && (
                <tr><td colSpan="12"><div className="empty"><i className="bi bi-people"></i><div className="empty-title">لا توجد طلاب</div></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pag">
          <span>{filteredStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredStudents.length)} من {filteredStudents.length}</span>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>

      <div className="grid-2col" style={{ marginTop: '20px' }}>
        <div className="card">
          <div className="card-hd"><h3>آخر الفترات</h3></div>
          <div style={{ padding: '12px' }}>
            {DB.sessions.slice(0, 4).map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: '1' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{s.start} ← {s.end}</div>
                </div>
                <span dangerouslySetInnerHTML={{ __html: s.status === 'active' ? '<span class="pill pill-green"><i class="bi bi-play-circle-fill"></i> جارية</span>' : s.status === 'upcoming' ? '<span class="pill pill-blue"><i class="bi bi-calendar-event"></i> قادمة</span>' : '<span class="pill pill-gray"><i class="bi bi-lock-fill"></i> منتهية</span>' }} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><h3>نسبة الحضور</h3><span style={{ fontSize: '11px', color: 'var(--text3)' }}>الشهر الجاري</span></div>
          <div className="card-bd">
            <div className="bar-chart">
              {students.slice(0, 6).map((s, i) => {
                const st = attStats(s.id, null, null, null);
                if (st.total === 0) return null;
                const c = st.pct >= 75 ? '#22c55e' : st.pct >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={s.id} className="bar-row">
                    <div className="bar-label">{s.name.split(' ').slice(0, 2).join(' ')}</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${st.pct}%`, background: c }}></div></div>
                    <div className="bar-val">{st.pct}%</div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;