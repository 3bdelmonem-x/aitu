import React, { useState } from 'react';
import { toast } from '../../utils/helpers';

const AddCriteriaModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast('e', 'أدخل اسم المعيار', 'bi-exclamation-circle');
      return;
    }
    setLoading(true);
    try {
      await onAdd({ name: name.trim(), maxScore });
      setName('');
      setMaxScore(10);
      onClose();
      toast('s', 'تم إضافة المعيار', 'bi-check-circle');
    } catch (error) {
      toast('e', 'خطأ', 'bi-x-circle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '380px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>إضافة معيار تقييم</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="modal-bd">
          <div className="form-g">
            <label>اسم المعيار</label>
            <input className="fc" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: السلوك، الالتزام..." />
          </div>
          <div className="form-g">
            <label>الدرجة القصوى</label>
            <input type="number" className="fc" value={maxScore} onChange={(e) => setMaxScore(parseInt(e.target.value) || 1)} min="1" max="100" />
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={handleSubmit} disabled={loading}>
            <i className="bi bi-check-lg"></i> إضافة
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCriteriaModal;