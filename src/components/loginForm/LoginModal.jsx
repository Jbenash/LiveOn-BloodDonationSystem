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
  const [loadingMessage, setLoadingMessage] = useState("Signing in...");
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRequestSent, setShowRequestSent] = useState(false);
  const [showEmailRequired, setShowEmailRequired] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);

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
    setLoadingMessage("Signing in...");

    try {
      const response = await fetch("http://localhost/liveonv2/backend_api/controllers/user_login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData),
        credentials: "include"
      });

      // Get response text first
      const responseText = await response.text();

      // Check if response is ok
      if (!response.ok) {
        console.error('Login response error:', response.status, responseText);
        toast.error(`Login failed: ${response.status} ${response.statusText}`);
        return;
      }

      // Try to parse JSON response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        console.error('Raw response:', responseText);
        toast.error('Login failed: Invalid server response');
        return;
      }

      if (data.success) {
        setLoadingMessage("Preparing dashboard...");

        // Wait for session to be fully established with validation check
        const validateAndNavigate = async () => {
          let attempts = 0;
          const maxAttempts = 3;

          const checkSession = async () => {
            try {
              const sessionResponse = await fetch('http://localhost/liveonv2/backend_api/controllers/check_session.php?simple=true', {
                credentials: 'include'
              });
              const sessionData = await sessionResponse.json();
              return sessionData.valid;
            } catch (error) {
              console.log('Session validation error:', error);
              return false;
            }
          };

          while (attempts < maxAttempts) {
            const isSessionValid = await checkSession();
            if (isSessionValid) {
              console.log('Session validated, navigating...');
              onClose(); // Close modal just before navigation
              try {
                if (data.user.role === "hospital") {
                  navigate('/HospitalDashboard', { replace: true });
                } else if (data.user.role === "mro") {
                  navigate('/MRODashboard', { replace: true });
                } else if (data.user.role === "admin") {
                  navigate('/AdminDashboard', { replace: true });
                } else if (data.user.role === "donor") {
                  navigate('/DonorDashboard', { replace: true });
                }
              } catch (navError) {
                console.log('Navigation error, using window.location:', navError);
                // Fallback to window.location if navigate fails
                if (data.user.role === "hospital") {
                  window.location.href = '/HospitalDashboard';
                } else if (data.user.role === "mro") {
                  window.location.href = '/MRODashboard';
                } else if (data.user.role === "admin") {
                  window.location.href = '/AdminDashboard';
                } else if (data.user.role === "donor") {
                  window.location.href = '/DonorDashboard';
                }
              }
              return;
            }

            attempts++;
            console.log(`Session not ready (attempt ${attempts}/${maxAttempts}), waiting...`);
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // If session validation fails after all attempts, still try to navigate
          console.log('Session validation failed after max attempts, attempting navigation anyway');
          onClose(); // Close modal before fallback navigation
          if (data.user.role === "donor") {
            window.location.href = '/DonorDashboard';
          } else if (data.user.role === "hospital") {
            window.location.href = '/HospitalDashboard';
          } else if (data.user.role === "mro") {
            window.location.href = '/MRODashboard';
          } else if (data.user.role === "admin") {
            window.location.href = '/AdminDashboard';
          }
        };

        await validateAndNavigate();
        setIsLoading(false); // Only reset loading after navigation completes

      } else {
        toast.error(data.message || "Login Failed");
        setIsLoading(false);
      }

    } catch (err) {
      console.error('Login error:', err);
      toast.error('Login failed. Please try again.');
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

  const handleContactAdmin = () => {
    setShowContactAdmin(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="login-modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="login-modal compact">
        <div className="modal-background">
          {/* Static background */}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>

        <div className="login-modal-content">
          {/* Compact Header */}
          <div className="login-header compact">
            <div className="header-icon compact">
              <span className="icon-symbol">🔐</span>
            </div>
            <h2 className="login-title compact">
              <span className="title-line">Welcome</span>
              <span className="title-highlight">Back</span>
            </h2>
            <p className="login-subtitle compact">
              Sign in to access your account
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
                      speed="1"
                      color="#ffffff"
                      text={loadingMessage}
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

            {/* Compact Footer */}
            <div className="login-footer compact">
              <p>Need help? <span className="link" onClick={handleContactAdmin}>Contact admin</span></p>
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
        {showContactAdmin && (
          <ContactAdminPopup
            isOpen={showContactAdmin}
            onClose={() => setShowContactAdmin(false)}
            userEmail={formData.username}
          />
        )}
      </div>
    </div>
  );
};

const ForgotPasswordPopup = ({ isOpen, email, onClose, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay">
      <div className="login-modal compact">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <div className="login-header compact">
            <div className="header-icon compact">
              <span className="icon-symbol">🔑</span>
            </div>
            <h2 className="login-title compact">Reset Password</h2>
            <p className="login-subtitle compact">Email: <strong>{email}</strong></p>
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
                    speed="1"
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
      <div className="login-modal compact">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <div className="login-header compact">
            <div className="header-icon compact">
              <span className="icon-symbol">📧</span>
            </div>
            <h2 className="login-title compact">Request Sent</h2>
            <p className="login-subtitle compact">Your request is sent to the admin.<br />Wait for approval.</p>
          </div>

          <div className="login-form-container compact">
            <button className="login-button compact" onClick={onClose}>
              <span className="btn-text">Close</span>
              <span className="btn-icon">✓</span>
            </button>
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
      <div className="login-modal compact">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <div className="login-header compact">
            <div className="header-icon compact">
              <span className="icon-symbol">⚠️</span>
            </div>
            <h2 className="login-title compact">Email Required</h2>
            <p className="login-subtitle compact">You need to enter your email.</p>
          </div>

          <div className="login-form-container compact">
            <button className="login-button compact" onClick={onClose}>
              <span className="btn-text">Close</span>
              <span className="btn-icon">✓</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactAdminPopup = ({ isOpen, onClose, userEmail }) => {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: userEmail || '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      const response = await fetch('http://localhost/liveonv2/backend_api/controllers/submit_admin_contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          type: 'admin_contact'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('Message sent successfully! Admin will contact you soon.');
        setTimeout(() => {
          onClose();
          setContactForm({ name: '', email: userEmail || '', subject: '', message: '' });
          setSubmitStatus('');
        }, 2000);
      } else {
        setSubmitStatus(data.message || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay">
      <div className="login-modal compact">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="login-modal-content">
          <div className="login-header compact">
            <div className="header-icon compact">
              <span className="icon-symbol">📞</span>
            </div>
            <h2 className="login-title compact">Contact Admin</h2>
            <p className="login-subtitle compact">Send a message to the administrator</p>
          </div>

          <div className="login-form-container compact">
            <form onSubmit={handleContactSubmit} className="login-form compact">
              {submitStatus && (
                <div className={`status-message ${submitStatus.includes('successfully') ? 'success' : 'error'}`}>
                  {submitStatus}
                </div>
              )}

              <div className="form-group compact">
                <label htmlFor="contactName" className="form-label compact">Name</label>
                <input
                  type="text"
                  id="contactName"
                  name="name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  placeholder="Enter your name"
                  required
                  className="form-input compact"
                />
              </div>

              <div className="form-group compact">
                <label htmlFor="contactEmail" className="form-label compact">Email</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="email"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  placeholder="Enter your email"
                  required
                  className="form-input compact"
                />
              </div>

              <div className="form-group compact">
                <label htmlFor="contactSubject" className="form-label compact">Subject</label>
                <input
                  type="text"
                  id="contactSubject"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  placeholder="Enter subject"
                  required
                  className="form-input compact"
                />
              </div>

              <div className="form-group compact">
                <label htmlFor="contactMessage" className="form-label compact">Message</label>
                <textarea
                  id="contactMessage"
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  placeholder="Enter your message"
                  required
                  className="form-input compact contact-textarea"
                  rows="4"
                />
              </div>

              <button
                type="submit"
                className="login-button compact"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading-spinner">
                    <span className="spinner"></span>
                    Sending...
                  </span>
                ) : (
                  <>
                    <span className="btn-text">Send Message</span>
                    <span className="btn-icon">📤</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 
