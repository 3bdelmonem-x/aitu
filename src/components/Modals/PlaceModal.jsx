import React, { useState, useEffect } from 'react';
import { DB } from '../../utils/db';
import { toast, getPlaceSessionTime, getPlaceCap } from '../../utils/helpers';
import { EGYPT_GOVERNORATES, DAY_LABELS, DEFAULT_WORK_DAYS } from '../../utils/constants';

const PlaceModal = ({ isOpen, onClose, onSave, editData }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'offline',
    dept: '',
    governorate: '',
    fieldSpecialization: '',
    contact: '',
    contactPhone: '',
    address: '',
    location: '',
    isExternal: false,
    factoryName: '',
    sessionCaps: {},
    sessionTimes: {}
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        type: editData.type || 'offline',
        dept: editData.dept || '',
        governorate: editData.governorate || '',
        fieldSpecialization: editData.fieldSpecialization || '',
        contact: editData.contact || '',
        contactPhone: editData.contactPhone || '',
        address: editData.address || '',
        location: editData.location || '',
        isExternal: editData.isExternal || false,
        factoryName: editData.factoryName || '',
        sessionCaps: editData.sessionCaps || {},
        sessionTimes: editData.sessionTimes || {}
      });
    } else {
      setFormData({
        name: '',
        type: 'offline',
        dept: '',
        governorate: '',
        fieldSpecialization: '',
        contact: '',
        contactPhone: '',
        address: '',
        location: '',
        isExternal: false,
        factoryName: '',
        sessionCaps: {},
        sessionTimes: {}
      });
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSessionCapChange = (sessId, value) => {
    setFormData(prev => ({
      ...prev,
      sessionCaps: { ...prev.sessionCaps, [sessId]: parseInt(value) || 0 }
    }));
  };

  const handleSessionTimeChange = (sessId, field, value) => {
    setFormData(prev => ({
      ...prev,
      sessionTimes: {
        ...prev.sessionTimes,
        [sessId]: { ...(prev.sessionTimes[sessId] || {}), [field]: value }
      }
    }));
  };

  const handleWorkDayToggle = (sessId, day) => {
    setFormData(prev => {
      const current = prev.sessionTimes[sessId]?.workDays || DEFAULT_WORK_DAYS;
      let workDays;
      if (current.includes(day)) {
        workDays = current.filter(d => d !== day);
      } else {
        workDays = [...current, day];
      }
      if (workDays.length === 0) workDays = DEFAULT_WORK_DAYS;
      return {
        ...prev,
        sessionTimes: {
          ...prev.sessionTimes,
          [sessId]: { ...(prev.sessionTimes[sessId] || {}), workDays }
        }
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast('e', 'أدخل اسم المكان', 'bi-exclamation-circle');
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
      <div className="modal" style={{ width: '620px', maxWidth: '95vw' }}>
        <div className="modal-hd">
          <h4>{editData ? 'تعديل مكان تدريب' : 'إضافة مكان تدريب'}</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-bd">
            <div className="fg-row">
              <div className="form-g">
                <label>اسم المكان</label>
                <input className="fc" name="name" value={formData.name} onChange={handleChange} placeholder="اسم المصنع / المنشأة" required />
              </div>
              <div className="form-g">
                <label>النوع</label>
                <select className="fc" name="type" value={formData.type} onChange={handleChange}>
                  <option value="offline">أوفلاين</option>
                  <option value="online">أونلاين</option>
                </select>
              </div>
            </div>
            
            {formData.isExternal && (
              <div className="form-g">
                <label>اسم المصنع / الشركة</label>
                <input className="fc" name="factoryName" value={formData.factoryName} onChange={handleChange} placeholder="اسم المصنع أو الشركة" />
              </div>
            )}

            <div className="fg-row">
              <div className="form-g">
                <label>القسم</label>
                <select className="fc" name="dept" value={formData.dept} onChange={handleChange}>
                  <option value="">كل الأقسام</option>
                  {DB.departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-g">
                <label>المحافظة</label>
                <select className="fc" name="governorate" value={formData.governorate} onChange={handleChange}>
                  <option value="">اختر المحافظة</option>
                  {EGYPT_GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div className="fg-row">
              <div className="form-g">
                <label>مجال / تخصص المكان</label>
                <input className="fc" name="fieldSpecialization" value={formData.fieldSpecialization} onChange={handleChange} placeholder="مثال: صيانة، برمجيات، تمريض" />
              </div>
              <div className="form-g">
                <label>رقم مسؤول المكان</label>
                <input className="fc" name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="01xxxxxxxxx" />
              </div>
            </div>

            <div className="fg-row">
              <div className="form-g">
                <label>المسؤول / التواصل</label>
                <input className="fc" name="contact" value={formData.contact} onChange={handleChange} placeholder="اسم المسؤول" />
              </div>
              <div className="form-g">
                <label>العنوان</label>
                <input className="fc" name="address" value={formData.address} onChange={handleChange} placeholder="عنوان المكان" />
              </div>
            </div>

            <div className="form-g">
              <label>الإحداثيات (خط العرض, خط الطول)</label>
              <input className="fc" name="location" value={formData.location} onChange={handleChange} placeholder="مثال: 27.162016, 31.185044" />
              <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '3px' }}>
                أدخل إحداثيات GPS مفصولة بفاصلة — مثال: <span style={{ fontFamily: 'monospace' }}>27.162016, 31.185044</span>
              </div>
            </div>

            <div className="form-g">
              <label>السعة والمواعيد لكل فترة</label>
              <div id="pl-session-caps" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface2)', maxHeight: '220px', overflowY: 'auto' }}>
                {DB.sessions.map(s => {
                  const cap = formData.sessionCaps?.[String(s.id)] || 0;
                  const times = formData.sessionTimes?.[String(s.id)] || {};
                  const st = times.startTime || '08:00';
                  const et = times.endTime || '14:00';
                  const wd = times.workDays || DEFAULT_WORK_DAYS;
                  
                  return (
                    <div key={s.id} style={{ padding: '8px 4px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ flex: '1', fontSize: '12px', fontWeight: '600', minWidth: '120px' }}>
                          {s.name}
                          <span dangerouslySetInnerHTML={{ __html: s.status === 'active' ? '<span class="pill pill-green" style="font-size:8px">جارية</span>' : s.status === 'upcoming' ? '<span class="pill pill-blue" style="font-size:8px">قادمة</span>' : '<span class="pill pill-gray" style="font-size:8px">منتهية</span>' }} />
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: '0' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>السعة:</span>
                          <input 
                            type="number" 
                            min="0" 
                            value={cap} 
                            onChange={(e) => handleSessionCapChange(s.id, e.target.value)}
                            style={{ width: '60px', padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: '12px', textAlign: 'center' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: '0', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>فترة من:</span>
                          <input 
                            type="date" 
                            value={times.periodStart || s.start || ''} 
                            onChange={(e) => handleSessionTimeChange(s.id, 'periodStart', e.target.value)}
                            style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: '11px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>إلى:</span>
                          <input 
                            type="date" 
                            value={times.periodEnd || s.end || ''} 
                            onChange={(e) => handleSessionTimeChange(s.id, 'periodEnd', e.target.value)}
                            style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: '11px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: '0', marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>دوام:</span>
                          <input 
                            type="time" 
                            value={st} 
                            onChange={(e) => handleSessionTimeChange(s.id, 'startTime', e.target.value)}
                            style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: '12px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--text3)' }}>–</span>
                          <input 
                            type="time" 
                            value={et} 
                            onChange={(e) => handleSessionTimeChange(s.id, 'endTime', e.target.value)}
                            style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 'var(--r)', fontSize: '12px' }}
                          />
                        </div>
                      </div>
                      <div className="work-days-row">
                        {DAY_LABELS.map((lb, i) => (
                          <label key={i} className={`work-day-chip ${wd.includes(i) ? 'on' : ''}`}>
                            <input 
                              type="checkbox" 
                              checked={wd.includes(i)} 
                              onChange={() => handleWorkDayToggle(s.id, i)}
                              disabled={i === 5}
                            />
                            {lb}
                          </label>
                        ))}
                        <span style={{ fontSize: '10px', color: 'var(--text3)', width: '100%' }}>الجمعة إجازة تلقائياً</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                السعة 0 = غير متاح · حدد فترة التدريب (من–إلى) ومواعيد العمل لكل فترة
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

export default PlaceModal;