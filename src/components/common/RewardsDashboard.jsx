import React, { useState, useEffect } from 'react';
import './RewardsDashboard.css';

const RewardsDashboard = ({ donorId }) => {
  const [rewardsData, setRewardsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {

    if (donorId) {
      fetchRewardsData();
    } else {
      setLoading(false);
      setError('Donor ID is required');
    }
  }, [donorId]);

  const fetchRewardsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost/Liveonv2/backend_api/controllers/get_donor_rewards.php?donor_id=${donorId}`);
      const data = await response.json();

      if (data.success) {
        setRewardsData(data.data);
      } else {
        setError(data.error || 'Failed to fetch rewards data');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rewards-loading">
        <div className="loading-spinner"></div>
        <p>Loading your rewards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rewards-error">
        <p>Error: {error}</p>
        <button onClick={fetchRewardsData}>Retry</button>
      </div>
    );
  }

  if (!rewardsData) {
    return <div className="rewards-error">No rewards data available</div>;
  }

  const {
    current_tier,
    next_tier,
    progress_to_next_tier,
    donation_count,
    rewards_data,
    achievements = [],
    partner_rewards = [],
    points_history = []
  } = rewardsData;

  return (
    <div className="rewards-dashboard">
      {/* Header Section */}
      <div className="rewards-header">
        <h2>🏆 LiveOn Rewards</h2>
        <p>Track your progress and unlock amazing rewards!</p>
      </div>

      {/* Current Tier Card */}
      <div className="tier-card">
        <div className="tier-info">
          <div className="tier-badge">
            <span className="badge-icon">{current_tier?.badge || '🥉'}</span>
            <h3>{current_tier?.name || 'Bronze Donor'}</h3>
          </div>
          <div className="tier-stats">
            <div className="stat">
              <span className="stat-label">Donations</span>
              <span className="stat-value">{donation_count}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Points</span>
              <span className="stat-value">{rewards_data?.current_points || 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Streak</span>
              <span className="stat-value">{rewards_data?.current_streak || 0}</span>
            </div>
          </div>
        </div>

        {next_tier && (
          <div className="progress-section">
            <div className="progress-info">
              <span>Progress to {next_tier.name}</span>
              <span>{progress_to_next_tier}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress_to_next_tier}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {next_tier.min_donations - donation_count} more donations to reach {next_tier.name}
            </p>
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="achievements-section">
        <h3>🎖️ Achievements</h3>
        <div className="achievements-grid">
          {(achievements || []).map((achievement) => (
            <div key={achievement.id} className="achievement-card">
              <div className="achievement-icon">
                {achievement.badge_icon}
              </div>
              <div className="achievement-info">
                <h4>{achievement.achievement_name}</h4>
                <p>{achievement.description}</p>
                <span className="points-reward">+{achievement.points_reward} points</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner Rewards Section */}
      <div className="partner-rewards-section">
        <h3>🎁 Available Rewards</h3>
        <div className="rewards-grid">
          {(partner_rewards || []).map((reward) => (
            <div key={reward.id} className="reward-card">
              <div className="reward-icon">
                {reward.partner_type === 'hospital' && '🏥'}
                {reward.partner_type === 'restaurant' && '🍽️'}
                {reward.partner_type === 'hotel' && '🏨'}
                {reward.partner_type === 'travel' && '✈️'}
                {reward.partner_type === 'health' && '💊'}
              </div>
              <div className="reward-info">
                <h4>{reward.partner_name}</h4>
                <p>{reward.reward_description}</p>
                {reward.discount_percentage && (
                  <span className="discount">{reward.discount_percentage}% off</span>
                )}
                <span className="points-required">{reward.points_required} points</span>
              </div>
              <button
                className="redeem-btn"
                disabled={(rewards_data?.current_points || 0) < reward.points_required}
              >
                {(rewards_data?.current_points || 0) >= reward.points_required ? 'Redeem' : 'Not Enough Points'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Points History Section */}
      <div className="points-history-section">
        <h3>📊 Points History</h3>
        <div className="history-list">
          {(points_history || []).length > 0 ? (
            (points_history || []).map((transaction, index) => (
              <div key={index} className="history-item">
                <div className="history-info">
                  <span className="transaction-reason">{transaction.reason}</span>
                  <span className="transaction-date">
                    {new Date(transaction.donation_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="transaction-points">
                  <span className="points-earned">+{transaction.points_earned}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-history">
              <p>No donation history yet. Start donating to earn points!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RewardsDashboard; 