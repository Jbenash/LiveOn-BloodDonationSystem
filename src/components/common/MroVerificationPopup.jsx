import React from 'react';
import './MroVerificationPopup.css';

const MroVerificationPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="mro-popup-overlay">
      <div className="mro-popup-card">
        <button className="mro-popup-close-btn" onClick={onClose}>&times;</button>
        <div className="mro-popup-content">
          <h2>Registration Complete!</h2>
          <p>Your registration is complete!</p>
          <p><b>An Medical Registration Officer from you preffered Hospital must verify your eligibility.</b></p>
          <p>Please visit the hospital you entered during registration to complete your verification process.</p>
        </div>
      </div>
    </div>
  );
};

export default MroVerificationPopup; 