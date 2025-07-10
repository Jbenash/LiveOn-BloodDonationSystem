import React, { useState, useEffect } from 'react';
import './RegistrationModal.css';

const bloodTypes = [
  '', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const hospitalOptions = [
  { id: '', name: 'Select hospital' },
  { id: 'hosp1', name: 'City Hospital' },
  { id: 'hosp2', name: 'General Hospital' },
  { id: 'hosp3', name: 'St. Mary\'s Hospital' },
  { id: 'hosp4', name: 'Red Cross Clinic' },
];

const RegistrationModal = ({ isOpen, onClose, onRegistrationComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    address: '',
    city: '',
    phone: '',
    otp: '',
    hospitalId: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) errs.email = 'Invalid email';
    if (!formData.dob) errs.dob = 'Date of birth is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.phone.trim()) errs.phone = 'Phone number is required';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.confirmPassword !== formData.password) errs.confirmPassword = 'Passwords do not match';
    if (!formData.hospitalId) errs.hospitalId = 'Hospital is required';
    return errs;
  };

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    const errs = validateStep1();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setIsSubmitting(true);
      try {
        const requestData = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          dob: formData.dob,
          address: formData.address,
          city: formData.city,
          phone: formData.phone,
          hospitalId: formData.hospitalId,
        };
        
        const response = await fetch('http://localhost/liveonv2/backend_api/register_donor.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.success) {
          setOtpSent(true);
          setStep(2);
        } else {
          setErrors({ email: result.message || 'Failed to register' });
        }
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({ email: 'Network error. Please try again.' });
      }
      setIsSubmitting(false);
    }
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost/liveonv2/backend_api/verify_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp
        }),
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setFormData({
          fullName: '', email: '', password: '', confirmPassword: '',
          dob: '', address: '', city: '', otp: '', hospitalId: '',
        });
        setStep(1);
        setOtpSent(false);
        onClose && onClose();
        if (onRegistrationComplete) onRegistrationComplete();
      } else {
        setErrors({ otp: result.message || 'Invalid OTP' });
      }
    } catch (error) {
      setErrors({ otp: 'Network error' });
    }
    setIsSubmitting(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose && onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose && onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="registration-modal-overlay"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="registration-modal">
        <div className="modal-background">
          <div className="modal-grid"></div>
          <div className="modal-particles"></div>
        </div>
        
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        
        <div className="registration-modal-content">
          <div className="registration-header">
            <div className="header-icon">
              <span className="icon-symbol">💉</span>
            </div>
            <h2 className="registration-title">
              <span className="title-line">Join the</span>
              <span className="title-highlight">Donation</span>
            </h2>
            <p className="registration-subtitle">
              Become a donor and help save lives in your community
            </p>
          </div>

          <div className="registration-container">
            <div className="registration-card">
              {step === 1 && (
                <form onSubmit={handleSubmitStep1} className="registration-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Enter your full name"
                        required
                      />
                      {errors.fullName && <div className="form-error">{errors.fullName}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Enter your email"
                        required
                      />
                      {errors.email && <div className="form-error">{errors.email}</div>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="dob">Date of Birth</label>
                      <input
                        type="date"
                        id="dob"
                        name="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                      {errors.dob && <div className="form-error">{errors.dob}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Enter your phone number"
                        required
                      />
                      {errors.phone && <div className="form-error">{errors.phone}</div>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="address">Address</label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="form-input address-textarea"
                        placeholder="Enter your full address"
                        rows="3"
                        required
                      />
                      {errors.address && <div className="form-error">{errors.address}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="city">City</label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Enter your city"
                        required
                      />
                      {errors.city && <div className="form-error">{errors.city}</div>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="hospitalId">Preferred Hospital</label>
                      <select
                        id="hospitalId"
                        name="hospitalId"
                        value={formData.hospitalId}
                        onChange={handleChange}
                        className="form-input"
                        required
                      >
                        {hospitalOptions.map(option => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                      {errors.hospitalId && <div className="form-error">{errors.hospitalId}</div>}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Create a password"
                        required
                      />
                      {errors.password && <div className="form-error">{errors.password}</div>}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirm Password</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="form-input"
                        placeholder="Confirm your password"
                        required
                      />
                      {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="registration-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading-spinner">
                        <span className="spinner"></span>
                        Processing...
                      </span>
                    ) : (
                      <>
                        <span className="btn-text">Create Account</span>
                        <span className="btn-icon">→</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleSubmitStep2} className="registration-form">
                  <div className="otp-section">
                    <div className="otp-icon">
                      <span className="icon-symbol">📧</span>
                    </div>
                    <h3 className="otp-title">Verify Your Email</h3>
                    <p className="otp-description">
                      We've sent a verification code to <strong>{formData.email}</strong>
                    </p>
                    
                    <div className="form-group">
                      <label htmlFor="otp">Verification Code</label>
                      <input
                        type="text"
                        id="otp"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
                        className="form-input otp-input"
                        placeholder="Enter 6-digit code"
                        maxLength="6"
                        required
                      />
                      {errors.otp && <div className="form-error">{errors.otp}</div>}
                    </div>

                    <button 
                      type="submit" 
                      className="registration-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="loading-spinner">
                          <span className="spinner"></span>
                          Verifying...
                        </span>
                      ) : (
                        <>
                          <span className="btn-text">Verify Email</span>
                          <span className="btn-icon">✓</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal; 