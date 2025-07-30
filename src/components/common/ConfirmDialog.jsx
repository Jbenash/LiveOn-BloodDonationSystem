import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ open, title = 'Confirm', message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'Cancel' }) => {
  if (!open) return null;
  return (
    <div className="confirm-dialog-overlay" onClick={onCancel}>
      <div className="confirm-dialog-box" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-btn confirm" onClick={onConfirm}>{confirmText}</button>
          <button className="confirm-dialog-btn cancel" onClick={onCancel}>{cancelText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 