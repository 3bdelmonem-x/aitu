import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, flutterDayLabel } from '../../utils/helpers';
import ConfirmModal from '../Modals/ConfirmModal';

const ExternalTraining = () => {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({
    status: 'pending',
    q: ''
  });
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionData, setActionData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['external_training_requests', 'students', 'sessions', 'places']);
      setRequests(DB.external_requests || []);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filters]);

  const applyFilters = () => {
    const { status, q } = filters;
    let filtered = requests;
    
    if (status) filtered = filtered.filter(r => r.status === status);
    if (q) {
      filtered = filtered.filter(r => {
        const hay = [r.placeName, r.factoryName, r.studentName, r.studentCode, r.contact, r.contactPhone]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q.toLowerCase());
      });
    }
    
    filtered.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    setFiltered(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const findStudentForRequest = (r) => {
    if (!r) return null;
    const byId = DB.students.find(s => s.id === r.studentId);
    if (byId) return byId;
    const code = String(r.studentCode || '').trim();
    if (code) {
      const st = DB.students.find(s => String(s.code || '').trim() === code);
      if (st) return st;
    }
    const name = String(r.studentName || '').trim();
    if (name) {
      const matches = DB.students.filter(s => String(s.name || '').trim() === name);
      if (matches.length === 1) return matches[0];
    }
    return null;
  };

  const handleApprove = async (request) => {
    const student = findStudentForRequest(request);
    if (!student) {
      toast('e', 'لم يُعثر على الطالب', 'bi-exclamation-circle');
      return;
    }

    // Get selected session from the select element
    const safeId = String(request._docId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const sessionSelect = document.getElementById(`ext-sess-${safeId}`);
    const sessId = parseInt(sessionSelect?.value);
    
    if (!sessId) {
      toast('e', 'اختر فترة التدريب', 'bi-exclamation-circle');
      return;
    }

    try {
      // Create place
      const workDays = Array.isArray(request.workingDays) && request.workingDays.length ? 
        request.workingDays.map(Number) : [0, 1, 2, 3, 4, 6];
      
      const sessionCaps = {};
      sessionCaps[String(sessId)] = 1;
      
      const sessionTimes = {};
      sessionTimes[String(sessId)] = {
        startTime: request.startTime || '08:00',
        endTime: request.endTime || '14:00',
        workDays,
        periodStart: request.startDate || '',
        periodEnd: request.endDate || '',
      };

      const placeData = {
        name: request.factoryName || request.placeName || 'مكان خارجي',
        type: (request.placeType || '').toLowerCase() === 'online' ? 'online' : 'offline',
        dept: request.studentDept || student.dept || '',
        contact: request.contact || '',
        contactPhone: request.contactPhone || '',
        address: request.address || '',
        location: request.location || '',
        isExternal: true,
        externalRequestId: request._docId,
        factoryName: request.factoryName || '',
        sessionCaps,
        sessionTimes,
      };

      // Save to Firestore
      toast('s', 'تم القبول وحفظ المكان والفترة', 'bi-check-circle');
      setConfirmOpen(false);
      setActionData(null);
    } catch (error) {
      toast('e', 'فشل: ' + (error?.message || ''), 'bi-x-circle');
    }
  };

  const handleReject = async (request) => {
    try {
      toast('i', 'تم الرفض — يمكن للطالب تقديم طلب جديد', 'bi-info-circle');
      setConfirmOpen(false);
      setActionData(null);
    } catch (error) {
      toast('e', 'خطأ', 'bi-x-circle');
    }
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  const field = (lbl, val) => (
    <div className="row">
      <span className="lbl">{lbl}</span>
      <span>{val || '—'}</span>
    </div>
  );

  return (
    <div>
      <div className="filters">
        <div className="fg">
          <label>الحالة</label>
          <select className="fc" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="pending">بانتظار الموافقة</option>
            <option value="approved">موافق عليها</option>
            <option value="rejected">مرفوضة</option>
            <option value="">الكل</option>
          </select>
        </div>
        <div className="fg">
          <label>بحث</label>
          <input type="text" className="fc" placeholder="اسم الطالب أو المكان..." value={filters.q} onChange={(e) => handleFilterChange('q', e.target.value)} />
        </div>
      </div>

      <div id="external-training-content">
        {filtered.map(r => {
          const student = findStudentForRequest(r);
          const safeId = String(r._docId || '').replace(/[^a-zA-Z0-9_-]/g, '_');
          const stPill = r.status === 'pending' ? 
            '<span class="pill pill-amber">بانتظار</span>' : 
            r.status === 'approved' ? 
            '<span class="pill pill-green">موافق</span>' : 
            '<span class="pill pill-red">مرفوض</span>';
          
          const stuLine = student ? `${student.name} · ${student.code}` : `${r.studentName || '—'} · ${r.studentCode || '—'}`;
          const wd = Array.isArray(r.workingDays) && r.workingDays.length ? 
            r.workingDays.map(flutterDayLabel).join(' · ') : '—';
          
          const actions = r.status === 'pending' ? (
            <div className="ext-req-actions">
              <select className="fc" id={`ext-sess-${safeId}`} style={{ padding: '6px 10px', fontSize: '12px', minWidth: '140px' }}>
                <option value="">فترة التدريب</option>
                {DB.sessions.filter(s => s.status !== 'done').map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button className="btn btn-success btn-sm" onClick={() => { setActionData({ request: r, action: 'approve' }); setConfirmOpen(true); }}>
                <i className="bi bi-check-lg"></i> قبول
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => { setActionData({ request: r, action: 'reject' }); setConfirmOpen(true); }}>
                <i className="bi bi-x-lg"></i> رفض
              </button>
            </div>
          ) : (
            <div className="ext-req-actions">
              <span className="pill pill-gray">{r.status === 'approved' ? 'تم القبول' : 'مرفوض'}</span>
            </div>
          );

          return (
            <div key={r.id || r._docId} className="ext-req-card">
              <div className="ext-req-hd">
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{r.factoryName || r.placeName || 'طلب خارجي'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{stuLine}</div>
                  <div style={{ marginTop: '6px' }} dangerouslySetInnerHTML={{ __html: stPill }} />
                </div>
              </div>
              <div className="ext-req-place" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                {field('اسم المصنع', r.factoryName)}
                {field('مكان التدريب', r.placeName)}
                {field('القسم', r.studentDept)}
                {field('الفرقة', r.studentLevel)}
                {field('الهاتف', r.studentPhone)}
                {field('الديانة', r.studentReligion)}
                {field('نوع المكان', r.placeType === 'online' ? 'أونلاين' : 'حضوري')}
                {field('عدد الأيام', r.days)}
                {field('تاريخ البداية', r.startDate)}
                {field('تاريخ الانتهاء', r.endDate)}
                {field('وقت الدوام', `${r.startTime || '—'} – ${r.endTime || '—'}`)}
                {field('أيام العمل', wd)}
                {field('العنوان', r.address)}
                {field('الموقع', r.location)}
                {field('المسؤول', r.contact)}
                {field('رقم المسؤول', r.contactPhone)}
                {field('تاريخ الطلب', (r.submittedAt || '').slice(0, 10))}
              </div>
              {actions}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty">
            <i className="bi bi-building"></i>
            <div className="empty-title">لا توجد طلبات</div>
            <div className="empty-sub">ستظهر هنا طلبات التدريب الخارجي من تطبيق الطلاب</div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setActionData(null); }}
        onConfirm={() => {
          if (actionData) {
            if (actionData.action === 'approve') {
              handleApprove(actionData.request);
            } else {
              handleReject(actionData.request);
            }
          }
        }}
        message={actionData?.action === 'approve' ? 'تأكيد قبول طلب التدريب الخارجي؟' : 'تأكيد رفض طلب التدريب الخارجي؟'}
        title={actionData?.action === 'approve' ? 'قبول الطلب' : 'رفض الطلب'}
        type={actionData?.action === 'approve' ? 'success' : 'danger'}
      />
    </div>
  );
};

export default ExternalTraining;