import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorDashboard.css';
import logo from '../../assets/logo.svg';

const DonorDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost/liveonv2/backend_api/donor_dashboard.php', {
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

  const handleLogout = () => {
    fetch("http://localhost/liveonv2/backend_api/logout.php", {
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
    <div className="donor-dashboard-root">
      {/* Animated Background */}
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
              <li className={activeSection === 'dashboard' ? 'active' : ''} onClick={() => setActiveSection('dashboard')}><span className="icon dashboard" />Dashboard</li>
              <li className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}><span className="icon profile" />Profile</li>
              <li className={activeSection === 'donations' ? 'active' : ''} onClick={() => setActiveSection('donations')}><span className="icon donations" />Donations</li>
              <li className={activeSection === 'rewards' ? 'active' : ''} onClick={() => setActiveSection('rewards')}><span className="icon rewards" />Rewards</li>
              <li className={activeSection === 'feedback' ? 'active' : ''} onClick={() => setActiveSection('feedback')}><span className="icon feedback" />Feedback</li>
              <li onClick={handleLogout}><span className="icon logout" />Logout</li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header glassy">
          <div className="dashboard-header-row">
            <span className="dashboard-title gradient-text">Donor Dashboard</span>
            <div className="dashboard-user-info">
              <img src={user.profilePic} alt="Profile" className="dashboard-user-avatar" style={{ cursor: 'pointer' }} onClick={() => setActiveSection('profile')} />
              <span className="dashboard-user-name">Welcome, {user.name}</span>
            </div>
          </div>
        </header>
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
                      <div className="stat-value stat-blue">{user.totalDonations}</div>
                      <div className="stat-label">Total Donations</div>
                    </div>
                    <div className="donation-stat">
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
                      <div className="stat-value stat-blue">{user.nextEligible}</div>
                      <div className="stat-label">Next Eligible</div>
                    </div>
                    <div className="donation-stat">
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
            <div style={{ maxWidth: 700, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
              {/* Total Donations */}
              <div className="dashboard-card glassy donation-stat-card animate-fadein" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ background: '#dc3545', color: '#fff', borderRadius: '50%', width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 2px 8px rgba(220,53,69,0.13)' }}>🩸</span>
                <div>
                  <div className="donation-stats-title gradient-text">Total Donations</div>
                  <div className="stat-value stat-blue" style={{ fontSize: '2.2rem', marginTop: 10 }}>{user.totalDonations}</div>
                </div>
              </div>
              {/* Last Donation */}
              <div className="dashboard-card glassy donation-stat-card animate-fadein" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 2px 8px rgba(59,130,246,0.13)' }}>📅</span>
                <div>
                  <div className="donation-stats-title gradient-text">Last Donation</div>
                  <div className="stat-value stat-blue" style={{ fontSize: '2.2rem', marginTop: 10 }}>
                    {
                      user.lastDonation ?
                        (new Date(user.lastDonation).toString() !== 'Invalid Date'
                          ? new Date(user.lastDonation).toLocaleDateString()
                          : user.lastDonation.slice(0, 10))
                        : 'N/A'
                    }
                  </div>
                </div>
              </div>
              {/* Next Eligible */}
              <div className="dashboard-card glassy donation-stat-card animate-fadein" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ background: '#f59e42', color: '#fff', borderRadius: '50%', width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 2px 8px rgba(245,158,66,0.13)' }}>⏳</span>
                <div>
                  <div className="donation-stats-title gradient-text">Next Eligible</div>
                  <div className="stat-value stat-blue" style={{ fontSize: '2.2rem', marginTop: 10 }}>{user.nextEligible}</div>
                </div>
              </div>
              {/* Lives Saved */}
              <div className="dashboard-card glassy donation-stat-card animate-fadein" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 2px 8px rgba(16,185,129,0.13)' }}>❤️</span>
                <div>
                  <div className="donation-stats-title gradient-text">Lives Saved</div>
                  <div className="stat-value stat-green" style={{ fontSize: '2.2rem', marginTop: 10 }}>{user.livesSaved}</div>
                </div>
              </div>
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
                      const res = await fetch('http://localhost/liveonv2/backend_api/submit_feedback.php', {
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
                    const res = await fetch('http://localhost/liveonv2/backend_api/update_donor_profile.php', {
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
