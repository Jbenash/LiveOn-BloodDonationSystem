import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HospitalDashboard.css';
import logo from '../../assets/logo.svg';
import userImg from '../../assets/user.png';

const HospitalDashboard = () => {
  const [hospital, setHospital] = useState(null);
  const [donors, setDonors] = useState([]);
  const [bloodInventory, setBloodInventory] = useState([]);
  const [activeSection, setActiveSection] = useState('dashboard');
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

  // Remove or comment out the old sendEmergencyRequest function
  // const sendEmergencyRequest = () => {
  //   fetch('http://localhost/liveonv2/backend_api/emergency_request.php', {
  //     method: 'POST',
  //     credentials: 'include',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ type: 'general' })
  //   })
  //     .then(res => res.json())
  //     .then(data => {
  //       alert(data.message || 'Emergency request sent');
  //     })
  //     .catch(err => {
  //       alert('Failed to send emergency request');
  //     });
  // };

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

  // Helper to filter donors by blood type
  const donorsByBloodType = (type) => donors.filter(d => d.bloodType === type);

  if (!hospital) return <div>Loading dashboard...</div>;

  const sectionTitles = {
    dashboard: 'Hospital Overview',
    donors: 'Donors',
    inventory: 'Blood Inventory',
    requests: 'Emergency Requests',
  };

  return (
    <div className="hospital-dashboard-root">
      <div className="dashboard-background">
        <div className="dashboard-grid"></div>
        <div className="dashboard-particles"></div>
      </div>

      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div>
          <div className="dashboard-logo" onClick={() => navigate('/')}>
            <img src={logo} alt="LiveOn Logo" className="logo-svg" />
          </div>
          <nav>
            <ul>
              <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}><span className="icon dashboard" />Overview</li>
              <li className={activeSection === 'donors' ? 'active' : ''} onClick={() => setActiveSection('donors')}><span className="icon donors" />Donors</li>
              <li className={activeSection === 'inventory' ? 'active' : ''} onClick={() => setActiveSection('inventory')}><span className="icon inventory" />Inventory</li>
              <li className={activeSection === 'requests' ? 'active' : ''} onClick={() => setActiveSection('requests')}><span className="icon requests" />Requests</li>
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-card glassy animate-fadein dashboard-header-card">
          <div className="dashboard-header-row">
            <span className="dashboard-title gradient-text">{sectionTitles[activeSection]}</span>
            <div className="dashboard-user-info">
              <img src={userImg} alt="Profile" className="dashboard-user-avatar" />
              <span className="dashboard-user-name">{hospital.name || 'Hospital'}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {activeSection === 'dashboard' && (
            <div className="dashboard-stats-grid">

              {/* Donor Availability */}
              <div className="dashboard-card glassy animate-fadein">
                <div className="profile-summary-title gradient-text">Donor Availability</div>
                <div className="donor-table-wrapper">
                  <table className="donor-table">
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

              {/* Row for Blood Inventory and Emergency Requests */}
              <div className="dashboard-row-cards">
                {/* Blood Inventory */}
                <div className="dashboard-card glassy animate-fadein small-card">
                  <div className="dashboard-card-inner">
                    <div className="dashboard-card-title">Blood Inventory</div>
                    <div className="dashboard-card-content">
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
                  </div>
                </div>

                {/* Emergency Request */}
                <div className="dashboard-card glassy animate-fadein small-card">
                  <div className="dashboard-card-inner">
                    <div className="dashboard-card-title">Emergency Requests</div>
                    <div className="dashboard-card-content">
                      <button className="dashboard-btn primary" onClick={() => setShowEmergencyPopup(true)}>
                        SEND EMERGENCY REQUEST
                      </button>
                      <div className="emergency-warning">
                        <span className="warning-icon">⚠️</span> Low blood volume detected for O- and AB+
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Sections (placeholders for future) */}
          {activeSection === 'donors' && (
            <div className="dashboard-card glassy animate-fadein">
              <div className="profile-summary-title gradient-text">Donor Availability</div>
              <div className="donor-table-wrapper">
                <table className="donor-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Blood Type</th>
                      <th>Contact Info</th>
                      <th>Location</th>
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
                      <tr><td colSpan="7">No donors available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeSection === 'inventory' && (
            <div className="dashboard-card glassy animate-fadein">
              <div className="dashboard-card-title">Blood Inventory</div>
              <div className="dashboard-card-content">
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
            </div>
          )}
          {activeSection === 'requests' && (
            <>
              <div className="dashboard-card glassy animate-fadein">
                <div className="dashboard-card-title">Emergency Requests</div>
                <div className="dashboard-card-content">
                  <button className="dashboard-btn primary" onClick={() => setShowEmergencyPopup(true)}>
                    SEND EMERGENCY REQUEST
                  </button>
                  <div className="emergency-warning">
                    <span className="warning-icon">⚠️</span> Low blood volume detected for O- and AB+
                  </div>
                </div>
              </div>
              {emergencyRequests.length > 0 ? (
                <div className="dashboard-card glassy animate-fadein" style={{ marginTop: '1.5rem' }}>
                  <div className="dashboard-card-title">Emergency Request Log</div>
                  <div className="dashboard-card-content">
                    <table className="donor-table">
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
                </div>
              ) : (
                <div className="dashboard-card glassy animate-fadein" style={{ marginTop: '1.5rem' }}>
                  <div className="dashboard-card-title">Emergency Request Log</div>
                  <div className="dashboard-card-content">
                    <div>No emergency requests found.</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {showEmergencyPopup && (
        <div className="modal-overlay">
          <div className="modal-content">
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
        <div className="modal-overlay">
          <div className="modal-content">
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
        <div className="modal-overlay">
          <div className="modal-content">
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
                      console.log('Donation request response:', data); // Debug log
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
        <div className="modal-overlay">
          <div className="modal-content">
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
        <div className="modal-overlay" onClick={() => setShowDonorPopup(false)}>
          <div className="modal-content donor-popup" onClick={e => e.stopPropagation()}>
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
  );
};

export default HospitalDashboard;