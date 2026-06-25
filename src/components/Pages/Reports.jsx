import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, placeName, sessName, studentName, sessionIsLocked } from '../../utils/helpers';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sess: '',
    place: '',
    dept: '',
    level: '',
    date: ''
  });
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['reports', 'daily_reports', 'students', 'enrollments', 'places', 'sessions', 'departments']);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadReports();
    }
  }, [loading, filters]);

  const loadReports = () => {
    const { sess, place, dept, level, date } = filters;
    
    // Supervisor reports
    let supervisorReports = DB.reports.filter(r => {
      if (sess && r.sessionId !== parseInt(sess)) return false;
      if (place && r.placeId !== parseInt(place)) return false;
      if (date && r.date !== date) return false;
      return true;
    }).map(r => ({ ...r, _source: 'supervisor' }));

    // Student daily reports
    let studentReports = DB.daily_reports.filter(r => {
      if (sess && r.sessionId !== parseInt(sess)) return false;
      if (place && r.placeId !== parseInt(place)) return false;
      if (date && r.date !== date) return false;
      return true;
    }).map(r => ({ ...r, _source: 'student' }));

    // Apply dept and level filters
    if (dept || level) {
      const filterByStudent = (report) => {
        const student = DB.students.find(s => s.id === report.studentId);
        if (!student) return false;
        if (dept && student.dept !== dept) return false;
        if (level && student.level !== level) return false;
        return true;
      };
      
      supervisorReports = supervisorReports.filter(r => {
        // For supervisor reports, check if any student in that place matches
        const enrolls = DB.enrollments.filter(e => e.placeId === r.placeId && e.sessionId === r.sessionId);
        return enrolls.some(e => {
          const student = DB.students.find(s => s.id === e.studentId);
          if (!student) return false;
          if (dept && student.dept !== dept) return false;
          if (level && student.level !== level) return false;
          return true;
        });
      });
      
      studentReports = studentReports.filter(filterByStudent);
    }

    const allReports = [...supervisorReports, ...studentReports].sort((a, b) => 
      (b.date || '').localeCompare(a.date || '')
    );
    
    setReports(allReports);
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
            {DB.places.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
          <label>التاريخ</label>
          <input type="date" className="fc" value={filters.date} onChange={(e) => handleFilterChange('date', e.target.value)} />
        </div>
        <div style={{ marginRight: 'auto' }}>
          <button className="btn btn-primary">
            <i className="bi bi-plus-lg"></i> رفع تقرير
          </button>
        </div>
      </div>

      <div id="reports-content">
        {reports.map(r => {
          const p = DB.places.find(pl => pl.id === r.placeId);
          const isStu = r._source === 'student';
          const isLocked = sessionIsLocked(r.sessionId);
          const linkUrl = isStu ? r.driveLink : r.pdfUrl;
          const linkLabel = isStu ? 'فتح Drive' : 'فتح PDF';
          const linkIcon = isStu ? 'bi-file-earmark-word' : 'bi-file-earmark-pdf';
          const uploaderLabel = isStu ? studentName(r.studentId) : (r.uploadedByName || '—');
          
          return (
            <div key={r.id || r._docId} className="report-card">
              <div className="report-hd">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="av" style={{ 
                    background: isStu ? '#3b82f622' : '#8b5cf622', 
                    color: isStu ? '#3b82f6' : '#8b5cf6', 
                    width: '32px', 
                    height: '32px', 
                    fontSize: '11px' 
                  }}>
                    {isStu ? 'ط' : 'م'}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>
                      {isStu ? <span className="pill pill-blue" style={{ fontSize: '10px' }}>طالب</span> : ''} {uploaderLabel}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      {p?.name || '—'} | {sessName(r.sessionId)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="report-date">{r.date}</span>
                  {linkUrl && (
                    <a className="pdf-preview-link" href={linkUrl} target="_blank" rel="noopener noreferrer" style={{ 
                      background: isStu ? '#eff6ff' : 'var(--red-l)', 
                      color: isStu ? '#3b82f6' : 'var(--red)' 
                    }}>
                      <i className={`bi ${linkIcon}`}></i> {linkLabel}
                    </a>
                  )}
                  {isAdmin && !isLocked && !isStu && (
                    <button className="btn-icon">
                      <i className="bi bi-pencil" style={{ fontSize: '11px' }}></i>
                    </button>
                  )}
                  {isAdmin && !isLocked && (
                    <button className="btn-icon danger">
                      <i className="bi bi-trash3" style={{ fontSize: '11px' }}></i>
                    </button>
                  )}
                </div>
              </div>
              {(r.content || r.notes) && (
                <div className="report-body" style={{ background: 'var(--surface2)', padding: '12px', borderRadius: 'var(--r)' }}>
                  {r.content || r.notes}
                </div>
              )}
            </div>
          );
        })}
        {reports.length === 0 && (
          <div className="empty">
            <i className="bi bi-file-text"></i>
            <div className="empty-title">لا توجد تقارير</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;