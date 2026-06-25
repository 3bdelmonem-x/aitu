import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { setToastFn } from '../../utils/helpers';

let toastInstance = null;

export const showToast = (type, message, icon = 'bi-info-circle') => {
  if (toastInstance) {
    toastInstance(message, type, icon);
  }
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastInstance = (message, type, icon) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type, icon }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3500);
    };
    
    // Set toast function for helpers
    setToastFn(toastInstance);
    
    return () => {
      toastInstance = null;
      setToastFn(null);
    };
  }, []);

  return ReactDOM.createPortal(
    <div className="toast-wrap">
      {toasts.map(({ id, message, type, icon }) => (
        <div key={id} className={`toast ${type}`}>
          <i className={`bi ${icon}`}></i>
          <span>{message}</span>
        </div>
      ))}
    </div>,
    document.getElementById('toast-root') || document.body
  );
};

const Toast = () => {
  return <ToastContainer />;
};

export default Toast;