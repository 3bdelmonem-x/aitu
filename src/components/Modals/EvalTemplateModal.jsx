import React, { useState, useEffect } from 'react';
import { DB } from '../../utils/db';
import { toast, getEvalCriteriaForPlace } from '../../utils/helpers';

const EvalTemplateModal = ({ isOpen, onClose, onSave, placeId }) => {
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && placeId) {
      const existing = getEvalCriteriaForPlace(placeId);
      setCriteria(existing);
    }
  }, [isOpen, placeId]);

  const addCriteria = () => {
    setCriteria([...criteria, { name: '', maxScore: 10 }]);
  };

  const updateCriteria = (index, field, value) => {
    const updated = [...criteria];
    updated[index][field] = value;
    setCriteria(updated);
  };

  const removeCriteria = (index) => {
    if (criteria[index]?.fixed) {
      toast('w', 'معيار الحضور ثابت', 'bi-lock');
      return;
    }
    const updated = criteria.filter((_, i) => i !== index);
    setCriteria(updated);
  };

  const handleSubmit = async () => {
    const valid = criteria.every(c => c.name && c.name.trim());
    if (!valid) {
      toast('e', 'أدخل اسم لكل معيار', 'bi-exclamation-circle');
      return;
    }
    setLoading(true);
    try {
      await onSave({ criteria, placeId });
      toast('s', 'تم حفظ المعايير', 'bi-check-circle');
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
      <div className="modal" style={{ width: '500px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>معايير التقييم للمكان</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="modal-bd">
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
            المكان: <strong>{DB.places.find(p => p.id === placeId)?.name || '—'}</strong>
          </div>
          <div id="eval-criteria-list" style={{ marginBottom: '12px' }}>
            {criteria.map((c, i) => {
              const isFixed = c.fixed || c.id === '__attendance_fixed__';
              return (
                <div key={i} className={`eval-criteria-row ${isFixed ? 'crit-fixed' : ''}`}>
                  {isFixed ? (
                    <>
                      <span className="eval-criteria-name">
                        {c.name} <span className="pill pill-blue" style={{ fontSize: '10px' }}><i className="bi bi-lock-fill"></i> ثابت</span>
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text3)', flexShrink: '0' }}>/ {c.maxScore} درجة</span>
                    </>
                  ) : (
                    <>
                      <input 
                        className="fc" 
                        value={c.name} 
                        onChange={(e) => updateCriteria(i, 'name', e.target.value)}
                        placeholder="اسم المعيار"
                        style={{ flex: '1', marginLeft: '8px' }}
                      />
                      <input 
                        type="number" 
                        className="fc" 
                        value={c.maxScore} 
                        onChange={(e) => updateCriteria(i, 'maxScore', parseInt(e.target.value) || 0)}
                        style={{ width: '60px', marginLeft: '8px' }}
                      />
                      <button className="btn-icon danger" onClick={() => removeCriteria(i)}>
                        <i className="bi bi-x" style={{ fontSize: '11px' }}></i>
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <button className="btn btn-secondary btn-sm" onClick={addCriteria}>
            <i className="bi bi-plus-lg"></i> إضافة معيار
          </button>
        </div>
        <div className="modal-ft">
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={handleSubmit} disabled={loading}>
            <i className="bi bi-check-lg"></i><span> حفظ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvalTemplateModal;