import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DB, ensureCollections } from '../../utils/db';
import { toast, todayStr } from '../../utils/helpers';
import DeptModal from '../Modals/DeptModal';
import PlaceModal from '../Modals/PlaceModal';
import ConfirmModal from '../Modals/ConfirmModal';

const Management = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [placeModalOpen, setPlaceModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editDeptData, setEditDeptData] = useState(null);
  const [editPlaceData, setEditPlaceData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      await ensureCollections(['departments', 'places', 'students', 'enrollments', 'holidays', 'place_supervisors']);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleDeleteDept = async (id) => {
    const dept = DB.departments.find(d => d.id === id);
    if (DB.students.some(s => s.dept === dept?.name)) {
      toast('e', 'القسم مستخدم لا يمكن حذفه', 'bi-exclamation-circle');
      return;
    }
    setDeleteTarget({ type: 'dept', id });
    setConfirmOpen(true);
  };

  const handleDeletePlace = async (id) => {
    setDeleteTarget({ type: 'place', id });
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'dept') {
        toast('s', 'تم حذف القسم', 'bi-check-circle');
      } else if (deleteTarget.type === 'place') {
        toast('s', 'تم حذف المكان', 'bi-check-circle');
      }
      setConfirmOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      toast('e', 'خطأ', 'bi-x-circle');
    }
  };

  const renderHolidays = () => {
    return (
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-hd">
          <h3>الإجازات الرسمية</h3>
          <button className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg"></i> إضافة
          </button>
        </div>
        <div className="card-bd" id="holidays-list">
          {DB.holidays.map(h => (
            <div key={h.id} className="holiday-row">
              <div style={{ flex: '0 0 140px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>من</label>
                <input type="date" className="fc" value={h.date || h.startDate || ''} />
              </div>
              <div style={{ flex: '0 0 140px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>إلى</label>
                <input type="date" className="fc" value={h.endDate || ''} />
              </div>
              <div style={{ flex: '1' }}>
                <label style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>اسم الإجازة</label>
                <input type="text" className="fc" value={h.name || ''} placeholder="اسم الإجازة" />
              </div>
              <button className="btn-icon danger" style={{ marginTop: '18px' }}>
                <i className="bi bi-trash3"></i>
              </button>
            </div>
          ))}
          {DB.holidays.length === 0 && (
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
              لا توجد إجازات — يوم واحد: اترك «إلى» فارغاً · فترة: حدد من وإلى
            </div>
          )}
        </div>
      </div>
    );
  };

  const ICONS = ['#3b82f6', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444'];

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div>
      {renderHolidays()}

      <div className="grid-mgmt">
        {/* Departments */}
        <div className="card">
          <div className="card-hd">
            <h3>الأقسام</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditDeptData(null); setDeptModalOpen(true); }}>
              <i className="bi bi-plus-lg"></i> إضافة
            </button>
          </div>
          <div className="card-bd" id="dept-list">
            {DB.departments.map((d, i) => (
              <div key={d.id} className="mgmt-item">
                <div className="mgmt-ico" style={{ background: `${ICONS[i % 5]}22`, color: ICONS[i % 5] }}>
                  <i className="bi bi-folder-fill"></i>
                </div>
                <div className="mgmt-info">
                  <div className="mgmt-name">{d.name}</div>
                  <div className="mgmt-sub">{d.code || ''} · {DB.students.filter(s => s.dept === d.name).length} طالب</div>
                </div>
                <div className="mgmt-actions">
                  <button className="btn-icon" onClick={() => { setEditDeptData(d); setDeptModalOpen(true); }}>
                    <i className="bi bi-pencil" style={{ fontSize: '12px' }}></i>
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteDept(d.id)}>
                    <i className="bi bi-trash3" style={{ fontSize: '12px' }}></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Internal Places */}
        <div className="card">
          <div className="card-hd">
            <h3>أماكن التدريب</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditPlaceData(null); setPlaceModalOpen(true); }}>
              <i className="bi bi-plus-lg"></i> إضافة
            </button>
          </div>
          <div className="card-bd" id="places-list">
            {DB.places.filter(p => !p.isExternal).map((p, i) => {
              const totalEnrolled = DB.enrollments.filter(e => e.placeId === p.id).length;
              return (
                <div key={p.id} className="mgmt-item">
                  <div className="mgmt-ico" style={{ background: `${ICONS[i % 5]}22`, color: ICONS[i % 5] }}>
                    <i className={`bi ${p.type === 'online' ? 'bi-globe' : 'bi-building-fill'}`}></i>
                  </div>
                  <div className="mgmt-info">
                    <div className="mgmt-name">{p.name}</div>
                    <div className="mgmt-sub">
                      {p.dept || 'كل الأقسام'} · {totalEnrolled} طالب
                      {p.governorate && ` · ${p.governorate}`}
                    </div>
                  </div>
                  <div className="mgmt-actions">
                    <button className="btn-icon" onClick={() => { setEditPlaceData(p); setPlaceModalOpen(true); }}>
                      <i className="bi bi-pencil" style={{ fontSize: '12px' }}></i>
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDeletePlace(p.id)}>
                      <i className="bi bi-trash3" style={{ fontSize: '12px' }}></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* External Places */}
        <div className="card">
          <div className="card-hd">
            <h3>أماكن التدريب الخارجية</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="pill pill-purple">{DB.places.filter(p => p.isExternal).length}</span>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditPlaceData(null); setPlaceModalOpen(true); }}>
                <i className="bi bi-plus-lg"></i> إضافة
              </button>
            </div>
          </div>
          <div className="card-bd" id="external-places-list">
            {DB.places.filter(p => p.isExternal).map((p, i) => {
              const totalEnrolled = DB.enrollments.filter(e => e.placeId === p.id).length;
              return (
                <div key={p.id} className="mgmt-item">
                  <div className="mgmt-ico" style={{ background: '#7c3aed22', color: '#7c3aed' }}>
                    <i className="bi bi-building"></i>
                  </div>
                  <div className="mgmt-info">
                    <div className="mgmt-name">{p.name}</div>
                    <div className="mgmt-sub">
                      {p.factoryName || 'خارجي'} · {totalEnrolled} طالب
                    </div>
                  </div>
                  <div className="mgmt-actions">
                    <button className="btn-icon" onClick={() => { setEditPlaceData(p); setPlaceModalOpen(true); }}>
                      <i className="bi bi-pencil" style={{ fontSize: '12px' }}></i>
                    </button>
                    <button className="btn-icon danger" onClick={() => handleDeletePlace(p.id)}>
                      <i className="bi bi-trash3" style={{ fontSize: '12px' }}></i>
                    </button>
                  </div>
                </div>
              );
            })}
            {DB.places.filter(p => p.isExternal).length === 0 && (
              <div style={{ padding: '16px', fontSize: '12px', color: 'var(--text3)', textAlign: 'center' }}>
                لا توجد أماكن خارجية بعد — تُنشأ تلقائياً عند قبول طلبات الطلاب
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DeptModal
        isOpen={deptModalOpen}
        onClose={() => { setDeptModalOpen(false); setEditDeptData(null); }}
        editData={editDeptData}
        onSave={async (data) => {
          toast('s', editDeptData ? 'تم التحديث' : 'تمت الإضافة', 'bi-check-circle');
          setDeptModalOpen(false);
          setEditDeptData(null);
        }}
      />

      <PlaceModal
        isOpen={placeModalOpen}
        onClose={() => { setPlaceModalOpen(false); setEditPlaceData(null); }}
        editData={editPlaceData}
        onSave={async (data) => {
          toast('s', editPlaceData ? 'تم التحديث' : 'تمت الإضافة', 'bi-check-circle');
          setPlaceModalOpen(false);
          setEditPlaceData(null);
        }}
      />

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
        onConfirm={confirmDelete}
        message="هل أنت متأكد من الحذف؟"
      />
    </div>
  );
};

export default Management;