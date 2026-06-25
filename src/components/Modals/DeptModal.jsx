import React, { useState, useEffect } from 'react';
import { toast } from '../../utils/helpers';

const DeptModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        code: editData.code || ''
      });
    } else {
      setFormData({ name: '', code: '' });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast('e', 'أدخل اسم القسم', 'bi-exclamation-circle');
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
      <div className="modal" style={{ width: '400px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>{editData ? 'تعديل القسم' : 'إضافة قسم'}</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="form-g">
              <label>اسم القسم</label>
              <input className="fc" name="name" value={formData.name} onChange={handleChange} placeholder="تكنولوجيا المعلومات" required />
            </div>
            <div className="form-g">
              <label>الرمز</label>
              <input className="fc" name="code" value={formData.code} onChange={handleChange} placeholder="IT" />
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

export default DeptModal;