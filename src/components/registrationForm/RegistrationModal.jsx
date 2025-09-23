import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import './RegistrationModal.css';
import LoadingSpinner from '../common/LoadingSpinner';

const bloodTypes = [
  '', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
];

const sriLankaDistricts = [
  '', 'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala', 'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya'
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
    district: '',
    phone: '',
    otp: '',
    hospitalId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 'weak', score: 0, color: '#ff4444' });

  // Password strength calculation function
  const calculatePasswordStrength = (password) => {
    if (!password) {
      return { strength: 'weak', score: 0, color: '#ff4444' };
    }

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Add points for each criteria met
    Object.values(checks).forEach(check => {
      if (check) score += 20;
    });

    // Bonus points for length
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Determine strength level
    let strength, color;
    if (score >= 90) {
      strength = 'strong';
      color = '#00C851';
    } else if (score >= 60) {
      strength = 'moderate';
      color = '#ffbb33';
    } else {
      strength = 'weak';
      color = '#ff4444';
    }

    return { strength, score, color };
  };

  // Handle password change with strength calculation
  const handlePasswordChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, password: value }));
    setPasswordStrength(calculatePasswordStrength(value));
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
      // Fetch hospitals when modal opens
      fetch('http://localhost/liveonv2/backend_api/controllers/get_hospitals.php', {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          console.log('Hospitals API response:', data);
          if (data.success) {
            setHospitals(data.hospitals);
            console.log('Hospitals set:', data.hospitals);
          } else {
            console.error('Failed to fetch hospitals:', data.error);
          }
        })
        .catch(error => {
          console.error('Error fetching hospitals:', error);
        });
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, fullName: value }));

    // Real-time validation for name with toast notifications
    if (value.trim()) {
      // Check if name contains only letters and spaces
      if (!/^[a-zA-Z\s]*$/.test(value)) {
        toast.error('Name must contain only letters and spaces');
      }
      // Check if name is not purely numeric
      const nameWithoutSpaces = value.replace(/\s/g, '');
      if (/^\d+$/.test(nameWithoutSpaces)) {
        toast.error('Name cannot be purely numeric');
      }
    }
  };

  const handleDateOfBirthChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, dob: value }));

    // Real-time validation for date of birth
    if (value) {
      const birthDate = new Date(value);
      const currentDate = new Date();

      // Check if date is not in the future
      if (birthDate > currentDate) {
        toast.error('Date of birth cannot be in the future');
        return;
      }

      // Calculate age
      const age = currentDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = currentDate.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) ? age - 1 : age;

      // Check age eligibility
      if (actualAge < 18) {
        toast.error('You must be at least 18 years old to donate blood');
      } else if (actualAge > 65) {
        toast.error('You must be 65 years old or younger to donate blood');
      }
    }
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;

    // Only allow digits
    const phoneRegex = /^[0-9]*$/;

    if (phoneRegex.test(value)) {
      setFormData(prev => ({ ...prev, phone: value }));
    } else {
      // Show error for invalid characters
      toast.error('Phone number can only contain numbers');
    }
  };

  const validateStep1 = () => {
    const errs = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else {
      // Check if name contains only letters and spaces
      if (!/^[a-zA-Z\s]+$/.test(formData.fullName.trim())) {
        errs.fullName = 'Name must contain only letters and spaces';
      }
      // Check if name is not purely numeric
      const nameWithoutSpaces = formData.fullName.trim().replace(/\s/g, '');
      if (/^\d+$/.test(nameWithoutSpaces)) {
        errs.fullName = 'Name cannot be purely numeric';
      }
      // Check minimum length
      if (formData.fullName.trim().length < 2) {
        errs.fullName = 'Name must be at least 2 characters long';
      }
    }

    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) errs.email = 'Invalid email';

    // Date of birth validation
    if (!formData.dob) {
      errs.dob = 'Date of birth is required';
    } else {
      // Calculate age from date of birth
      const birthDate = new Date(formData.dob);
      const currentDate = new Date();
      const age = currentDate.getFullYear() - birthDate.getFullYear();
      const monthDiff = currentDate.getMonth() - birthDate.getMonth();

      // Adjust age if birthday hasn't occurred this year
      const actualAge = monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate()) ? age - 1 : age;

      // Check if age is within donation eligibility range (18 to 65)
      if (actualAge < 18) {
        errs.dob = 'You must be at least 18 years old to donate blood';
      } else if (actualAge > 65) {
        errs.dob = 'You must be 65 years old or younger to donate blood';
      }

      // Check if date is not in the future
      if (birthDate > currentDate) {
        errs.dob = 'Date of birth cannot be in the future';
      }
    }

    if (!formData.address.trim()) errs.address = 'Address is required';
    if (!formData.district) errs.district = 'District is required';

    // Phone number validation
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required';
    } else {
      // Check if phone contains only digits
      if (!/^[0-9]+$/.test(formData.phone.trim())) {
        errs.phone = 'Phone number can only contain numbers';
      }
      // Check if phone has exactly 10 digits (Sri Lankan format)
      if (formData.phone.trim().length !== 10) {
        errs.phone = 'Phone number must be exactly 10 digits (Sri Lankan format)';
      }
    }

    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.confirmPassword !== formData.password) errs.confirmPassword = 'Passwords do not match';
    if (!formData.hospitalId) errs.hospitalId = 'Hospital is required';
    return errs;
  };

  const handleSubmitStep1 = async (e) => {
    e.preventDefault();
    const errs = validateStep1();

    if (Object.keys(errs).length === 0) {
      setIsSubmitting(true);
      try {
        const requestData = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          dob: formData.dob,
          address: formData.address,
          city: formData.district, // send as 'city' to backend
          phone: formData.phone,
          hospitalId: formData.hospitalId,
        };

        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/register_donor.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          toast.success('Registration successful! Please check your email for OTP verification.');
          setOtpSent(true);
          setStep(2);
        } else {
          // Show server-side validation errors
          if (result.errors && typeof result.errors === 'object') {
            // Handle multiple validation errors
            Object.keys(result.errors).forEach(field => {
              result.errors[field].forEach(error => {
                toast.error(`${field}: ${error}`);
              });
            });
          } else {
            toast.error(result.message || 'Failed to register');
          }
        }
      } catch (error) {
        console.error('Registration error:', error);
        toast.error('Network error. Please try again.');
      }
      setIsSubmitting(false);
    } else {
      // Show client-side validation errors as toast notifications
      Object.keys(errs).forEach(field => {
        toast.error(errs[field]);
      });
    }
  };

  const handleSubmitStep2 = async (e) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      toast.error('OTP is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost/liveonv2/backend_api/controllers/verify_otp.php', {
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
        toast.success('Email verified successfully! Your registration request has been sent to the MRO for approval.');
        setFormData({
          fullName: '', email: '', password: '', confirmPassword: '',
          dob: '', address: '', district: '', otp: '', hospitalId: '',
        });
        setStep(1);
        setOtpSent(false);
        onClose && onClose();
        if (onRegistrationComplete) onRegistrationComplete();
      } else {
        toast.error(result.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
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
          {/* Removed modal-grid and modal-particles for a static background */}
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
                        onChange={handleNameChange}
                        className="form-input"
                        placeholder="Enter your full name"
                        required
                      />
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
                        onChange={handleDateOfBirthChange}
                        className="form-input"
                        max={(() => {
                          const today = new Date();
                          const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
                          return maxDate.toISOString().split('T')[0];
                        })()}
                        min={(() => {
                          const today = new Date();
                          const minDate = new Date(today.getFullYear() - 65, today.getMonth(), today.getDate());
                          return minDate.toISOString().split('T')[0];
                        })()}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="form-input"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="district">District</label>
                      <select
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        className="form-input"
                        required
                      >
                        {sriLankaDistricts.map(d => (
                          <option key={d} value={d}>{d ? d : 'Select district'}</option>
                        ))}
                      </select>
                    </div>

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
                        <option value="">Select hospital</option>
                        {hospitals.map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.city})
                          </option>
                        ))}
                      </select>
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
                        onChange={handlePasswordChange}
                        className="form-input"
                        placeholder="Create a password"
                        required
                      />
                      {formData.password && (
                        <div className="password-strength-container">
                          <div className="password-strength-bar">
                            <div
                              className="password-strength-fill"
                              style={{
                                width: `${passwordStrength.score}%`,
                                backgroundColor: passwordStrength.color
                              }}
                            ></div>
                          </div>
                          <div className="password-strength-text" style={{ color: passwordStrength.color }}>
                            {passwordStrength.strength.charAt(0).toUpperCase() + passwordStrength.strength.slice(1)} Password
                          </div>
                        </div>
                      )}
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
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="registration-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <LoadingSpinner
                        size="16"
                        stroke="2"
                        color="#ffffff"
                        text="Processing..."
                        className="button"
                      />
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
                    </div>

                    <button
                      type="submit"
                      className="registration-button"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <LoadingSpinner
                          size="16"
                          stroke="2"
                          color="#ffffff"
                          text="Verifying..."
                          className="button"
                        />
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
