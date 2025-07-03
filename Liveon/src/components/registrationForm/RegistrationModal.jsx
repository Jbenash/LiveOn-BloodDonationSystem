import React, { useState, useEffect } from 'react';
import './RegistrationModal.css';

const bloodTypes = [
  '', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const RegistrationModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dob: '',
    bloodType: '',
    address: '',
    city: '',
    otp: ''
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
    if (!formData.bloodType) errs.bloodType = 'Blood type is required';
    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.confirmPassword !== formData.password) errs.confirmPassword = 'Passwords do not match';
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
          bloodType: formData.bloodType,
          address: formData.address,
          city: formData.city
        };
        
        const response = await fetch('http://localhost/liveonv2/backend_api/register_donor.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
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
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Registration successful!');
        setFormData({
          fullName: '', email: '', password: '', confirmPassword: '',
          dob: '', bloodType: '', address: '', city: '', otp: ''
        });
        setStep(1);
        setOtpSent(false);
        onClose && onClose();
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
        <button className="modal-close-btn" onClick={onClose}>
          <span>&times;</span>
        </button>
        <div className="registration-modal-content">
          <div className="registration-container">
            <div className="registration-card">
              <h2>Register</h2>
              {step === 1 && (
                <form onSubmit={handleSubmitStep1} className="registration-form">
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    {errors.fullName && <div className="form-error">{errors.fullName}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    {errors.email && <div className="form-error">{errors.email}</div>}
                  </div>
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
                    <label htmlFor="bloodType">Blood Type</label>
                    <select
                      id="bloodType"
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      {bloodTypes.map(type => (
                        <option key={type} value={type}>{type ? type : 'Select blood type'}</option>
                      ))}
                    </select>
                    {errors.bloodType && <div className="form-error">{errors.bloodType}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="address">Address</label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="form-input address-textarea"
                      required
                      rows={3}
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
                      required
                    />
                    {errors.city && <div className="form-error">{errors.city}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
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
                      required
                    />
                    {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                  </div>
                  <button type="submit" className="registration-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              )}
              {step === 2 && (
                <form onSubmit={handleSubmitStep2} className="registration-form">
                  <div className="form-group">
                    <label htmlFor="otp">Enter OTP</label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      className="form-input"
                      required
                      maxLength={6}
                      placeholder="Enter the 6-digit OTP"
                    />
                    {errors.otp && <div className="form-error">{errors.otp}</div>}
                  </div>
                  <button type="submit" className="registration-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Verifying...' : 'Confirm OTP'}
                  </button>
                </form>
              )}
              {otpSent && step === 2 && (
                <div className="otp-info">(For demo, use <b>123456</b> as OTP)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationModal; 