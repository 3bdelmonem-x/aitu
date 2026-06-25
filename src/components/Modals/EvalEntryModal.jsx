import React, { useState, useEffect } from 'react';
import { DB } from '../../utils/db';
import { toast, initials, computeAttendanceEvalScore, getEvalCriteriaForPlace } from '../../utils/helpers';

const EvalEntryModal = ({ isOpen, onClose, onSave, studentId, placeId, sessionId }) => {
  const [scores, setScores] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [criteria, setCriteria] = useState([]);

  useEffect(() => {
    if (isOpen && studentId && placeId) {
      const s = DB.students.find(st => st.id === studentId);
      setStudent(s);
      
      const crit = getEvalCriteriaForPlace(placeId);
      setCriteria(crit);
      
      const attCalc = computeAttendanceEvalScore(studentId, sessionId, placeId);
      const existing = DB.evaluations.find(e => 
        e.studentId === studentId && 
        e.placeId === placeId && 
        e.sessionId === sessionId
      );
      
      const initialScores = crit.map((c, i) => {
        if (c.fixed || c.id === '__attendance_fixed__') {
          return { score: attCalc.score, maxScore: c.maxScore };
        }
        return { score: existing?.scores?.[i]?.score || 0, maxScore: c.maxScore };
      });
      
      setScores(initialScores);
      setNotes(existing?.notes || '');
    }
  }, [isOpen, studentId, placeId, sessionId]);

  const updateScore = (index, value) => {
    const updated = [...scores];
    updated[index].score = Math.min(parseFloat(value) || 0, updated[index].maxScore);
    setScores(updated);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSave({ studentId, placeId, sessionId, scores, notes });
      toast('s', 'تم حفظ التقييم', 'bi-check-circle');
      onClose();
    } catch (error) {
      toast('e', 'خطأ في الحفظ', 'bi-x-circle');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !student) return null;

  const attCalc = computeAttendanceEvalScore(studentId, sessionId, placeId);

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal score-popup">
        <div className="modal-hd">
          <h4>تقييم طالب</h4>
          <button className="modal-x" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="modal-bd">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', padding: '12px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <div className="av" style={{ width: '40px', height: '40px', fontSize: '13px', background: '#3b82f622', color: '#3b82f6' }}>
              {initials(student.name)}
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px' }}>{student.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{DB.places.find(p => p.id === placeId)?.name || '—'}</div>
            </div>
          </div>

          <div id="eval-entry-criteria" style={{ marginBottom: '12px' }}>
            {criteria.map((c, i) => {
              const isFixed = c.fixed || c.id === '__attendance_fixed__';
              const score = scores[i]?.score || 0;
              
              if (isFixed) {
                return (
                  <div key={i} className="eval-criteria-row crit-fixed" style={{ flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="eval-criteria-name">{c.name}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text3)' }}>من {c.maxScore} درجة (تلقائي)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: '1', height: '8px', background: 'var(--surface3)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, score / c.maxScore * 100)}%`, background: 'var(--accent)', borderRadius: '99px' }}></div>
                      </div>
                      <span style={{ fontWeight: '800', fontSize: '16px', minWidth: '48px', textAlign: 'center', color: 'var(--accent)' }}>{score}</span>
                    </div>
                    <div className="att-crit-info">
                      <div className="row"><span>أيام الحضور</span><span>{attCalc.present}</span></div>
                      <div className="row"><span>غياب بعذر</span><span>{attCalc.excused}</span></div>
                      <div className="row"><span>غياب بدون عذر</span><span>{attCalc.absentUnexcused}</span></div>
                      <div className="row"><span>أيام عمل الفترة</span><span>{attCalc.totalWorkDays}</span></div>
                      <div className="row"><span>الدرجة النهائية</span><span>{attCalc.score} / 25</span></div>
                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '6px' }}>{attCalc.rule}</div>
                    </div>
                  </div>
                );
              }

              const pct = c.maxScore > 0 ? Math.round(score / c.maxScore * 100) : 0;
              const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';

              return (
                <div key={i} className="eval-criteria-row" style={{ flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="eval-criteria-name">{c.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text3)' }}>من {c.maxScore} درجة</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="range" 
                      min="0" 
                      max={c.maxScore} 
                      value={score} 
                      onChange={(e) => updateScore(i, e.target.value)}
                      style={{ flex: '1', accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontWeight: '700', fontSize: '14px', minWidth: '28px', textAlign: 'center', color }}>{score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="form-g">
            <label>ملاحظات</label>
            <textarea className="fc" value={notes} onChange={(e) => setNotes(e.target.value)} rows="2" placeholder="ملاحظات اختيارية..."></textarea>
          </div>
        </div>
        <div className="modal-ft">
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={handleSubmit} disabled={loading}>
            <i className="bi bi-check-lg"></i><span> حفظ التقييم</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvalEntryModal;