import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, message, title = 'تأكيد الحذف', type = 'danger' }) => {
  if (!isOpen) return null;

  const icon = type === 'danger' ? 'bi-trash3' : 'bi-exclamation-triangle';
  const iconClass = type === 'danger' ? 'danger' : 'warn';

  return (
    <div className="modal-bg open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal confirm-modal">
        <div className="confirm-bd">
          <div className={`confirm-ico ${iconClass}`}>
            <i className={`bi ${icon}`}></i>
          </div>
          <div className="confirm-title">{title}</div>
          <div className="confirm-msg">{message}</div>
        </div>
        <div className="modal-ft">
          <button className="btn btn-secondary" onClick={onClose}>إلغاء</button>
          <button className={`btn btn-${type}`} onClick={onConfirm}>
            <i className={`bi ${icon}`}></i> تأكيد
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;