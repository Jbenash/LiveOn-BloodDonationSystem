import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Avatar } from 'flowbite-react';
import './DonorDashboard.css';
import logo from '../../assets/logo.svg';
import ConfirmDialog from '../common/ConfirmDialog';
import ErrorDisplay from '../common/ErrorDisplay';
import LoadingSpinner from '../common/LoadingSpinner';
import RewardsDashboard from '../common/RewardsDashboard';

const DonorDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [donations, setDonations] = useState([]);
  const [countdown, setCountdown] = useState('');
  const countdownInterval = useRef(null);
  const navigate = useNavigate();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [showSaveProfileDialog, setShowSaveProfileDialog] = useState(false);
  const [isLogoutTriggered, setIsLogoutTriggered] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeReason, setRemoveReason] = useState('');
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHospitalPopup, setShowHospitalPopup] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [showHealthTipsPopup, setShowHealthTipsPopup] = useState(false);

  // Ensure any modal-induced scroll lock is cleared when entering dashboard
  useEffect(() => {
    document.body.classList.remove('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

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

      fetch('http://localhost/Liveonv2/backend_api/controllers/donor_dashboard.php', {
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
            // Handle different types of errors
            if (data.status === 'pending_approval') {
              // Special handling for pending approval
              setError(data.error);
              setErrorType('pending_approval');
            } else {
              setError(data.error);
              setErrorType('general');
            }
            throw new Error(data.error);
          } else {
            setUser(data);
            setError(null); // Clear any previous errors
            setErrorType(null);
          }
        })
        .catch(err => {
          // Don't set error if we're logging out or component is unmounting
          if (!isLoggingOut && err.name !== 'AbortError') {
            console.error('Error fetching donor data:', err);

            if (err.message === 'SESSION_EXPIRED') {
              // Don't set error state, just redirect immediately
              setLoading(false);
              navigate('/');
              return;
            }

            // Only set error for non-session related issues
            setError(err.message || 'Failed to load donor data');
            toast.error('Failed to load donor data');
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

  useEffect(() => {
    if (activeSection === 'donations' && user?.donorId) {
      fetch(`http://localhost/Liveonv2/backend_api/controllers/get_donor_donations.php?donor_id=${user.donorId}`, {
        credentials: 'include'
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) setDonations(data.donations);
          else setDonations([]);
        })
        .catch(() => setDonations([]));
    }
  }, [activeSection, user]);

  useEffect(() => {
    // Use nextEligible date from API response if available
    let baseDate = null;

    if (user?.nextEligible && user.nextEligible !== 'N/A' && user.nextEligible !== 'First Donation') {
      baseDate = new Date(user.nextEligible);
    }

    if (baseDate) {
      function updateCountdown() {
        const now = new Date();
        const diff = baseDate - now;
        if (diff <= 0) {
          setCountdown('Eligible now!');
          if (countdownInterval.current) clearInterval(countdownInterval.current);
          return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }

      updateCountdown();
      countdownInterval.current = setInterval(updateCountdown, 1000);
      return () => {
        if (countdownInterval.current) clearInterval(countdownInterval.current);
      };
    } else {
      setCountdown('N/A');
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    }
  }, [user?.nextEligible]);

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
    fetch("http://localhost/Liveonv2/backend_api/controllers/logout.php", {
      method: 'POST',
      credentials: 'include'
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
            setUser(null);
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
      setUser(null);
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

  // Profile save confirmation functions
  const confirmSaveProfile = async () => {
    setShowSaveProfileDialog(false);
    const formData = new FormData();
    formData.append('donorId', editForm.donorId);
    formData.append('name', editForm.name);
    // Note: bloodType and age cannot be changed for safety and verification reasons
    formData.append('location', editForm.location);
    formData.append('email', editForm.email);
    if (editForm.profilePicFile) {
      formData.append('profilePicFile', editForm.profilePicFile);
    }
    if (editForm.removeAvatar) {
      formData.append('removeAvatar', '1');
    }
    try {
      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/update_donor_profile.php', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        // Update user state with new profile data
        setUser(u => ({
          ...u,
          name: editForm.name,
          // bloodType and age: keep existing values as they cannot be changed
          location: editForm.location,
          email: editForm.email,
          profilePic: (editForm.removeAvatar || data.avatarRemoved) ? null : (data.imagePath ? `http://localhost/Liveonv2/${data.imagePath}` : u.profilePic)
        }));

        // Reset edit form to clear any cached data
        setEditForm({});
        setShowEditProfile(false);
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Error updating profile');
    }
  };

  const cancelSaveProfile = () => setShowSaveProfileDialog(false);

  // Remove from system functions
  const handleRemoveFromSystem = () => {
    setShowRemoveDialog(true);
  };

  const confirmRemove = async () => {
    if (!removeReason.trim()) {
      toast.error('Please provide a reason for removal');
      return;
    }

    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/request_donor_removal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: user.donorId,
          reason: removeReason.trim()
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Removal request sent to administrators successfully');
        setShowRemoveDialog(false);
        setRemoveReason('');
      } else {
        toast.error(data.message || 'Failed to send removal request');
      }
    } catch (error) {
      console.error('Error sending removal request:', error);
      toast.error('Error sending removal request');
    }
  };

  const cancelRemove = () => {
    setShowRemoveDialog(false);
    setRemoveReason('');
  };

  // Function to fetch hospitals from database
  const fetchHospitals = async (location) => {
    setLoadingHospitals(true);
    try {
      const response = await fetch(`http://localhost/Liveonv2/backend_api/controllers/get_hospitals.php?location=${encodeURIComponent(location)}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setHospitals(data.hospitals);
      } else {
        console.error('Failed to fetch hospitals:', data.error);
        setHospitals([]);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]);
    } finally {
      setLoadingHospitals(false);
    }
  };

  // Function to handle hospital popup opening
  const handleHospitalPopupOpen = () => {
    setShowHospitalPopup(true);
    if (user?.location) {
      fetchHospitals(user.location);
    }
  };

  if (loading) {
    return (
      <div className="donor-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#dc2626"
          text="Loading your donor dashboard..."
          className="full-page"
        />
      </div>
    );
  }

  // Don't show error if we're logging out or if it's a session expiration
  if (error && !isLoggingOut) {
    // Special handling for pending approval
    if (errorType === 'pending_approval') {
      return (
        <div className="donor-dashboard-root">
          <div className="donor-dashboard-container">
            <div className="dashboard-header">
              <div className="header-nav">
                <img
                  src="/src/assets/logo.svg"
                  alt="LiveOn Logo"
                  className="header-logo"
                  onClick={() => setShowLogoDialog(true)}
                />
                <h1>Donor Dashboard</h1>
                <div className="header-actions">
                  <button
                    className="logout-btn"
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className="pending-approval-container" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              textAlign: 'center',
              minHeight: '60vh'
            }}>
              <div style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <h2 style={{ color: '#92400e', marginBottom: '1rem' }}>Registration Pending</h2>
                <p style={{ color: '#78350f', lineHeight: '1.5' }}>
                  {error}
                </p>
                <p style={{ color: '#78350f', fontSize: '0.9rem', marginTop: '1rem' }}>
                  You will receive an email notification once your profile is approved and you can access all dashboard features.
                </p>
              </div>
            </div>
          </div>

          {/* Logout Dialog */}
          {showLogoutDialog && (
            <div className="popup-overlay">
              <div className="popup-content">
                <h3>Confirm Logout</h3>
                <p>Are you sure you want to logout?</p>
                <div className="popup-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowLogoutDialog(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Logo Dialog */}
          {showLogoDialog && (
            <div className="popup-overlay">
              <div className="popup-content">
                <img src="/src/assets/logo.svg" alt="LiveOn Logo" style={{ width: '100px', marginBottom: '1rem' }} />
                <h3>LiveOn Blood Donation System</h3>
                <p>Connecting donors with those in need.</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowLogoDialog(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // General error display
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          // Re-fetch data
          fetch('http://localhost/Liveonv2/backend_api/controllers/donor_dashboard.php', {
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
                setUser(data);
              }
            })
            .catch(err => {
              console.error('Error fetching donor data:', err);
              if (err.message === 'SESSION_EXPIRED') {
                navigate('/');
                return;
              }
              setError(err.message || 'Failed to load donor data');
              toast.error('Failed to load donor data');
            })
            .finally(() => {
              setLoading(false);
            });
        }}
        title="Failed to load donor dashboard"
        buttonText="Retry"
      />
    );
  }

  // Show loading spinner if no user data and not logging out (initial load)
  if (!user && !isLoggingOut && !loading) {
    return (
      <div className="donor-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#dc2626"
          text="Checking your session..."
          className="full-page"
        />
      </div>
    );
  }

  // Show loading spinner if logging out
  if (isLoggingOut) {
    return (
      <div className="donor-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#dc2626"
          text="Logging you out..."
          className="full-page"
        />
      </div>
    );
  }

  if (!user && !isLoggingOut) {
    return (
      <ErrorDisplay
        error="No donor data available"
        title="Donor data not found"
        buttonText="Retry"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="donor-dashboard-container">
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
      <ConfirmDialog
        open={showSaveProfileDialog}
        title="Confirm Profile Changes"
        message="Are you sure you want to save these profile changes?"
        onConfirm={confirmSaveProfile}
        onCancel={cancelSaveProfile}
        confirmText="Save Changes"
        cancelText="Cancel"
      />
      {/* Remove from System Modal */}
      {showRemoveDialog && (
        <div className="modal-overlay" onClick={cancelRemove}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={cancelRemove}>&times;</button>

            <div>
              <h2>Remove from System</h2>
              <p>Please provide a reason for requesting removal from the donation system. This request will be sent to administrators for review.</p>
            </div>

            <div className="form-field">
              <label>Reason for Removal *</label>
              <textarea
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="Please explain why you want to be removed from the system..."
                rows={4}
                style={{ width: '100%', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '1rem', resize: 'vertical' }}
              />
            </div>

            <div className="action-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={cancelRemove}
              >
                Cancel
              </button>
              <button
                type="button"
                className="save-btn"
                onClick={confirmRemove}
                disabled={!removeReason.trim()}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
      <aside className="sidebar">
        <div style={{ width: '100%' }}>
          <div className="logo" onClick={handleLogoClick}>
            <img src={logo} alt="LiveOn Logo" />
          </div>
          <nav>
            <ul>
              <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}>
                <span className="sidebar-label">Dashboard</span>
              </li>
              <li className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>
                <span className="sidebar-label">Profile</span>
              </li>
              <li className={activeSection === 'donations' ? 'active' : ''} onClick={() => setActiveSection('donations')}>
                <span className="sidebar-label">Donations</span>
              </li>
              <li className={activeSection === 'rewards' ? 'active' : ''} onClick={() => setActiveSection('rewards')}>
                <span className="sidebar-label">Rewards</span>
              </li>
              <li className={activeSection === 'feedback' ? 'active' : ''} onClick={() => setActiveSection('feedback')}>
                <span className="sidebar-label">Feedback</span>
              </li>
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span style={{ fontSize: 20, display: 'flex', alignItems: 'center' }}>⎋</span> Logout
        </button>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h1>Donor Dashboard</h1>
          <div className="dashboard-user-info">
            <Avatar
              img={user.profilePic || null}
              alt="Profile"
              size="md"
              rounded
              placeholderInitials={user.name ? user.name.substring(0, 2).toUpperCase() : "DN"}
              className="custom-avatar"
              style={{
                backgroundColor: '#6b7280',
                color: '#ffffff',
                border: '2px solid #6b7280'
              }}
              onClick={() => {
                // Initialize form with current user data
                setEditForm({
                  donorId: user?.donorId || '',
                  name: user?.name || '',
                  bloodType: user?.bloodType || '',
                  age: user?.age || '',
                  location: user?.location || '',
                  email: user?.email || '',
                  profilePic: user?.profilePic || '',
                  removeAvatar: false
                });
                setShowEditProfile(true);
              }}
            />
            <span className="dashboard-user-name">{user.name || 'Donor'}</span>
          </div>
        </header>
        <div className="dashboard-content">
          {activeSection === 'profile' && (
            <div className="dashboard-stats-grid">
              {/* Enhanced Profile Section */}
              <div className="profile-section-container">

                {/* Main Profile Card */}
                <div className="profile-main-card">
                  <div className="profile-header">
                    <Avatar
                      img={user.profilePic || null}
                      alt="Profile"
                      size="xl"
                      rounded
                      placeholderInitials={user.name ? user.name.substring(0, 2).toUpperCase() : "DN"}
                      className="profile-card-avatar"
                    />
                    <div className="profile-info">
                      <h2 className="profile-name">{user.name}</h2>
                      <p className="profile-id">Donor ID: {user.donorId}</p>
                      <div className="status-indicator">
                        <span className="status-dot"></span>
                        <span className="status-text">
                          {user.donorStatus === 'available' ? 'Available for Donation' : 'Not Available for Donation'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-details">
                    <div className="detail-item">
                      <span className="detail-label">Blood Type</span>
                      <span className="detail-value blood-type-badge">{user.bloodType}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Age</span>
                      <span className="detail-value">{user.age}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location</span>
                      <span className="detail-value">{user.location}</span>
                    </div>
                    <div className="detail-item email-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{user.email}</span>
                    </div>
                  </div>

                  <button className="edit-profile-btn" onClick={() => {
                    setEditForm({
                      donorId: user?.donorId || '',
                      name: user?.name || '',
                      bloodType: user?.bloodType || '',
                      age: user?.age || '',
                      location: user?.location || '',
                      email: user?.email || '',
                      profilePic: user?.profilePic || '',
                      removeAvatar: false
                    });
                    setShowEditProfile(true);
                  }}>
                    <span className="btn-icon">✏️</span>
                    Edit Profile
                  </button>
                </div>

                {/* Stats Cards Grid */}
                <div className="stats-grid">
                  {/* Donation Progress Card */}
                  <div className="stats-card progress-card">
                    <div className="card-header">
                      <div className="card-icon">🩸</div>
                      <h3>Donation Progress</h3>
                    </div>
                    <div className="progress-section">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min((user.totalDonations || 0) * 20, 100)}%` }}></div>
                      </div>
                      <div className="progress-text">
                        <span>{user.totalDonations || 0} donations</span>
                        <span>Goal: 5 donations</span>
                      </div>
                    </div>
                  </div>



                  {/* Eligibility Card */}
                  <div className="stats-card eligibility-card">
                    <div className="card-header">
                      <div className="card-icon">⏰</div>
                      <h3>Next Donation</h3>
                    </div>
                    <div className="eligibility-info">
                      <div className="eligibility-status">
                        {countdown && countdown !== 'N/A' && countdown !== 'Eligible now!' ? (
                          <span className="status-waiting">Wait {countdown}</span>
                        ) : countdown === 'Eligible now!' && user.donorStatus === 'available' ? (
                          <span className="status-eligible">Eligible Now!</span>
                        ) : (
                          <span className="status-waiting">Not Available</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Points Card */}
                  <div className="stats-card points-card">
                    <div className="card-header">
                      <div className="card-icon">🏆</div>
                      <h3>Reward Points</h3>
                    </div>
                    <div className="points-number">
                      <span className="number">{user.points || 0}</span>
                      <span className="label">points</span>
                    </div>
                  </div>
                </div>

                {/* Smart Recommendations */}
                <div className="recommendations-section">
                  <h3 className="section-title">Smart Recommendations</h3>

                  <div className="recommendations-grid">
                    {/* Donation Reminder */}
                    {countdown === 'Eligible now!' && user.donorStatus === 'available' && (
                      <div className="recommendation-card reminder-card">
                        <div className="rec-icon">🔔</div>
                        <div className="rec-content">
                          <h4>Ready to Donate!</h4>
                          <p>You're eligible to donate again. Schedule your next donation.</p>
                        </div>
                        <button className="rec-action-btn">Schedule Now</button>
                      </div>
                    )}

                    {/* Hospital Suggestion */}
                    <div className="recommendation-card hospital-card">
                      <div className="rec-icon">🏥</div>
                      <div className="rec-content">
                        <h4>Nearby Hospitals</h4>
                        <p>Try these hospitals near {user.location} for your next donation.</p>
                      </div>
                      <button className="rec-action-btn" onClick={handleHospitalPopupOpen}>View Hospitals</button>
                    </div>

                    {/* Health Tips */}
                    <div className="recommendation-card health-card">
                      <div className="rec-icon">💧</div>
                      <div className="rec-content">
                        <h4>Health Tip</h4>
                        <p>Stay hydrated and get plenty of rest before your donation.</p>
                      </div>
                      <button className="rec-action-btn" onClick={() => setShowHealthTipsPopup(true)}>Learn More</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeSection === 'dashboard' && (
            <>
              <div className="dashboard-stats-grid">
                {/* Enhanced Profile Summary Card */}
                <div className="enhanced-profile-summary-card">
                  <div className="profile-summary-header">
                    <div className="profile-summary-avatar-section">
                      <Avatar
                        img={user.profilePic || null}
                        alt="Profile"
                        size="xl"
                        rounded
                        placeholderInitials={user.name ? user.name.substring(0, 2).toUpperCase() : "DN"}
                        className="profile-summary-avatar"
                      />
                      <div className="profile-summary-status">
                        <div className="status-badge">
                          <span className={user.donorStatus === 'available' ? 'status-dot-active' : 'status-dot-inactive'}></span>
                          <span>{user.donorStatus === 'available' ? 'Active Donor' : 'Not Available'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="profile-summary-info">
                      <h2 className="profile-summary-name">{user.name}</h2>
                      <p className="profile-summary-id">#{user.donorId}</p>
                      <div className="profile-summary-badges">
                        <span className="blood-type-badge-summary">{user.bloodType}</span>
                        <span className="age-badge">{user.age} years</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-summary-details">
                    <div className="detail-row">
                      <div className="detail-item-summary">
                        <span className="detail-icon">📍</span>
                        <div className="detail-content">
                          <span className="detail-label-summary">Location</span>
                          <span className="detail-value-summary">{user.location}</span>
                        </div>
                      </div>
                      <div className="detail-item-summary">
                        <span className="detail-icon">📧</span>
                        <div className="detail-content">
                          <span className="detail-label-summary">Email</span>
                          <span className="detail-value-summary email-value">{user.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="profile-summary-stats">
                      <div className="stat-item">
                        <span className="stat-number">{user.totalDonations || 0}</span>
                        <span className="stat-label">Donations</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{user.totalDonations ? user.totalDonations * 3 : 0}</span>
                        <span className="stat-label">Lives Saved</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{user.points || 0}</span>
                        <span className="stat-label">Points</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Countdown Box - moved here */}
              <div style={{ margin: '32px 0 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                {(countdown && countdown !== 'N/A' && countdown !== 'Eligible now!') && (
                  <div style={{
                    color: ' #2d3a8c',
                    fontWeight: 700,
                    fontSize: '1.35rem',
                    textAlign: 'center',
                    marginBottom: 14,
                    textShadow: '0 2px 8px rgba(30,41,59,0.18)'
                  }}>
                    Next Donation Countdown
                  </div>
                )}
                {countdown && countdown !== 'N/A' && countdown !== 'Eligible now!' ? (() => {
                  const parts = countdown.match(/(\d+)d (\d+)h (\d+)m (\d+)s/);
                  if (!parts) return null;
                  const [days, hours, minutes, seconds] = parts.slice(1).map(Number);
                  return (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '18px 24px',
                      minWidth: 320,
                      margin: '0 auto',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#2d3a8c',
                        WebkitTextStroke: '0px',
                        textShadow: 'none',
                        filter: 'none',
                        fontWeight: 500,
                        fontSize: '2.6rem',
                        letterSpacing: 2,
                        marginBottom: 4,
                      }}>
                        <span style={{ color: '#2d3a8c', fontWeight: 700 }}>{days}</span>
                        <span style={{ margin: '0 8px', color: '#2d3a8c' }}>:</span>
                        <span style={{ color: '#2d3a8c', fontWeight: 700 }}>{hours.toString().padStart(2, '0')}</span>
                        <span style={{ margin: '0 8px', color: '#2d3a8c' }}>:</span>
                        <span style={{ color: '#2d3a8c', fontWeight: 700 }}>{minutes.toString().padStart(2, '0')}</span>
                        <span style={{ margin: '0 8px', color: '#2d3a8c' }}>:</span>
                        <span style={{ color: '#2d3a8c', fontWeight: 700 }}>{seconds.toString().padStart(2, '0')}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 38,
                        color: '#2d3a8c',
                        WebkitTextStroke: '0px',
                        textShadow: 'none',
                        filter: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 400,
                        opacity: 0.85,
                        letterSpacing: 1,
                      }}>
                        <span style={{ color: '#2d3a8c' }}>day</span>
                        <span style={{ color: '#2d3a8c' }}>hour</span>
                        <span style={{ color: '#2d3a8c' }}>min</span>
                        <span style={{ color: '#2d3a8c' }}>sec</span>
                      </div>
                    </div>
                  );
                })() : countdown === 'Eligible now!' && user.donorStatus === 'available' ? (
                  <div style={{
                    background: '#16a34a',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    boxShadow: '0 2px 8px rgba(22,163,74,0.13)',
                    letterSpacing: 1,
                    minWidth: 180,
                    textAlign: 'center',
                    margin: '0 auto',
                    display: 'inline-block'
                  }}>
                    Eligible now!
                  </div>
                ) : (
                  <div style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: 12,
                    fontWeight: 700,
                    fontSize: '1.15rem',
                    boxShadow: '0 2px 8px rgba(239,68,68,0.13)',
                    letterSpacing: 1,
                    minWidth: 180,
                    textAlign: 'center',
                    margin: '0 auto',
                    display: 'inline-block'
                  }}>
                    Not Available
                  </div>
                )}
              </div>
              <div className="dashboard-stats-grid">
                {/* Donation Stats */}
                <div className="dashboard-card glassy donation-stats animate-fadein">
                  <div className="donation-stats-title gradient-text">Donation Statistics</div>
                  <div className="donation-stats-grid">

                    <div className="donation-stat">
                      {/* Last Donation SVG - Provided by user */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="32" height="32" viewBox="0 0 2048 2048" style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}>
                          <defs>
                            <clipPath id="id0"><path d="M1024-.001c565.541 0 1024 458.46 1024 1024s-458.461 1024-1024 1024c-565.541 0-1024-458.461-1024-1024 0-565.541 458.461-1024 1024-1024z" /></clipPath>
                            <style>{`.fil17{fill:#223539}.fil7{fill:#263238}.fil1{fill:#f57c00}.fil6{fill:#0091ea;fill-rule:nonzero}`}</style>
                          </defs>
                          <g id="Layer_x0020_1">
                            <path d="M1024-.001c565.541 0 1024 458.46 1024 1024s-458.461 1024-1024 1024c-565.541 0-1024-458.461-1024-1024 0-565.541 458.461-1024 1024-1024z" style={{ fill: '#ff9800' }} />
                            <g style={{ clipPath: 'url(#id0)' }}>
                              <g id="_466417432">
                                <path className="fil1" d="M871.208 468.827 2007.09 1604.71l1.06 1.17.95 1.27.83 1.36.69 1.44.56 1.51.4 1.58.25 1.64.09 1.68L876.035 480.482l-.085-1.685-.251-1.636-.405-1.58-.555-1.514-.693-1.441-.826-1.359-.949-1.269z" />
                                <path className="fil1" d="M681.671 468.827 1817.55 1604.71l1.07 1.17.95 1.27.82 1.36.69 1.44.56 1.51.4 1.58.25 1.64.09 1.68L686.499 480.482l-.085-1.685-.251-1.636-.405-1.58-.555-1.514-.693-1.441-.826-1.359-.95-1.269z" />
                                <path className="fil1" d="m1485.59 1485.59 1135.88 1135.88-5.77 5.63-5.9 5.5-6.03 5.35-6.16 5.21-6.29 5.06-6.41 4.91-6.52 4.76-6.65 4.61-6.76 4.45-6.87 4.29-6.98 4.13-7.09 3.96-7.2 3.79-7.29 3.63-7.39 3.45-7.49 3.28-7.59 3.1-7.67 2.74-7.77 2.55-7.94 2.36-8.01 2.16-8.09 1.98-8.16 1.78-8.24 1.57-8.31 1.38-8.38 1.17-8.44.97-8.5.75-8.56.55-8.62.32-8.67.11L1248 1584l8.67-.11 8.62-.33 8.56-.54 8.5-.76 8.44-.96 8.38-1.17 8.31-1.38 8.23-1.57 8.17-1.78 8.09-1.98 8.01-2.16 7.93-2.36 7.85-2.54 7.77-2.74 7.67-2.92 7.58-3.09 7.49-3.28 7.4-3.45 7.29-3.63 7.2-3.79 7.08-3.97 6.99-4.12 6.87-4.29 6.76-4.45 6.64-4.61 6.53-4.76 6.41-4.91 6.29-5.07 6.15-5.21 6.03-5.35 5.9-5.49z" />
                                <path className="fil1" d="M912.073 1255.11 2047.95 2391h-72.39L839.675 1255.11z" />
                                <path className="fil1" d="M839.675 1255.11 1975.56 2391h-333.45L506.233 1255.11z" />
                                <path className="fil1" d="m1248 1584 1135.88 1135.88-8.67-.11-8.62-.32-8.56-.55-8.5-.75-8.44-.97-8.38-1.17-8.31-1.38-8.23-1.57-8.17-1.78-8.09-1.98-8.01-2.16-7.93-2.36-7.85-2.55-7.77-2.74-7.67-2.91-7.58-3.1-7.49-3.28-7.4-3.45-7.29-3.63-7.2-3.79-7.08-3.96-6.99-4.13-6.87-4.29-6.76-4.45-6.64-4.61-6.53-4.76-6.41-4.91-6.29-5.06-6.16-5.21-6.03-5.35-1135.88-1135.89 6.03 5.35 6.16 5.21 6.29 5.07 6.41 4.91 6.52 4.76 6.65 4.61 6.76 4.45 6.87 4.29 6.98 4.12 7.09 3.97 7.2 3.79 7.29 3.63 7.39 3.45 7.49 3.28 7.59 3.09 7.67 2.92 7.77 2.74 7.84 2.54 7.94 2.36 8.01 2.17 8.09 1.98 8.16 1.77 8.24 1.58 8.31 1.38 8.38 1.17 8.44.96 8.5.76 8.56.54 8.62.33z" />
                                <path className="fil1" d="M506.233 1255.11 1642.11 2391l-2.16-.06-2.14-.16-2.11-.27-2.08-.38-2.04-.47-2-.57-1.96-.67-1.92-.75-1.87-.85-1.82-.94-1.77-1.02-1.71-1.09-1.66-1.18-1.6-1.26-1.53-1.33L477.859 1244.12l1.533 1.33 1.597 1.25 1.656 1.18 1.714 1.1 1.769 1.02 1.82.94 1.871.84 1.917.76 1.96.67 2.002.57 2.041.47 2.077.37 2.109.28 2.14.16z" />
                                <path className="fil1" d="M686.499 480.482 1822.38 1616.36v65.93L686.499 546.403z" />
                                <path className="fil1" d="M876.035 480.482 2011.92 1616.36v65.93L876.035 546.403z" />
                                <path className="fil1" d="M1255.11 747.806 2390.99 1883.69v164.27L1255.11 912.073z" />
                                <path className="fil1" d="m1584 1248 1135.88 1135.88-.11 8.67-.33 8.62-.54 8.56-.75 8.51-.97 8.44-1.17 8.37-1.38 8.31-1.58 8.24-1.77 8.16-1.98 8.09-2.17 8.02-2.36 7.93-2.54 7.85-2.74 7.76-2.92 7.67-3.09 7.59-3.28 7.49-3.45 7.39-3.63 7.3-3.79 7.19-3.97 7.09-4.12 6.98-4.29 6.87-4.45 6.76-4.61 6.65-4.76 6.53-4.91 6.4-5.07 6.29-5.21 6.16-5.35 6.03-5.49 5.9-5.63 5.77-1135.88-1135.88 5.63-5.77 5.49-5.9 5.35-6.03 5.21-6.16 5.06-6.29 4.92-6.41 4.76-6.52 4.6-6.65 4.45-6.76 4.29-6.87 4.13-6.98 3.96-7.09 3.8-7.2 3.63-7.29 3.45-7.39 3.27-7.5 3.1-7.58 2.92-7.67 2.73-7.77 2.55-7.85 2.36-7.93 2.17-8.01 1.97-8.09 1.78-8.17 1.58-8.23 1.38-8.31 1.17-8.38.96-8.44.76-8.5.54-8.56.33-8.62z" />
                                <path className="fil1" d="M1061.81 469.998 2197.69 1605.88l.95 1.27.82 1.36.7 1.44.55 1.51.41 1.58.25 1.64.08 1.68L1065.57 480.482l-.08-1.685-.25-1.636-.41-1.58-.55-1.514-.7-1.441-.82-1.359z" />
                                <path className="fil1" d="M1065.57 480.482 2201.45 1616.36v65.93L1065.57 546.403z" />
                                <path className="fil1" d="M1255.11 546.404 2390.99 1682.29v16.48L1255.11 562.885z" />
                                <path className="fil1" d="M1255.11 562.885 2390.99 1698.77v161.19L1255.11 724.077z" />
                                <path className="fil1" d="M1255.11 724.077 2390.99 1859.96v3.62L1255.11 727.701z" />
                                <path className="fil1" d="M1255.11 727.701 2390.99 1863.58v17.95L1255.11 745.649z" />
                                <path className="fil1" d="M1255.11 745.649 2390.99 1881.53v2.16L1255.11 747.806z" />
                                <path className="fil1" d="m1496.71 1022.08 1135.88 1135.89 5.35 6.03 5.21 6.16 5.07 6.28 4.91 6.41 4.76 6.53 4.61 6.64 4.45 6.76 4.29 6.88 4.12 6.98 3.97 7.09 3.79 7.19 3.63 7.29 3.45 7.4 3.28 7.49 3.09 7.58 2.92 7.68 2.74 7.76 2.54 7.85 2.36 7.93 2.17 8.01 1.98 8.09 1.77 8.17 1.58 8.24 1.38 8.3 1.17 8.38.97 8.44.75 8.5.54 8.56.33 8.62.11 8.67L1584 1248l-.11-8.67-.33-8.62-.54-8.56-.76-8.5-.96-8.44-1.17-8.38-1.38-8.31-1.58-8.24-1.78-8.16-1.97-8.09-2.17-8.01-2.36-7.93-2.55-7.85-2.73-7.77-2.92-7.67-3.1-7.58-3.27-7.5-3.45-7.39-3.63-7.29-3.8-7.2-3.96-7.09-4.13-6.98-4.29-6.87-4.45-6.76-4.6-6.64-4.76-6.53-4.92-6.41-5.06-6.29-5.21-6.16z" />
                                <path className="fil1" d="M1255.11 912.073c89.956 1.87 171.226 39.093 230.472 98.341 60.804 60.803 98.413 144.804 98.413 237.586 0 92.782-37.609 176.783-98.413 237.587-60.804 60.804-144.804 98.413-237.586 98.413-92.783 0-176.783-37.609-237.587-98.413-59.247-59.246-96.47-140.517-98.34-230.473H506.23c-11.63 0-22.194-4.747-29.84-12.393-7.646-7.648-12.394-18.21-12.394-29.842V546.405h189.536v-65.922c0-9.103 7.38-16.482 16.482-16.482s16.482 7.38 16.482 16.482v65.921h156.573v-65.92c0-9.104 7.38-16.483 16.482-16.483s16.481 7.38 16.481 16.482v65.921h156.573v-65.92c0-9.104 7.38-16.483 16.483-16.483 9.101 0 16.482 7.38 16.482 16.482v65.921h173.059l16.482.001v365.669z" />
                              </g>
                            </g>
                            <path d="M1024-.001c565.541 0 1024 458.46 1024 1024s-458.461 1024-1024 1024c-565.541 0-1024-458.461-1024-1024 0-565.541 458.461-1024 1024-1024z" style={{ fill: 'none' }} />
                            <path d="M1255.11 727.701v485.177c0 11.632-4.747 22.194-12.393 29.842-7.648 7.646-18.209 12.393-29.839 12.393H506.23c-11.63 0-22.194-4.747-29.84-12.393-7.646-7.648-12.394-18.21-12.394-29.842V727.701h791.115z" style={{ fill: '#bdbdbd' }} />
                            <path d="M480.481 546.403h758.15l16.482.001v181.297H463.998V546.405l16.483-.002z" style={{ fill: '#ff3d00' }} />
                            <path d="M480.481 747.806h774.632v-23.73H463.998v23.73h16.483z" style={{ fill: '#db3300' }} />
                            <path className="fil6" d="M653.534 480.482c0-9.103 7.38-16.482 16.482-16.482 9.103 0 16.483 7.38 16.483 16.482v164.814c0 9.103-7.38 16.482-16.483 16.482-9.102 0-16.482-7.38-16.482-16.482V480.482zM843.072 480.482c0-9.103 7.38-16.482 16.481-16.482 9.103 0 16.482 7.38 16.482 16.482v164.814c0 9.103-7.38 16.482-16.482 16.482-9.101 0-16.481-7.38-16.481-16.482V480.482zM1032.61 480.482c0-9.103 7.38-16.482 16.482-16.482s16.483 7.38 16.483 16.482v164.814c0 9.103-7.381 16.482-16.483 16.482s-16.482-7.38-16.482-16.482V480.482z" />
                            <path className="fil7" d="M1083.05 1106.57v35.645H883.455c-.281-8.928 1.126-17.507 4.289-25.732 5.062-13.64 13.217-26.997 24.395-40.214 11.25-13.147 27.42-28.403 48.51-45.698 32.833-26.927 55.05-48.23 66.58-63.977 11.53-15.678 17.294-30.582 17.294-44.574 0-14.693-5.272-27.067-15.749-37.19-10.544-10.054-24.255-15.116-41.127-15.116-17.858 0-32.13 5.343-42.816 16.1-10.756 10.686-16.17 25.52-16.31 44.432l-38.106-3.866c2.602-28.474 12.444-50.128 29.458-65.032 17.014-14.905 39.933-22.357 68.618-22.357 28.965 0 51.884 8.086 68.757 24.115 16.943 16.1 25.38 35.995 25.38 59.759 0 12.092-2.46 23.974-7.452 35.643-4.921 11.672-13.148 23.974-24.607 36.841-11.459 12.935-30.512 30.652-57.157 53.15-22.216 18.7-36.489 31.355-42.816 38.035-6.327 6.608-11.53 13.287-15.678 20.036h148.132zM848.448 1106.57v35.645H648.853c-.281-8.928 1.124-17.507 4.289-25.732 5.062-13.64 13.217-26.997 24.395-40.214 11.25-13.147 27.418-28.403 48.51-45.698 32.833-26.927 55.05-48.23 66.578-63.977 11.531-15.678 17.296-30.582 17.296-44.574 0-14.693-5.273-27.067-15.749-37.19-10.546-10.054-24.255-15.116-41.128-15.116-17.857 0-32.128 5.343-42.815 16.1-10.756 10.686-16.17 25.52-16.31 44.432l-38.106-3.866c2.602-28.474 12.444-50.128 29.458-65.032 17.014-14.905 39.933-22.357 68.618-22.357 28.965 0 51.884 8.086 68.757 24.115 16.943 16.1 25.38 35.995 25.38 59.759 0 12.092-2.461 23.974-7.452 35.643-4.921 11.672-13.148 23.974-24.607 36.841-11.46 12.935-30.512 30.652-57.157 53.15-22.217 18.7-36.489 31.355-42.816 38.035-6.327 6.608-11.53 13.287-15.678 20.036h148.132z" />
                            <path d="M1248 912.544v300.334c0 11.63-4.748 22.194-12.393 29.842-7.648 7.646-18.21 12.393-29.84 12.393H839.67C861.181 1062.19 1029.505 912 1233.993 912c7.084 0 14.124.188 21.117.545z" style={{ fill: '#9f9f9f' }} />
                            <path d="M1083.05 1106.57v35.645H883.457c-.282-8.928 1.124-17.507 4.287-25.732 5.063-13.64 13.218-26.997 24.396-40.214 11.249-13.147 27.42-28.403 48.512-45.698 30.565-25.07 51.93-45.262 64.037-60.638a400.308 400.308 0 0 1 55.863-28.056c-1.236 5.591-3.024 11.134-5.375 16.631-4.921 11.67-13.148 23.974-24.607 36.841-11.459 12.935-30.511 30.652-57.157 53.15-22.216 18.701-36.489 31.356-42.816 38.035-6.327 6.608-11.53 13.287-15.677 20.036h148.13z" style={{ fill: '#262f34' }} />
                            <circle cx="1248" cy="1248" r="293.998" style={{ fill: '#b2ebf2' }} />
                            <path d="M1248 912c92.782 0 176.782 37.609 237.586 98.414C1546.392 1071.22 1584 1155.218 1584 1248c0 92.782-37.609 176.783-98.414 237.587C1424.782 1546.392 1340.782 1584 1248 1584c-92.783 0-176.783-37.608-237.587-98.413-60.806-60.804-98.414-144.806-98.414-237.587 0-92.781 37.609-176.782 98.414-237.586C1071.217 949.61 1155.217 912 1248 912zm0 42.002c162.37 0 293.998 131.628 293.998 293.998 0 162.371-131.628 293.998-293.998 293.998-162.371 0-293.998-131.627-293.998-293.998 0-162.37 131.627-293.998 293.998-293.998z" style={{ fill: '#006064' }} />
                            <path className="fil7" d="M1248 995.997h.001c4.4 0 7.999 3.15 7.999 7v242.958c0 3.85-3.6 7-7.999 7H1248c-4.398 0-7.998-3.15-7.998-7v-242.959c0-3.85 3.598-6.999 7.998-6.999z" />
                            <path d="M1238.73 1243c2.09-3.872 6.572-5.543 9.96-3.715l171.9 92.765c3.387 1.828 4.45 6.493 2.361 10.363v.002c-2.088 3.87-6.57 5.543-9.958 3.714l-171.902-92.765c-3.387-1.828-4.45-6.491-2.36-10.364z" style={{ fill: '#546e7a' }} />
                            <circle className="fil7" cx="1248" cy="1248" r="21" />
                            <path d="M1030.59 1376.66a3.28 3.28 0 0 1-3.27-5.69l270.545-155.395a3.28 3.28 0 0 1 3.268 5.691L1030.59 1376.66z" style={{ fill: '#d50000', fillRule: 'nonzero' }} />
                            <circle transform="matrix(.20025 -.74074 .74074 .20025 1248 1248)" r="14.062" style={{ fill: '#d50000' }} />
                            <path d="M1248 954.002v587.996c-162.371 0-293.998-131.627-293.998-293.998 0-162.37 131.627-293.998 293.998-293.998z" style={{ fill: '#a0dbe0' }} />
                            <path d="M1248 912v42.002c-162.371 0-293.998 131.628-293.998 293.998 0 162.371 131.627 293.998 293.998 293.998v42.003c-92.783 0-176.783-37.609-237.587-98.413-60.806-60.805-98.414-144.806-98.414-237.587 0-92.782 37.609-176.782 98.414-237.586C1071.217 949.609 1155.217 912 1248 912z" style={{ fill: '#005e60' }} />
                            <path className="fil17" d="M1248 995.997h.001v256.957H1248c-4.398 0-7.998-3.149-7.998-7v-242.958c0-3.85 3.598-7 7.998-7z" />
                            <path d="M1238.73 1243v-.001c1.951-3.616 5.99-5.31 9.272-4.031v18.124l-6.911-3.729c-3.387-1.828-4.45-6.491-2.361-10.363z" style={{ fill: '#4c6b74' }} />
                            <path className="fil17" d="M1248 1227v42c-11.598 0-21-9.402-21-21 0-11.597 9.402-21 21-21z" />
                            <path d="M1030.59 1376.66a3.283 3.283 0 0 1-3.27-5.69l220.677-126.752v7.568L1030.59 1376.66z" style={{ fill: '#c00806', fillRule: 'nonzero' }} />
                            <path d="M1237.58 1245.18c1.302-4.813 5.659-7.98 10.417-7.976v21.584c-.93 0-1.875-.121-2.817-.376-5.753-1.556-9.154-7.479-7.6-13.232z" style={{ fill: '#c00806' }} />
                          </g>
                        </svg>
                      </span>
                      <div className="stat-value stat-blue">{
                        user.lastDonation ?
                          (new Date(user.lastDonation).toString() !== 'Invalid Date'
                            ? new Date(user.lastDonation).toLocaleDateString()
                            : user.lastDonation.slice(0, 10))
                          : 'N/A'
                      }</div>
                      <div className="stat-label">Last Donation</div>
                    </div>
                    <div className="donation-stat">
                      {/* Next Eligible SVG - Provided by user */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="32" height="32" viewBox="0 0 2048 2048" style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}>
                          <defs>
                            <style>{`.fil14{fill:#223539}.fil4{fill:#263238}.fil3{fill:#0091ea;fill-rule:nonzero}`}</style>
                          </defs>
                          <g id="Layer_x0020_1">
                            <g id="_359271856">
                              <path d="M1341 618v665c0 16-7 30-17 41-10 10-25 17-41 17H314c-16 0-30-7-41-17-10-10-17-25-17-41V618h1085z" style={{ fill: '#bdbdbd' }} />
                              <path d="M279 369h1063v249H257V369h23z" style={{ fill: '#ff3d00' }} />
                              <path d="M279 645h1063v-33H257v33h23z" style={{ fill: '#db3300' }} />
                              <path className="fil3" d="M516 279c0-12 10-23 23-23 12 0 23 10 23 23v226c0 12-10 23-23 23-12 0-23-10-23-23V279zM776 279c0-12 10-23 23-23 12 0 23 10 23 23v226c0 12-10 23-23 23-12 0-23-10-23-23V279zM1036 279c0-12 10-23 23-23 12 0 23 10 23 23v226c0 12-10 23-23 23-12 0-23-10-23-23V279z" />
                              <path className="fil4" d="M1105 1137v49H831c0-12 2-24 6-35 7-19 18-37 33-55s38-39 67-63c45-37 75-66 91-88s24-42 24-61c0-20-7-37-22-51-14-14-33-21-56-21-24 0-44 7-59 22s-22 35-22 61l-52-5c4-39 17-69 40-89s55-31 94-31c40 0 71 11 94 33s35 49 35 82c0 17-3 33-10 49s-18 33-34 51-42 42-78 73c-30 26-50 43-59 52s-16 18-22 27h203zM783 1137v49H509c0-12 2-24 6-35 7-19 18-37 33-55s38-39 67-63c45-37 75-66 91-88s24-42 24-61c0-20-7-37-22-51-14-14-33-21-56-21-24 0-44 7-59 22s-22 35-22 61l-52-5c4-39 17-69 40-89s55-31 94-31c40 0 71 11 94 33s35 49 35 82c0 17-3 33-10 49s-18 33-34 51-42 42-78 73c-30 26-50 43-59 52s-16 18-22 27h203z" />
                            </g>
                            <g id="_359271400">
                              <path d="M1341 871v412c0 16-7 30-17 41-10 10-25 17-41 17H771c29-265 260-471 541-471 10 0 19 0 29 1z" style={{ fill: '#9f9f9f' }} />
                              <path d="M1105 1137v49H831c0-12 2-24 6-35 7-19 18-37 33-55s38-39 67-63c42-34 71-62 88-83 24-15 50-28 77-38-2 8-4 15-7 23-7 16-18 33-34 51s-42 42-78 73c-30 26-50 43-59 52s-16 18-22 27h203z" style={{ fill: '#262f34' }} />
                            </g>
                            <g id="_360340336">
                              <circle cx="1331" cy="1331" r="403" style={{ fill: '#b2ebf2' }} />
                              <path d="M1331 870c127 0 242 52 326 135 83 83 135 199 135 326s-52 242-135 326c-83 83-199 135-326 135s-242-52-326-135c-83-83-135-199-135-326s52-242 135-326c83-83 199-135 326-135zm0 58c223 0 403 181 403 403 0 223-181 403-403 403-223 0-403-181-403-403 0-223 181-403 403-403z" style={{ fill: '#006064' }} />
                              <path className="fil4" d="M1331 986c6 0 11 4 11 10v333c0 5-5 10-11 10s-11-4-11-10V996c0-5 5-10 11-10z" />
                              <path d="M1318 1324c3-5 9-8 14-5l236 127c5 3 6 9 3 14s-9 8-14 5l-236-127c-5-3-6-9-3-14z" style={{ fill: '#546e7a' }} />
                              <circle className="fil4" cx="1331" cy="1331" r="29" />
                              <path d="M1033 1508c-2 1-5 0-6-2s0-5 2-6l371-213c2-1 5 0 6 2s0 5-2 6l-371 213z" style={{ fill: '#d50000', fillRule: 'nonzero' }} />
                              <circle transform="rotate(-74.872 1535.036 -203.833) scale(1.05234)" r="14" style={{ fill: '#d50000' }} />
                              <g>
                                <path d="M1331 928v806c-223 0-403-181-403-403 0-223 181-403 403-403z" style={{ fill: '#a0dbe0' }} />
                                <path d="M1331 870v58c-223 0-403 181-403 403 0 223 181 403 403 403v58c-127 0-242-52-326-135-83-83-135-199-135-326s52-242 135-326c83-83 199-135 326-135z" style={{ fill: '#005e60' }} />
                                <path className="fil14" d="M1331 986v352c-6 0-11-4-11-10V995c0-5 5-10 11-10z" />
                                <path d="M1318 1324c3-5 8-7 13-6v25l-9-5c-5-3-6-9-3-14z" style={{ fill: '#4c6b74' }} />
                                <path className="fil14" d="M1331 1302v58c-16 0-29-13-29-29s13-29 29-29z" />
                                <path d="M1033 1508c-2 1-5 0-6-2s0-5 2-6l303-174v10l-298 171z" style={{ fill: '#c00806', fillRule: 'nonzero' }} />
                                <path d="M1317 1327c2-7 8-11 14-11v30c-1 0-3 0-4-1-8-2-13-10-10-18z" style={{ fill: '#c00806' }} />
                              </g>
                            </g>
                            <path style={{ fill: 'none' }} d="M0 0h2048v2048H0z" />
                          </g>
                        </svg>
                      </span>
                      <div className="stat-value stat-blue">{
                        user.nextEligible ?
                          (new Date(user.nextEligible).toString() !== 'Invalid Date'
                            ? new Date(user.nextEligible).toLocaleDateString()
                            : user.nextEligible)
                          : 'N/A'
                      }</div>
                      <div className="stat-label">Next Eligible</div>
                    </div>
                    <div className="donation-stat">
                      {/* Lives Saved SVG - Provided by user */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
                        <svg version="1.1" id="Icon_Set" xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 512 512" width="32" height="32" style={{ enableBackground: 'new 0 0 512 512' }} xmlSpace="preserve">
                          <style>{`.st2{fill:#4c4372}.st7{fill:#e8677d}`}</style>
                          <g id="Blood_Donation">
                            <circle cx="256" cy="256" r="207" style={{ fill: '#f0c48a' }} />
                            <path d="M256 243.698c-36.921 0-59.996-39.968-41.536-71.942L256 99.815l41.536 71.942c18.46 31.974-4.615 71.941-41.536 71.941z" style={{ fill: '#fd919e' }} />
                            <path className="st2" d="M256 249.698c-19.508 0-36.979-10.086-46.732-26.98-9.754-16.894-9.754-37.066 0-53.961l41.536-71.942a6.002 6.002 0 0 1 10.392 0l41.536 71.942c9.754 16.895 9.754 37.067-.001 53.961-9.753 16.894-27.223 26.98-46.731 26.98zm0-137.884-36.34 62.942c-7.585 13.138-7.585 28.824 0 41.961s21.17 20.98 36.34 20.98 28.755-7.843 36.34-20.98 7.585-28.824 0-41.961L256 111.814z" />
                            <path className="st7" d="M347.504 214.591c-21.983 0-35.722-23.797-24.731-42.835l24.731-42.835 24.731 42.835c10.991 19.038-2.748 42.835-24.731 42.835z" />
                            <path className="st2" d="M347.504 220.591c-12.492 0-23.68-6.459-29.927-17.278-6.246-10.819-6.246-23.737 0-34.557l24.73-42.835a6.002 6.002 0 0 1 10.392 0l24.73 42.834c6.246 10.819 6.246 23.738 0 34.557-6.245 10.82-17.433 17.279-29.925 17.279zm0-79.669-19.534 33.834c-4.077 7.062-4.077 15.495 0 22.557 4.077 7.062 11.38 11.278 19.534 11.278s15.457-4.216 19.534-11.278 4.077-15.494 0-22.556l-19.534-33.835z" />
                            <g>
                              <path className="st7" d="M164.496 214.591c-21.983 0-35.722-23.797-24.731-42.835l24.731-42.835 24.731 42.835c10.991 19.038-2.748 42.835-24.731 42.835z" />
                              <path className="st2" d="M164.496 220.591c-12.492 0-23.68-6.459-29.927-17.278-6.246-10.819-6.246-23.737 0-34.557l24.73-42.835a6.002 6.002 0 0 1 10.392 0l24.73 42.834c6.246 10.819 6.246 23.738 0 34.557-6.245 10.82-17.433 17.279-29.925 17.279zm0-79.669-19.534 33.834c-4.077 7.062-4.077 15.495 0 22.557 4.077 7.062 11.38 11.278 19.534 11.278s15.457-4.216 19.534-11.278 4.077-15.494 0-22.556l-19.534-33.835z" />
                            </g>
                            <g>
                              <path d="m90.502 347.338 44.26-48.319a98.368 98.368 0 0 1 72.537-31.925h89.242c9.554 0 17.298 7.745 17.298 17.298 0 9.554-7.745 17.298-17.298 17.298h-31.046a8.555 8.555 0 0 0-8.555 8.555 8.555 8.555 0 0 0 8.555 8.555h46.479a55.938 55.938 0 0 0 29.721-8.549l56.535-35.46c6.863-4.304 15.904-2.377 20.415 4.351l.209.312c4.682 6.984 2.983 16.342-3.796 21.192l-66.881 47.847a66.87 66.87 0 0 1-38.908 12.484h-87.014a36.162 36.162 0 0 0-24.806 9.849l-43.876 41.36-63.071-64.848z" style={{ fill: '#d3e6f8' }} />
                              <path className="st2" d="M153.574 418.186a5.982 5.982 0 0 1-4.302-1.817l-63.071-64.848a6 6 0 0 1-.124-8.236l44.26-48.319c19.719-21.526 47.77-33.873 76.962-33.873h89.241c12.847 0 23.299 10.452 23.299 23.298s-10.452 23.298-23.299 23.298h-31.046c-1.408 0-2.555 1.146-2.555 2.555s1.146 2.555 2.555 2.555h46.479a49.888 49.888 0 0 0 26.534-7.632l56.534-35.46c9.672-6.066 22.229-3.389 28.587 6.093l.213.319c6.509 9.707 4.186 22.626-5.292 29.407l-66.881 47.847c-12.44 8.9-27.102 13.604-42.398 13.604h-87.015a30.05 30.05 0 0 0-20.69 8.215l-43.876 41.36a5.984 5.984 0 0 1-4.115 1.634zm-54.822-70.972 55.004 56.554 39.578-37.309a42.006 42.006 0 0 1 28.921-11.483h87.015c12.777 0 25.024-3.93 35.416-11.364l66.881-47.847c4.169-2.982 5.181-8.679 2.304-12.97l-.213-.318a8.947 8.947 0 0 0-12.239-2.604l-56.535 35.46a61.876 61.876 0 0 1-32.91 9.466h-46.479c-8.025 0-14.555-6.529-14.555-14.555s6.529-14.555 14.555-14.555h31.046c6.23 0 11.299-5.068 11.299-11.298s-5.068-11.298-11.299-11.298H207.3c-25.836 0-50.662 10.927-68.112 29.978l-40.436 44.143z" />
                            </g>
                          </g>
                        </svg>
                      </span>
                      <div className="stat-value stat-green">{user.totalDonations ? user.totalDonations * 3 : 0}</div>
                      <div className="stat-label">Lives Saved</div>
                    </div>
                  </div>
                </div>

                {/* Reward Section */}
                <div className="dashboard-card glassy reward-stats animate-fadein">
                  <div className="reward-title gradient-text">Reward Points & Ranking</div>
                  <div className="reward-points stat-green">{user.points} Points</div>
                  <div className="reward-rank">Rank: {user.rank}</div>
                </div>
              </div>

              {/* Remove from System Option */}
              <div className="dashboard-cta-card glassy animate-fadein">
                <h3 className="cta-title gradient-text">System Management</h3>
                <p className="cta-desc">If you no longer wish to be part of the continuous donation program, you can request removal from the system.</p>
                <button className="dashboard-btn danger" onClick={handleRemoveFromSystem}>Remove from System</button>
              </div>
            </>
          )}
          {activeSection === 'donations' && (
            <div className="donation-history-container">
              <h2 className="donation-history-title">My Donation History</h2>
              {donations.length === 0 ? (
                <div className="no-donations-message">
                  <p>No donation records found.</p>
                </div>
              ) : (
                <div className="donation-table-wrapper">
                  <table className="donation-history-table">
                    <thead>
                      <tr>
                        <th className="th-number">No.</th>
                        <th className="th-volume">Volume (ml)</th>
                        <th className="th-date">Date</th>
                        <th className="th-hospital">Hospital</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donations.map((don, idx) => (
                        <tr key={don.donation_id || idx} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                          <td className="td-number">{idx + 1}</td>
                          <td className="td-volume">{don.units_donated}</td>
                          <td className="td-date">{new Date(don.donation_date).toLocaleString()}</td>
                          <td className="td-hospital">{don.hospital_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeSection === 'rewards' && user && user.donorId && (
            <RewardsDashboard donorId={user.donorId} />
          )}
          {activeSection === 'feedback' && (
            <div className="feedback-section-container">
              {/* Feedback Header */}
              <div className="feedback-header">
                <div className="feedback-header-content">
                  <h2 className="feedback-title">💬 Share Your Experience</h2>
                  <p className="feedback-subtitle">Help us improve our blood donation platform by sharing your thoughts and suggestions</p>
                </div>
                <div className="feedback-stats">
                  <div className="feedback-stat">
                    <div className="stat-icon">🎤</div>
                    <div className="stat-content">
                      <span className="stat-number">Your Voice</span>
                      <span className="stat-label">Matters</span>
                    </div>
                    <div className="stat-decoration">
                      <div className="decoration-dot"></div>
                      <div className="decoration-dot"></div>
                      <div className="decoration-dot"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Form Card */}
              <div className="feedback-form-card">
                <div className="form-header">
                  <h3>📝 Submit Feedback</h3>
                  <p>Tell us about your experience with our blood donation platform</p>
                </div>

                <form
                  className="feedback-form"
                  onSubmit={async e => {
                    e.preventDefault();
                    const feedback = e.target.elements.feedback.value.trim();
                    const feedbackType = e.target.elements.feedbackType.value;
                    const rating = e.target.elements.rating.value;

                    if (!feedback) {
                      toast.error('Please enter your feedback.');
                      return;
                    }

                    try {
                      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/submit_feedback.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          donorId: user.donorId,
                          feedback,
                          feedbackType,
                          rating
                        }),
                        credentials: 'include',
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success('Thank you for your feedback! It will be reviewed by an admin before being displayed on the homepage.');
                        e.target.reset();
                        // Reset rating display
                        document.querySelectorAll('.rating-star').forEach(star => {
                          star.classList.remove('active');
                        });
                      } else {
                        toast.error(data.message || 'Failed to submit feedback');
                      }
                    } catch (err) {
                      toast.error('Error submitting feedback');
                    }
                  }}
                >
                  {/* Feedback Type Selection */}
                  <div className="form-group">
                    <label className="form-label">Feedback Type</label>
                    <select name="feedbackType" className="form-select" required>
                      <option value="">Select feedback type</option>
                      <option value="general">General Feedback</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="complaint">Complaint</option>
                      <option value="praise">Praise</option>
                      <option value="bug">Bug Report</option>
                    </select>
                  </div>

                  {/* Rating Section */}
                  <div className="form-group">
                    <label className="form-label">Overall Rating</label>
                    <div className="rating-container">
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span
                            key={star}
                            className="rating-star"
                            onClick={() => {
                              // Update visual stars
                              document.querySelectorAll('.rating-star').forEach((s, index) => {
                                if (index < star) {
                                  s.classList.add('active');
                                } else {
                                  s.classList.remove('active');
                                }
                              });
                              // Update hidden input
                              document.querySelector('input[name="rating"]').value = star;
                            }}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      <input type="hidden" name="rating" value="0" />
                      <span className="rating-text">Click to rate your experience</span>
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <div className="form-group">
                    <label className="form-label">Your Feedback</label>
                    <textarea
                      name="feedback"
                      className="feedback-textarea"
                      rows={6}
                      placeholder="Share your thoughts, suggestions, or experiences with our blood donation platform..."
                      required
                      onChange={(e) => {
                        const charCount = e.target.value.length;
                        e.target.parentNode.querySelector('.char-count').textContent = charCount;
                      }}
                    />
                    <div className="textarea-counter">
                      <span className="char-count">0</span> / 500 characters
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="submit-feedback-btn">
                    <span className="btn-icon">📤</span>
                    Submit Feedback
                  </button>
                </form>
              </div>

              {/* Feedback Guidelines */}
              <div className="feedback-guidelines">
                <h3>📋 Feedback Guidelines</h3>
                <div className="guidelines-grid">
                  <div className="guideline-item">
                    <span className="guideline-icon">💡</span>
                    <div className="guideline-content">
                      <h4>Be Specific</h4>
                      <p>Provide detailed feedback about specific features or experiences</p>
                    </div>
                  </div>
                  <div className="guideline-item">
                    <span className="guideline-icon">🤝</span>
                    <div className="guideline-content">
                      <h4>Be Constructive</h4>
                      <p>Share suggestions for improvement along with any concerns</p>
                    </div>
                  </div>
                  <div className="guideline-item">
                    <span className="guideline-icon">🔒</span>
                    <div className="guideline-content">
                      <h4>Privacy First</h4>
                      <p>Don't include personal information in your feedback</p>
                    </div>
                  </div>
                  <div className="guideline-item">
                    <span className="guideline-icon">⏰</span>
                    <div className="guideline-content">
                      <h4>Response Time</h4>
                      <p>We review and respond to feedback within 48 hours</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Add similar blocks for Donations, Rewards, Feedback, etc. if needed */}
        </div>
        {/* Footer removed for clean layout */}
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" onClick={() => {
          setShowEditProfile(false);
          // Reset user state if modal is closed without saving
          if (editForm.removeAvatar && !editForm.profilePicFile) {
            setUser(u => ({ ...u, profilePic: editForm.profilePic }));
          }
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => {
              setShowEditProfile(false);
              // Reset user state if modal is closed without saving
              if (editForm.removeAvatar && !editForm.profilePicFile) {
                setUser(u => ({ ...u, profilePic: editForm.profilePic }));
              }
            }}>&times;</button>

            {/* Header */}
            <div>
              <h2>Edit Profile</h2>
              <p>Update your personal information</p>
            </div>

            <form>
              {/* Profile Picture Section */}
              <div className="profile-picture-section">
                <div>
                  <img
                    src={editForm.profilePic || user.profilePic}
                    alt="Profile"
                  />
                  <div className="profile-picture-buttons">
                    <label className="change-photo-btn">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => {
                              setEditForm(f => ({ ...f, profilePic: ev.target.result, profilePicFile: file }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {(editForm.profilePic || user.profilePic) && (
                      <button
                        type="button"
                        className="remove-avatar-btn"
                        onClick={() => {
                          setEditForm(f => ({
                            ...f,
                            profilePic: null,
                            profilePicFile: null,
                            removeAvatar: true
                          }));
                          // Immediately update the user state for instant UI feedback
                          setUser(u => ({ ...u, profilePic: null }));
                        }}
                      >
                        Remove Avatar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields in Single Column */}
              <div className="form-grid">
                {/* Donor ID */}
                <div className="form-field">
                  <label>Donor ID</label>
                  <input
                    type="text"
                    value={editForm.donorId || ''}
                    readOnly
                  />
                </div>

                {/* Name */}
                <div className="form-field">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Age */}
                <div className="form-field">
                  <label>Age</label>
                  <input
                    type="number"
                    value={editForm.age || ''}
                    readOnly
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #e2e8f0',
                      fontSize: '14px',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      cursor: 'not-allowed'
                    }}
                    placeholder="Age cannot be changed"
                    min="18"
                    max="65"
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Age cannot be modified for verification purposes
                  </small>
                </div>

                {/* Blood Type */}
                <div className="form-field">
                  <label>Blood Type</label>
                  <input
                    type="text"
                    value={editForm.bloodType || ''}
                    readOnly
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1.5px solid #e2e8f0',
                      fontSize: '14px',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      cursor: 'not-allowed'
                    }}
                    placeholder="Blood type cannot be changed"
                  />
                  <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Blood type cannot be modified for safety reasons
                  </small>
                </div>

                {/* Location */}
                <div className="form-field">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Enter your location"
                  />
                </div>

                {/* Email */}
                <div className="form-field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    readOnly
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowEditProfile(false);
                    // Reset user state if modal is closed without saving
                    if (editForm.removeAvatar && !editForm.profilePicFile) {
                      setUser(u => ({ ...u, profilePic: editForm.profilePic }));
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="save-btn"
                  onClick={() => setShowSaveProfileDialog(true)}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hospital Popup */}
      {showHospitalPopup && (
        <div className="hospital-popup-overlay" onClick={() => setShowHospitalPopup(false)}>
          <div className="hospital-popup" onClick={e => e.stopPropagation()}>
            <div className="popup-header">
              <h3>🏥 Nearby Hospitals</h3>
              <button
                className="close-btn"
                onClick={() => setShowHospitalPopup(false)}
              >
                ✕
              </button>
            </div>
            <div className="popup-content">
              <p className="location-info">Hospitals near <strong>{user?.location || 'your location'}</strong></p>
              {loadingHospitals ? (
                <div className="loading-hospitals">
                  <div className="loading-spinner"></div>
                  <p>Loading hospitals...</p>
                </div>
              ) : hospitals.length > 0 ? (
                <div className="hospitals-list">
                  {hospitals.map((hospital, index) => (
                    <div key={hospital.id || index} className="hospital-item">
                      <div className="hospital-info">
                        <h4 className="hospital-name">{hospital.name}</h4>
                        <p className="hospital-address">{hospital.address}</p>
                        <div className="hospital-details">
                          <span className="distance">{hospital.distance}</span>
                          <span className="rating">⭐ {hospital.rating}</span>
                        </div>
                        <div className="hospital-services">
                          <span className="service-badge blood-bank">🩸 Blood Bank</span>
                          <span className="service-badge emergency">🚨 Emergency</span>
                        </div>
                      </div>
                      <div className="hospital-actions">
                        <button className="call-btn" onClick={() => window.open(`tel:${hospital.phone}`)}>
                          📞 Call
                        </button>
                        <button className="directions-btn" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`)}>
                          🗺️ Directions
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-hospitals">
                  <p>No hospitals found near {user?.location || 'your location'}</p>
                  <p className="no-hospitals-subtitle">Try updating your location or contact support</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Health Tips Popup */}
      {showHealthTipsPopup && (
        <div className="health-tips-popup-overlay" onClick={() => setShowHealthTipsPopup(false)}>
          <div className="health-tips-popup" onClick={e => e.stopPropagation()}>
            <div className="popup-header health-header">
              <h3>💊 Health Tips for Blood Donors</h3>
              <button
                className="close-btn"
                onClick={() => setShowHealthTipsPopup(false)}
              >
                ✕
              </button>
            </div>
            <div className="popup-content health-content">
              <div className="health-tips-single-card">
                <div className="all-tips-section">
                  <div className="tip-list">
                    {/* Before Donation Tips */}
                    <h4 className="section-title">🕐 Before Donation</h4>
                    <div className="tip-item">
                      <span className="tip-icon">💧</span>
                      <div className="tip-content">
                        <h5>Stay Hydrated</h5>
                        <p>Drink plenty of water 24 hours before donation</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">😴</span>
                      <div className="tip-content">
                        <h5>Get Good Sleep</h5>
                        <p>Ensure 7-8 hours of sleep the night before</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">🍽️</span>
                      <div className="tip-content">
                        <h5>Eat Well</h5>
                        <p>Have a healthy meal 3-4 hours before donation</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">🚫</span>
                      <div className="tip-content">
                        <h5>Avoid Alcohol</h5>
                        <p>Don't consume alcohol 24 hours before donation</p>
                      </div>
                    </div>

                    {/* During Donation Tips */}
                    <h4 className="section-title">🩸 During Donation</h4>
                    <div className="tip-item">
                      <span className="tip-icon">😌</span>
                      <div className="tip-content">
                        <h5>Stay Relaxed</h5>
                        <p>Take deep breaths and stay calm</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">💪</span>
                      <div className="tip-content">
                        <h5>Pump Your Fist</h5>
                        <p>Gently squeeze and release your fist to help blood flow</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">🗣️</span>
                      <div className="tip-content">
                        <h5>Communicate</h5>
                        <p>Tell staff if you feel dizzy or uncomfortable</p>
                      </div>
                    </div>

                    {/* After Donation Tips */}
                    <h4 className="section-title">🔄 After Donation</h4>
                    <div className="tip-item">
                      <span className="tip-icon">💺</span>
                      <div className="tip-content">
                        <h5>Rest for 10-15 Minutes</h5>
                        <p>Stay seated and relax after donation</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">🥤</span>
                      <div className="tip-content">
                        <h5>Drink Extra Fluids</h5>
                        <p>Consume extra water for the next 24 hours</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">🍎</span>
                      <div className="tip-content">
                        <h5>Eat Iron-Rich Foods</h5>
                        <p>Include spinach, red meat, and beans in your diet</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">🏃</span>
                      <div className="tip-content">
                        <h5>Avoid Strenuous Exercise</h5>
                        <p>Wait 24 hours before heavy physical activity</p>
                      </div>
                    </div>

                    {/* General Health Tips */}
                    <h4 className="section-title">❤️ General Health</h4>
                    <div className="tip-item">
                      <span className="tip-icon">🏥</span>
                      <div className="tip-content">
                        <h5>Regular Check-ups</h5>
                        <p>Get regular health check-ups to ensure eligibility</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">💊</span>
                      <div className="tip-content">
                        <h5>Medication Awareness</h5>
                        <p>Inform staff about any medications you're taking</p>
                      </div>
                    </div>
                    <div className="tip-item">
                      <span className="tip-icon">📅</span>
                      <div className="tip-content">
                        <h5>Wait Between Donations</h5>
                        <p>Wait at least 56 days between whole blood donations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="emergency-contact">
                <h4>🚨 Emergency Contact</h4>
                <p>If you experience any unusual symptoms after donation, contact your healthcare provider immediately.</p>
                <div className="emergency-info">
                  <span>📞 Blood Bank Hotline: 104</span>
                  <span>🏥 Emergency: 108</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
