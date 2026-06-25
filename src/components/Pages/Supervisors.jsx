import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, initials, avColor } from '../../utils/helpers';
import SupervisorModal from '../Modals/SupervisorModal';
import ConfirmModal from '../Modals/ConfirmModal';

const Supervisors = () => {
  const { isAdmin } = useAuth();
  const [supervisors, setSupervisors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [dept, setDept] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['supervisors', 'place_supervisors', 'places', 'enrollments', 'departments']);
      setSupervisors(DB.supervisors || []);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [supervisors, dept, q]);

  const applyFilters = () => {
    const filtered = supervisors.filter(s => {
      if (dept && s.dept !== dept) return false;
      const name = s.name || `${s.fname || ''} ${s.lname || ''}`.trim();
      if (q && !name.toLowerCase().includes(q.toLowerCase()) && !(s.email || '').toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    setFiltered(filtered);
  };

  const handleSave = async (data) => {
    if (editData) {
      // Update
      toast('s', 'تم تحديث المشرف', 'bi-check-circle');
    } else {
      // Add
      toast('s', 'تمت إضافة المشرف', 'bi-check-circle');
    }
    setModalOpen(false);
    setEditData(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      toast('s', 'تم حذف المشرف', 'bi-check-circle');
      setDeleteId(null);
      setConfirmOpen(false);
    }
  };

  const exportCSV = () => {
    const rows = supervisors.map(sv => {
      const myPlaceIds = [...new Set(DB.place_supervisors.filter(ps => ps.supervisorId === sv.id).map(ps => ps.placeId))];
      const places = myPlaceIds.map(id => DB.places.find(p => p.id === id)?.name || '').join('; ');
      const q = v => `"${(v || '').replace(/"/g, '""')}"`;
      const name = sv.name || `${sv.fname || ''} ${sv.lname || ''}`.trim();
      return [q(name), q(sv.dept), q(sv.gender || ''), q(sv.religion || ''), q(sv.phone || ''), q(sv.email || ''), q(places)];
    });
    const csv = [['name', 'dept', 'gender', 'religion', 'phone', 'email', 'places'], ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    a.download = 'AITU_supervisors.csv';
    a.click();
    toast('s', 'تم تصدير المشرفين', 'bi-download');
  };

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div>
      <div className="filters">
        <div className="fg">
          <label>القسم</label>
          <select className="fc" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">الكل</option>
            {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>بحث</label>
          <input type="text" className="fc" placeholder="اسم المشرف..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ marginRight: 'auto', display: 'flex', gap: '8px' }}>
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={exportCSV}><i className="bi bi-download"></i> CSV</button>
              <button className="btn btn-primary" onClick={() => { setEditData(null); setModalOpen(true); }}>
                <i className="bi bi-person-plus"></i> إضافة مشرف
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid-sv">
        {filtered.map((sv, i) => {
          const myPlaceIds = [...new Set(DB.place_supervisors.filter(ps => ps.supervisorId === sv.id).map(ps => ps.placeId))];
          const myPlaces = DB.places.filter(p => myPlaceIds.includes(p.id));
          const myStuIds = [...new Set(DB.enrollments.filter(e => myPlaceIds.includes(e.placeId)).map(e => e.studentId))];
          const c = avColor(i);
          const name = sv.name || `${sv.fname || ''} ${sv.lname || ''}`.trim();
          
          return (
            <div key={sv.id} className="sv-card">
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div className="av" style={{ background: `${c}22`, color: c, width: '44px', height: '44px', fontSize: '14px' }}>
                  {initials(name)}
                </div>
                <div style={{ flex: '1' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{sv.dept}</div>
                  {sv.email && <div style={{ fontSize: '11px', color: 'var(--text3)' }}><i className="bi bi-envelope"></i> {sv.email}</div>}
                  {sv.phone && <div style={{ fontSize: '11px', color: 'var(--text3)' }}><i className="bi bi-phone"></i> {sv.phone}</div>}
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button className="btn-icon" onClick={() => { setEditData(sv); setModalOpen(true); }}>
                      <i className="bi bi-pencil" style={{ fontSize: '12px' }}></i>
                    </button>
                    <button className="btn-icon danger" onClick={() => { setDeleteId(sv.id); setConfirmOpen(true); }}>
                      <i className="bi bi-trash3" style={{ fontSize: '12px' }}></i>
                    </button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '12px' }}>
                <div style={{ textAlign: 'center', flex: '1' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{myStuIds.length}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>طالب</div>
                </div>
                <div style={{ textAlign: 'center', flex: '1' }}>
                  <div style={{ fontSize: '18px', fontWeight: '700' }}>{myPlaces.length}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>مكان</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {myPlaces.map(p => (
                  <div key={p.id} style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="bi bi-building" style={{ color: 'var(--text3)' }}></i>
                    <span>{p.name}</span>
                  </div>
                ))}
                {myPlaces.length === 0 && (
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>لا توجد أماكن مسندة</div>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="empty" style={{ gridColumn: '1/-1' }}>
            <i className="bi bi-person-x"></i>
            <div className="empty-title">لا توجد نتائج</div>
          </div>
        )}
      </div>

      <SupervisorModal 
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSave={handleSave}
        editData={editData}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteId(null); }}
        onConfirm={handleDelete}
        message="هل تريد حذف هذا المشرف؟"
      />
    </div>
  );
};

export default Supervisors;