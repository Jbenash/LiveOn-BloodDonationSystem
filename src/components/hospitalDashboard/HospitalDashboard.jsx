import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HospitalDashboard.css';
import logo from '../../assets/logo.svg';
import userImg from '../../assets/user.png';

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
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost/liveonv2/backend_api/hospital_dashboard.php', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          navigate('/login');
        } else {
          setHospital(data);
          setDonors(data.donors || []);
          setBloodInventory(data.bloodInventory || []);
          setEmergencyRequests(data.emergencyRequests || []);
        }
      });
  }, [navigate]);

  const handleRequest = (donorId) => {
    setDonationRequestDonorId(donorId);
    setDonationHospitalName(hospital?.name || '');
    setDonationReason('');
    setDonationError('');
    setShowDonationRequestPopup(true);
  };

  const handleLogout = () => {
    fetch('http://localhost/liveonv2/backend_api/logout.php', {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => {
        navigate('/');
      })
      .catch(() => {
        navigate('/');
      });
  };

  const donorsByBloodType = (type) => donors.filter(d => d.bloodType === type);

  if (!hospital) return <div>Loading dashboard...</div>;

  return (
    <div className="mro-dashboard-container">
      <aside className="sidebar" style={{ width: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh' }}>
        <div style={{ width: '100%' }}>
          <div className="logo" style={{ cursor: 'pointer', padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginLeft: 32 }} onClick={() => navigate('/') }>
            <img src={logo} alt="LiveOn Logo" style={{ height: 120, width: 'auto', display: 'block' }} />
          </div>
          <nav>
            <ul style={{ padding: 0, margin: 0 }}>
              <li className={activeSection === 'Overview' ? 'active' : ''} onClick={() => setActiveSection('Overview')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Overview</span>
              </li>
              <li className={activeSection === 'Donors' ? 'active' : ''} onClick={() => setActiveSection('Donors')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Donors</span>
              </li>
              <li className={activeSection === 'Inventory' ? 'active' : ''} onClick={() => setActiveSection('Inventory')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Inventory</span>
              </li>
              <li className={activeSection === 'Requests' ? 'active' : ''} onClick={() => setActiveSection('Requests')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Requests</span>
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
          {/* Dashboard Header: Hospital Dashboard ... Hospital Name */}
          <div className="dashboard-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, padding: '28px 32px' }}>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#222', margin: 0 }}>Hospital Dashboard</h1>
            <div style={{ fontSize: '1.15rem', fontWeight: 600, color: '#2563eb', marginLeft: 24, whiteSpace: 'nowrap' }}>
              <span>🏥 {hospital.name}</span>
            </div>
          </div>
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
                      setEmergencyError('');
                      fetch('http://localhost/liveonv2/backend_api/emergency_request.php', {
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
                        })
                        .catch(err => {
                          setEmergencyError('Failed to send emergency request');
                        });
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
                      setDonationError('');
                      fetch('http://localhost/liveonv2/backend_api/send_donation_request.php', {
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
                        })
                        .catch(err => {
                          setDonationError('Failed to send donation request');
                        });
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
                      <div className="profile-summary-card" key={idx}>
                        <img
                          src={donor.profilePic || userImg}
                          alt={donor.name}
                          className="profile-avatar"
                          style={{ width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', border: '2px solid #3b82f6', marginRight: 20 }}
                        />
                        <div className="profile-summary-text">
                          <div><span className="label">Donor ID:</span> {donor.donor_id || '-'}</div>
                          <div><span className="label">Name:</span> {donor.name}</div>
                          <div><span className="label">Blood Type:</span> {donor.bloodType}</div>
                          <div><span className="label">Age:</span> {donor.age || '-'}</div>
                          <div><span className="label">Location:</span> {donor.location}</div>
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