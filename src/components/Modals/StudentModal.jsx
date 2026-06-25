import React, { useState, useEffect } from 'react';
import { DB } from '../../utils/db';
import { toast, normalizeStudentStatus } from '../../utils/helpers';
import { STUDENT_STATUS_OPTIONS } from '../../utils/constants';

const StudentModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    studentStatus: 'مستجد',
    dept: '',
    level: '',
    nationalId: '',
    address: '',
    phone: '',
    gender: '',
    religion: '',
    distribution_type: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        code: editData.code || '',
        name: editData.name || '',
        studentStatus: normalizeStudentStatus(editData.studentStatus || editData.status),
        dept: editData.dept || '',
        level: editData.level || '',
        nationalId: editData.nationalId || '',
        address: editData.address || '',
        phone: editData.phone || '',
        gender: editData.gender || '',
        religion: editData.religion || '',
        distribution_type: editData.distribution_type || ''
      });
    } else {
      setFormData({
        code: '',
        name: '',
        studentStatus: 'مستجد',
        dept: '',
        level: '',
        nationalId: '',
        address: '',
        phone: '',
        gender: '',
        religion: '',
        distribution_type: ''
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim() || !formData.dept) {
      toast('e', 'يرجى ملء الحقول المطلوبة', 'bi-exclamation-circle');
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

  const levels = ['أولى ثانوي', 'تانية ثانوي', 'تالتة ثانوي', 'أولى كلية', 'تانية كلية', 'تالتة كلية', 'رابعة كلية'];

  if (!isOpen) return null;

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '540px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>{editData ? 'تعديل الطالب' : 'إضافة طالب'}</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="fg-row">
              <div className="form-g">
                <label>كود الطالب</label>
                <input className="fc" name="code" value={formData.code} onChange={handleChange} placeholder="2024001" required />
              </div>
              <div className="form-g">
                <label>الاسم الكامل</label>
                <input className="fc" name="name" value={formData.name} onChange={handleChange} placeholder="الاسم" required />
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>حالة الطالب</label>
                <select className="fc" name="studentStatus" value={formData.studentStatus} onChange={handleChange}>
                  {STUDENT_STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-g">
                <label>التخصص (القسم)</label>
                <select className="fc" name="dept" value={formData.dept} onChange={handleChange} required>
                  <option value="">اختر</option>
                  {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>الفرقة</label>
                <select className="fc" name="level" value={formData.level} onChange={handleChange}>
                  <option value="">اختر</option>
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-g">
                <label>نوع التدريب</label>
                <select className="fc" name="distribution_type" value={formData.distribution_type} onChange={handleChange}>
                  <option value="">غير محدد</option>
                  <option value="college">داخلي (توزيع الكلية)</option>
                  <option value="external">خارجي</option>
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>الرقم القومي</label>
                <input className="fc" name="nationalId" value={formData.nationalId} onChange={handleChange} placeholder="14 رقم" />
              </div>
              <div className="form-g">
                <label>عنوان الطالب</label>
                <input className="fc" name="address" value={formData.address} onChange={handleChange} placeholder="العنوان" />
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>التليفون</label>
                <input className="fc" name="phone" value={formData.phone} onChange={handleChange} placeholder="01xxxxxxxxx" />
              </div>
              <div className="form-g">
                <label>الديانة</label>
                <select className="fc" name="religion" value={formData.religion} onChange={handleChange}>
                  <option value="">اختر</option>
                  <option value="مسلم">مسلم</option>
                  <option value="مسيحي">مسيحي</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>النوع</label>
                <select className="fc" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">اختر</option>
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
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

export default StudentModal;