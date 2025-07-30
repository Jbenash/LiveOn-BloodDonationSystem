import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';
import { toast } from 'sonner';
import LoadingSpinner from '../common/LoadingSpinner';

const LoginModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRequestSent, setShowRequestSent] = useState(false);
  const [showEmailRequired, setShowEmailRequired] = useState(false);
  // Removed errorMessage state since we're using Sonner toasts

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost/liveonv2/backend_api/controllers/user_login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
        credentials: "include"
      });

      const data = await response.json();

      if (data.success) {
        onClose(); // Close modal on successful login

        if (data.user.role === "hospital") {
          navigate('/HospitalDashboard');
        } else if (data.user.role === "mro") {
          navigate('/MRODashboard');
        } else if (data.user.role === "admin") {
          navigate('/AdminDashboard');
        } else if (data.user.role === "donor") {
          navigate('/DonorDashboard');
        }

      } else {
        toast.error(data.message || "Login Failed");
      }

    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleForgotPassword = () => {
    if (!formData.username || !formData.username.trim()) {
      setShowEmailRequired(true);
      return;
    }
    setShowForgotPassword(true);
  };

  const handleForgotPasswordSubmit = async (newPassword) => {
    setShowForgotPassword(false);
    setShowRequestSent(false);
    if (!formData.username || !formData.username.trim()) {
      setShowEmailRequired(true);
      return;
    }
    try {
      const res = await fetch('http://localhost/liveonv2/backend_api/controllers/submit_password_reset_request.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.username, requested_password: newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setShowRequestSent(true);
      } else {
        toast.error(data.message || 'Failed to submit password reset request');
      }
    } catch (e) {
      toast.error('Network error');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="login-modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="login-modal">
        <div className="modal-background">
          {/* Removed modal-grid and modal-particles for a static background */}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>

        <div className="login-modal-content">
          <div className="login-header">
            <div className="header-icon">
              <span className="icon-symbol">🔐</span>
            </div>
            <h2 className="login-title">
              <span className="title-line">Welcome</span>
              <span className="title-highlight">Back</span>
            </h2>
            <p className="login-subtitle">
              Sign in to access your account and continue saving lives
            </p>
          </div>

          <div className="login-container">
            <div className="login-card">
              <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="username">Email Address</label>
                  <input
                    type="email"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="form-input"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className="form-input"
                  />
                  <div className="forgot-password-link">
                    <span className="link" onClick={handleForgotPassword}>
                      Forgot Password?
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                >
                                     {isLoading ? (
                     <LoadingSpinner 
                       size="16" 
                       stroke="2" 
                       color="#ffffff" 
                       text="Signing in..."
                       className="button"
                     />
                   ) : (
                    <>
                      <span className="btn-text">Sign In</span>
                      <span className="btn-icon">→</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="login-footer">
            <p>Need help? <span className="link">Contact your administrator</span></p>
          </div>
        </div>
      </div>

      {showForgotPassword && (
        <ForgotPasswordPopup
          isOpen={showForgotPassword}
          email={formData.username}
          onClose={() => setShowForgotPassword(false)}
          onSubmit={handleForgotPasswordSubmit}
        />
      )}
      {showRequestSent && (
        <RequestSentPopup
          isOpen={showRequestSent}
          onClose={() => setShowRequestSent(false)}
        />
      )}
      {showEmailRequired && (
        <EmailRequiredPopup
          isOpen={showEmailRequired}
          onClose={() => setShowEmailRequired(false)}
        />
      )}
    </div>
  );
};

const ForgotPasswordPopup = ({ isOpen, email, onClose, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!isOpen) return null;
  return (
    <div className="login-modal-overlay">
      <div className="login-modal forgot-password-modal">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <div className="login-header">
            <div className="header-icon">
              <span className="icon-symbol">🔑</span>
            </div>
            <h2 className="login-title">Reset Password</h2>
            <p className="login-subtitle">Email: <strong>{email}</strong></p>
          </div>

          <div className="login-container">
            <div className="login-card">
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Enter new password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="login-button"
                disabled={isSubmitting || !newPassword}
                onClick={() => { setIsSubmitting(true); onSubmit(newPassword); }}
              >
                                 {isSubmitting ? (
                   <LoadingSpinner 
                     size="16" 
                     stroke="2" 
                     color="#ffffff" 
                     text="Submitting..."
                     className="button"
                   />
                 ) : (
                  <>
                    <span className="btn-text">Submit</span>
                    <span className="btn-icon">✓</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RequestSentPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="login-modal-overlay">
      <div className="login-modal forgot-password-modal">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <div className="login-header">
            <div className="header-icon">
              <span className="icon-symbol">📧</span>
            </div>
            <h2 className="login-title">Request Sent</h2>
            <p className="login-subtitle">Your request is sent to the admin.<br />Wait for approval.</p>
          </div>

          <div className="login-container">
            <div className="login-card">
              <button className="login-button" onClick={onClose}>
                <span className="btn-text">Close</span>
                <span className="btn-icon">✓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailRequiredPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="login-modal-overlay">
      <div className="login-modal forgot-password-modal">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <div className="login-header">
            <div className="header-icon">
              <span className="icon-symbol">⚠️</span>
            </div>
            <h2 className="login-title">Email Required</h2>
            <p className="login-subtitle">You need to enter your email.</p>
          </div>

          <div className="login-container">
            <div className="login-card">
              <button className="login-button" onClick={onClose}>
                <span className="btn-text">Close</span>
                <span className="btn-icon">✓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 