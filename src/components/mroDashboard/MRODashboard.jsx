import React, { useState, useEffect, useCallback } from "react";
import "./MRODashboard.css";
import { useNavigate } from 'react-router-dom';
import { FaUserFriends, FaClipboardList, FaUserCheck, FaCheckCircle } from 'react-icons/fa';
import logo from '../../assets/logo.svg';
import { toast } from 'sonner';
import ConfirmDialog from '../common/ConfirmDialog';
import ErrorDisplay from '../common/ErrorDisplay';
import LoadingSpinner from '../common/LoadingSpinner';

const MRODashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("Overview");
  const [showPopup, setShowPopup] = useState(false);
  const [popupDonor, setPopupDonor] = useState(null);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    medicalHistory: '',
    doctorsNote: '',
    verificationDate: new Date().toISOString().split('T')[0], // Today's date as default
    bloodGroup: '',
    age: ''
  });

  // Function to calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob || dob === '' || dob === null || dob === undefined) {
      return '';
    }
    
    try {
      const today = new Date();
      const birthDate = new Date(dob);
      
      // Check if birthDate is valid
      if (isNaN(birthDate.getTime())) {
        return '';
      }
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      return age;
    } catch (error) {
      console.error('Error calculating age from DOB:', dob, error);
      return '';
    }
  };
  const [donorRequests, setDonorRequests] = useState([]);
  const [donorRegistrations, setDonorRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState("");
  const [showDonatePopup, setShowDonatePopup] = useState(false);
  const [donatePopupDonor, setDonatePopupDonor] = useState(null);
  const [donateForm, setDonateForm] = useState({
    bloodType: '',
    donationDate: '',
    volume: '',
    notes: ''
  });
  const [donationLogs, setDonationLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationStats, setVerificationStats] = useState({ verificationData: [], stats: {} });
  const [donationTimestamp, setDonationTimestamp] = useState('');
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalNameLoading, setHospitalNameLoading] = useState(true);
  const [hospitalNameError, setHospitalNameError] = useState(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectDonorId, setRejectDonorId] = useState(null);
  const [rejectDonorData, setRejectDonorData] = useState(null);
  const [verificationDateTime, setVerificationDateTime] = useState('');
  const [hospitalId, setHospitalId] = useState("");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutTriggered, setIsLogoutTriggered] = useState(false);

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

  // Auth check: redirect to home if not logged in as MRO
  useEffect(() => {
    fetch("http://localhost/Liveonv2/backend_api/controllers/get_donor_requests.php", { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          navigate('/');
        }
      });
  }, [navigate]);

  useEffect(() => {
    // Don't fetch data if we're logging out
    if (isLoggingOut) return;

    setLoading(true);
    setError(null);

    const controller = new AbortController();

    fetch("http://localhost/Liveonv2/backend_api/controllers/get_donor_requests.php", {
      credentials: "include",
      signal: controller.signal
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            // Session expired or user not logged in - redirect to login
            throw new Error('SESSION_EXPIRED');
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isLoggingOut) {
          if (data.success) {
            setDonorRequests(data.requests || []);
            setError(null); // Clear any previous errors
          } else {
            throw new Error(data.error || 'Failed to fetch requests');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        // Don't set error if we're logging out or component is unmounting
        if (!isLoggingOut && err.name !== 'AbortError') {
          console.error('Error fetching donor requests:', err);

          if (err.message === 'SESSION_EXPIRED') {
            // Don't set error state, just redirect immediately
            setLoading(false);
            navigate('/');
            return;
          }

          setError(err.message);
          setLoading(false);
          toast.error('Failed to fetch donor requests: ' + err.message);
        }
      });

    // Cleanup function to abort fetch if component unmounts or logout starts
    return () => {
      controller.abort();
    };
  }, [isLoggingOut, navigate]);

  // Fetch donor registrations
  useEffect(() => {
    if (isLoggingOut) return;

    const controller = new AbortController();

    fetch("http://localhost/Liveonv2/backend_api/controllers/get_donor_registrations.php", {
      credentials: "include",
      signal: controller.signal
    })
      .then(async res => {
        if (!res.ok) {
          if (res.status === 401) {
            navigate('/');
            return;
          }
          const errorData = await res.text();
          console.error('Response data:', errorData);
          try {
            const jsonError = JSON.parse(errorData);
            throw new Error(jsonError.error || `HTTP ${res.status}`);
          } catch (e) {
            throw new Error(`HTTP ${res.status}: ${errorData}`);
          }
        }
        return res.json();
      })
      .then(data => {
        if (!isLoggingOut) {
          if (data && data.success) {
            setDonorRegistrations(data.registrations || []);
          } else {
            console.error('Error response:', data);
            throw new Error(data?.error || 'Failed to fetch registrations');
          }
        }
      })
      .catch(err => {
        if (!isLoggingOut && err.name !== 'AbortError') {
          console.error('Error fetching donor registrations:', err);
          if (err.stack) console.error(err.stack);
          toast.error('Failed to fetch donor registrations: ' + err.message);
        }
      });

    return () => controller.abort();
  }, [isLoggingOut, navigate]);

  // Fetch verification statistics
  useEffect(() => {
    if (isLoggingOut) return;

    fetch("http://localhost/Liveonv2/backend_api/controllers/get_verification_stats.php", {
      credentials: "include"
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('SESSION_EXPIRED');
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isLoggingOut) {
          setVerificationStats(data);
          setError(null); // Clear any previous errors
        }
      })
      .catch((err) => {
        if (!isLoggingOut) {
          console.error("Error fetching verification stats:", err);

          if (err.message === 'SESSION_EXPIRED') {
            navigate('/');
            return;
          }

          toast.error('Failed to fetch verification stats: ' + err.message);
        }
      });
  }, [isLoggingOut, navigate]);

  // Fetch donation logs
  useEffect(() => {
    if (isLoggingOut) return;

    fetch("http://localhost/Liveonv2/backend_api/controllers/get_donation_logs.php", {
      credentials: "include"
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('SESSION_EXPIRED');
          }
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && !isLoggingOut) {
          setDonationLogs(data.donations);
          setError(null); // Clear any previous errors
        } else {
          console.error("Error fetching donation logs:", data.error);
        }
      })
      .catch((err) => {
        if (!isLoggingOut) {
          console.error("Error fetching donation logs:", err);

          if (err.message === 'SESSION_EXPIRED') {
            navigate('/');
            return;
          }

          toast.error('Failed to fetch donation logs: ' + err.message);
        }
      });
  }, [isLoggingOut, navigate]);

  useEffect(() => {
    // Don't fetch if we're logging out
    if (isLoggingOut) return;

    // Fetch hospital name for MRO
    fetch("http://localhost/Liveonv2/backend_api/controllers/get_mro_hospital.php", {
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
        if (!isLoggingOut) {
          if (data.success) {
            setHospitalName(data.hospital_name);
            if (data.hospital_id) setHospitalId(data.hospital_id);
            setError(null); // Clear any previous errors
          } else {
            setHospitalNameError(data.error || "Failed to load hospital name");
          }
          setHospitalNameLoading(false);
        }
      })
      .catch(err => {
        if (!isLoggingOut) {
          console.error("Error fetching hospital name:", err);

          if (err.message === 'SESSION_EXPIRED') {
            navigate('/');
            return;
          }

          setHospitalNameError("Failed to load hospital name");
          toast.error('Failed to load hospital name: ' + err.message);
          setHospitalNameLoading(false);
        }
      });
  }, [isLoggingOut, navigate]);

  useEffect(() => {
    if (showPopup) {
      const now = new Date();
      setVerificationDateTime(now.toLocaleString('en-GB', { hour12: false }));
    }
  }, [showPopup]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenPopup = (donor) => {
    setPopupDonor(donor);
    setShowPopup(true);
    
    // Calculate age automatically from DOB
    const calculatedAge = calculateAge(donor.dob);
    
    setFormData(prev => ({
      ...prev,
      age: calculatedAge ? calculatedAge.toString() : '',
      bloodGroup: donor.blood_group || ''
    }));
  };
  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupDonor(null);
  };

  const handleSubmitDonorDetails = async () => {
    if (!popupDonor) return;
    setSubmitStatus("");

    // Validate age for blood donation eligibility
    const age = parseInt(formData.age);
    if (!age || age < 18) {
      toast.error('Donor must be at least 18 years old to be medically verified for blood donation. Age calculated from DOB: ' + age);
      return;
    } else if (age > 65) {
      toast.error('Donor must be 65 years old or younger to be medically verified for blood donation. Age calculated from DOB: ' + age);
      return;
    }

    // Prepare data for backend
    const donor_id = popupDonor.donor_id;

    const mro_id = 'MRO001'; // Replace with actual logged-in MRO ID if available
    const payload = {
      donor_id: donor_id,
      mro_id: mro_id,
      height_cm: formData.height,
      weight_kg: formData.weight,
      medical_history: formData.medicalHistory,
      doctor_notes: formData.doctorsNote,
      verification_date: formData.verificationDate,
      blood_group: formData.bloodGroup,
      age: formData.age,
      full_name: popupDonor.fullName || popupDonor.donor_fullname || ''
    };

    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/save_medical_verification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setSubmitStatus('Medical verification and PDF created successfully!');

        // Only proceed with email if PDF was created successfully
        if (data.data && data.data.pdf_path && data.data.pdf_size_bytes > 0) {
          // Wait a moment for database to fully commit, then send verification email
          setTimeout(async () => {
            const emailPayload = {
              donor_id: popupDonor.donor_id,
              full_name: popupDonor.fullName || popupDonor.donor_fullname || '',
              blood_group: formData.bloodGroup || '',
              email: popupDonor.email || popupDonor.donor_email || ''
            };

            try {
              const emailResponse = await fetch('http://localhost/Liveonv2/backend_api/controllers/send_verification_email.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(emailPayload)
              });

              if (!emailResponse.ok) {
                throw new Error(`Email API returned ${emailResponse.status}`);
              }

              const emailRes = await emailResponse.json();
              if (emailRes.success) {
                setSubmitStatus('Donor verified and email sent successfully!');
                toast.success('Donor verified and email sent!');

                // Only remove from list after EVERYTHING is successful
                setDonorRequests(prev => prev.filter(donor => donor.donor_id !== popupDonor.donor_id));
                setTimeout(() => {
                  setShowPopup(false);
                  setPopupDonor(null);
                  setFormData({ height: '', weight: '', medicalHistory: '', doctorsNote: '', verificationDate: new Date().toISOString().split('T')[0], bloodGroup: '', age: '' });
                  setSubmitStatus("");
                }, 2000);

              } else {
                setSubmitStatus('PDF created but email failed: ' + (emailRes.error || 'Unknown error'));
                toast.error('Email sending failed: ' + (emailRes.error || 'Unknown error'));
              }
            } catch (err) {
              setSubmitStatus('PDF created but email failed: ' + err.message);
              toast.error('Email sending failed: ' + err.message);
            }
          }, 1500); // 1.5 second delay
        } else {
          setSubmitStatus('Error: PDF was not created properly');
          toast.error('PDF creation failed');
        }
      } else {
        setSubmitStatus(data.error || 'Failed to save donor details.');
      }
    } catch (err) {
      setSubmitStatus('Error: ' + err.message);
    }
  };

  const handleOpenDonatePopup = (donor) => {
    setDonatePopupDonor(donor);
    setShowDonatePopup(true);
    // Set the timestamp when popup opens (with milliseconds)
    const now = new Date();
    setDonationTimestamp(now.toISOString()); // ISO string with ms
    setDonateForm({
      bloodType: donor.blood_group || '',
      donationDate: '',
      volume: '',
      notes: ''
    });

  };
  const handleCloseDonatePopup = () => {
    setShowDonatePopup(false);
    setDonatePopupDonor(null);
  };
  const handleDonateFormChange = (e) => {
    const { name, value } = e.target;
    setDonateForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleDonateSubmit = async (e) => {
    e.preventDefault();
    if (!donatePopupDonor) return;

    // Always use the timestamp from popup open
    const donationDateTime = donationTimestamp;

    // Prepare data for backend
    const payload = {
      donor_id: donatePopupDonor.donor_id,
      blood_type: donateForm.bloodType,
      donation_date: donationDateTime, // send the exact timestamp
      units_donated: donateForm.volume,
      hospital_id: hospitalId // <-- include hospital_id
    };

    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/save_donation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        // Update donor status via separate API call (this updates both donor and user status)
        await fetch('http://localhost/Liveonv2/backend_api/controllers/update_donor_status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ donor_id: donatePopupDonor.donor_id, status: 'not available' })
        });

        // Update the local state to reflect the status change immediately
        setDonorRegistrations(prev =>
          prev.map(donor =>
            donor.donor_id === donatePopupDonor.donor_id
              ? { ...donor, status: 'inactive' }
              : donor
          )
        );

        // Close popup and reset form
        setShowDonatePopup(false);
        setDonatePopupDonor(null);
        setDonateForm({ bloodType: '', donationDate: '', volume: '', notes: '' });
        setDonationTimestamp('');

        // Show success message
        toast.success('Donation recorded successfully!');
      } else {
        toast.error('Error: ' + (data.error || 'Failed to save donation'));
      }
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleReject = (donor) => {
    setRejectDonorId(donor.donor_id);
    setRejectDonorData(donor);
    setShowRejectConfirm(true);
  };

  const confirmReject = async () => {
    if (!rejectDonorId) return;
    try {
      await fetch('http://localhost/Liveonv2/backend_api/controllers/reject_donor.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor_id: rejectDonorId })
      });
      setDonorRequests(prev => prev.filter(d => d.donor_id !== rejectDonorId));
    } catch (err) {
      toast.error('Failed to reject donor.');
    }
    setShowRejectConfirm(false);
    setRejectDonorId(null);
    setRejectDonorData(null);
  };

  // Filter donorRequests based on search term, role, and status
  const filteredDonorRequests = Array.isArray(donorRequests) ? donorRequests.filter(donor => {
    const term = searchTerm.toLowerCase();
    return (
      (donor.donor_id && donor.donor_id.toString().toLowerCase().includes(term)) ||
      (donor.donor_fullname && donor.donor_fullname.toLowerCase().includes(term)) ||
      (donor.donor_email && donor.donor_email.toLowerCase().includes(term))
    );
  }) : [];

  // Filter donorRegistrations based on donor_id, full_name, email, or blood_group
  const filteredDonorRegistrations = donorRegistrations.filter(donor => {
    const term = searchTerm.toLowerCase();
    return (
      donor.donor_id.toLowerCase().includes(term) ||
      donor.full_name.toLowerCase().includes(term) ||
      (donor.email && donor.email.toLowerCase().includes(term)) ||
      (donor.blood_group && donor.blood_group.toLowerCase().includes(term))
    );
  });

  // Filter donationLogs based on donor_id or full_name
  const filteredDonationLogs = donationLogs.filter(log =>
    (log.donor_id && log.donor_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.full_name && log.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort donation logs by date (most recent first)
  const sortedDonationLogs = [...filteredDonationLogs].sort((a, b) => new Date(b.donation_date) - new Date(a.donation_date));

  // Function to create colorful bar chart
  const createVerificationChart = () => {
    if (!verificationStats.verificationData || verificationStats.verificationData.length === 0) {
      return <p style={{ textAlign: 'center', color: '#6b7280' }}>No verification data available</p>;
    }

    const maxCount = Math.max(...verificationStats.verificationData.map(d => d.count));
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

    return (
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ color: '#2d3a8c', marginBottom: '15px' }}>Donor Verifications (Last 30 Days)</h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '200px', padding: '20px 0' }}>
          {verificationStats.verificationData.map((item, index) => {
            const height = maxCount > 0 ? (item.count / maxCount) * 150 : 0;
            const color = colors[index % colors.length];

            return (
              <div key={item.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '100%',
                    height: `${height}px`,
                    backgroundColor: color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  title={`${item.count} verifications on ${item.date}`}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '8px',
                  transform: 'rotate(-45deg)',
                  whiteSpace: 'nowrap'
                }}>
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: '#2d3a8c',
                  marginTop: '4px'
                }}>
                  {item.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Add logout handler
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
  const confirmLogout = async () => {
    setShowLogoutDialog(false);
    setIsLoggingOut(true); // Set logout flag to prevent API calls
    setIsLogoutTriggered(true); // Prevent back button handler from triggering

    try {
      // Call logout API
      const response = await fetch("http://localhost/Liveonv2/backend_api/controllers/logout.php", {
        method: 'POST',
        credentials: 'include',
      });

      console.log('Logout successful');
    } catch (error) {
      console.log('Logout API error:', error);
    } finally {
      // Clear any remaining state
      setDonorRequests([]);
      setDonorRegistrations([]);
      setDonationLogs([]);
      setVerificationStats({ verificationData: [], stats: {} });
      setHospitalName("");
      setHospitalId("");
      setError(null);
      setLoading(false);

      // Use window.location.href directly to avoid React Router issues
      setTimeout(() => {
        window.location.href = '/';
      }, 200);
    }
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
      setDonorRequests([]);
      setDonorRegistrations([]);
      setDonationLogs([]);
      setVerificationStats({ verificationData: [], stats: {} });
      setHospitalName("");
      setHospitalId("");
      setError(null);
      setLoading(false);

      // Use window.location.href directly to avoid React Router issues
      setTimeout(() => {
        window.location.href = '/';
      }, 200);
    }
  };
  const cancelLogo = () => setShowLogoDialog(false);

  const overviewCards = [
    {
      label: 'Total Donors',
      value: donorRequests.length + donorRegistrations.length,
      icon: <FaUserFriends size={32} color="#2563eb" />,
      bg: 'linear-gradient(135deg, #dbeafe 0%, #2563eb 100%)',
      color: '#1e293b',
    },
    {
      label: 'Pending Requests',
      value: donorRequests.length,
      icon: <FaClipboardList size={32} color="#f59e42" />,
      bg: 'linear-gradient(135deg, #fef3c7 0%, #f59e42 100%)',
      color: '#92400e',
    },
    {
      label: 'Active Donors',
      value: donorRegistrations.filter(donor => donor.status === 'active').length,
      icon: <FaUserCheck size={32} color="#22c55e" />,
      bg: 'linear-gradient(135deg, #dcfce7 0%, #22c55e 100%)',
      color: '#166534',
    },
    {
      label: 'Total Verifications',
      value: verificationStats.stats?.total_verified || 0,
      icon: <FaCheckCircle size={32} color="#7c3aed" />,
      bg: 'linear-gradient(135deg, #ede9fe 0%, #7c3aed 100%)',
      color: '#7c3aed',
    },
  ];

  // Show loading animation while initial data is being fetched
  if (loading && donorRequests.length === 0) {
    return (
      <div className="mro-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#7c3aed"
          text="Loading MRO dashboard..."
          className="full-page"
        />
      </div>
    );
  }

  // Show loading spinner if logging out
  if (isLoggingOut) {
    return (
      <div className="mro-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#7c3aed"
          text="Logging you out..."
          className="full-page"
        />
      </div>
    );
  }

  // Show error display if there's an error
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => {
          setError(null);
          setLoading(true);
          // Re-fetch data
          fetch("http://localhost/Liveonv2/backend_api/controllers/get_donor_requests.php", {
            credentials: "include"
          })
            .then((res) => {
              if (!res.ok) throw new Error("Network response was not ok");
              return res.json();
            })
            .then((data) => {
              setDonorRequests(data);
              setLoading(false);
            })
            .catch((err) => {
              setError(err.message);
              setLoading(false);
              toast.error('Failed to fetch donor requests: ' + err.message);
            });
        }}
        title="Failed to load MRO dashboard"
        buttonText="Retry"
      />
    );
  }

  return (
    <div className="mro-dashboard-container">
      <aside className="sidebar">
        <div style={{ width: '100%' }}>
          <div className="logo" onClick={handleLogoClick}>
            <img src={logo} alt="LiveOn Logo" />
          </div>
          <nav>
            <ul>
              <li className={activeSection === "Overview" ? "active" : ""} onClick={() => setActiveSection("Overview")}>
                <span className="sidebar-label">Overview</span>
              </li>
              <li className={activeSection === "Donor Requests" ? "active" : ""} onClick={() => setActiveSection("Donor Requests")}>
                <span className="sidebar-label">Donor Requests</span>
                {filteredDonorRequests.length > 0 && (
                  <span className="sidebar-badge">{filteredDonorRequests.length}</span>
                )}
              </li>
              <li className={activeSection === "Donor Registration Logs" ? "active" : ""} onClick={() => setActiveSection("Donor Registration Logs")}>
                <span className="sidebar-label">Donor Registration Logs</span>
              </li>
              <li className={activeSection === "Donation Logs" ? "active" : ""} onClick={() => setActiveSection("Donation Logs")}>
                <span className="sidebar-label">Donation Logs</span>
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
          {/* Dashboard Header: MRO Dashboard ... Hospital Name */}
          <header className="dashboard-header">
            <h1>MRO Dashboard</h1>
            <div className="dashboard-user-info">
              {hospitalNameLoading ? (
                <span className="dashboard-user-name">Loading hospital name...</span>
              ) : hospitalNameError ? (
                <span className="dashboard-user-name" style={{ color: '#f87171' }}>{hospitalNameError}</span>
              ) : (
                <span className="dashboard-user-name">🏥 {hospitalName}</span>
              )}
            </div>
          </header>
          {/* Section Tabs */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
            {/* Removed section tabs navigation bar */}
          </div>

          {activeSection === "Overview" && (
            <section className="dashboard-section" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '28px', marginBottom: '36px' }}>
                {overviewCards.map(card => (
                  <div key={card.label} style={{
                    background: card.bg,
                    color: card.color,
                    borderRadius: '18px',
                    boxShadow: '0 4px 24px rgba(30,41,59,0.10)',
                    padding: '32px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minHeight: 140,
                  }}>
                    <div style={{ marginBottom: 16 }}>{card.icon}</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: 8 }}>{card.value}</div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 600 }}>{card.label}</div>
                  </div>
                ))}
              </div>
              {/* Verification Chart */}
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(30,41,59,0.04)', marginBottom: '24px' }}>
                {createVerificationChart()}
              </div>
              <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(30,41,59,0.04)' }}>
                <h3 style={{ color: '#2563eb', margin: '0 0 18px 0', fontWeight: 700 }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 28px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.13)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setActiveSection("Donor Requests")}
                  >
                    Review Pending Requests
                  </button>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 28px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(34,197,94,0.13)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setActiveSection("Donor Registration Logs")}
                  >
                    View Active Donors
                  </button>
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #f59e42 0%, #fbbf24 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px 28px',
                      fontWeight: 600,
                      fontSize: '1rem',
                      boxShadow: '0 2px 8px rgba(251,191,36,0.13)',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onClick={() => setActiveSection("Donation Logs")}
                  >
                    Check Donation Logs
                  </button>
                </div>
              </div>
            </section>
          )}
          {activeSection === "Donor Requests" && (
            <section className="dashboard-section">
              <h2>Donor Requests</h2>
              {/* Search bar is now inside dashboard-section, just above the table */}
              <div style={{ margin: '0 0 16px 0', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: 200,
                  maxWidth: '100%'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 20
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 120 120">
                      <rect width="15" height="62.367" x="76.95" y="57.266" opacity=".35" transform="rotate(-45.001 84.45 88.451)"></rect>
                      <rect width="15" height="62.367" x="76.95" y="53.266" fill="#0037ff" transform="rotate(-45.001 84.45 84.451)"></rect>
                      <circle cx="49" cy="53" r="37" opacity=".35"></circle>
                      <circle cx="49" cy="49" r="37" fill="#0075ff"></circle>
                      <circle cx="49" cy="53" r="28" opacity=".35"></circle>
                      <circle cx="49" cy="49" r="28" fill="#a4e2f1"></circle>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search Donors..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      padding: '10px 14px 10px 40px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: '1.08rem',
                      width: '100%',
                      background: '#f8fafc',
                      color: '#222',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(30,41,59,0.04)',
                      transition: 'border 0.2s',
                      marginBottom: 0
                    }}
                  />
                </div>
              </div>
              {loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p style={{ color: 'red' }}>Error: {error}</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>REQUEST ID</th>
                      <th>FULL NAME</th>
                      <th>EMAIL</th>
                      <th>ADDRESS</th>
                      <th>CITY</th>
                      <th>REQUEST DATE</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonorRequests.map((donor, idx) => (
                      <tr key={`${donor.request_id}_${idx}`}>
                        <td>{donor.request_id}</td>
                        <td>{donor.donor_fullname}</td>
                        <td>{donor.donor_email}</td>
                        <td>{donor.address}</td>
                        <td>{donor.city}</td>
                        <td>{new Date(donor.created_at).toLocaleDateString()}</td>
                        <td>
                          <button className="btn-cancel" onClick={() => handleReject(donor)}>Reject</button>
                          <button className="btn-verify" onClick={() => handleOpenPopup({
                            donor_id: donor.donor_id,
                            fullName: donor.donor_fullname,
                            email: donor.donor_email,
                            otp: donor.otp_number,
                            blood_group: donor.blood_group,
                            dob: donor.dob // Add DOB for age calculation
                          })}>Accept</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
          {activeSection === "Donor Registration Logs" && (
            <section className="dashboard-section">
              <h2>Donor Registration Logs</h2>
              <div style={{ margin: '0 0 16px 0', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: 200,
                  maxWidth: '100%'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 20
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 120 120">
                      <rect width="15" height="62.367" x="76.95" y="57.266" opacity=".35" transform="rotate(-45.001 84.45 88.451)" />
                      <rect width="15" height="62.367" x="76.95" y="53.266" fill="#0037ff" transform="rotate(-45.001 84.45 84.451)" />
                      <circle cx="49" cy="53" r="37" opacity=".35" />
                      <circle cx="49" cy="49" r="37" fill="#0075ff" />
                      <circle cx="49" cy="53" r="28" opacity=".35" />
                      <circle cx="49" cy="49" r="28" fill="#a4e2f1" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search Donors..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      padding: '10px 14px 10px 40px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: '1.08rem',
                      width: '100%',
                      background: '#f8fafc',
                      color: '#222',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(30,41,59,0.04)',
                      transition: 'border 0.2s',
                      marginBottom: 0
                    }}
                  />
                </div>
              </div>
              {donorRegistrations.length === 0 ? (
                <p>No registered donors found.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>DONOR ID</th>
                      <th>FULL NAME</th>
                      <th>EMAIL</th>
                      <th>BLOOD GROUP</th>
                      <th>STATUS</th>
                      <th>REGISTERED ON</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonorRegistrations.map((donor, idx) => (
                      <tr key={`${donor.donor_id}_${idx}`}>
                        <td>{donor.donor_id}</td>
                        <td>{donor.full_name}</td>
                        <td>{donor.email}</td>
                        <td>{donor.blood_group}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            backgroundColor: donor.status === 'active' ? '#bbf7d0' : '#fecaca',
                            color: donor.status === 'active' ? '#166534' : '#b91c1c',
                            fontWeight: 500,
                            fontSize: '0.95em',
                            minWidth: '80px',
                            textAlign: 'center'
                          }}>
                            {donor.status}
                          </span>
                        </td>
                        <td>{donor.verification_date ? new Date(donor.verification_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <button
                            style={{
                              background: donor.status === 'active' ? '#22c55e' : '#d1d5db',
                              color: donor.status === 'active' ? '#fff' : '#6b7280',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.9rem',
                              cursor: donor.status === 'active' ? 'pointer' : 'not-allowed',
                              fontWeight: '500',
                              transition: 'background 0.2s'
                            }}
                            disabled={donor.status !== 'active'}
                            onMouseOver={donor.status === 'active' ? (e) => e.target.style.background = '#16a34a' : undefined}
                            onMouseOut={donor.status === 'active' ? (e) => e.target.style.background = '#22c55e' : undefined}
                            onClick={donor.status === 'active' ? () => handleOpenDonatePopup(donor) : undefined}
                          >
                            Donate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
          {activeSection === "Donation Logs" && (
            <section className="dashboard-section">
              <h2>Donation Logs</h2>
              <div style={{ margin: '0 0 16px 0', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: 200,
                  maxWidth: '100%'
                }}>
                  <span style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: 20
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="20" height="20" viewBox="0 0 120 120">
                      <rect width="15" height="62.367" x="76.95" y="57.266" opacity=".35" transform="rotate(-45.001 84.45 88.451)" />
                      <rect width="15" height="62.367" x="76.95" y="53.266" fill="#0037ff" transform="rotate(-45.001 84.45 84.451)" />
                      <circle cx="49" cy="53" r="37" opacity=".35" />
                      <circle cx="49" cy="49" r="37" fill="#0075ff" />
                      <circle cx="49" cy="53" r="28" opacity=".35" />
                      <circle cx="49" cy="49" r="28" fill="#a4e2f1" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Search Donations..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                      padding: '10px 14px 10px 40px',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 8,
                      fontSize: '1.08rem',
                      width: '100%',
                      background: '#f8fafc',
                      color: '#222',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(30,41,59,0.04)',
                      transition: 'border 0.2s',
                      marginBottom: 0
                    }}
                  />
                </div>
              </div>
              {donationLogs.length === 0 ? (
                <p>No donation logs found.</p>
              ) : (
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>DONATION ID</th>
                      <th>DONOR ID</th>
                      <th>FULL NAME</th>
                      <th>BLOOD TYPE</th>
                      <th>VOLUME (ml)</th>
                      <th>DONATION DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDonationLogs.map((log, idx) => (
                      <tr key={`${log.donation_id}_${idx}`}>
                        <td>{log.donation_id}</td>
                        <td>{log.donor_id}</td>
                        <td>{log.full_name}</td>
                        <td>{log.blood_type}</td>
                        <td>{log.units_donated}</td>
                        <td>{log.donation_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}
          {showPopup && popupDonor && (
            <div className="popup-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 1000,
              padding: '20px',
              overflowY: 'auto',
              scrollbarWidth: 'none', /* Firefox */
              msOverflowStyle: 'none' /* IE and Edge */
            }}>
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                margin: 'auto',
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none' /* IE and Edge */
              }}>
                <button 
                  onClick={handleClosePopup} 
                  style={{ 
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 10,
                    color: '#64748b',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  ×
                </button>

                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color: 'white', 
                  padding: '32px 40px', 
                  borderRadius: '16px 16px 0 0',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>🏥 Medical Verification</h3>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '1rem' }}>Complete donor medical assessment</p>
                </div>
                
                <div style={{ padding: '32px 40px' }}>
                  <form>
                    {/* Donor Information Section */}
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '24px', 
                      borderRadius: '12px', 
                      marginBottom: '24px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 20px 0', 
                        color: '#1e293b', 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        👤 Donor Information
                      </h4>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '16px', 
                        marginBottom: '16px' 
                      }}>
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#64748b', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Donor ID
                          </label>
                          <input 
                            type="text" 
                            value={popupDonor.donor_id || ''} 
                            readOnly 
                            style={{ 
                              background: '#e2e8f0', 
                              color: '#475569', 
                              fontWeight: 500, 
                              border: '2px solid #cbd5e1', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#64748b', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Age (Auto-calculated)
                          </label>
                          <input 
                            type="text" 
                            value={formData.age ? `${formData.age} years` : 'Not available'} 
                            readOnly 
                            style={{ 
                              background: '#dcfce7', 
                              color: '#15803d', 
                              fontWeight: 600, 
                              border: '2px solid #bbf7d0', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '16px' 
                      }}>
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#64748b', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Full Name
                          </label>
                          <input 
                            type="text" 
                            value={popupDonor.fullName || popupDonor.full_name || ''} 
                            readOnly 
                            style={{ 
                              background: '#e2e8f0', 
                              color: '#475569', 
                              fontWeight: 500, 
                              border: '2px solid #cbd5e1', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#64748b', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Date of Birth
                          </label>
                          <input 
                            type="text" 
                            value={popupDonor.dob ? new Date(popupDonor.dob).toLocaleDateString('en-US', { 
                              year: 'numeric', month: 'long', day: 'numeric' 
                            }) : 'Not available'} 
                            readOnly 
                            style={{ 
                              background: '#e2e8f0', 
                              color: '#475569', 
                              fontWeight: 500, 
                              border: '2px solid #cbd5e1', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Physical Measurements Section */}
                    <div style={{ 
                      background: '#fefce8', 
                      padding: '24px', 
                      borderRadius: '12px', 
                      marginBottom: '24px',
                      border: '1px solid #fde047'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 20px 0', 
                        color: '#a16207', 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📏 Physical Measurements
                      </h4>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '20px' 
                      }}>
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#a16207', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Height (cm) <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input 
                            type="number" 
                            name="height" 
                            value={formData.height} 
                            onChange={handleInputChange} 
                            placeholder="e.g., 170" 
                            min="100" 
                            max="250"
                            required
                            style={{ 
                              border: '2px solid #fbbf24', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%', 
                              fontWeight: 500,
                              fontSize: '0.9rem',
                              outline: 'none',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }} 
                            onFocus={(e) => {
                              e.target.style.borderColor = '#f59e0b';
                              e.target.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#fbbf24';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#a16207', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Weight (kg) <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input 
                            type="number" 
                            name="weight" 
                            value={formData.weight} 
                            onChange={handleInputChange} 
                            placeholder="e.g., 70" 
                            min="30" 
                            max="200"
                            required
                            style={{ 
                              border: '2px solid #fbbf24', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%', 
                              fontWeight: 500,
                              fontSize: '0.9rem',
                              outline: 'none',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }} 
                            onFocus={(e) => {
                              e.target.style.borderColor = '#f59e0b';
                              e.target.style.boxShadow = '0 0 0 3px rgba(251, 191, 36, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#fbbf24';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Medical Information Section */}
                    <div style={{ 
                      background: '#fef2f2', 
                      padding: '24px', 
                      borderRadius: '12px', 
                      marginBottom: '24px',
                      border: '1px solid #fecaca'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 20px 0', 
                        color: '#dc2626', 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        🩺 Medical Information
                      </h4>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          fontWeight: 600, 
                          color: '#dc2626', 
                          display: 'block', 
                          marginBottom: '6px', 
                          fontSize: '0.875rem' 
                        }}>
                          Blood Group <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <select 
                          name="bloodGroup" 
                          value={formData.bloodGroup} 
                          onChange={handleInputChange} 
                          required 
                          style={{ 
                            border: '2px solid #f87171', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            width: '100%', 
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            background: 'white',
                            outline: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#ef4444';
                            e.target.style.boxShadow = '0 0 0 3px rgba(248, 113, 113, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#f87171';
                            e.target.style.boxShadow = 'none';
                          }}
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+ (A Positive)</option>
                          <option value="A-">A- (A Negative)</option>
                          <option value="B+">B+ (B Positive)</option>
                          <option value="B-">B- (B Negative)</option>
                          <option value="AB+">AB+ (AB Positive)</option>
                          <option value="AB-">AB- (AB Negative)</option>
                          <option value="O+">O+ (O Positive)</option>
                          <option value="O-">O- (O Negative)</option>
                        </select>
                      </div>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ 
                          fontWeight: 600, 
                          color: '#dc2626', 
                          display: 'block', 
                          marginBottom: '6px', 
                          fontSize: '0.875rem' 
                        }}>
                          Medical History
                        </label>
                        <textarea 
                          name="medicalHistory" 
                          value={formData.medicalHistory} 
                          onChange={handleInputChange} 
                          placeholder="Any chronic conditions, medications, allergies, or relevant medical history..."
                          rows={4}
                          style={{ 
                            border: '2px solid #f87171', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            width: '100%', 
                            fontWeight: 400,
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.5,
                            minHeight: '100px',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#ef4444';
                            e.target.style.boxShadow = '0 0 0 3px rgba(248, 113, 113, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#f87171';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      
                      <div>
                        <label style={{ 
                          fontWeight: 600, 
                          color: '#dc2626', 
                          display: 'block', 
                          marginBottom: '6px', 
                          fontSize: '0.875rem' 
                        }}>
                          Doctor's Assessment & Notes <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea 
                          name="doctorsNote" 
                          value={formData.doctorsNote} 
                          onChange={handleInputChange} 
                          placeholder="Medical officer's assessment, fitness for donation, any recommendations..."
                          rows={4}
                          required
                          style={{ 
                            border: '2px solid #f87171', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            width: '100%', 
                            fontWeight: 400,
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.5,
                            minHeight: '100px',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#ef4444';
                            e.target.style.boxShadow = '0 0 0 3px rgba(248, 113, 113, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#f87171';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Verification Details Section */}
                    <div style={{ 
                      background: '#f0f9ff', 
                      padding: '24px', 
                      borderRadius: '12px', 
                      marginBottom: '24px',
                      border: '1px solid #bae6fd'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 20px 0', 
                        color: '#0369a1', 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        ✅ Verification Details
                      </h4>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '16px',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#0369a1', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Verification Status <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <select 
                            name="verificationStatus" 
                            value={formData.verificationStatus} 
                            onChange={handleInputChange} 
                            required 
                            style={{ 
                              border: '2px solid #38bdf8', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%', 
                              fontWeight: 500,
                              fontSize: '0.9rem',
                              background: 'white',
                              outline: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#0284c7';
                              e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#38bdf8';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <option value="">Select Status</option>
                            <option value="verified">✅ Verified - Eligible</option>
                            <option value="rejected">❌ Rejected - Not Eligible</option>
                            <option value="pending">⏳ Pending - Under Review</option>
                          </select>
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#0369a1', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Verification Date & Time
                          </label>
                          <input 
                            type="text" 
                            value={verificationDateTime} 
                            readOnly 
                            style={{ 
                              background: '#e0f2fe', 
                              color: '#0369a1', 
                              fontWeight: 600, 
                              border: '2px solid #38bdf8', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label style={{ 
                          fontWeight: 600, 
                          color: '#0369a1', 
                          display: 'block', 
                          marginBottom: '6px', 
                          fontSize: '0.875rem' 
                        }}>
                          Additional Notes & Recommendations
                        </label>
                        <textarea 
                          name="additionalNotes" 
                          value={formData.additionalNotes} 
                          onChange={handleInputChange} 
                          placeholder="Any additional notes, follow-up recommendations, or special instructions..."
                          rows={3}
                          style={{ 
                            border: '2px solid #38bdf8', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            width: '100%', 
                            fontWeight: 400,
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.5,
                            minHeight: '80px',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#0284c7';
                            e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#38bdf8';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      justifyContent: 'flex-end', 
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '2px solid #f1f5f9'
                    }}>
                      <button 
                        type="button" 
                        onClick={() => setPopupDonor(null)} 
                        style={{ 
                          padding: '14px 28px', 
                          borderRadius: '8px', 
                          border: '2px solid #6b7280', 
                          background: 'white', 
                          color: '#374151', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s',
                          minWidth: '120px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f9fafb';
                          e.target.style.borderColor = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.borderColor = '#6b7280';
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        onClick={handleSubmitDonorDetails}
                        style={{ 
                          padding: '14px 28px', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                          color: 'white', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s',
                          minWidth: '160px',
                          boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 6px 12px -2px rgba(220, 38, 38, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.2)';
                        }}
                      >
                        💾 Save Verification
                      </button>
                    </div>
                    {submitStatus && (
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '12px 16px',
                        borderRadius: '8px',
                        textAlign: 'center', 
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        background: submitStatus.startsWith('Donor details saved') ? '#dcfce7' : '#fef2f2',
                        color: submitStatus.startsWith('Donor details saved') ? '#15803d' : '#dc2626',
                        border: `1px solid ${submitStatus.startsWith('Donor details saved') ? '#bbf7d0' : '#fecaca'}`
                      }}>
                        {submitStatus}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}
          {showDonatePopup && donatePopupDonor && (
            <div className="popup-overlay" style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.5)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 1000,
              padding: '20px',
              overflowY: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                maxWidth: '700px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                margin: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}>
                <button 
                  onClick={handleCloseDonatePopup} 
                  style={{ 
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    zIndex: 10,
                    color: '#64748b',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  ×
                </button>

                <div style={{ 
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                  color: 'white', 
                  padding: '32px 40px', 
                  borderRadius: '16px 16px 0 0',
                  textAlign: 'center'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>🩸 Blood Donation Record</h3>
                  <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '1rem' }}>Complete donation information</p>
                </div>
                
                <div style={{ padding: '32px 40px' }}>
                  <form onSubmit={handleDonateSubmit}>
                    {/* Donor Information Section */}
                    <div style={{ 
                      background: '#f8fafc', 
                      padding: '24px', 
                      borderRadius: '12px', 
                      marginBottom: '24px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 20px 0', 
                        color: '#1e293b', 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        👤 Donor Information
                      </h4>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '16px', 
                        marginBottom: '16px' 
                      }}>
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#64748b', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Full Name
                          </label>
                          <input 
                            type="text" 
                            value={donatePopupDonor.full_name || ''} 
                            readOnly 
                            style={{ 
                              background: '#e2e8f0', 
                              color: '#475569', 
                              fontWeight: 500, 
                              border: '2px solid #cbd5e1', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#64748b', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Donor ID
                          </label>
                          <input 
                            type="text" 
                            value={donatePopupDonor.donor_id || ''} 
                            readOnly 
                            style={{ 
                              background: '#e2e8f0', 
                              color: '#475569', 
                              fontWeight: 500, 
                              border: '2px solid #cbd5e1', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label style={{ 
                          fontWeight: 600, 
                          color: '#64748b', 
                          display: 'block', 
                          marginBottom: '6px', 
                          fontSize: '0.875rem' 
                        }}>
                          Blood Type
                        </label>
                        <input 
                          type="text" 
                          name="bloodType" 
                          value={donateForm.bloodType || ''} 
                          onChange={handleDonateFormChange} 
                          readOnly 
                          style={{ 
                            background: '#fee2e2', 
                            color: '#dc2626', 
                            fontWeight: 600, 
                            border: '2px solid #fecaca', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            width: '100%',
                            fontSize: '0.9rem',
                            boxSizing: 'border-box'
                          }} 
                        />
                      </div>
                    </div>

                    {/* Donation Details Section */}
                    <div style={{ 
                      background: '#f0fdf4', 
                      padding: '24px', 
                      borderRadius: '12px', 
                      marginBottom: '24px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h4 style={{ 
                        margin: '0 0 20px 0', 
                        color: '#15803d', 
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        📅 Donation Details
                      </h4>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                        gap: '16px',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#15803d', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Donation Date & Time
                          </label>
                          <input 
                            type="text" 
                            value={donationTimestamp ? new Date(donationTimestamp).toLocaleString('en-GB', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''} 
                            readOnly 
                            style={{ 
                              background: '#dcfce7', 
                              color: '#15803d', 
                              fontWeight: 600, 
                              border: '2px solid #bbf7d0', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%',
                              fontSize: '0.9rem',
                              boxSizing: 'border-box'
                            }} 
                          />
                        </div>
                        
                        <div>
                          <label style={{ 
                            fontWeight: 600, 
                            color: '#15803d', 
                            display: 'block', 
                            marginBottom: '6px', 
                            fontSize: '0.875rem' 
                          }}>
                            Units Donated <span style={{ color: '#dc2626' }}>*</span>
                          </label>
                          <input 
                            type="number" 
                            name="volume" 
                            value={donateForm.volume || ''} 
                            onChange={handleDonateFormChange} 
                            placeholder="Enter number of units (e.g., 1, 2, 3)" 
                            min="1"
                            max="10"
                            required 
                            style={{ 
                              border: '2px solid #22c55e', 
                              borderRadius: '8px', 
                              padding: '12px 16px', 
                              width: '100%', 
                              fontWeight: 500,
                              fontSize: '0.9rem',
                              background: 'white',
                              outline: 'none',
                              transition: 'all 0.2s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = '#16a34a';
                              e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = '#22c55e';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label style={{ 
                          fontWeight: 600, 
                          color: '#15803d', 
                          display: 'block', 
                          marginBottom: '6px', 
                          fontSize: '0.875rem' 
                        }}>
                          Additional Notes
                        </label>
                        <textarea 
                          name="notes" 
                          value={donateForm.notes || ''} 
                          onChange={handleDonateFormChange} 
                          placeholder="Any additional notes about the donation (optional)..."
                          rows={3}
                          style={{ 
                            border: '2px solid #22c55e', 
                            borderRadius: '8px', 
                            padding: '12px 16px', 
                            width: '100%', 
                            fontWeight: 400,
                            fontSize: '0.9rem',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: 1.5,
                            minHeight: '80px',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#16a34a';
                            e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#22c55e';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '16px', 
                      justifyContent: 'flex-end', 
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '2px solid #f1f5f9'
                    }}>
                      <button 
                        type="button" 
                        onClick={handleCloseDonatePopup} 
                        style={{ 
                          padding: '14px 28px', 
                          borderRadius: '8px', 
                          border: '2px solid #6b7280', 
                          background: 'white', 
                          color: '#374151', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s',
                          minWidth: '120px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#f9fafb';
                          e.target.style.borderColor = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'white';
                          e.target.style.borderColor = '#6b7280';
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        style={{ 
                          padding: '14px 28px', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                          color: 'white', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          fontSize: '0.95rem',
                          transition: 'all 0.2s',
                          minWidth: '180px',
                          boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)';
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 6px 12px -2px rgba(220, 38, 38, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 6px -1px rgba(220, 38, 38, 0.2)';
                        }}
                      >
                        🩸 Record Donation
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          {showRejectConfirm && rejectDonorData && (
            <div className="modal-overlay" onClick={() => setShowRejectConfirm(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{
                maxWidth: '500px',
                padding: '2rem',
                borderRadius: '16px',
                background: 'white',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #fee2e2'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    fontSize: '1.5rem'
                  }}>
                    ⚠️
                  </div>
                  <div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: '#dc2626',
                      marginBottom: '0.25rem'
                    }}>Confirm Rejection</h3>
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#6b7280'
                    }}>This action cannot be undone</p>
                  </div>
                </div>

                <div style={{
                  background: '#f9fafb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <p style={{
                    margin: '0 0 1rem 0',
                    fontSize: '1rem',
                    color: '#374151',
                    fontWeight: '500'
                  }}>Are you sure you want to reject this donor registration request?</p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '0.5rem 1rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{ fontWeight: '600', color: '#6b7280' }}>Name:</span>
                    <span style={{ color: '#111827', fontWeight: '500' }}>{rejectDonorData.donor_fullname}</span>

                    <span style={{ fontWeight: '600', color: '#6b7280' }}>Email:</span>
                    <span style={{ color: '#111827' }}>{rejectDonorData.donor_email}</span>

                    <span style={{ fontWeight: '600', color: '#6b7280' }}>Request ID:</span>
                    <span style={{ color: '#111827', fontFamily: 'monospace', fontSize: '0.8rem' }}>{rejectDonorData.request_id}</span>

                    <span style={{ fontWeight: '600', color: '#6b7280' }}>City:</span>
                    <span style={{ color: '#111827' }}>{rejectDonorData.city}</span>

                    <span style={{ fontWeight: '600', color: '#6b7280' }}>Requested:</span>
                    <span style={{ color: '#111827' }}>{new Date(rejectDonorData.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={() => setShowRejectConfirm(false)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      background: 'white',
                      color: '#374151',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.background = '#f9fafb';
                    }}
                    onMouseOut={e => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.background = 'white';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReject}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: '2px solid #dc2626',
                      borderRadius: '8px',
                      background: '#dc2626',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                      e.target.style.background = '#b91c1c';
                      e.target.style.borderColor = '#b91c1c';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = '#dc2626';
                      e.target.style.borderColor = '#dc2626';
                    }}
                  >
                    Reject Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
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
    </div>
  );
};

export default MRODashboard; 