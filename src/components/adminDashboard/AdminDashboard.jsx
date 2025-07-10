import React from "react";
import "./AdminDashboard.css";
import logo from "../../assets/logo.svg";
import userImg from "../../assets/user.png";

const quickStats = [
  { label: "Users", value: 1200 },
  { label: "Hospitals", value: 32 },
  { label: "Donors", value: 540 },
  { label: "Pending Requests", value: 8 }
];

const recentUsers = [
  { name: "Alice Smith", email: "alice@example.com", role: "Donor", date: "2024-06-01" },
  { name: "Bob Lee", email: "bob@example.com", role: "Hospital", date: "2024-06-01" },
  { name: "Carol White", email: "carol@example.com", role: "Donor", date: "2024-05-31" }
];

const recentRequests = [
  { id: 101, type: "Blood", status: "Pending", date: "2024-06-01" },
  { id: 102, type: "Plasma", status: "Fulfilled", date: "2024-05-31" },
  { id: 103, type: "Platelets", status: "Pending", date: "2024-05-30" }
];

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard-root">
      {/* Animated Background */}
      <div className="dashboard-background">
        <div className="dashboard-grid"></div>
        <div className="dashboard-particles"></div>
      </div>
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo">
          <img src={logo} alt="LiveOn Logo" className="logo-svg" />
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className="active"><span className="icon">🛡️</span> Dashboard</li>
            <li><span className="icon">👥</span> Users</li>
            <li><span className="icon">🏥</span> Hospitals</li>
            <li><span className="icon">🩸</span> Donors</li>
            <li><span className="icon">📨</span> Requests</li>
            <li><span className="icon">📊</span> Reports</li>
            <li><span className="icon">⚙️</span> Settings</li>
            <li><span className="icon">🚪</span> Logout</li>
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header glassy">
          <div className="dashboard-header-row">
            <span className="dashboard-title gradient-text">Admin Dashboard</span>
            <div className="dashboard-user-info">
              <img src={userImg} alt="User" className="dashboard-user-avatar" />
              <span className="dashboard-user-name">Welcome, Admin</span>
            </div>
          </div>
        </header>
        {/* Content Grid */}
        <div className="dashboard-content-grid">
          {/* Top: Quick Stats */}
          <div className="dashboard-quick-stats">
            {quickStats.map((stat, idx) => (
              <div className="dashboard-card glassy stat-card animate-fadein" key={idx}>
                <div className="stat-label">{stat.label}</div>
                <div className={`stat-value ${stat.label === 'Pending Requests' ? 'stat-green' : 'stat-blue'}`}>{stat.value}</div>
              </div>
            ))}
          </div>
          {/* Middle: Recent Users & Requests */}
          <div className="dashboard-middle-row">
            <section className="dashboard-card glassy animate-fadein recent-users-section">
              <h2 className="section-title gradient-text">Recent User Registrations</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((user, idx) => (
                    <tr key={idx}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="dashboard-card glassy animate-fadein recent-requests-section">
              <h2 className="section-title gradient-text">Recent Requests</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req, idx) => (
                    <tr key={idx}>
                      <td>{req.id}</td>
                      <td>{req.type}</td>
                      <td><span className={`status-chip ${req.status.toLowerCase()}`}>{req.status}</span></td>
                      <td>{req.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
          {/* Bottom: System Health/Notifications */}
          <section className="dashboard-card glassy animate-fadein system-health-section">
            <h3 className="section-title gradient-text">System Health</h3>
            <div className="system-health-content">
              <span className="health-indicator healthy"></span> All systems operational
            </div>
            <div className="system-notification">
              <span className="notification-icon">🔔</span> No new notifications
            </div>
          </section>
        </div>
        {/* Footer */}
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

export default AdminDashboard; 