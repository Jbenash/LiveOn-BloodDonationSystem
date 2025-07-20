import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorDashboard.css';
import logo from '../../assets/logo.svg';

const DonorDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [donations, setDonations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost/liveonv2/backend_api/controllers/donor_dashboard.php', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          navigate('/'); // If not logged in, redirect
        } else {
          setUser(data);
        }
      })
      .catch(err => {
        console.error('Error fetching donor data:', err);
        navigate('/'); // In case of error, redirect
      });
  }, [navigate]);

  useEffect(() => {
    if (activeSection === 'donations' && user?.donorId) {
      fetch(`http://localhost/liveonv2/backend_api/get_donor_donations.php?donor_id=${user.donorId}`, {
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

  const handleLogout = () => {
    fetch("http://localhost/liveonv2/backend_api/controllers/logout.php", {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => {
        navigate('/'); // Go to login or home page
      })
      .catch(error => {
        console.error("Logout failed:", error);
      });
  };

  if (!user) return <div>Loading dashboard...</div>;

  return (
    <div className="donor-dashboard-container">
      <aside className="sidebar" style={{ width: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100vh' }}>
        <div style={{ width: '100%' }}>
          <div className="logo" style={{ cursor: 'pointer', padding: '18px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginLeft: 32, marginBottom: 40 }} onClick={() => navigate('/') }>
            <img src={logo} alt="LiveOn Logo" style={{ height: 120, width: 'auto', display: 'block' }} />
        </div>
        <nav>
            <ul style={{ padding: 0, margin: 0 }}>
              <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Dashboard</span>
              </li>
              <li className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Profile</span>
              </li>
              <li className={activeSection === 'donations' ? 'active' : ''} onClick={() => setActiveSection('donations')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Donations</span>
              </li>
              <li className={activeSection === 'rewards' ? 'active' : ''} onClick={() => setActiveSection('rewards')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Rewards</span>
              </li>
              <li className={activeSection === 'feedback' ? 'active' : ''} onClick={() => setActiveSection('feedback')}
                  style={{ fontSize: '1.18rem', padding: '18px 0 18px 18px', marginBottom: 8, borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', display: 'flex', alignItems: 'center' }}>
                <span className="sidebar-label">Feedback</span>
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
      <div className="dashboard-main">
        <div className="dashboard-section" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, padding: '28px 32px' }}>
          <header className="dashboard-header" style={{ margin: 0 }}>
            <h1 style={{ margin: 0 }}>Donor Dashboard</h1>
          </header>
            <div className="dashboard-user-info">
            <img src={user.profilePic} alt="Profile" className="dashboard-user-avatar" onClick={() => setActiveSection('profile')} />
              <span className="dashboard-user-name">Welcome, {user.name}</span>
            </div>
          </div>
        <div className="dashboard-content">
          {activeSection === 'profile' && (
            <div className="dashboard-stats-grid">
              {/* Redesigned Profile Card */}
              <div className="dashboard-card glassy profile-summary animate-fadein" style={{ maxWidth: 600, margin: '0 auto', padding: '3.5rem 2.5rem', boxShadow: '0 12px 40px rgba(220,53,69,0.13)', background: 'rgba(255,255,255,0.99)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
                  <img src={user.profilePic} alt="Profile" style={{ width: 150, height: 150, borderRadius: '50%', objectFit: 'cover', border: '6px solid #dc3545', boxShadow: '0 6px 24px rgba(220,53,69,0.13)' }} />
                  <div style={{ fontWeight: 700, fontSize: '2.1rem', marginTop: 24, color: '#1e293b', letterSpacing: 0.5 }}>{user.name}</div>
                  <div style={{ fontWeight: 600, fontSize: '1.3rem', color: '#dc3545', marginTop: 4 }}>Donor ID: {user.donorId}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.18rem' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Blood Type:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{user.bloodType}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.18rem' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Age:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{user.age}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.18rem' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Location:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{user.location}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.18rem' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>Email:</span>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{user.email}</span>
                  </div>
                </div>
                <button className="dashboard-btn primary" style={{ width: '100%', marginTop: 16, fontSize: '1.15rem', padding: '14px 0' }}
                  onClick={() => {
                    setEditForm({
                      donorId: user.donorId,
                      name: user.name,
                      bloodType: user.bloodType,
                      age: user.age,
                      location: user.location,
                      email: user.email
                    });
                    setShowEditProfile(true);
                  }}
                >Edit Profile</button>
              </div>
            </div>
          )}
          {activeSection === 'dashboard' && (
            <>
          <div className="dashboard-stats-grid">
            {/* Profile Card */}
            <div className="dashboard-card glassy profile-summary animate-fadein">
              <div className="profile-summary-title gradient-text">Profile Summary</div>
              <div className="profile-summary-details">
                <img src={user.profilePic} alt="Profile" className="profile-avatar" />
                <div className="profile-summary-text">
                      <div><span className="label">Donor ID:</span> {user.donorId}</div>
                  <div><span className="label">Name:</span> {user.name}</div>
                  <div><span className="label">Blood Type:</span> {user.bloodType}</div>
                  <div><span className="label">Age:</span> {user.age}</div>
                  <div><span className="label">Location:</span> {user.location}</div>
                  <div><span className="label">Email:</span> {user.email}</div>
                </div>
              </div>
            </div>

            {/* Donation Stats */}
            <div className="dashboard-card glassy donation-stats animate-fadein">
              <div className="donation-stats-title gradient-text">Donation Statistics</div>
              <div className="donation-stats-grid">
                <div className="donation-stat">
                      {/* Total Donations SVG - Provided by user */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="32" height="32">
                          <defs>
                            <style>{`.cls-2{fill:#afccd9}.cls-3{fill:#c2e2f5}.cls-4{fill:#ad3542}.cls-5{fill:#fff}.cls-6{fill:#d93a46}.cls-7{fill:#d65366}`}</style>
                          </defs>
                          <circle cx="256" cy="262" r="250" style={{ fill: '#76c27d' }} />
                          <g>
                            <path className="cls-2" d="M386.2 140.88v167a130.3 130.3 0 0 1-121.85 130c-2.79.19-5.62.28-8.47.28a130.31 130.31 0 0 1-130.31-130.31v-167a55.76 55.76 0 0 1 55.77-55.76h149.09a55.76 55.76 0 0 1 55.77 55.79z" />
                            <path className="cls-3" d="M386.2 140.88v167a130.3 130.3 0 0 1-121.85 130 130.29 130.29 0 0 1-121.83-130v-167a55.75 55.75 0 0 1 55.75-55.76h132.16a55.76 55.76 0 0 1 55.77 55.76z" />
                            <path className="cls-4" d="M360 282.18V340c0 38.37-38.31 69.48-85.58 69.48h-34c-47.28 0-85.6-31.11-85.6-69.48v-57.82c0-16.43 16.4-29.75 36.64-29.75h131.93c20.22 0 36.61 13.32 36.61 29.75z" />
                            <circle className="cls-3" cx="255.88" cy="50.92" r="44.36" />
                            <rect className="cls-5" x="200.2" y="115.39" width="114.44" height="86.12" rx="10.53" />
                            <path className="cls-6" d="M237 166.94a20.45 20.45 0 1 0 40.9 0c0-11.29-20.45-37.42-20.45-37.42S237 155.65 237 166.94z" />
                            <circle className="cls-2" cx="255.88" cy="50.92" r="25.88" />
                            <path className="cls-6" d="M262.13 409.51v102.42q-3.06.07-6.13.07t-6.36-.08V409.51zM360 247.23V340c0 38.38-38.32 69.48-85.58 69.48h-3.2c-47.26 0-85.58-31.1-85.58-69.48v-57.83a23.84 23.84 0 0 1 .28-3.6l-31.1 2.55s-.83-44.69 35.67-47.19c0 0 3.93-.45 9.71-.52 10.31-.12 26.49 1 36.76 8 0 0 15.19 9.5 35.86 0 0 0 19.16-14.08 43-5.39a28.31 28.31 0 0 0 20-.45 20.47 20.47 0 0 1 18.18 1.19 12 12 0 0 1 6 10.47z" />
                            <path className="cls-4" d="m185.93 278.57-31.1 2.55s-.83-44.69 35.67-47.19c0 0 3.93-.45 9.71-.52-14.65 15.08-14.28 45.16-14.28 45.16z" />
                            <rect className="cls-5" x="320" y="154.1" width="46.67" height="16.67" rx="8.33" />
                            <rect className="cls-5" x="336" y="187.39" width="30.67" height="16.67" rx="8.33" />
                            <rect className="cls-5" x="320" y="221.43" width="46.67" height="16.67" rx="8.33" />
                            <rect className="cls-5" x="336" y="254.72" width="30.67" height="16.67" rx="8.33" />
                            <rect className="cls-5" x="320" y="289.69" width="46.67" height="16.67" rx="8.33" />
                            <rect className="cls-5" x="336" y="322.98" width="30.67" height="16.67" rx="8.33" />
                            <circle className="cls-7" cx="236.97" cy="280.41" r="12.31" />
                            <circle className="cls-7" cx="289.35" cy="298.03" r="12.31" />
                            <circle className="cls-7" cx="264.36" cy="331.31" r="7.59" />
                            <circle className="cls-7" cx="236.97" cy="365.43" r="7.59" />
                            <circle className="cls-7" cx="300.25" cy="380.61" r="7.59" />
                            <path d="m491.86 91.54-88.73 88.73L330 107.16l-15.6-15.62a51.68 51.68 0 0 1 73.09-73.09l15.62 15.62 15.62-15.62a51.69 51.69 0 0 1 73.11 73.09z" style={{ fill: '#db3a46' }} />
                            <path d="M403.13 180.27 330 107.16l-15.6-15.62a51.68 51.68 0 0 1 30.45-87.86c-3.59 37.95-.66 110.89 58.28 176.59z" style={{ fill: '#af3542' }} />
                            <path d="M294.33 463v10a4.87 4.87 0 0 1-4.87 4.88h-5.75a4.88 4.88 0 0 0-4.88 4.87V511q-8.28.75-16.7 1-3.06.07-6.13.07t-6.36-.08l-2.81-.08q-5.87-.22-11.66-.7v-28.49a4.88 4.88 0 0 0-4.88-4.87h-5.75a4.87 4.87 0 0 1-4.87-4.88V463a4.87 4.87 0 0 1 4.87-4.88h64.92a4.87 4.87 0 0 1 4.87 4.88z" style={{ fill: '#d5d2d3' }} />
                            <path className="cls-5" d="M294.33 463v10a4.87 4.87 0 0 1-4.87 4.88h-5.75a4.88 4.88 0 0 0-4.88 4.87V511q-8.28.75-16.7 1-3.06.07-6.13.07t-6.36-.08l-2.81-.08v-29.19a4.87 4.87 0 0 0-4.87-4.87h-5.75a4.87 4.87 0 0 1-4.87-4.88V463a4.87 4.87 0 0 1 4.87-4.88h53.25a4.87 4.87 0 0 1 4.87 4.88z" />
                            <path d="M403.13 116.07a7.54 7.54 0 0 1-5.31-2.2l-26.13-26.13a7.5 7.5 0 0 1 10.61-10.61l20 20L438 48.65a7.5 7.5 0 1 1 12 8.9L409.16 113a7.46 7.46 0 0 1-5.47 3z" style={{ fill: '#fdfcfd' }} />
                          </g>
                        </svg>
                      </span>
                  <div className="stat-value stat-blue">{user.totalDonations}</div>
                  <div className="stat-label">Total Donations</div>
                </div>
                <div className="donation-stat">
                      {/* Last Donation SVG - Provided by user */}
                      <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="32" height="32" viewBox="0 0 2048 2048" style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}>
                          <defs>
                            <clipPath id="id0"><path d="M1024-.001c565.541 0 1024 458.46 1024 1024s-458.461 1024-1024 1024c-565.541 0-1024-458.461-1024-1024 0-565.541 458.461-1024 1024-1024z"/></clipPath>
                            <style>{`.fil17{fill:#223539}.fil7{fill:#263238}.fil1{fill:#f57c00}.fil6{fill:#0091ea;fill-rule:nonzero}`}</style>
                          </defs>
                          <g id="Layer_x0020_1">
                            <path d="M1024-.001c565.541 0 1024 458.46 1024 1024s-458.461 1024-1024 1024c-565.541 0-1024-458.461-1024-1024 0-565.541 458.461-1024 1024-1024z" style={{ fill: '#ff9800' }} />
                            <g style={{ clipPath: 'url(#id0)' }}>
                              <g id="_466417432">
                                <path className="fil1" d="M871.208 468.827 2007.09 1604.71l1.06 1.17.95 1.27.83 1.36.69 1.44.56 1.51.4 1.58.25 1.64.09 1.68L876.035 480.482l-.085-1.685-.251-1.636-.405-1.58-.555-1.514-.693-1.441-.826-1.359-.949-1.269z"/>
                                <path className="fil1" d="M681.671 468.827 1817.55 1604.71l1.07 1.17.95 1.27.82 1.36.69 1.44.56 1.51.4 1.58.25 1.64.09 1.68L686.499 480.482l-.085-1.685-.251-1.636-.405-1.58-.555-1.514-.693-1.441-.826-1.359-.95-1.269z"/>
                                <path className="fil1" d="m1485.59 1485.59 1135.88 1135.88-5.77 5.63-5.9 5.5-6.03 5.35-6.16 5.21-6.29 5.06-6.41 4.91-6.52 4.76-6.65 4.61-6.76 4.45-6.87 4.29-6.98 4.13-7.09 3.96-7.2 3.79-7.29 3.63-7.39 3.45-7.49 3.28-7.59 3.1-7.67 2.74-7.77 2.55-7.94 2.36-8.01 2.16-8.09 1.98-8.16 1.78-8.24 1.57-8.31 1.38-8.38 1.17-8.44.97-8.5.75-8.56.55-8.62.32-8.67.11L1248 1584l8.67-.11 8.62-.33 8.56-.54 8.5-.76 8.44-.96 8.38-1.17 8.31-1.38 8.23-1.57 8.17-1.78 8.09-1.98 8.01-2.16 7.93-2.36 7.85-2.54 7.77-2.74 7.67-2.92 7.58-3.09 7.49-3.28 7.4-3.45 7.29-3.63 7.2-3.79 7.08-3.97 6.99-4.12 6.87-4.29 6.76-4.45 6.64-4.61 6.53-4.76 6.41-4.91 6.29-5.07 6.15-5.21 6.03-5.35 5.9-5.49z"/>
                                <path className="fil1" d="M912.073 1255.11 2047.95 2391h-72.39L839.675 1255.11z"/>
                                <path className="fil1" d="M839.675 1255.11 1975.56 2391h-333.45L506.233 1255.11z"/>
                                <path className="fil1" d="m1248 1584 1135.88 1135.88-8.67-.11-8.62-.32-8.56-.55-8.5-.75-8.44-.97-8.38-1.17-8.31-1.38-8.23-1.57-8.17-1.78-8.09-1.98-8.01-2.16-7.93-2.36-7.85-2.55-7.77-2.74-7.67-2.91-7.58-3.1-7.49-3.28-7.4-3.45-7.29-3.63-7.2-3.79-7.08-3.96-6.99-4.13-6.87-4.29-6.76-4.45-6.64-4.61-6.53-4.76-6.41-4.91-6.29-5.06-6.16-5.21-6.03-5.35-1135.88-1135.89 6.03 5.35 6.16 5.21 6.29 5.07 6.41 4.91 6.52 4.76 6.65 4.61 6.76 4.45 6.87 4.29 6.98 4.12 7.09 3.97 7.2 3.79 7.29 3.63 7.39 3.45 7.49 3.28 7.59 3.09 7.67 2.92 7.77 2.74 7.84 2.54 7.94 2.36 8.01 2.17 8.09 1.98 8.16 1.77 8.24 1.58 8.31 1.38 8.38 1.17 8.44.96 8.5.76 8.56.54 8.62.33z"/>
                                <path className="fil1" d="M506.233 1255.11 1642.11 2391l-2.16-.06-2.14-.16-2.11-.27-2.08-.38-2.04-.47-2-.57-1.96-.67-1.92-.75-1.87-.85-1.82-.94-1.77-1.02-1.71-1.09-1.66-1.18-1.6-1.26-1.53-1.33L477.859 1244.12l1.533 1.33 1.597 1.25 1.656 1.18 1.714 1.1 1.769 1.02 1.82.94 1.871.84 1.917.76 1.96.67 2.002.57 2.041.47 2.077.37 2.109.28 2.14.16z"/>
                                <path className="fil1" d="M686.499 480.482 1822.38 1616.36v65.93L686.499 546.403z"/>
                                <path className="fil1" d="M876.035 480.482 2011.92 1616.36v65.93L876.035 546.403z"/>
                                <path className="fil1" d="M1255.11 747.806 2390.99 1883.69v164.27L1255.11 912.073z"/>
                                <path className="fil1" d="m1584 1248 1135.88 1135.88-.11 8.67-.33 8.62-.54 8.56-.75 8.51-.97 8.44-1.17 8.37-1.38 8.31-1.58 8.24-1.77 8.16-1.98 8.09-2.17 8.02-2.36 7.93-2.54 7.85-2.74 7.76-2.92 7.67-3.09 7.59-3.28 7.49-3.45 7.39-3.63 7.3-3.79 7.19-3.97 7.09-4.12 6.98-4.29 6.87-4.45 6.76-4.61 6.65-4.76 6.53-4.91 6.4-5.07 6.29-5.21 6.16-5.35 6.03-5.49 5.9-5.63 5.77-1135.88-1135.88 5.63-5.77 5.49-5.9 5.35-6.03 5.21-6.16 5.06-6.29 4.92-6.41 4.76-6.52 4.6-6.65 4.45-6.76 4.29-6.87 4.13-6.98 3.96-7.09 3.8-7.2 3.63-7.29 3.45-7.39 3.27-7.5 3.1-7.58 2.92-7.67 2.73-7.77 2.55-7.85 2.36-7.93 2.17-8.01 1.97-8.09 1.78-8.17 1.58-8.23 1.38-8.31 1.17-8.38.96-8.44.76-8.5.54-8.56.33-8.62z"/>
                                <path className="fil1" d="M1061.81 469.998 2197.69 1605.88l.95 1.27.82 1.36.7 1.44.55 1.51.41 1.58.25 1.64.08 1.68L1065.57 480.482l-.08-1.685-.25-1.636-.41-1.58-.55-1.514-.7-1.441-.82-1.359z"/>
                                <path className="fil1" d="M1065.57 480.482 2201.45 1616.36v65.93L1065.57 546.403z"/>
                                <path className="fil1" d="M1255.11 546.404 2390.99 1682.29v16.48L1255.11 562.885z"/>
                                <path className="fil1" d="M1255.11 562.885 2390.99 1698.77v161.19L1255.11 724.077z"/>
                                <path className="fil1" d="M1255.11 724.077 2390.99 1859.96v3.62L1255.11 727.701z"/>
                                <path className="fil1" d="M1255.11 727.701 2390.99 1863.58v17.95L1255.11 745.649z"/>
                                <path className="fil1" d="M1255.11 745.649 2390.99 1881.53v2.16L1255.11 747.806z"/>
                                <path className="fil1" d="m1496.71 1022.08 1135.88 1135.89 5.35 6.03 5.21 6.16 5.07 6.28 4.91 6.41 4.76 6.53 4.61 6.64 4.45 6.76 4.29 6.88 4.12 6.98 3.97 7.09 3.79 7.19 3.63 7.29 3.45 7.4 3.28 7.49 3.09 7.58 2.92 7.68 2.74 7.76 2.54 7.85 2.36 7.93 2.17 8.01 1.98 8.09 1.77 8.17 1.58 8.24 1.38 8.3 1.17 8.38.97 8.44.75 8.5.54 8.56.33 8.62.11 8.67L1584 1248l-.11-8.67-.33-8.62-.54-8.56-.76-8.5-.96-8.44-1.17-8.38-1.38-8.31-1.58-8.24-1.78-8.16-1.97-8.09-2.17-8.01-2.36-7.93-2.55-7.85-2.73-7.77-2.92-7.67-3.1-7.58-3.27-7.5-3.45-7.39-3.63-7.29-3.8-7.2-3.96-7.09-4.13-6.98-4.29-6.87-4.45-6.76-4.6-6.64-4.76-6.53-4.92-6.41-5.06-6.29-5.21-6.16z"/>
                                <path className="fil1" d="M1255.11 912.073c89.956 1.87 171.226 39.093 230.472 98.341 60.804 60.803 98.413 144.804 98.413 237.586 0 92.782-37.609 176.783-98.413 237.587-60.804 60.804-144.804 98.413-237.586 98.413-92.783 0-176.783-37.609-237.587-98.413-59.247-59.246-96.47-140.517-98.34-230.473H506.23c-11.63 0-22.194-4.747-29.84-12.393-7.646-7.648-12.394-18.21-12.394-29.842V546.405h189.536v-65.922c0-9.103 7.38-16.482 16.482-16.482s16.482 7.38 16.482 16.482v65.921h156.573v-65.92c0-9.104 7.38-16.483 16.482-16.483s16.481 7.38 16.481 16.482v65.921h156.573v-65.92c0-9.104 7.38-16.483 16.483-16.483 9.101 0 16.482 7.38 16.482 16.482v65.921h173.059l16.482.001v365.669z"/>
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
                  <div className="stat-value stat-blue">{user.nextEligible}</div>
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
                  <div className="stat-value stat-green">{user.livesSaved}</div>
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

          {/* Call to Action */}
          <div className="dashboard-cta-card glassy animate-fadein">
            <h3 className="cta-title gradient-text">Ready for your next donation?</h3>
            <p className="cta-desc">Book your next appointment and keep saving lives!</p>
            <button className="dashboard-btn primary">Book Next Donation</button>
          </div>
            </>
          )}
          {activeSection === 'donations' && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <h2 style={{ marginBottom: 24 }}>My Donation History</h2>
              {donations.length === 0 ? (
                <div>No donation records found.</div>
              ) : (
                <table className="dashboard-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(59,130,246,0.10)' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #f43f5e 0%, #3b82f6 100%)' }}>
                      <th style={{ color: '#f43f5e', fontWeight: 700, padding: '14px 0', fontSize: '1.08rem', border: 'none', textAlign: 'center' }}>No.</th>
                      <th style={{ color: '#2563eb', fontWeight: 700, padding: '14px 0', fontSize: '1.08rem', border: 'none', textAlign: 'center' }}>Volume (ml)</th>
                      <th style={{ color: '#334155', fontWeight: 700, padding: '14px 0', fontSize: '1.08rem', border: 'none', textAlign: 'center' }}>Date</th>
                      <th style={{ color: '#10b981', fontWeight: 700, padding: '14px 0', fontSize: '1.08rem', border: 'none', textAlign: 'center' }}>Hospital</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((don, idx) => (
                      <tr key={don.donation_id || idx} style={{ background: idx % 2 === 0 ? '#f1f5f9' : '#e0e7ff', transition: 'background 0.2s' }}>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 600, color: '#f43f5e', fontSize: '1.05rem', border: 'none' }}>{idx + 1}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 600, color: '#2563eb', fontSize: '1.05rem', border: 'none' }}>{don.units_donated}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 600, color: '#334155', fontSize: '1.05rem', border: 'none' }}>{new Date(don.donation_date).toLocaleString()}</td>
                        <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 600, color: '#10b981', fontSize: '1.05rem', border: 'none' }}>{don.hospital_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {activeSection === 'rewards' && (
            <div className="dashboard-stats-grid">
              {/* Reward Points & Ranking Only */}
              <div className="dashboard-card glassy reward-stats animate-fadein" style={{ gridColumn: '1 / span 3' }}>
                <div className="reward-title gradient-text">Reward Points & Ranking</div>
                <div className="reward-points stat-green">{user.points} Points</div>
                <div className="reward-rank">Rank: {user.rank}</div>
              </div>
            </div>
          )}
          {activeSection === 'feedback' && (
            <div className="dashboard-stats-grid" style={{ justifyContent: 'center' }}>
              <div className="dashboard-card glassy animate-fadein" style={{ gridColumn: '1 / span 3', maxWidth: 500, margin: '0 auto' }}>
                <div className="feedback-title gradient-text" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 18 }}>Submit Feedback</div>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const feedback = e.target.elements.feedback.value.trim();
                    if (!feedback) {
                      alert('Please enter your feedback.');
                      return;
                    }
                    try {
                      const res = await fetch('http://localhost/liveonv2/backend_api/controllers/submit_feedback.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ donorId: user.donorId, feedback }),
                        credentials: 'include',
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert('Thank you for your feedback!');
                        e.target.reset();
                      } else {
                        alert(data.message || 'Failed to submit feedback');
                      }
                    } catch (err) {
                      alert('Error submitting feedback');
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                >
                  <textarea
                    name="feedback"
                    rows={5}
                    placeholder="Enter your feedback here..."
                    style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '12px', fontSize: '1.08rem', resize: 'vertical', minHeight: 100 }}
                  />
                  <button type="submit" className="dashboard-btn primary" style={{ fontSize: '1.08rem', padding: '12px 0' }}>Submit Feedback</button>
                </form>
          </div>
            </div>
          )}
          {/* Add similar blocks for Donations, Rewards, Feedback, etc. if needed */}
        </div>
        {/* Footer removed for clean layout */}
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(30,41,59,0.25)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ background: '#fff', borderRadius: 18, maxWidth: 480, width: '95%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(59,130,246,0.13)', padding: '2.2rem 2rem', position: 'relative' }}>
            <button onClick={() => setShowEditProfile(false)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', fontSize: 26, color: '#dc3545', cursor: 'pointer' }}>&times;</button>
            <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#1e293b', fontWeight: 700 }}>Edit Profile</h2>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <label style={{ fontWeight: 600, color: '#64748b' }}>
                Donor ID:
                <input type="text" value={editForm.donorId} readOnly style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 600, border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginTop: 4 }} />
              </label>
              <label style={{ fontWeight: 600, color: '#64748b' }}>
                Profile Picture:
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
                  style={{ marginTop: 4 }}
                />
                {editForm.profilePic && (
                  <img
                    src={editForm.profilePic}
                    alt="Preview"
                    style={{ width: 90, height: 90, borderRadius: '50%', objectFit: 'cover', marginTop: 10, border: '3px solid #dc3545', boxShadow: '0 2px 8px rgba(220,53,69,0.13)' }}
                  />
                )}
              </label>
              <label style={{ fontWeight: 600, color: '#64748b' }}>
                Name:
                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginTop: 4 }} />
              </label>
              <label style={{ fontWeight: 600, color: '#64748b' }}>
                Blood Type:
                <select value={editForm.bloodType} onChange={e => setEditForm(f => ({ ...f, bloodType: e.target.value }))} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginTop: 4 }}>
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
              <label style={{ fontWeight: 600, color: '#64748b' }}>
                Age:
                <input type="number" value={editForm.age} onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginTop: 4 }} />
              </label>
              <label style={{ fontWeight: 600, color: '#64748b' }}>
                Location:
                <input type="text" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginTop: 4 }} />
              </label>
              <label style={{ fontWeight: 600, color: '#64748b' }}>
                Email:
                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', marginTop: 4 }} />
              </label>
              <button type="button" className="dashboard-btn primary" style={{ marginTop: 10, fontSize: '1.08rem', padding: '12px 0' }}
                onClick={async () => {
                  const formData = new FormData();
                  formData.append('donorId', editForm.donorId);
                  formData.append('name', editForm.name);
                  formData.append('bloodType', editForm.bloodType);
                  formData.append('age', editForm.age);
                  formData.append('location', editForm.location);
                  formData.append('email', editForm.email);
                  if (editForm.profilePicFile) {
                    formData.append('profilePicFile', editForm.profilePicFile);
                  }
                  try {
                    const res = await fetch('http://localhost/liveonv2/backend_api/controllers/update_donor_profile.php', {
                      method: 'POST',
                      body: formData,
                      credentials: 'include',
                    });
                    const data = await res.json();
                    if (data.success) {
                      setUser(u => ({ ...u, name: editForm.name, bloodType: editForm.bloodType, age: editForm.age, location: editForm.location, email: editForm.email, profilePic: data.imagePath ? `http://localhost/liveonv2/backend_api/${data.imagePath}` : u.profilePic }));
                      setShowEditProfile(false);
                    } else {
                      alert(data.message || 'Failed to update profile');
                    }
                  } catch (err) {
                    alert('Error updating profile');
                  }
                }}
              >Save Changes</button>
            </form>
          </div>
      </div>
      )}
    </div>
  );
};

export default DonorDashboard;
