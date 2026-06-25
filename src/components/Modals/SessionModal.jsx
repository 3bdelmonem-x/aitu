import React, { useState, useEffect } from 'react';
import { DB } from '../../utils/db';
import { toast } from '../../utils/helpers';

const SessionModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'offline',
    start: '',
    end: '',
    academicYear: '',
    status: 'upcoming',
    notes: '',
    depts: ['__all__']
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        type: editData.type || 'offline',
        start: editData.start || '',
        end: editData.end || '',
        academicYear: editData.academicYear || '',
        status: editData.status || 'upcoming',
        notes: editData.notes || '',
        depts: editData.depts || (editData.dept ? [editData.dept] : ['__all__'])
      });
    } else {
      setFormData({
        name: '',
        type: 'offline',
        start: '',
        end: '',
        academicYear: '',
        status: 'upcoming',
        notes: '',
        depts: ['__all__']
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleDept = (deptName) => {
    setFormData(prev => {
      let depts = [...prev.depts];
      if (deptName === '__all__') {
        return { ...prev, depts: ['__all__'] };
      }
      if (depts.includes('__all__')) {
        depts = [];
      }
      const index = depts.indexOf(deptName);
      if (index >= 0) {
        depts.splice(index, 1);
      } else {
        depts.push(deptName);
      }
      if (depts.length === 0) {
        depts = ['__all__'];
      }
      return { ...prev, depts };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast('e', 'أدخل اسم الفترة', 'bi-exclamation-circle');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast('e', 'خطأ في الحفظ', 'bi-x-circle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '540px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>{editData ? 'تعديل فترة التدريب' : 'إضافة فترة تدريب'}</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="fg-row">
              <div className="form-g">
                <label>اسم الفترة</label>
                <input className="fc" name="name" value={formData.name} onChange={handleChange} placeholder="تدريب صيف 2025" required />
              </div>
              <div className="form-g">
                <label>النوع</label>
                <select className="fc" name="type" value={formData.type} onChange={handleChange}>
                  <option value="online">أونلاين</option>
                  <option value="offline">أوفلاين</option>
                  <option value="both">مختلط</option>
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>تاريخ البداية</label>
                <input type="date" className="fc" name="start" value={formData.start} onChange={handleChange} />
              </div>
              <div className="form-g">
                <label>تاريخ الانتهاء</label>
                <input type="date" className="fc" name="end" value={formData.end} onChange={handleChange} />
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>السنة الدراسية</label>
                <input className="fc" name="academicYear" value={formData.academicYear} onChange={handleChange} placeholder="25/26" />
              </div>
              <div className="form-g">
                <label>الحالة</label>
                <select className="fc" name="status" value={formData.status} onChange={handleChange}>
                  <option value="upcoming">قادمة</option>
                  <option value="active">جارية</option>
                  <option value="done">منتهية</option>
                </select>
              </div>
            </div>
            <div className="form-g">
              <label>الأقسام المستهدفة</label>
              <div className="dept-chips">
                <span className={`dept-chip ${formData.depts.includes('__all__') ? 'on' : ''}`} onClick={() => toggleDept('__all__')}>
                  كل الأقسام
                </span>
                {DB.departments.map(d => (
                  <span 
                    key={d.id} 
                    className={`dept-chip ${formData.depts.includes(d.name) ? 'on' : ''}`}
                    onClick={() => toggleDept(d.name)}
                  >
                    {d.name}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
                اختر «كل الأقسام» أو قسماً واحداً أو أكثر
              </div>
            </div>
            <div className="form-g">
              <label>ملاحظات</label>
              <textarea className="fc" name="notes" value={formData.notes} onChange={handleChange} rows="2"></textarea>
            </div>
          </div>
          <div className="modal-ft">
            <button type="button" className="btn btn-secondary" onClick={onClose}>إلغاء</button>
            <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
              <i className="bi bi-check-lg"></i><span> حفظ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionModal;