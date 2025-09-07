import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from 'flowbite-react';
import './HospitalDashboard.css';
import logo from '../../assets/logo.svg';
import userImg from '../../assets/user.png';
import ConfirmDialog from '../common/ConfirmDialog';
import ErrorDisplay from '../common/ErrorDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

const HospitalDashboard = () => {
  const [hospital, setHospital] = useState(null);
  const [donors, setDonors] = useState([]);
  const [bloodInventory, setBloodInventory] = useState([]);
  const [activeSection, setActiveSection] = useState('Overview');
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [showEmergencyPopup, setShowEmergencyPopup] = useState(false);
  const [emergencyBloodType, setEmergencyBloodType] = useState('');
  const [emergencyUnits, setEmergencyUnits] = useState('');
  const [showRequestSentPopup, setShowRequestSentPopup] = useState(false);
  const [emergencyError, setEmergencyError] = useState('');
  const [showDonationRequestPopup, setShowDonationRequestPopup] = useState(false);
  const [donationRequestDonorId, setDonationRequestDonorId] = useState(null);
  const [donationHospitalName, setDonationHospitalName] = useState('');
  const [donationReason, setDonationReason] = useState('');
  const [donationError, setDonationError] = useState('');
  const [showDonationRequestSentPopup, setShowDonationRequestSentPopup] = useState(false);
  const [selectedBloodType, setSelectedBloodType] = useState(null);
  const [showDonorPopup, setShowDonorPopup] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Custom dialog state
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [isLogoutTriggered, setIsLogoutTriggered] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Browser back button handling
  useEffect(() => {
    const handlePopState = (e) => {
      // Prevent browser back button from working normally
      e.preventDefault();
      // Only show logout dialog if not already showing and not triggered by button click
      if (!showLogoutDialog && !isLogoutTriggered) {
        setShowLogoutDialog(true);
      }
      // Push the current state back to prevent navigation
      window.history.pushState(null, null, window.location.pathname);
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState);

    // Push current state to prevent immediate back navigation
    window.history.pushState(null, null, window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Remove showLogoutDialog from dependency array to prevent re-adding event listeners

  useEffect(() => {
    // Don't fetch data if we're logging out
    if (isLoggingOut) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    // Add a small delay to ensure session is ready
    const fetchData = () => {
      // Check if we have any session-related cookies
      const hasSessionCookie = document.cookie.includes('LIVEON_SESSION') ||
        document.cookie.includes('PHPSESSID') ||
        document.cookie.includes('session');

      // Don't redirect immediately - let the API call determine if session is valid
      // The session might be valid even if we can't detect the cookie name

      fetch('http://localhost/Liveonv2/backend_api/controllers/hospital_dashboard.php', {
        credentials: 'include',
        signal: controller.signal
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 401) {
              // Session expired or user not logged in - redirect to login
              throw new Error('SESSION_EXPIRED');
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          } else {
            setHospital(data);
            setDonors(data.donors || []);
            setBloodInventory(data.bloodInventory || []);
            setEmergencyRequests(data.emergencyRequests || []);
            setError(null); // Clear any previous errors
          }
        })
        .catch(err => {
          // Don't set error if we're logging out or component is unmounting
          if (!isLoggingOut && err.name !== 'AbortError') {
            console.error('Error fetching hospital data:', err);

            if (err.message === 'SESSION_EXPIRED') {
              // Don't set error state, just redirect immediately
              setLoading(false);
              navigate('/');
              return;
            }

            // Only set error for non-session related issues
            setError(err.message || 'Failed to load hospital dashboard');
            toast.error('Failed to load hospital dashboard');
          }
        })
        .finally(() => {
          if (!isLoggingOut) {
            setLoading(false);
          }
        });
    };

    // Add a longer delay to ensure session is ready and prevent unnecessary API calls
    const timeoutId = setTimeout(fetchData, 200);

    // Cleanup function to abort fetch if component unmounts or logout starts
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [navigate, isLoggingOut]);

  const handleRequest = (donorId) => {
    setDonationRequestDonorId(donorId);
    setDonationHospitalName(hospital?.name || '');
    setDonationReason('');
    setDonationError('');
    setShowDonationRequestPopup(true);
  };

  // Use custom dialog for logout
  const handleLogout = (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Set flag to prevent browser back button handler from triggering
    setIsLogoutTriggered(true);
    // Only show dialog if not already showing
    if (!showLogoutDialog) {
      setShowLogoutDialog(true);
    }
    // Reset flag after a short delay
    setTimeout(() => setIsLogoutTriggered(false), 100);
  };
  const confirmLogout = () => {
    setShowLogoutDialog(false);
    setIsLoggingOut(true); // Set logout flag to prevent API calls
    setIsLogoutTriggered(true); // Prevent back button handler from triggering
    setError(null); // Clear any error state during logout

    // Call logout API first
    fetch('http://localhost/Liveonv2/backend_api/controllers/logout.php', {
      method: 'POST',
      credentials: 'include',
    })
      .then((response) => {
        // Check if logout was successful
        if (response.ok) {
          console.log('Logout successful');
        } else {
          console.log('Logout API returned error, but continuing with navigation');
        }
      })
      .catch((error) => {
        console.log('Logout API error, but continuing with navigation:', error);
      })
      .finally(() => {
        // Add a longer delay to ensure session is properly destroyed and prevent race conditions
        setTimeout(() => {
          try {
            // Clear any remaining state
            setHospital(null);
            setError(null);
            setLoading(false);

            // Navigate to home page
            navigate('/', { replace: true });
          } catch (navError) {
            console.log('Navigation error, using window.location:', navError);
            // Fallback to window.location if navigate fails
            window.location.href = '/';
          }
        }, 300); // Increased delay to 300ms to prevent race conditions
      });
  };
  const cancelLogout = () => setShowLogoutDialog(false);

  // Use custom dialog for logo click
  const handleLogoClick = () => {
    setShowLogoDialog(true);
  };
  const confirmLogo = async () => {
    setShowLogoDialog(false);

    // Actually logout the user instead of just navigating
    setIsLoggingOut(true);

    try {
      // Call logout API
      const response = await fetch("http://localhost/Liveonv2/backend_api/controllers/logout.php", {
        method: 'POST',
        credentials: 'include',
      });

      console.log('Logout successful from home button');
    } catch (error) {
      console.log('Logout API error from home button:', error);
    } finally {
      // Clear any remaining state
      setHospital(null);
      setDonors([]);
      setBloodInventory([]);
      setEmergencyRequests([]);
      setError(null);
      setLoading(false);

      // Navigate to home page after logout
      setTimeout(() => {
        try {
          navigate('/', { replace: true });
        } catch (navError) {
          console.log('Navigation error, using window.location:', navError);
          window.location.href = '/';
        }
      }, 200);
    }
  };
  const cancelLogo = () => setShowLogoDialog(false);

  const donorsByBloodType = (type) => donors.filter(d => d.bloodType === type);

  if (loading) {
    return (
      <div className="hospital-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#059669"
          text="Loading your hospital dashboard..."
          className="full-page"
        />
      </div>
    );
  }

  // Don't show error if we're logging out or if it's a session expiration
  if (error && !isLoggingOut) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          // Re-fetch data
          fetch('http://localhost/Liveonv2/backend_api/controllers/hospital_dashboard.php', {
            credentials: 'include'
          })
            .then(res => {
              if (!res.ok) {
                if (res.status === 401) {
                  throw new Error('SESSION_EXPIRED');
                }
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
              }
              return res.json();
            })
            .then(data => {
              if (data.error) {
                throw new Error(data.error);
              } else {
                setHospital(data);
                setDonors(data.donors || []);
                setBloodInventory(data.bloodInventory || []);
                setEmergencyRequests(data.emergencyRequests || []);
              }
            })
            .catch(err => {
              console.error('Error fetching hospital data:', err);
              if (err.message === 'SESSION_EXPIRED') {
                navigate('/');
                return;
              }
              setError(err.message || 'Failed to load hospital dashboard');
              toast.error('Failed to load hospital dashboard');
            })
            .finally(() => {
              setLoading(false);
            });
        }}
        title="Failed to load hospital dashboard"
        buttonText="Retry"
      />
    );
  }

  // Show loading spinner if no hospital data and not logging out (initial load)
  if (!hospital && !isLoggingOut && !loading) {
    return (
      <div className="hospital-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#059669"
          text="Checking your session..."
          className="full-page"
        />
      </div>
    );
  }

  // Show loading spinner if logging out
  if (isLoggingOut) {
    return (
      <div className="hospital-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#059669"
          text="Logging you out..."
          className="full-page"
        />
      </div>
    );
  }

  return (
    <div className="hospital-dashboard-container">
      <ConfirmDialog
        open={showLogoutDialog}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
        confirmText="Logout"
        cancelText="Cancel"
      />
      <ConfirmDialog
        open={showLogoDialog}
        title="Confirm Navigation"
        message="Are you sure you want to go to the home page? You will be logged out."
        onConfirm={confirmLogo}
        onCancel={cancelLogo}
        confirmText="Go Home"
        cancelText="Cancel"
      />
      <aside className="sidebar">
        <div style={{ width: '100%' }}>
          <div className="logo" onClick={handleLogoClick}>
            <img src={logo} alt="LiveOn Logo" />
          </div>
          <nav>
            <ul>
              <li className={activeSection === 'Overview' ? 'active' : ''} onClick={() => setActiveSection('Overview')}>
                <span className="sidebar-label">Overview</span>
              </li>
              <li className={activeSection === 'Donors' ? 'active' : ''} onClick={() => setActiveSection('Donors')}>
                <span className="sidebar-label">Donors</span>
              </li>
              <li className={activeSection === 'Inventory' ? 'active' : ''} onClick={() => setActiveSection('Inventory')}>
                <span className="sidebar-label">Inventory</span>
              </li>
              <li className={activeSection === 'Requests' ? 'active' : ''} onClick={() => setActiveSection('Requests')}>
                <span className="sidebar-label">Requests</span>
              </li>
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span style={{ fontSize: 20, display: 'flex', alignItems: 'center' }}>⎋</span> Logout
        </button>
      </aside>
      <main className="dashboard-main" style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 2 }}>
          {/* Dashboard Header: Hospital Dashboard ... Hospital Name */}
          <header className="dashboard-header">
            <h1>Hospital Dashboard</h1>
            <div className="dashboard-user-info">
              <span className="dashboard-user-name">🏥 {hospital.name}</span>
            </div>
          </header>
          {/* Section Tabs (if needed) */}
          {/* Section Content */}
          {activeSection === 'Overview' && (
            <section className="dashboard-section" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              {/* Donor Availability Table */}
              <div style={{ marginBottom: '36px' }}>
                <h2 style={{ color: '#2d3a8c', fontWeight: 700, marginBottom: 18 }}>Donor Availability</h2>
                <div className="donor-table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Full Name</th>
                        <th>Blood Type</th>
                        <th>Contact Info</th>
                        <th>Location</th>
                        <th>Preferred Hospital</th>
                        <th>Last Donation</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donors.length > 0 ? (
                        donors.map((donor, idx) => (
                          <tr key={idx}>
                            <td>{donor.name}</td>
                            <td>{donor.bloodType}</td>
                            <td>{donor.contact}</td>
                            <td>{donor.location}</td>
                            <td>{donor.preferredHospitalName || donor.preferredHospitalId || 'Not specified'}</td>
                            <td>{donor.lastDonation || 'N/A'}</td>
                            <td>
                              <span className={`status ${donor.status === 'available' ? 'available' : 'unavailable'}`}>
                                {donor.status === 'available' ? 'Available' : 'Not Available'}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`dashboard-btn ${donor.status === 'available' ? 'primary' : 'disabled'}`}
                                onClick={() => handleRequest(donor.donor_id)}
                                disabled={donor.status !== 'available'}
                              >
                                Request Donation
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="8">No donors available</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Blood Inventory and Emergency Requests */}
              <div style={{ display: 'flex', gap: '28px', marginBottom: '36px' }}>
                {/* Blood Inventory */}
                <div className="dashboard-section" style={{ flex: 1, padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(30,41,59,0.04)' }}>
                  <h2 style={{ color: '#2d3a8c', fontWeight: 700, marginBottom: 18 }}>Blood Inventory</h2>
                  <div className="inventory-list">
                    {bloodInventory.length > 0 ? (
                      bloodInventory.map((item, idx) => {
                        const width = Math.min(100, (item.units / 20) * 100);
                        const levelClass = item.units < 4 ? 'low' : item.units < 10 ? 'medium' : 'high';
                        return (
                          <div className="inventory-item" key={idx}>
                            <span className="blood-type">{item.type}</span>
                            <div
                              className="inventory-bar-container clickable"
                              onClick={() => {
                                setSelectedBloodType(item.type);
                                setShowDonorPopup(true);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className={`inventory-bar ${levelClass}`} style={{ width: `${width}%` }}>
                                <span className="inventory-bar-label">{item.units}</span>

                              </div>
                            </div>
                            <span className="inventory-units">{item.units} units</span>
                          </div>
                        );
                      })
                    ) : (
                      <div>No blood inventory data</div>
                    )}
                  </div>
                </div>
                {/* Emergency Requests */}
                <div className="dashboard-section" style={{ flex: 1, padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(30,41,59,0.04)' }}>
                  <h2 style={{ color: '#2d3a8c', fontWeight: 700, marginBottom: 18 }}>Emergency Requests</h2>
                  <button className="dashboard-btn primary" onClick={() => setShowEmergencyPopup(true)}>
                    SEND EMERGENCY REQUEST
                  </button>
                  <div className="emergency-warning" style={{ marginTop: 16 }}>
                    <span className="warning-icon">⚠️</span> Low blood volume detected for O- and AB+
                  </div>
                  {/* Emergency Request Log */}
                  {emergencyRequests.length > 0 ? (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h3 style={{ color: '#2563eb', marginBottom: 12 }}>Emergency Request Log</h3>
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Blood Type</th>
                            <th>Status</th>
                            <th>Required Units</th>
                            <th>Time Sent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emergencyRequests.map((req, idx) => (
                            <tr key={idx}>
                              <td>{req.bloodType}</td>
                              <td>
                                <span className={`status ${req.status === 'Critical' ? 'unavailable' : 'available'}`}>{req.status}</span>
                              </td>
                              <td>{req.requiredUnits}</td>
                              <td>{new Date(req.createdAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ marginTop: '1.5rem' }}>No emergency requests found.</div>
                  )}
                </div>
              </div>
            </section>
          )}
          {activeSection === 'Donors' && (
            <section className="dashboard-section">
              <h2>Donors</h2>
              <div className="donor-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Blood Type</th>
                      <th>Contact Info</th>
                      <th>Location</th>
                      <th>Preferred Hospital</th>
                      <th>Last Donation</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.length > 0 ? (
                      donors.map((donor, idx) => (
                        <tr key={idx}>
                          <td>{donor.name}</td>
                          <td>{donor.bloodType}</td>
                          <td>{donor.contact}</td>
                          <td>{donor.location}</td>
                          <td>{donor.preferredHospitalName || donor.preferredHospitalId || 'Not specified'}</td>
                          <td>{donor.lastDonation || 'N/A'}</td>
                          <td>
                            <span className={`status ${donor.status === 'available' ? 'available' : 'unavailable'}`}>
                              {donor.status === 'available' ? 'Available' : 'Not Available'}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`dashboard-btn ${donor.status === 'available' ? 'primary' : 'disabled'}`}
                              onClick={() => handleRequest(donor.donor_id)}
                              disabled={donor.status !== 'available'}
                            >
                              Request Donation
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="8">No donors available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {activeSection === 'Inventory' && (
            <section className="dashboard-section">
              <h2>Blood Inventory</h2>
              <div className="inventory-list">
                {bloodInventory.length > 0 ? (
                  bloodInventory.map((item, idx) => {
                    const width = Math.min(100, (item.units / 20) * 100);
                    const levelClass = item.units < 4 ? 'low' : item.units < 10 ? 'medium' : 'high';
                    return (
                      <div className="inventory-item" key={idx}>
                        <span className="blood-type">{item.type}</span>
                        <div
                          className="inventory-bar-container clickable"
                          onClick={() => {
                            setSelectedBloodType(item.type);
                            setShowDonorPopup(true);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className={`inventory-bar ${levelClass}`} style={{ width: `${width}%` }}>
                            <span className="inventory-bar-label">{item.units}</span>
                          </div>
                        </div>
                        <span className="inventory-units">{item.units} units</span>
                      </div>
                    );
                  })
                ) : (
                  <div>No blood inventory data</div>
                )}
              </div>
            </section>
          )}
          {activeSection === 'Requests' && (
            <section className="dashboard-section">
              <h2>Emergency Requests</h2>
              <button className="dashboard-btn primary" onClick={() => setShowEmergencyPopup(true)}>
                SEND EMERGENCY REQUEST
              </button>
              <div className="emergency-warning" style={{ marginTop: 16 }}>
                <span className="warning-icon">⚠️</span> Low blood volume detected for O- and AB+
              </div>
              {/* Emergency Request Log */}
              {emergencyRequests.length > 0 ? (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ color: '#2563eb', marginBottom: 12 }}>Emergency Request Log</h3>
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Blood Type</th>
                        <th>Status</th>
                        <th>Required Units</th>
                        <th>Time Sent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emergencyRequests.map((req, idx) => (
                        <tr key={idx}>
                          <td>{req.bloodType}</td>
                          <td>
                            <span className={`status ${req.status === 'Critical' ? 'unavailable' : 'available'}`}>{req.status}</span>
                          </td>
                          <td>{req.requiredUnits}</td>
                          <td>{new Date(req.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ marginTop: '1.5rem' }}>No emergency requests found.</div>
              )}
            </section>
          )}
          {/* Popups/Modals (reuse existing logic) */}
          {showEmergencyPopup && (
            <div className="popup-overlay">
              <div className="popup-form">
                <button className="popup-close" onClick={() => setShowEmergencyPopup(false)}>&times;</button>
                <h3>Send Emergency Request</h3>
                <label>
                  Blood Type:
                  <select value={emergencyBloodType} onChange={e => setEmergencyBloodType(e.target.value)}>
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </label>
                <label>
                  Required Units:
                  <input
                    type="number"
                    min="1"
                    value={emergencyUnits}
                    onChange={e => setEmergencyUnits(e.target.value)}
                  />
                </label>
                {emergencyError && <div className="error-message" style={{ color: 'red', marginTop: '0.5rem' }}>{emergencyError}</div>}
                <div className="modal-actions">
                  <button
                    className="dashboard-btn primary"
                    onClick={() => {
                      if (!emergencyBloodType && !emergencyUnits) {
                        setEmergencyError('You have to enter both blood type and required units.');
                        return;
                      } else if (!emergencyBloodType) {
                        setEmergencyError('You forgot to enter blood type.');
                        return;
                      } else if (!emergencyUnits) {
                        setEmergencyError('You forgot to enter blood units.');
                        return;
                      }
                      if (window.confirm(`Are you sure you want to send an emergency request for ${emergencyUnits} units of ${emergencyBloodType} blood? This will notify all available donors.`)) {
                        setEmergencyError('');
                        fetch('http://localhost/Liveonv2/backend_api/controllers/emergency_request.php', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            blood_type: emergencyBloodType,
                            required_units: emergencyUnits
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setShowEmergencyPopup(false);
                            setEmergencyBloodType('');
                            setEmergencyUnits('');
                            setShowRequestSentPopup(true);
                            // Send SMS to all donors with the selected blood group
                            const relevantDonors = donors.filter(d => d.bloodType === emergencyBloodType);
                            relevantDonors.forEach(donor => {
                              if (donor.contact) {
                                const smsMessage = `Dear ${donor.name}, urgent need for ${emergencyUnits} units of ${emergencyBloodType} blood at ${hospital.name}. Please contact us if you can donate.`;
                                fetch('http://localhost/Liveonv2/backend_api/controllers/send_sms.php', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    phone: donor.contact,
                                    message: smsMessage
                                  })
                                });
                              }
                            });
                          })
                          .catch(err => {
                            setEmergencyError('Failed to send emergency request');
                          });
                      }
                    }}
                  >
                    Send to All Donors
                  </button>
                  <button className="dashboard-btn" onClick={() => { setShowEmergencyPopup(false); setEmergencyError(''); }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {showRequestSentPopup && (
            <div className="popup-overlay">
              <div className="popup-form">
                <h3>Request Sent</h3>
                <p>Your emergency request has been sent successfully!</p>
                <div className="modal-actions">
                  <button className="dashboard-btn primary" onClick={() => setShowRequestSentPopup(false)}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          {showDonationRequestPopup && (
            <div className="popup-overlay">
              <div className="popup-form">
                <button className="popup-close" onClick={() => setShowDonationRequestPopup(false)}>&times;</button>
                <h3>Request Donation</h3>
                <label>
                  Hospital Name:
                  <input
                    type="text"
                    value={donationHospitalName}
                    onChange={e => setDonationHospitalName(e.target.value)}
                    disabled
                  />
                </label>
                <label>
                  Reason:
                  <textarea
                    value={donationReason}
                    onChange={e => setDonationReason(e.target.value)}
                    placeholder="Enter the reason for the donation request"
                  />
                </label>
                {donationError && <div className="error-message" style={{ color: 'red', marginTop: '0.5rem' }}>{donationError}</div>}
                <div className="modal-actions">
                  <button
                    className="dashboard-btn primary"
                    onClick={() => {
                      if (!donationReason) {
                        setDonationError('You forgot to enter the reason.');
                        return;
                      }
                      if (window.confirm('Are you sure you want to send this donation request? This will notify the selected donor.')) {
                        setDonationError('');
                        fetch('http://localhost/Liveonv2/backend_api/controllers/send_donation_request.php', {
                          method: 'POST',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            donorId: donationRequestDonorId,
                            hospitalName: donationHospitalName,
                            reason: donationReason
                          })
                        })
                          .then(res => res.json())
                          .then(data => {
                            setShowDonationRequestPopup(false);
                            setShowDonationRequestSentPopup(true);
                            // Find the donor object by ID
                            const donor = donors.find(d => d.donor_id === donationRequestDonorId);
                            if (donor && donor.contact) {
                              const smsMessage = `Dear ${donor.name}, you have a new blood donation request from ${hospital.name}. Reason: ${donationReason}`;
                              fetch('http://localhost/Liveonv2/backend_api/controllers/send_sms.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  phone: donor.contact,
                                  message: smsMessage
                                })
                              })
                                .then(res => res.json())
                                .then(smsRes => {
                                  // Optionally handle SMS response
                                })
                                .catch(err => {
                                  // Optionally handle SMS error
                                });
                            }
                          })
                          .catch(err => {
                            setDonationError('Failed to send donation request');
                          });
                      }
                    }}
                  >
                    Send Request
                  </button>
                  <button className="dashboard-btn" onClick={() => setShowDonationRequestPopup(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {showDonationRequestSentPopup && (
            <div className="popup-overlay">
              <div className="popup-form">
                <h3>Request Sent</h3>
                <p>Your donation request has been sent successfully!</p>
                <div className="modal-actions">
                  <button className="dashboard-btn primary" onClick={() => setShowDonationRequestSentPopup(false)}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Donor Popup Modal */}
          {showDonorPopup && (
            <div className="popup-overlay" onClick={() => setShowDonorPopup(false)}>
              <div className="popup-form donor-popup" onClick={e => e.stopPropagation()}>
                <h3>Donors with Blood Type: {selectedBloodType}</h3>
                <div className="donor-cards-list">
                  {donorsByBloodType(selectedBloodType).length > 0 ? (
                    donorsByBloodType(selectedBloodType).map((donor, idx) => (
                      <div className="profile-summary-card" key={donor.donor_id || idx}>
                        <Avatar
                          img={donor.profilePic || null}
                          alt={donor.name || 'Donor'}
                          size="lg"
                          rounded
                          placeholderInitials={donor.name ? donor.name.substring(0, 2).toUpperCase() : "DN"}
                          style={{
                            marginRight: 20,
                            backgroundColor: '#6b7280',
                            color: '#ffffff',
                            border: '2px solid #6b7280'
                          }}
                        />
                        <div className="profile-summary-text">
                          <div><span className="label">Donor ID:</span> {donor.donor_id || '-'}</div>
                          <div><span className="label">Name:</span> {donor.name || '-'}</div>
                          <div><span className="label">Blood Type:</span> {donor.bloodType || '-'}</div>
                          <div><span className="label">Age:</span> {donor.age || '-'}</div>
                          <div><span className="label">Location:</span> {donor.location || '-'}</div>
                          <div><span className="label">Email:</span> {donor.email || '-'}</div>
                          <div><span className="label">Phone:</span> {donor.contact || '-'}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '1.5rem' }}>No donors found for this blood type.</div>
                  )}
                </div>
                <button className="dashboard-btn primary" onClick={() => setShowDonorPopup(false)} style={{ marginTop: '1.5rem' }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default HospitalDashboard;