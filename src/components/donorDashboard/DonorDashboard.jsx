import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorDashboard.css';
import logo from '../../assets/logo.svg';

const DonorDashboard = () => {
  const [user, setUser] = useState(null);
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
        <div className="dashboard-logo" onClick={() => navigate('/')}> 
          <img src={logo} alt="LiveOn Logo" className="logo-svg" />
        </div>
        <nav>
          <ul>
            <li className="active"><span className="icon dashboard" />Dashboard</li>
            <li><span className="icon profile" />Profile</li>
            <li><span className="icon donations" />Donations</li>
            <li><span className="icon rewards" />Rewards</li>
            <li><span className="icon feedback" />Feedback</li>
            <li onClick={handleLogout}><span className="icon logout" />Logout</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        <header className="dashboard-header glassy">
          <div className="dashboard-header-row">
            <span className="dashboard-title gradient-text">Donor Dashboard</span>
            <div className="dashboard-user-info">
              <img src={user.profilePic} alt="Profile" className="dashboard-user-avatar" />
              <span className="dashboard-user-name">Welcome, {user.name}</span>
            </div>
          </div>
        </header>
        <div className="dashboard-content">
          <div className="dashboard-stats-grid">
            {/* Profile Card */}
            <div className="dashboard-card glassy profile-summary animate-fadein">
              <div className="profile-summary-title gradient-text">Profile Summary</div>
              <div className="profile-summary-details">
                <img src={user.profilePic} alt="Profile" className="profile-avatar" />
                <div className="profile-summary-text">
                  <div><span className="label">Name:</span> {user.name}</div>
                  <div><span className="label">Blood Type:</span> {user.bloodType}</div>
                  <div><span className="label">Age:</span> {user.age}</div>
                  <div><span className="label">Location:</span> {user.location}</div>
                  <div><span className="label">Email:</span> {user.email}</div>
                </div>
              </div>
              <button className="dashboard-btn primary">Edit Profile</button>
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
                  <div className="stat-value stat-blue">{user.lastDonation}</div>
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
        </div>
        <footer className="dashboard-footer">
          <div className="footer-content">
            <div className="footer-logo">
              <img src={logo} alt="LiveOn Logo" className="logo-svg" />
              <span>LiveOn</span>
            </div>
            <p>Revolutionizing blood donation through technology</p>
            <div className="footer-social-links">
              <span className="social-icon">📱</span>
              <span className="social-icon">💬</span>
              <span className="social-icon">📷</span>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-line"></div>
            <div className="footer-copyright">
              <span>© 2024 LiveOn. All rights reserved.</span>
              <span>Built with ❤️ for humanity</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DonorDashboard;
