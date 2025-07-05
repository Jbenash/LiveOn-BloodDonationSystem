import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DonorDashboard.css';

const DonorDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost/Liveonv2/backend_api/donor_dashboard.php', {
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
    fetch("http://localhost/Liveonv2/backend_api/logout.php", {
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
    <div className="liveon-root">
      <aside className="liveon-sidebar">
        <div className="liveon-logo">LiveOn</div>
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

      <div className="liveon-main">
        <header className="liveon-header">
          <div className="liveon-user-info">
            <img src={user.profilePic} alt="Profile" className="liveon-user-avatar" />
            <span className="liveon-user-name">{user.name}</span>
          </div>
        </header>
        <div className="liveon-content">
          <h2 className="liveon-title">Dashboard</h2>
          <div className="liveon-dashboard-grid">
            {/* Profile Card */}
            <div className="liveon-card profile-summary">
              <div className="profile-summary-title">Donor Profile Summary</div>
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
              <button className="liveon-btn">Edit Profile</button>
            </div>

            {/* Donation Stats */}
            <div className="liveon-card donation-stats-2row">
              <div className="donation-stats-title-2row">Donation Statistics</div>
              <div className="donation-stats-grid-2x2">
                <div className="donation-stat-2col">
                  <div className="stat-value-2row stat-blue">{user.totalDonations}</div>
                  <div className="stat-label-2row">Total Donations</div>
                </div>
                <div className="donation-stat-2col">
                  <div className="stat-value-2row stat-blue">{user.lastDonation}</div>
                  <div className="stat-label-2row">Last Donation</div>
                </div>
                <div className="donation-stat-2col">
                  <div className="stat-value-2row stat-blue">{user.nextEligible}</div>
                  <div className="stat-label-2row">Next Eligible</div>
                </div>
                <div className="donation-stat-2col">
                  <div className="stat-value-2row stat-green">{user.livesSaved}</div>
                  <div className="stat-label-2row">Lives Saved</div>
                </div>
              </div>
            </div>

            {/* Reward Section */}
            <div className="liveon-card reward-stats">
              <div className="reward-title">Reward Points & Ranking</div>
              <div className="reward-points stat-green">{user.points} Points</div>
              <div className="reward-rank">Rank: {user.rank}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDashboard;
