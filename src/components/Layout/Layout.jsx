import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Toast from '../Shared/Toast';
import { loadCoreData } from '../../utils/db';

const Layout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      loadCoreData();
    }
  }, [user]);

  if (loading) {
    return <div className="page-loader"><div className="spin"></div><span>جاري التحميل...</span></div>;
  }

  return (
    <div className="shell">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="page-area">
          <Outlet />
        </div>
      </div>
      <Toast />
    </div>
  );
};

export default Layout;
