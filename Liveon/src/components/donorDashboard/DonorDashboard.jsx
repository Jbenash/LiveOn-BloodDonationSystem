import React from 'react';
import './DonorDashboard.css';

const DonorDashboard = () => {
    const user = {
        name: 'John Doe',
        bloodType: 'O+',
        age: 32,
        location: 'New York, USA',
        email: 'john.doe@example.com',
        profilePic: 'https://randomuser.me/api/portraits/men/1.jpg',
        totalDonations: 12,
        lastDonation: '2023-10-26',
        nextEligible: '2024-07-24',
        livesSaved: 36,
        points: 1500,
        rank: 'Gold Donor',
    };

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
                        <li><span className="icon logout" />Logout</li>
                    </ul>
                </nav>
            </aside>
            <div className="liveon-main">
                <header className="liveon-header">
                    <div />
                    <div className="liveon-user-info">
                        <img src={user.profilePic} alt="Profile" className="liveon-user-avatar" />
                        <span className="liveon-user-name">{user.name}</span>
                    </div>
                </header>
                <div className="liveon-content">
                    <h2 className="liveon-title">Dashboard</h2>
                    <div className="liveon-dashboard-grid">
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
                        <div className="liveon-card next-eligible">
                            <div className="next-eligible-"></div>
                            <div className="next-eligible-date">
                                <span className="calendar-icon">📅</span>
                                <span className="date-text">July 24, 2024</span>
                            </div>
                            <div className="next-eligible-desc">Your next eligible donation date</div>
                        </div>
                        <div className="liveon-card donation-stats-2row">
                            <div className="donation-stats-title-2row">Donation Statistics</div>
                            <div className="donation-stats-rows donation-stats-grid-2x2">
                                <div className="donation-stats-row">
                                    <div className="donation-stat-2col">
                                        <div className="stat-value-2row stat-blue">{user.totalDonations}</div>
                                        <div className="stat-label-2row">Total Donations</div>
                                    </div>
                                    <div className="donation-stat-2col">
                                        <div className="stat-value-2row stat-blue">{user.lastDonation}</div>
                                        <div className="stat-label-2row">Last Donation</div>
                                    </div>
                                </div>
                                <div className="donation-stats-row">
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
                        </div>
                        <div className="liveon-card reward-stats">
                            <div className="reward-title">Reward Points & Ranking</div>
                            <div className="reward-points stat-green">{user.points.toLocaleString()} Points</div>
                            <div className="reward-rank">Rank: {user.rank}</div>
                            <button className="liveon-btn">View Rewards</button>
                        </div>
                        <div className="liveon-card feedback-section">
                            <div className="feedback-title">Feedback & Reviews</div>
                            <div className="feedback-desc">Your feedback helps us improve! Share your experience with LiveOn.</div>
                            <button className="liveon-btn">Leave Feedback</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DonorDashboard;
