import React, { useState, useEffect } from 'react';
import { DB } from '../../utils/db';
import { toast } from '../../utils/helpers';

const ReportModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
    sessionId: '',
    placeId: '',
    date: '',
    content: '',
    pdfUrl: '',
    pdfFile: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        sessionId: editData.sessionId || '',
        placeId: editData.placeId || '',
        date: editData.date || '',
        content: editData.content || '',
        pdfUrl: editData.pdfUrl || '',
        pdfFile: null
      });
    } else {
      setFormData({
        sessionId: '',
        placeId: '',
        date: new Date().toISOString().slice(0, 10),
        content: '',
        pdfUrl: '',
        pdfFile: null
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setFormData(prev => ({ ...prev, pdfFile: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.sessionId || !formData.placeId || !formData.date) {
      toast('e', 'يرجى اختيار الفترة والمكان والتاريخ', 'bi-exclamation-circle');
      return;
    }
    if (!formData.pdfFile && !formData.pdfUrl) {
      toast('e', 'ارفع ملف PDF أو أدخل رابطاً', 'bi-exclamation-circle');
      return;
    }
    setLoading(true);
    try {
      await onSave(formData);
      toast('s', editData ? 'تم تحديث التقرير' : 'تم رفع التقرير', 'bi-check-circle');
      onClose();
    } catch (error) {
      toast('e', 'خطأ في الرفع: ' + (error?.message || ''), 'bi-x-circle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: '500px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>{editData ? 'تعديل تقرير' : 'رفع تقرير'}</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="fg-row">
              <div className="form-g">
                <label>الفترة</label>
                <select className="fc" name="sessionId" value={formData.sessionId} onChange={handleChange} required>
                  <option value="">اختر</option>
                  {DB.sessions.filter(s => s.status !== 'done').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-g">
                <label>المكان</label>
                <select className="fc" name="placeId" value={formData.placeId} onChange={handleChange} required>
                  <option value="">اختر مكان</option>
                  {DB.places.filter(p => !formData.sessionId || getPlaceCap(p, parseInt(formData.sessionId)) > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-g">
              <label>التاريخ</label>
              <input type="date" className="fc" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div className="form-g">
              <label>رفع ملف PDF</label>
              <input type="file" className="fc" accept=".pdf,application/pdf" onChange={handleFileChange} />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>أو أدخل رابطاً خارجياً</div>
            </div>
            <div className="form-g">
              <label>رابط خارجي (اختياري)</label>
              <input className="fc" name="pdfUrl" value={formData.pdfUrl} onChange={handleChange} placeholder="https://.../report.pdf" />
            </div>
            <div className="form-g">
              <label>محتوى / ملاحظات (اختياري)</label>
              <textarea className="fc" name="content" value={formData.content} onChange={handleChange} rows="3"></textarea>
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

// Helper
const getPlaceCap = (place, sessId) => {
  if (!place) return 0;
  if (place.sessionCaps && place.sessionCaps[String(sessId)] !== undefined) {
    return parseInt(place.sessionCaps[String(sessId)]) || 0;
  }
  if (place.capacity) return parseInt(place.capacity) || 0;
  return 0;
};

export default ReportModal;