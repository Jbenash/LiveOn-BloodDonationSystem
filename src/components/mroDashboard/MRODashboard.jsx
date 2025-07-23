import React, { useState, useEffect } from "react";
import "./MRODashboard.css";
import { useNavigate } from 'react-router-dom';
import { FaUserFriends, FaClipboardList, FaUserCheck, FaCheckCircle } from 'react-icons/fa';
import logo from '../../assets/logo.svg';
import { toast } from 'sonner';

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
    volume: ''
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
  const [verificationDateTime, setVerificationDateTime] = useState('');

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
    setLoading(true);
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
  
  // Fetch donor registrations
    fetch("http://localhost/Liveonv2/backend_api/controllers/get_donor_registrations.php", {
      credentials: "include"
    })
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      setDonorRegistrations(data);
    })
    .catch((err) => {
      console.error("Error fetching donor registrations:", err);
      toast.error('Failed to fetch donor registrations: ' + err.message);
    });

  // Fetch verification statistics
    fetch("http://localhost/Liveonv2/backend_api/controllers/get_verification_stats.php", {
      credentials: "include"
    })
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      setVerificationStats(data);
    })
    .catch((err) => {
      console.error("Error fetching verification stats:", err);
      toast.error('Failed to fetch verification stats: ' + err.message);
    });

  // Fetch donation logs
    fetch("http://localhost/Liveonv2/backend_api/controllers/get_donation_logs.php", {
      credentials: "include"
    })
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      if (data.success) {
        setDonationLogs(data.donations);
      } else {
        console.error("Error fetching donation logs:", data.error);
      }
    })
    .catch((err) => {
      console.error("Error fetching donation logs:", err);
      toast.error('Failed to fetch donation logs: ' + err.message);
    });
}, []);

  useEffect(() => {
    // Fetch hospital name for MRO
    fetch("http://localhost/Liveonv2/backend_api/controllers/get_mro_hospital.php", { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHospitalName(data.hospital_name);
        } else {
          setHospitalNameError(data.error || "Failed to load hospital name");
        }
        setHospitalNameLoading(false);
      })
      .catch(err => {
        setHospitalNameError("Failed to load hospital name");
        toast.error('Failed to load hospital name: ' + err.message);
        setHospitalNameLoading(false);
      });
  }, []);

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
  };
  const handleClosePopup = () => {
    setShowPopup(false);
    setPopupDonor(null);
  };

  const handleSubmitDonorDetails = async () => {
    if (!popupDonor) return;
    setSubmitStatus("");
    // Prepare data for backend
    const donor_id = popupDonor.donor_id;
    console.log('popupDonor:', popupDonor); // Debug: check what's in popupDonor
    console.log('donor_id:', donor_id); // Debug: check donor_id value
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
    console.log('payload:', payload); // Debug: check the payload being sent
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/save_medical_verification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setSubmitStatus('Donor details saved successfully!');
        // Send verification email to donor
        const emailPayload = {
          donor_id: popupDonor.donor_id,
          full_name: popupDonor.fullName || popupDonor.donor_fullname || '',
          blood_group: popupDonor.blood_group || '',
          email: popupDonor.email || popupDonor.donor_email || ''
        };
        fetch('http://localhost/Liveonv2/backend_api/controllers/send_verification_email.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPayload)
        })
        .then(res => res.json())
        .then(emailRes => {
          if (emailRes.success) {
            setSubmitStatus('Donor details saved and email sent!');
          } else {
            setSubmitStatus('Donor details saved, but email failed: ' + (emailRes.error || 'Unknown error'));
          }
        })
        .catch(err => {
          setSubmitStatus('Donor details saved, but email failed: ' + err.message);
        });
        setDonorRequests(prev => prev.filter(donor => donor.donor_id !== popupDonor.donor_id));
        setTimeout(() => {
          setShowPopup(false);
          setPopupDonor(null);
          setFormData({ height: '', weight: '', medicalHistory: '', doctorsNote: '', verificationDate: new Date().toISOString().split('T')[0], bloodGroup: '', age: '' });
          setSubmitStatus("");
        }, 1500);
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
      volume: '' 
    });
    console.log("donatePopupDonor:", donor);
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
      volume: donateForm.volume
    };
    
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/save_donation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        // Immediately set donor status to 'not available'
        await fetch('http://localhost/Liveonv2/backend_api/controllers/update_donor_status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ donor_id: donatePopupDonor.donor_id, status: 'not available' })
        });

        // No alert after successful donation
        setShowDonatePopup(false);
        setDonatePopupDonor(null);
        setDonateForm({ bloodType: '', donationDate: '', volume: '' });
        setDonationTimestamp('');
      } else {
        alert('Error: ' + (data.error || 'Failed to save donation'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleReject = (donorId) => {
    setRejectDonorId(donorId);
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
      alert('Failed to reject donor.');
    }
    setShowRejectConfirm(false);
    setRejectDonorId(null);
  };

  // Filter donorRequests based on search term, role, and status
  const filteredDonorRequests = donorRequests.filter(donor => {
    const term = searchTerm.toLowerCase();
    return (
      (donor.donor_id && donor.donor_id.toLowerCase().includes(term)) ||
      (donor.donor_fullname && donor.donor_fullname.toLowerCase().includes(term)) ||
      (donor.donor_email && donor.donor_email.toLowerCase().includes(term)) ||
      (donor.otp_number && donor.otp_number.toLowerCase().includes(term))
    );
  }).filter(donor => donor.status === 'inactive');

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
  const handleLogout = async () => {
    try {
      await fetch("http://localhost/Liveonv2/backend_api/controllers/logout.php", {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/');
    } catch (error) {
      alert('Logout failed');
    }
  };

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
      value: donorRegistrations.length,
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

  return (
    <div className="mro-dashboard-container">
      <aside className="sidebar" style={{ width: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh' }}>
        <div style={{ width: '100%' }}>
          <div className="logo" style={{ cursor: 'pointer', padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginLeft: 32 }} onClick={() => navigate('/') }>
            <img src={logo} alt="LiveOn Logo" style={{ height: 120, width: 'auto', display: 'block' }} />
          </div>
        <nav>
            <ul style={{ padding: 0, margin: 0 }}>
              <li className={activeSection === "Overview" ? "active" : ""} onClick={() => setActiveSection("Overview")}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Overview</span>
              </li>
              <li className={activeSection === "Donor Requests" ? "active" : ""} onClick={() => setActiveSection("Donor Requests")}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s' }}>
                <span className="sidebar-label">Donor Requests</span>
                {filteredDonorRequests.length > 0 && (
                  <span className="sidebar-badge" style={{ background: '#dc2626', color: '#fff', borderRadius: '50%', minWidth: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, marginLeft: 12 }}>{filteredDonorRequests.length}</span>
                )}
              </li>
              <li className={activeSection === "Donor Registration Logs" ? "active" : ""} onClick={() => setActiveSection("Donor Registration Logs")}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Donor Registration Logs</span>
              </li>
              <li className={activeSection === "Donation Logs" ? "active" : ""} onClick={() => setActiveSection("Donation Logs")}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Donation Logs</span>
              </li>
          </ul>
        </nav>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '90%',
            margin: '0 auto 24px auto',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 0',
            fontSize: '1.1rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(220,38,38,0.13)',
            transition: 'background 0.2s',
          }}
        >
          <span style={{ fontSize: 20, display: 'flex', alignItems: 'center' }}>⎋</span> Logout
        </button>
      </aside>
      <main className="dashboard-main" style={{ display: 'flex', gap: '24px' }}>
        <div style={{ flex: 2 }}>
          {/* Dashboard Header: MRO Dashboard ... Hospital Name */}
          <div className="dashboard-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, padding: '28px 32px' }}>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#222', margin: 0 }}>MRO Dashboard</h1>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#2563eb', marginLeft: 24, whiteSpace: 'nowrap' }}>
              {hospitalNameLoading ? (
                <span>Loading hospital name...</span>
              ) : hospitalNameError ? (
                <span style={{ color: '#f87171' }}>{hospitalNameError}</span>
              ) : (
                <span>🏥 {hospitalName}</span>
              )}
                </div>
                </div>
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
                      <th>DONOR ID</th>
                      <th>FULL NAME</th>
                      <th>EMAIL</th>
                      <th>OTP NUMBER</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonorRequests.map((donor, idx) => (
                      <tr key={`${donor.donor_id}_${idx}`}>
                        <td>{donor.donor_id}</td>
                        <td>{donor.donor_fullname}</td>
                        <td>{donor.donor_email}</td>
                        <td>{donor.otp_number}</td>
                        <td>
                          <button className="btn-cancel" onClick={() => handleReject(donor.donor_id)}>Reject</button>
                          <button className="btn-verify" onClick={() => handleOpenPopup({
                            donor_id: donor.donor_id,
                            fullName: donor.donor_fullname,
                            email: donor.donor_email,
                            otp: donor.otp_number,
                            blood_group: donor.blood_group // add blood_group for email
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
                            backgroundColor: donor.status === 'available' ? '#bbf7d0' : '#fecaca',
                            color: donor.status === 'available' ? '#166534' : '#b91c1c',
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
                              background: donor.status === 'available' ? '#22c55e' : '#d1d5db',
                              color: donor.status === 'available' ? '#fff' : '#6b7280',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.9rem',
                              cursor: donor.status === 'available' ? 'pointer' : 'not-allowed',
                              fontWeight: '500',
                              transition: 'background 0.2s'
                            }}
                            disabled={donor.status !== 'available'}
                            onMouseOver={donor.status === 'available' ? (e) => e.target.style.background = '#16a34a' : undefined}
                            onMouseOut={donor.status === 'available' ? (e) => e.target.style.background = '#22c55e' : undefined}
                            onClick={donor.status === 'available' ? () => handleOpenDonatePopup(donor) : undefined}
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
            <div className="popup-overlay">
              <div className="popup-form" style={{ maxWidth: 480, width: '95%', padding: '2.2rem 2rem', borderRadius: 18, fontWeight: 700 }}>
                <button className="popup-close" onClick={handleClosePopup} style={{ fontWeight: 700 }}>&times;</button>
                <h3 style={{ textAlign: 'center', marginBottom: 24, color: '#2563eb', fontWeight: 700 }}>Donor Medical Verification</h3>
                <form style={{ fontWeight: 700 }}>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Donor ID</label>
                    <input type="text" value={popupDonor.donor_id || ''} readOnly style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 700, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Full Name</label>
                    <input type="text" value={popupDonor.fullName || ''} readOnly style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 700, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%' }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Height (cm)</label>
                    <input type="text" name="height" value={formData.height} onChange={handleInputChange} placeholder="Height" style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%', fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Weight (kg)</label>
                    <input type="text" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Weight" style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%', fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Medical History</label>
                    <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} placeholder="Enter medical history" style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%', minHeight: 60, fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Doctor's Note</label>
                    <textarea name="doctorsNote" value={formData.doctorsNote} onChange={handleInputChange} placeholder="Enter doctor's note" style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%', minHeight: 60, fontWeight: 700 }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Verification Date</label>
                    <input type="text" name="verificationDate" value={verificationDateTime} readOnly style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%', fontWeight: 700, background: '#f1f5f9', color: '#64748b' }} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Blood Group</label>
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} required style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%', fontWeight: 700 }}>
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 6 }}>Age</label>
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Age" style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', width: '100%', fontWeight: 700 }} />
                  </div>
                  <hr style={{ margin: '24px 0', border: 'none', borderTop: '1.5px solid #e2e8f0' }} />
                  <button type="button" className="btn-verify" style={{ width: '100%', fontSize: '1.13rem', padding: '14px 0', fontWeight: 700 }} onClick={handleSubmitDonorDetails}>Submit</button>
                  {submitStatus && <div style={{ marginTop: '10px', color: submitStatus.startsWith('Donor details saved') ? 'green' : 'red', textAlign: 'center', fontWeight: 700 }}>{submitStatus}</div>}
                </form>
              </div>
            </div>
          )}
          {showDonatePopup && donatePopupDonor && (
            <div className="popup-overlay">
              <div className="popup-form">
                <button className="popup-close" onClick={handleCloseDonatePopup}>&times;</button>
                <h3>Donation Details</h3>
                <form onSubmit={handleDonateSubmit}>
                  <label>
                    Full Name:
                    <input type="text" value={donatePopupDonor.full_name} readOnly style={{ backgroundColor: '#f3f4f6' }} />
                  </label>
                  <label>
                    Donor ID:
                    <input type="text" value={donatePopupDonor.donor_id} readOnly style={{ backgroundColor: '#f3f4f6' }} />
                  </label>
                  <label>
                    Blood Type:
                    <input type="text" name="bloodType" value={donateForm.bloodType} onChange={handleDonateFormChange} readOnly style={{ backgroundColor: '#f3f4f6' }} />
                  </label>
                  <label>
                    Donation Date & Time:
                    <input type="text" value={donationTimestamp ? new Date(donationTimestamp).toLocaleString('en-GB', { hour12: false }) : ''} readOnly style={{backgroundColor: '#f3f4f6'}} />
                  </label>
                  <label>
                    Units:
                    <input type="text" name="volume" value={donateForm.volume} onChange={handleDonateFormChange} placeholder="Number of units" required />
                  </label>
                  <button type="submit" className="btn-donate" style={{ marginTop: '12px' }}>Submit</button>
                </form>
              </div>
            </div>
          )}
          {showRejectConfirm && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Confirm Rejection</h3>
                <p>Are you really want to reject this donor request?</p>
                <div className="modal-actions">
                  <button className="btn-cancel" onClick={() => setShowRejectConfirm(false)}>Cancel</button>
                  <button className="btn-verify" onClick={confirmReject}>Confirm</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MRODashboard; 