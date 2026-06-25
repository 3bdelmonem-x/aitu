import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const Topbar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [activeSessions, setActiveSessions] = useState([]);
  
  const pageTitles = {
    '/dashboard': 'لوحة التحكم',
    '/sessions': 'فترات التدريب',
    '/distribution': 'توزيع الطلاب والمشرفين',
    '/supervisors': 'المشرفون',
    '/attendance': 'الحضور والغياب',
    '/excuses': 'طلبات الأعذار',
    '/external-training': 'التدريب الخارجي',
    '/report-center': 'مركز التقارير',
    '/analytics': 'الإحصائيات',
    '/evaluations': 'التقييمات',
    '/reports': 'التقارير',
    '/management': 'الإعدادات',
    '/sv-home': 'طلابي',
    '/sv-attendance': 'الحضور',
    '/sv-evaluations': 'التقييمات',
    '/sv-reports': 'التقارير',
  };

  useEffect(() => {
    const q = query(collection(db, 'sessions'), where('status', '==', 'active'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveSessions(sessions);
    });
    return unsubscribe;
  }, []);

  const title = pageTitles[location.pathname] || 'AITU';
  const crumb = `AITU / ${title}`;

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div className="topbar-crumb">{crumb}</div>
      </div>
      <div className="topbar-right">
        <div className="session-badge">
          <span className="s-dot"></span>
          <span>
            {activeSessions.length > 0 
              ? `${activeSessions.length} فترة جارية` 
              : 'لا توجد فترة جارية'}
          </span>
        </div>
        <button className="tb-btn" onClick={logout}>
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default Topbar;