import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast } from '../../utils/helpers';

const SvReports = () => {
  const { userDoc } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filters, setFilters] = useState({
    place: '',
    date: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['reports', 'daily_reports', 'students', 'enrollments', 'place_supervisors', 'places', 'sessions']);
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
    const myPlaceIds = DB.place_supervisors
      .filter(ps => ps.supervisorId === userDoc?.supervisorId)
      .map(ps => ps.placeId);
    
    const filterPlaceId = parseInt(filters.place) || null;
    const filterDate = filters.date;

    // Supervisor reports
    const svReports = DB.reports
      .filter(r => 
        myPlaceIds.includes(r.placeId) &&
        (!filterPlaceId || r.placeId === filterPlaceId) &&
        (!filterDate || r.date === filterDate)
      )
      .map(r => ({ ...r, _source: 'supervisor' }));

    // Student daily reports
    const myEnrolls = DB.enrollments.filter(e => myPlaceIds.includes(e.placeId));
    const myStuIds = [...new Set(myEnrolls.map(e => e.studentId))];
    
    const stuReports = DB.daily_reports
      .filter(r => 
        myStuIds.includes(r.studentId) &&
        myPlaceIds.includes(r.placeId) &&
        (!filterPlaceId || r.placeId === filterPlaceId) &&
        (!filterDate || r.date === filterDate)
      )
      .map(r => ({ ...r, _source: 'student' }));

    const allReports = [...svReports, ...stuReports].sort((a, b) => 
      (b.date || '').localeCompare(a.date || '')
    );
    
    setReports(allReports);
    setFilteredReports(allReports);
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
          <label>التاريخ</label>
          <input type="date" className="fc" value={filters.date} onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))} />
        </div>
        <div style={{ marginRight: 'auto' }}>
          <button className="btn btn-primary">
            <i className="bi bi-plus-lg"></i> رفع تقرير
          </button>
        </div>
      </div>

      <div id="sv-reports-content">
        {filteredReports.map(r => {
          const p = DB.places.find(pl => pl.id === r.placeId);
          const isStu = r._source === 'student';
          const linkUrl = isStu ? r.driveLink : r.pdfUrl;
          const linkLabel = isStu ? 'فتح Drive' : 'فتح PDF';
          const linkIcon = isStu ? 'bi-file-earmark-word' : 'bi-file-earmark-pdf';
          const uploaderLabel = isStu ? DB.students.find(s => s.id === r.studentId)?.name || '—' : r.uploadedByName || '—';
          
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
                      {p?.name || '—'} | {DB.sessions.find(s => s.id === r.sessionId)?.name || '—'}
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
        {filteredReports.length === 0 && (
          <div className="empty">
            <i className="bi bi-file-text"></i>
            <div className="empty-title">لا توجد تقارير</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SvReports;