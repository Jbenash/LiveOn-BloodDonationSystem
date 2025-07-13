import React, { useState, useEffect } from "react";
import "./MRODashboard.css";
import { useNavigate } from 'react-router-dom';

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

  // Auth check: redirect to home if not logged in as MRO
  useEffect(() => {
    fetch("http://localhost/Liveonv2/backend_api/get_donor_requests.php", { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          navigate('/');
        }
      });
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost/Liveonv2/backend_api/get_donor_requests.php", {
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
      });

    // Fetch donor registrations
    fetch("http://localhost/Liveonv2/backend_api/get_donor_registrations.php", {
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
      });

    // Fetch verification statistics
    fetch("http://localhost/Liveonv2/backend_api/get_verification_stats.php", {
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
      });

    // Fetch donation logs
    fetch("http://localhost/Liveonv2/backend_api/get_donation_logs.php", {
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
      });
  }, []);

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
      const response = await fetch('http://localhost/Liveonv2/backend_api/save_medical_verification.php', {
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
        fetch('http://localhost/Liveonv2/backend_api/send_verification_email.php', {
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
      const response = await fetch('http://localhost/Liveonv2/backend_api/save_donation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        // Immediately set donor status to 'not available'
        await fetch('http://localhost/Liveonv2/backend_api/update_donor_status.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ donor_id: donatePopupDonor.donor_id, status: 'not available' })
        });
        // Trigger delayed status reset (after 2 minutes)
        await fetch('http://localhost/Liveonv2/backend_api/schedule_status_available.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ donor_id: donatePopupDonor.donor_id, delay_seconds: 120 })
        });
        alert(`Donation saved successfully! Donation ID: ${data.donation_id}`);
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
      await fetch("http://localhost/Liveonv2/backend_api/logout.php", {
        method: 'POST',
        credentials: 'include',
      });
      navigate('/');
    } catch (error) {
      alert('Logout failed');
    }
  };

  return (
    <div className="mro-dashboard-container">
      <aside className="sidebar" style={{ width: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh' }}>
        <div style={{ width: '100%' }}>
          <div className="logo" style={{ cursor: 'pointer', fontSize: '1.6rem', padding: '18px 0' }} onClick={() => navigate('/')}>LiveOn</div>
          <nav>
            <ul style={{ padding: 0, margin: 0 }}>
              <li className={activeSection === "Overview" ? "active" : ""} onClick={() => setActiveSection("Overview")}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s' }}>Overview</li>
              <li className={activeSection === "Donor Requests" ? "active" : ""} onClick={() => setActiveSection("Donor Requests")}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexDirection: 'row' }}>
                Donor Requests
                {filteredDonorRequests.length > 0 && (
                  <span style={{
                    background: '#dc2626',
                    color: '#fff',
                    borderRadius: '50%',
                    minWidth: 26,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(220,38,38,0.13)'
                  }}>{filteredDonorRequests.length}</span>
                )}
              </li>
              <li className={activeSection === "Donor Registration Logs" ? "active" : ""} onClick={() => setActiveSection("Donor Registration Logs")}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s' }}>Donor Registration Logs</li>
              <li className={activeSection === "Donation Logs" ? "active" : ""} onClick={() => setActiveSection("Donation Logs")}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s' }}>Donation Logs</li>
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
          <header className="dashboard-header">
            <h1>MRO Dashboard</h1>
            {activeSection !== "Overview" && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input className="search-bar" type="text" placeholder="Search donor names..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <button className="btn-search" type="button" aria-label="Search">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2" />
                    <line x1="14.2929" y1="14.7071" x2="18" y2="18.4142" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            )}
          </header>
          {activeSection === "Overview" && (
            <section className="dashboard-section">
              <h2>Dashboard Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div style={{ background: '#e0e7ff', padding: '20px', borderRadius: '12px', border: '1px solid #c7d2fe' }}>
                  <h3 style={{ color: '#2d3a8c', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Total Donors</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2d3a8c', margin: '0' }}>{donorRequests.length + donorRegistrations.length}</p>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Registered in system</p>
                </div>

                <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <h3 style={{ color: '#92400e', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Pending Requests</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e', margin: '0' }}>{donorRequests.length}</p>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Awaiting verification</p>
                </div>

                <div style={{ background: '#dcfce7', padding: '20px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <h3 style={{ color: '#166534', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Active Donors</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534', margin: '0' }}>{donorRegistrations.length}</p>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Verified and active</p>
                </div>

                <div style={{ background: '#f3e8ff', padding: '20px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                  <h3 style={{ color: '#7c3aed', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Total Verifications</h3>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed', margin: '0' }}>{verificationStats.stats?.total_verified || 0}</p>
                  <p style={{ color: '#6b7280', margin: '5px 0 0 0', fontSize: '0.9rem' }}>Medical verifications</p>
                </div>
              </div>

              {/* Verification Chart */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                {createVerificationChart()}
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ color: '#2d3a8c', margin: '0 0 15px 0' }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  <button
                    style={{
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}
                    onClick={() => setActiveSection("Donor Requests")}
                  >
                    Review Pending Requests
                  </button>
                  <button
                    style={{
                      background: '#22c55e',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem'
                    }}
                    onClick={() => setActiveSection("Donor Registration Logs")}
                  >
                    View Active Donors
                  </button>
                  <button
                    style={{
                      background: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.9rem'
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
                      <tr key={donor.otp_number || idx}>
                        <td>{donor.donor_id}</td>
                        <td>{donor.donor_fullname}</td>
                        <td>{donor.donor_email}</td>
                        <td>{donor.otp_number}</td>
                        <td>
                          <button className="btn-cancel">Cancel</button>
                          <button className="btn-verify" onClick={() => handleOpenPopup({
                            donor_id: donor.donor_id,
                            fullName: donor.donor_fullname,
                            email: donor.donor_email,
                            otp: donor.otp_number,
                            blood_group: donor.blood_group // add blood_group for email
                          })}>Next</button>
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
                  {donorRegistrations.length === 0 ? (
                    <tr><td colSpan="6">No registered donors found.</td></tr>
                  ) : (
                    filteredDonorRegistrations.map((donor, idx) => (
                      <tr key={donor.donor_id || idx}>
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
                    ))
                  )}
                </tbody>
              </table>
            </section>
          )}
          {activeSection === "Donation Logs" && (
            <section className="dashboard-section">
              <h2>Donation Logs</h2>
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
                  {donationLogs.length === 0 ? (
                    <tr><td colSpan="6">No donation logs found.</td></tr>
                  ) : (
                    filteredDonationLogs.map((log, idx) => (
                      <tr key={log.donation_id || idx}>
                        <td>{log.donation_id}</td>
                        <td>{log.donor_id}</td>
                        <td>{log.full_name}</td>
                        <td>{log.blood_type}</td>
                        <td>{log.units_donated}</td>
                        <td>{log.donation_date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          )}
          {showPopup && popupDonor && (
            <div className="popup-overlay">
              <div className="popup-form">
                <button className="popup-close" onClick={handleClosePopup}>&times;</button>
                <h3>Donor Medical Details</h3>
                <form>
                  <label>
                    Donor ID:
                    <input type="text" value={popupDonor.donor_id || ''} readOnly />
                  </label>
                  <label>
                    Full Name:
                    <input type="text" value={popupDonor.fullName || ''} readOnly />
                  </label>
                  <label>
                    Email:
                    <input type="text" value={popupDonor.email || ''} readOnly />
                  </label>
                  <label>
                    Height:
                    <input type="text" name="height" value={formData.height} onChange={handleInputChange} placeholder="Enter height (cm)" />
                  </label>
                  <label>
                    Weight:
                    <input type="text" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Enter weight (kg)" />
                  </label>
                  <label>
                    Medical History:
                    <textarea name="medicalHistory" value={formData.medicalHistory} onChange={handleInputChange} placeholder="Enter medical history" />
                  </label>
                  <label>
                    Doctor's Note:
                    <textarea name="doctorsNote" value={formData.doctorsNote} onChange={handleInputChange} placeholder="Enter doctor's note" />
                  </label>
                  <label>
                    Verification Date:
                    <input type="date" name="verificationDate" value={formData.verificationDate} onChange={handleInputChange} />
                  </label>
                  <label>
                    Blood Group:
                    <select name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} required>
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
                  </label>
                  <label>
                    Age:
                    <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Enter age" />
                  </label>
                  <button type="button" className="btn-verify" style={{ marginTop: '12px' }} onClick={handleSubmitDonorDetails}>Submit</button>
                  {submitStatus && <div style={{ marginTop: '10px', color: submitStatus.startsWith('Donor details saved') ? 'green' : 'red' }}>{submitStatus}</div>}
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
                    Volume:
                    <input type="text" name="volume" value={donateForm.volume} onChange={handleDonateFormChange} placeholder="Enter volume (e.g. 450ml)" required />
                  </label>
                  <button type="submit" className="btn-donate" style={{ marginTop: '12px' }}>Submit</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MRODashboard;