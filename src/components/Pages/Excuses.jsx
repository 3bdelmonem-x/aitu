import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, initials, studentName, placeName, sessName } from '../../utils/helpers';
import ConfirmModal from '../Modals/ConfirmModal';

const Excuses = () => {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    dept: '',
    level: '',
    q: ''
  });
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionData, setActionData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['excuse_requests', 'students', 'attendance', 'places', 'sessions', 'departments']);
      setRequests(DB.excuse_requests || []);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const applyFilters = () => {
    const { status, dept, level, q } = filters;
    let filtered = requests;
    
    if (status) filtered = filtered.filter(r => r.status === status);
    if (q) filtered = filtered.filter(r => studentName(r.studentId).toLowerCase().includes(q.toLowerCase()));
    if (dept || level) {
      filtered = filtered.filter(r => {
        const st = DB.students.find(s => s.id === r.studentId);
        if (!st) return false;
        if (dept && st.dept !== dept) return false;
        if (level && st.level !== level) return false;
        return true;
      });
    }
    
    filtered.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    setFiltered(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExcuse = async (requestId, action) => {
    const req = DB.excuse_requests.find(r => r.id === requestId);
    if (!req) return;

    try {
      // Update excuse request status
      // Update attendance record
      const newStatus = action === 'approved' ? 'excused' : 'absent';
      const attRec = DB.attendance.find(r =>
        r.studentId === req.studentId &&
        r.date === req.date &&
        r.sessionId === req.sessionId &&
        r.placeId === req.placeId
      );

      if (attRec?._docId) {
        // Update existing attendance
      } else {
        // Create new attendance record
      }

      toast('s', action === 'approved' ? 'تمت الموافقة — سُجِّل غياب بعذر' : 'تم الرفض — سُجِّل الطالب غائباً', 'bi-check-circle');
      setConfirmOpen(false);
      setActionData(null);
    } catch (error) {
      toast('e', 'خطأ', 'bi-x-circle');
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div>
      <div className="filters">
        <div className="fg">
          <label>الحالة</label>
          <select className="fc" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="pending">في الانتظار</option>
            <option value="approved">موافق عليها</option>
            <option value="rejected">مرفوضة</option>
            <option value="">الكل</option>
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

      <div id="excuses-content">
        {filtered.map(r => {
          const s = DB.students.find(st => st.id === r.studentId);
          const statusPill = r.status === 'pending' ? 
            '<span class="pill pill-purple">في الانتظار</span>' : 
            r.status === 'approved' ? 
            '<span class="pill pill-green">موافق</span>' : 
            '<span class="pill pill-red">مرفوض</span>';
          
          return (
            <div key={r.id} className="excuse-card">
              <div className="av" style={{ background: '#f59e0b22', color: '#f59e0b', width: '40px', height: '40px', fontSize: '13px' }}>
                {initials(s?.name || '')}
              </div>
              <div style={{ flex: '1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '700' }}>{s?.name || '—'}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{s?.dept || ''}</span>
                  <span dangerouslySetInnerHTML={{ __html: statusPill }} />
                  <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: 'auto' }}>{r.date}</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', background: 'var(--surface2)', padding: '10px', borderRadius: 'var(--r)', marginBottom: '8px' }}>
                  {r.reason}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  المكان: {placeName(r.placeId)} · الفترة: {sessName(r.sessionId)}
                </div>
                {r.imageUrl && (
                  <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: '8px' }}>
                    <img src={r.imageUrl} className="excuse-img-preview" alt="مرفق" />
                  </a>
                )}
              </div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button className="btn btn-success btn-sm" onClick={() => { setActionData({ id: r.id, action: 'approved' }); setConfirmOpen(true); }}>
                    <i className="bi bi-check-lg"></i> موافقة
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => { setActionData({ id: r.id, action: 'rejected' }); setConfirmOpen(true); }}>
                    <i className="bi bi-x-lg"></i> رفض
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty">
            <i className="bi bi-envelope-check"></i>
            <div className="empty-title">لا توجد طلبات</div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setActionData(null); }}
        onConfirm={() => {
          if (actionData) {
            handleExcuse(actionData.id, actionData.action);
          }
        }}
        message={actionData?.action === 'approved' ? 'تأكيد الموافقة على طلب العذر؟' : 'تأكيد رفض طلب العذر؟'}
        title={actionData?.action === 'approved' ? 'موافقة على العذر' : 'رفض العذر'}
        type={actionData?.action === 'approved' ? 'success' : 'danger'}
      />
    </div>
  );
};

export default Excuses;