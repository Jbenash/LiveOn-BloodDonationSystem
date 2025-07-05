import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import userImg from '../../assets/user.png';

const AdminDashboard = () => {
  const navigate = useNavigate();
  return (
    <div className="admin-dashboard-root">
      {/* Sidebar */}
      <aside className="admin-sidebar simple">
        <div className="sidebar-header">
          <span className="sidebar-logo" onClick={() => navigate('/')} style={{cursor: 'pointer'}}>LiveOn</span>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li className="active">
              <span className="sidebar-icon">&#x1F5C3;</span>
              Dashboard
            </li>
            <li>
              <span className="sidebar-icon">&#x1F464;</span>
              User Management
            </li>
            <li className="sidebar-subitem">Donors</li>
            <li className="sidebar-subitem">Hospitals</li>
            <li className="sidebar-subitem">MROs</li>
            <li className="sidebar-subitem">Admins</li>
            <li>
              <span className="sidebar-icon">&#x1F4D1;</span>
              Activity Logs
            </li>
            <li>
              <span className="sidebar-icon">&#x1F4A7;</span>
              Blood Requests
            </li>
            <li>
              <span className="sidebar-icon">&#x1F514;</span>
              Notifications & Reminders
            </li>
            <li>
              <span className="sidebar-icon">&#x1F512;</span>
              Security & Access
            </li>
          </ul>
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-bottom">
          <div className="sidebar-logout">Logout</div>
          <div className="sidebar-user">
            <img src={userImg} alt="Admin User" className="sidebar-user-img" />
            <div>
              <div className="sidebar-user-name">Admin User</div>
              <div className="sidebar-user-role">Super Admin</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-main-header">
          <h1>Dashboard Overview</h1>
          <input className="admin-search" type="text" placeholder="Search dashboard..." />
        </div>
        <div className="admin-cards-row">
          <div className="admin-card">
            <div className="admin-card-header">
              <span>Total Donors</span>
              <span className="admin-card-icon admin-card-icon-blue">👥</span>
            </div>
            <div className="admin-card-value">1,234</div>
            <div className="admin-card-desc">Last updated 5 mins ago</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-header">
              <span>Active Hospitals</span>
              <span className="admin-card-icon admin-card-icon-blue">➕</span>
            </div>
            <div className="admin-card-value">45</div>
            <div className="admin-card-desc">Currently active</div>
          </div>
          <div className="admin-card">
            <div className="admin-card-header">
              <span>Pending Requests</span>
              <span className="admin-card-icon admin-card-icon-dot" />
            </div>
            <div className="admin-card-value">12</div>
            <div className="admin-card-desc">Requires immediate attention</div>
          </div>
        </div>
        <div className="admin-cards-row">
          <div className="admin-card">
            <div className="admin-card-header">
              <span>Blood Units Available</span>
              <span className="admin-card-icon admin-card-icon-dot" />
            </div>
            <div className="admin-card-value">567</div>
            <div className="admin-card-desc">Across all centers</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard; 