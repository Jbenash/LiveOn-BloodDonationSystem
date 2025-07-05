import React, { useState, useEffect } from "react";
import "./MRODashboard.css";

const MRODashboard = () => {
  const [activeSection, setActiveSection] = useState("Overview");
  const [showPopup, setShowPopup] = useState(false);
  const [popupDonor, setPopupDonor] = useState(null);
  const [formData, setFormData] = useState({
    height: '',
    weight: '',
    medicalHistory: '',
    doctorsNote: '',
    verificationDate: new Date().toISOString().split('T')[0] // Today's date as default
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

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost/Liveon_git/project-1/Liveon/backend/get_donor_requests.php")
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
  fetch("http://localhost/Liveon_git/project-1/Liveon/backend/get_donor_registrations.php")
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
  fetch("http://localhost/Liveon_git/project-1/Liveon/backend/get_verification_stats.php")
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
  fetch("http://localhost/Liveon_git/project-1/Liveon/backend/get_donation_logs.php")
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
      verification_date: formData.verificationDate
    };
    console.log('payload:', payload); // Debug: check the payload being sent
    try {
      const response = await fetch('http://localhost/Liveon_git/project-1/Liveon/backend/save_medical_verification.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setSubmitStatus('Donor details saved successfully!');
        setDonorRequests(prev => prev.filter(donor => donor.donor_id !== popupDonor.donor_id));
        setTimeout(() => {
          setShowPopup(false);
          setPopupDonor(null);
          setFormData({ height: '', weight: '', medicalHistory: '', doctorsNote: '', verificationDate: new Date().toISOString().split('T')[0] });
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
    // Prefill form with donor details and current date/time
    const currentDateTime = new Date().toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    setDonateForm({ 
      bloodType: donor.blood_group || '', 
      donationDate: new Date().toISOString().split('T')[0], // Current date
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
    
    // Prepare data for backend
    const payload = {
      donor_id: donatePopupDonor.donor_id,
      full_name: donatePopupDonor.full_name,
      blood_type: donateForm.bloodType,
      donation_date: donateForm.donationDate,
      volume: donateForm.volume
    };
    
    console.log('Donation payload:', payload); // Debug: check the payload
    
    try {
      const response = await fetch('http://localhost/Liveon_git/project-1/Liveon/backend/save_donation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Donation saved successfully! Donation ID: ${data.donation_id}`);
        setShowDonatePopup(false);
        setDonatePopupDonor(null);
        setDonateForm({ bloodType: '', donationDate: '', volume: '' });
      } else {
        alert('Error: ' + (data.error || 'Failed to save donation'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Filter donorRequests based on search term
  const filteredDonorRequests = donorRequests.filter(donor =>
    donor.donor_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.donor_email.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="mro-dashboard-container">
      <aside className="sidebar" style={{ width: '140px' }}>
        <div className="logo">LiveOn</div>
        <nav>
          <ul>
            <li className={activeSection === "Overview" ? "active" : ""} onClick={() => setActiveSection("Overview")}>Overview</li>
            <li className={activeSection === "Donor Requests" ? "active" : ""} onClick={() => setActiveSection("Donor Requests")}>Donor Requests</li>
            <li className={activeSection === "Donor Registration Logs" ? "active" : ""} onClick={() => setActiveSection("Donor Registration Logs")}>Donor Registration Logs</li>
            <li className={activeSection === "Donation Logs" ? "active" : ""} onClick={() => setActiveSection("Donation Logs")}>Donation Logs</li>
          </ul>
        </nav>
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
                    <circle cx="9" cy="9" r="7" stroke="white" strokeWidth="2"/>
                    <line x1="14.2929" y1="14.7071" x2="18" y2="18.4142" stroke="white" strokeWidth="2" strokeLinecap="round"/>
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
                            otp: donor.otp_number
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
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {donorRegistrations.length === 0 ? (
                    <tr><td colSpan="5">No registered donors found.</td></tr>
                  ) : (
                    donorRegistrations.map((donor, idx) => (
                      <tr key={donor.donor_id || idx}>
                        <td>{donor.donor_id}</td>
                        <td>{donor.full_name}</td>
                        <td>{donor.email}</td>
                        <td>{donor.blood_group}</td>
                        <td>
                          <button 
                            style={{
                              background: '#22c55e',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              fontWeight: '500',
                              transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#16a34a'}
                            onMouseOut={(e) => e.target.style.background = '#22c55e'}
                            onClick={() => handleOpenDonatePopup(donor)}
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
                    donationLogs.map((log, idx) => (
                      <tr key={log.donation_id || idx}>
                        <td>{log.donation_id}</td>
                        <td>{log.donor_id}</td>
                        <td>{log.full_name}</td>
                        <td>{log.blood_type}</td>
                        <td>{log.volume}</td>
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
                  <button type="button" className="btn-verify" style={{marginTop: '12px'}} onClick={handleSubmitDonorDetails}>Submit</button>
                  {submitStatus && <div style={{marginTop: '10px', color: submitStatus.startsWith('Donor details saved') ? 'green' : 'red'}}>{submitStatus}</div>}
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
                    <input type="text" value={donatePopupDonor.full_name} readOnly style={{backgroundColor: '#f3f4f6'}} />
                  </label>
                  <label>
                    Donor ID:
                    <input type="text" value={donatePopupDonor.donor_id} readOnly style={{backgroundColor: '#f3f4f6'}} />
                  </label>
                  <label>
                    Blood Type:
                    <input type="text" name="bloodType" value={donateForm.bloodType} onChange={handleDonateFormChange} readOnly style={{backgroundColor: '#f3f4f6'}} />
                  </label>
                  <label>
                    Donation Date:
                    <input type="date" name="donationDate" value={donateForm.donationDate} onChange={handleDonateFormChange} readOnly style={{backgroundColor: '#f3f4f6'}} />
                  </label>
                  <label>
                    Volume:
                    <input type="text" name="volume" value={donateForm.volume} onChange={handleDonateFormChange} placeholder="Enter volume (e.g. 450ml)" required />
                  </label>
                  <button type="submit" className="btn-donate" style={{marginTop: '12px'}}>Submit</button>
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