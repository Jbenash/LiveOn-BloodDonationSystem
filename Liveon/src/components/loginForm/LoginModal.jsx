import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginModal.css';

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
      const response = await fetch("http://localhost/liveonv2/backend_api/user_login.php", {
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
          navigate('/DonorDashboard');
        } else if (data.user.role === "admin") {
          navigate('/AdminDashboard');
        } else if (data.user.role === "donor") {
          navigate('/DonorDashboard');
        }

      } else {
        alert(data.message || "Login Failed");
      }

    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
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

  const handleForgotPasswordSubmit = (newPassword) => {
    // Here you would send the request to the backend
    setShowForgotPassword(false);
    setShowRequestSent(true);
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
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>

        <div className="login-modal-content">
          <div className="login-header">
            <h1>Get Started</h1>
            <p>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Email</label>
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
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <span className="link" style={{ fontSize: '14px', cursor: 'pointer' }} onClick={handleForgotPassword}>
                  Forgot Password?
                </span>
              </div>
            </div>

            <button
              type="submit"
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p><span className="link">Contact your administrator</span></p>
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
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <h2>Reset Password</h2>
          <p>Email: <b>{email}</b></p>
          <input
            type="password"
            placeholder="Enter new password"
            className="form-input"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
          />
          <button
            className="login-button"
            style={{ marginTop: 16 }}
            disabled={isSubmitting || !newPassword}
            onClick={() => { setIsSubmitting(true); onSubmit(newPassword); }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
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
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <h2>Request Sent</h2>
          <p>Your request is sent to the admin.<br />Wait for approval.</p>
          <button className="login-button" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
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
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <h2>Email Required</h2>
          <p>You need to enter your email.</p>
          <button className="login-button" style={{ marginTop: 16 }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 