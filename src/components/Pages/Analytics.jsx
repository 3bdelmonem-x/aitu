import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { CHART_COLORS } from '../../utils/constants';

const Analytics = () => {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState({
    sess: '',
    dept: '',
    level: ''
  });
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['students', 'enrollments', 'attendance', 'places', 'supervisors', 'place_supervisors', 'sessions', 'departments']);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      calculateAnalytics();
    }
  }, [filters, loading]);

  const calculateAnalytics = () => {
    const { sess, dept } = filters;
    
    const enrolls = DB.enrollments.filter(e => !sess || e.sessionId === parseInt(sess));
    const stuIds = [...new Set(enrolls.map(e => e.studentId))];
    const students = DB.students.filter(s => 
      stuIds.includes(s.id) && (!dept || s.dept === dept)
    );
    
    const allAtt = DB.attendance.filter(r => 
      (!sess || r.sessionId === parseInt(sess)) && 
      students.some(s => s.id === r.studentId)
    );
    
    const pct = allAtt.length > 0 ? 
      Math.round(allAtt.filter(r => r.status === 'present').length / allAtt.length * 100) : 0;

    // Places chart
    const placesData = DB.places.map(p => ({
      label: p.name,
      value: enrolls.filter(e => e.placeId === p.id).length
    })).filter(d => d.value > 0);

    // Departments chart
    const deptData = DB.departments.map(d => ({
      label: d.name,
      value: students.filter(s => s.dept === d.name).length
    }));

    // Attendance chart
    const attData = DB.places.map(p => {
      const stu = [...new Set(enrolls.filter(e => e.placeId === p.id).map(e => e.studentId))];
      const pa = allAtt.filter(r => stu.includes(r.studentId));
      return {
        label: p.name,
        value: pa.length > 0 ? Math.round(pa.filter(r => r.status === 'present').length / pa.length * 100) : 0
      };
    }).filter(d => d.value > 0);

    // Supervisor chart
    const svData = DB.supervisors.map(sv => {
      const myPl = [...new Set(DB.place_supervisors.filter(ps => ps.supervisorId === sv.id).map(ps => ps.placeId))];
      const name = sv.name || `${sv.fname || ''} ${sv.lname || ''}`.trim();
      return {
        label: name,
        value: [...new Set(enrolls.filter(e => myPl.includes(e.placeId)).map(e => e.studentId))].length
      };
    });

    setAnalyticsData({
      students: students.length,
      places: DB.places.length,
      sessions: DB.sessions.length,
      pct,
      placesData,
      deptData,
      attData,
      svData
    });
  };

  const renderBarChart = (data) => {
    if (!data || !data.length) {
      return <div className="empty"><i className="bi bi-bar-chart"></i><div className="empty-sub">لا توجد بيانات</div></div>;
    }
    const max = Math.max(...data.map(d => d.value), 1);
    return data.map((d, i) => (
      <div key={i} className="bar-row">
        <div className="bar-label" title={d.label}>{d.label}</div>
        <div className="bar-track">
          <div className="bar-fill" style={{ 
            width: `${Math.round(d.value / max * 100)}%`, 
            background: CHART_COLORS[i % CHART_COLORS.length] 
          }}></div>
        </div>
        <div className="bar-val">{d.value}</div>
      </div>
    ));
  };

  if (loading || !analyticsData) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div>
      <div className="metrics">
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><i className="bi bi-people-fill"></i></div>
          <div><div className="m-label">الطلاب</div><div className="m-value">{analyticsData.students}</div></div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><i className="bi bi-building-fill"></i></div>
          <div><div className="m-label">الأماكن</div><div className="m-value">{analyticsData.places}</div></div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#edebfe', color: '#7c3aed' }}><i className="bi bi-calendar-week-fill"></i></div>
          <div><div className="m-label">الفترات</div><div className="m-value">{analyticsData.sessions}</div></div>
        </div>
        <div className="metric-card">
          <div className="m-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><i className="bi bi-graph-up-arrow"></i></div>
          <div><div className="m-label">الحضور</div><div className="m-value">{analyticsData.pct}%</div></div>
        </div>
      </div>

      <div className="filters" style={{ marginBottom: '20px' }}>
        <div className="fg">
          <label>الفترة</label>
          <select className="fc" value={filters.sess} onChange={(e) => setFilters(prev => ({ ...prev, sess: e.target.value }))}>
            <option value="">الكل</option>
            {DB.sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>القسم</label>
          <select className="fc" value={filters.dept} onChange={(e) => setFilters(prev => ({ ...prev, dept: e.target.value }))}>
            <option value="">الكل</option>
            {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid-2col" style={{ marginBottom: '20px' }}>
        <div className="card">
          <div className="card-hd"><h3>الطلاب لكل مكان</h3></div>
          <div className="card-bd">
            <div className="bar-chart">{renderBarChart(analyticsData.placesData)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><h3>الطلاب لكل قسم</h3></div>
          <div className="card-bd">
            <div className="bar-chart">{renderBarChart(analyticsData.deptData)}</div>
          </div>
        </div>
      </div>

      <div className="grid-2col">
        <div className="card">
          <div className="card-hd"><h3>نسبة الحضور لكل مكان</h3></div>
          <div className="card-bd">
            <div className="bar-chart">{renderBarChart(analyticsData.attData)}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><h3>طلاب لكل مشرف</h3></div>
          <div className="card-bd">
            <div className="bar-chart">{renderBarChart(analyticsData.svData)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;