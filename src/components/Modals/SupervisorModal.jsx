import React, { useState, useEffect } from 'react';
import { DB } from '../../utils/db';
import { toast } from '../../utils/helpers';

const SupervisorModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
    name: '',
    dept: '',
    phone: '',
    email: '',
    gender: '',
    religion: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || `${editData.fname || ''} ${editData.lname || ''}`.trim() || '',
        dept: editData.dept || '',
        phone: editData.phone || '',
        email: editData.email || '',
        gender: editData.gender || '',
        religion: editData.religion || '',
        password: ''
      });
    } else {
      setFormData({
        name: '',
        dept: '',
        phone: '',
        email: '',
        gender: '',
        religion: '',
        password: ''
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.dept) {
      toast('e', 'يرجى ملء الاسم والقسم', 'bi-exclamation-circle');
      return;
    }
    if (!formData.email) {
      toast('e', 'أدخل البريد الإلكتروني', 'bi-exclamation-circle');
      return;
    }
    if (!editData && !formData.password) {
      toast('e', 'أدخل كلمة المرور', 'bi-exclamation-circle');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast('e', 'كلمة المرور 6 أحرف على الأقل', 'bi-exclamation-circle');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      toast('e', 'فشل الحفظ: ' + (error?.message || ''), 'bi-x-circle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '500px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>{editData ? 'تعديل المشرف' : 'إضافة مشرف'}</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="form-g">
              <label>الاسم الكامل</label>
              <input className="fc" name="name" value={formData.name} onChange={handleChange} placeholder="اسم المشرف" required />
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>القسم</label>
                <select className="fc" name="dept" value={formData.dept} onChange={handleChange} required>
                  <option value="">اختر</option>
                  {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-g">
                <label>رقم الهاتف</label>
                <input className="fc" name="phone" value={formData.phone} onChange={handleChange} placeholder="01xxxxxxxxx" />
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>البريد الإلكتروني</label>
                <input className="fc" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@aitu.edu" required />
              </div>
              <div className="form-g">
                <label>الجنس</label>
                <select className="fc" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">اختر</option>
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
            </div>
            <div className="fg-row">
              <div className="form-g">
                <label>كلمة مرور الدخول</label>
                <input className="fc" type="password" name="password" value={formData.password} onChange={handleChange} placeholder={editData ? 'اترك فارغاً إن لم تريد التغيير' : '••••••••'} />
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

export default SupervisorModal;