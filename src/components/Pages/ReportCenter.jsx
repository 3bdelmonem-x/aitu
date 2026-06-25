import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, normalizeStudentStatus, ATT_MAX_SCORE } from '../../utils/helpers';
import { EGYPT_GOVERNORATES } from '../../utils/constants';

const ReportCenter = () => {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({
    year: '',
    sess: '',
    place: '',
    gov: '',
    level: '',
    dept: '',
    student: '',
    mode: '',
    cls: ''
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'attendance', 'sessions', 'places', 'departments']);
      setLoading(false);
    };
    loadData();
  }, []);

  const buildReportData = () => {
    const { year, sess, place, gov, level, dept, student, mode, cls } = filters;
    
    let enrolls = DB.enrollments.filter(e => e.placeId);
    if (sess) enrolls = enrolls.filter(e => e.sessionId === parseInt(sess));
    if (place) enrolls = enrolls.filter(e => e.placeId === parseInt(place));
    if (student) enrolls = enrolls.filter(e => e.studentId === parseInt(student));

    const rows = enrolls.map(e => {
      const st = DB.students.find(s => s.id === e.studentId);
      const pl = DB.places.find(p => p.id === e.placeId);
      const sessObj = DB.sessions.find(s => s.id === e.sessionId);
      if (!st || !pl) return null;
      
      if (year && sessObj?.academicYear !== year) return null;
      if (gov && pl.governorate !== gov) return null;
      if (level && st.level !== level) return null;
      if (dept && st.dept !== dept) return null;
      if (mode && pl.type !== mode) return null;
      
      const trainingMode = st.distribution_type === 'external' ? 'external' : 
                          (st.distribution_type === 'college' || st.distribution_type === 'internal') ? 'internal' : null;
      if (cls === 'internal' && trainingMode !== 'internal') return null;
      if (cls === 'external' && trainingMode !== 'external') return null;
      
      // Calculate attendance
      const attRecs = DB.attendance.filter(r => 
        r.studentId === st.id && r.sessionId === e.sessionId && r.placeId === e.placeId
      );
      const present = attRecs.filter(r => r.status === 'present').length;
      const absent = attRecs.filter(r => r.status === 'absent').length;
      const excused = attRecs.filter(r => r.status === 'excused').length;
      const totalWorkDays = attRecs.length || 1;
      const score = totalWorkDays > 0 ? Math.round((present / totalWorkDays) * ATT_MAX_SCORE * 10) / 10 : 0;
      
      return {
        student: st,
        place: pl,
        session: sessObj,
        enrollment: e,
        trainingMode: trainingMode || '—',
        modeLabel: pl.type === 'online' ? 'Online' : 'Offline',
        classLabel: trainingMode === 'external' ? 'خارجي' : trainingMode === 'internal' ? 'داخلي' : '—',
        att: { present, absent, excused, totalWorkDays, score, maxScore: ATT_MAX_SCORE }
      };
    }).filter(Boolean);

    // Calculate stats
    const places = [...new Map(rows.map(r => [r.place.id, r.place])).values()];
    const sessions = [...new Map(rows.filter(r => r.session).map(r => [r.session.id, r.session])).values()];
    const govCount = {};
    rows.forEach(r => {
      const g = r.place.governorate || 'غير محدد';
      govCount[g] = (govCount[g] || 0) + 1;
    });
    const modeOn = rows.filter(r => r.place.type === 'online').length;
    const modeOff = rows.filter(r => r.place.type !== 'online').length;
    const intN = rows.filter(r => r.trainingMode === 'internal').length;
    const extN = rows.filter(r => r.trainingMode === 'external').length;

    setReportData({
      rows,
      places,
      sessions,
      govCount,
      modeOn,
      modeOff,
      intN,
      extN,
      total: rows.length
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = () => {
    buildReportData();
    toast('s', 'تم إنشاء التقرير', 'bi-check-circle');
  };

  const printPDF = () => {
    if (printRef.current) {
      window.print();
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  const filterSummary = [
    filters.year && `السنة: ${filters.year}`,
    filters.sess && `الفترة: ${DB.sessions.find(s => s.id === parseInt(filters.sess))?.name}`,
    filters.place && `المكان: ${DB.places.find(p => p.id === parseInt(filters.place))?.name}`,
    filters.gov && `المحافظة: ${filters.gov}`,
    filters.level && `الفرقة: ${filters.level}`,
    filters.dept && `القسم: ${filters.dept}`,
    filters.mode && `النوع: ${filters.mode === 'online' ? 'Online' : 'Offline'}`,
    filters.cls && `التصنيف: ${filters.cls === 'internal' ? 'داخلي' : 'خارجي'}`
  ].filter(Boolean).join(' · ') || 'الكل';

  return (
    <div>
      <div className="page-head" style={{ marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>مركز التقارير والإحصائيات</h3>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
            أنشئ تقارير ديناميكية حسب الفلاتر المختارة
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }} className="no-print">
          <button className="btn btn-primary btn-sm" onClick={generateReport}>
            <i className="bi bi-file-earmark-bar-graph"></i> إنشاء التقرير
          </button>
          {reportData && (
            <button className="btn btn-secondary btn-sm" onClick={printPDF}>
              <i className="bi bi-printer"></i> طباعة PDF
            </button>
          )}
        </div>
      </div>

      <div className="filters no-print">
        <div className="fg">
          <label>السنة الدراسية</label>
          <select className="fc" value={filters.year} onChange={(e) => handleFilterChange('year', e.target.value)}>
            <option value="">الكل</option>
            {[...new Set(DB.sessions.map(s => s.academicYear).filter(Boolean))].sort().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>الفترة التدريبية</label>
          <select className="fc" value={filters.sess} onChange={(e) => handleFilterChange('sess', e.target.value)}>
            <option value="">الكل</option>
            {DB.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>المكان</label>
          <select className="fc" value={filters.place} onChange={(e) => handleFilterChange('place', e.target.value)}>
            <option value="">الكل</option>
            {DB.places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>المحافظة</label>
          <select className="fc" value={filters.gov} onChange={(e) => handleFilterChange('gov', e.target.value)}>
            <option value="">الكل</option>
            {EGYPT_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>الفرقة / المرحلة</label>
          <select className="fc" value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}>
            <option value="">الكل</option>
            {[...new Set(DB.students.map(s => s.level).filter(Boolean))].sort().map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div className="fg">
          <label>القسم / التخصص</label>
          <select className="fc" value={filters.dept} onChange={(e) => handleFilterChange('dept', e.target.value)}>
            <option value="">الكل</option>
            {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>الطالب</label>
          <select className="fc" value={filters.student} onChange={(e) => handleFilterChange('student', e.target.value)}>
            <option value="">الكل</option>
            {DB.students.filter(s => 
              (!filters.level || s.level === filters.level) &&
              (!filters.dept || s.dept === filters.dept)
            ).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>نوع التدريب</label>
          <select className="fc" value={filters.mode} onChange={(e) => handleFilterChange('mode', e.target.value)}>
            <option value="">الكل</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
        <div className="fg">
          <label>تصنيف التدريب</label>
          <select className="fc" value={filters.cls} onChange={(e) => handleFilterChange('cls', e.target.value)}>
            <option value="">الكل</option>
            <option value="internal">داخلي</option>
            <option value="external">خارجي</option>
          </select>
        </div>
      </div>

      <div id="report-center-output" ref={printRef}>
        {reportData ? (
          <div className="report-center-wrap" dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', Tahoma, sans-serif" }}>
            <div style={{ marginBottom: '16px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>مركز التقارير — AITU</h3>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
                تاريخ الإنشاء: {new Date().toLocaleString('ar-EG')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                الفلاتر: {filterSummary}
              </div>
            </div>

            <div className="report-center-summary">
              <div className="rc-metric"><div className="v">{reportData.total}</div><div className="l">طلاب</div></div>
              <div className="rc-metric"><div className="v">{reportData.places.length}</div><div className="l">أماكن</div></div>
              <div className="rc-metric"><div className="v">{reportData.sessions.length}</div><div className="l">فترات</div></div>
              <div className="rc-metric"><div className="v">{reportData.modeOn}</div><div className="l">Online</div></div>
              <div className="rc-metric"><div className="v">{reportData.modeOff}</div><div className="l">Offline</div></div>
              <div className="rc-metric"><div className="v">{reportData.intN}</div><div className="l">داخلي</div></div>
              <div className="rc-metric"><div className="v">{reportData.extN}</div><div className="l">خارجي</div></div>
            </div>

            <div className="rc-section">
              <h4>توزيع المحافظات</h4>
              <table className="rc-table">
                <thead><tr><th>المحافظة</th><th>عدد الطلاب</th></tr></thead>
                <tbody>
                  {Object.entries(reportData.govCount).sort((a, b) => b[1] - a[1]).map(([g, n]) => (
                    <tr key={g}><td>{g}</td><td>{n}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rc-section">
              <h4>الفترات التدريبية</h4>
              <table className="rc-table">
                <thead><tr><th>الفترة</th><th>السنة</th><th>البداية</th><th>النهاية</th><th>الحالة</th><th>عدد الطلاب</th></tr></thead>
                <tbody>
                  {reportData.sessions.map(s => {
                    const n = reportData.rows.filter(r => r.session?.id === s.id).length;
                    return (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.academicYear || '—'}</td>
                        <td>{s.start}</td>
                        <td>{s.end}</td>
                        <td>{s.status}</td>
                        <td>{n}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rc-section">
              <h4>الأماكن</h4>
              <table className="rc-table">
                <thead><tr><th>المكان</th><th>المحافظة</th><th>النوع</th><th>المجال</th><th>مسؤول</th><th>هاتف</th><th>طلاب</th></tr></thead>
                <tbody>
                  {reportData.places.map(p => {
                    const n = reportData.rows.filter(r => r.place.id === p.id).length;
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.governorate || '—'}</td>
                        <td>{p.type === 'online' ? 'Online' : 'Offline'}</td>
                        <td>{p.fieldSpecialization || '—'}</td>
                        <td>{p.contact || '—'}</td>
                        <td>{p.contactPhone || '—'}</td>
                        <td>{n}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="rc-section">
              <h4>الطلاب — تفصيلي</h4>
              <div className="tbl-wrap">
                <table className="rc-table">
                  <thead>
                    <tr>
                      <th>الكود</th><th>الاسم</th><th>الفرقة</th><th>التخصص</th>
                      <th>الفترة</th><th>المكان</th><th>النوع</th><th>التصنيف</th>
                      <th>حالة</th><th>حضور</th><th>بعذر</th><th>بدون عذر</th><th>درجة/{ATT_MAX_SCORE}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((r, i) => (
                      <tr key={i}>
                        <td className="mono">{r.student.code || '—'}</td>
                        <td>{r.student.name}</td>
                        <td>{r.student.level || '—'}</td>
                        <td>{r.student.dept || '—'}</td>
                        <td>{r.session?.name || '—'}</td>
                        <td>{r.place.name}</td>
                        <td>{r.modeLabel}</td>
                        <td>{r.classLabel}</td>
                        <td>{normalizeStudentStatus(r.student.studentStatus)}</td>
                        <td>{r.att.present}</td>
                        <td>{r.att.excused}</td>
                        <td>{r.att.absent}</td>
                        <td>{r.att.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty">
            <i className="bi bi-funnel"></i>
            <div className="empty-title">اختر الفلاتر واضغط «إنشاء التقرير»</div>
            <div className="empty-sub">يمكنك ترك أي فلتر على «الكل» لعرض جميع البيانات</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCenter;