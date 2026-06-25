import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { isAdmin, userDoc, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const adminNavItems = [
    { path: '/dashboard', icon: 'bi-grid-1x2-fill', label: 'لوحة التحكم' },
    { path: '/sessions', icon: 'bi-calendar-week-fill', label: 'الفترات' },
    { path: '/distribution', icon: 'bi-diagram-3-fill', label: 'التوزيع' },
    { path: '/supervisors', icon: 'bi-person-badge-fill', label: 'المشرفون' },
    { path: '/attendance', icon: 'bi-calendar-check-fill', label: 'الحضور' },
    { path: '/excuses', icon: 'bi-envelope-exclamation-fill', label: 'الأعذار' },
    { path: '/external-training', icon: 'bi-building', label: 'تدريب خارجي' },
    { path: '/analytics', icon: 'bi-bar-chart-fill', label: 'الإحصائيات' },
    { path: '/report-center', icon: 'bi-clipboard-data-fill', label: 'مركز التقارير' },
    { path: '/evaluations', icon: 'bi-star-fill', label: 'التقييمات' },
    { path: '/reports', icon: 'bi-file-text-fill', label: 'التقارير' },
    { path: '/management', icon: 'bi-sliders', label: 'الإعدادات' },
  ];

  const svNavItems = [
    { path: '/sv-home', icon: 'bi-people-fill', label: 'طلابي' },
    { path: '/sv-attendance', icon: 'bi-calendar-check-fill', label: 'الحضور' },
    { path: '/sv-evaluations', icon: 'bi-star-fill', label: 'التقييمات' },
    { path: '/sv-reports', icon: 'bi-file-text-fill', label: 'التقارير' },
  ];

  const navItems = isAdmin() ? adminNavItems : svNavItems;
  const name = userDoc ? `${userDoc.fname || ''} ${userDoc.lname || ''}`.trim() : 'مستخدم';
  const initials = name.split(' ').slice(0, 2).map(w => w[0] || '').join('');

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <img src="/fff.png" alt="AITU" />
      </div>
      
      <div id="admin-nav" className={isAdmin() ? '' : 'hidden-nav'}>
        <div className="sb-section">الرئيسية</div>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <i className={`bi ${item.icon}`}></i>
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">{initials || 'م'}</div>
          <div>
            <div className="sb-user-name">{name}</div>
            <div className="sb-user-role">{isAdmin() ? 'مدير النظام' : 'مشرف'}</div>
          </div>
        </div>
        <button className="sb-logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i> تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;