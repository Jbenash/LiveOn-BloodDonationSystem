import React, { useState, useEffect, useRef } from "react";
import "./AdminDashboard.css";
import logo from "../../assets/logo.svg";
import userImg from "../../assets/user.png";
import { FaBell } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_donors: 0,
    total_hospitals: 0,
    pending_requests: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', status: '', password: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [allHospitals, setAllHospitals] = useState([]);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [allDonors, setAllDonors] = useState([]);
  const [donorSearch, setDonorSearch] = useState('');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('');
  const [allRequests, setAllRequests] = useState([]);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('');
  const [allFeedback, setAllFeedback] = useState([]);
  const [allSuccessStories, setAllSuccessStories] = useState([]);
  const [editStory, setEditStory] = useState(null); // story being edited or null
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [storyForm, setStoryForm] = useState({ title: '', message: '' });
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState('');
  const [isAddStory, setIsAddStory] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notificationWrapperRef = useRef(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', photo: null, photoPreview: null });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [editHospital, setEditHospital] = useState(null);
  const [editHospitalForm, setEditHospitalForm] = useState({ name: '', location: '', contact_email: '', contact_phone: '' });
  const [editDonor, setEditDonor] = useState(null);
  const [editDonorForm, setEditDonorForm] = useState({ name: '', email: '', phone: '', blood_type: '', city: '', status: '' });
  const [hospitalTab, setHospitalTab] = useState('staffs'); // 'staffs' or 'mros'
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedResetRequest, setSelectedResetRequest] = useState(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState('');
  // Dummy data for MROs
  const [allMROs, setAllMROs] = useState([
    { mro_id: 'MRO001', name: 'Dr. Silva', email: 'dr.silva@hospital.com', phone: '0771234567', hospital: 'National Hospital' },
    { mro_id: 'MRO002', name: 'Dr. Perera', email: 'dr.perera@hospital.com', phone: '0779876543', hospital: 'General Hospital' }
  ]);

  // Click outside to close notification popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationWrapperRef.current && !notificationWrapperRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    // Bind the event listener
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Helper to add a notification
  const addNotification = (message, type = 'info') => {
    setNotifications(prev => [{
      message,
      type,
      timestamp: new Date().toLocaleString(),
      id: Date.now() + Math.random()
    }, ...prev]);
    setUnreadCount(c => c + 1);
  };

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost/liveonv2/backend_api/controllers/get_notifications.php', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          setUnreadCount(data.notifications.filter(n => n.status === 'unread').length);
        }
      } catch (e) { /* ignore */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mark all as read
  const markNotificationsRead = async () => {
    try {
      await fetch('http://localhost/liveonv2/backend_api/controllers/mark_notifications_read.php', { method: 'POST', credentials: 'include' });
      setUnreadCount(0);
      // Optionally refetch notifications
      const res = await fetch('http://localhost/liveonv2/backend_api/controllers/get_notifications.php', { credentials: 'include' });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (e) { /* ignore */ }
  };

  // Mark a single notification as read
  const markNotificationRead = async (notification_id) => {
    try {
      await fetch('http://localhost/liveonv2/backend_api/controllers/mark_notification_read.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_id })
      });
      // Update UI
      setNotifications(prev => prev.map(n => n.notification_id === notification_id ? { ...n, status: 'read' } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch (e) { /* ignore */ }
  };

  // Fetch password reset requests
  useEffect(() => {
    const fetchPasswordResets = async () => {
      try {
        const res = await fetch('http://localhost/liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setPasswordResetRequests(data.requests);
      } catch (e) {}
    };
    fetchPasswordResets();
    const interval = setInterval(fetchPasswordResets, 10000);
    return () => clearInterval(interval);
  }, []);

  // Show badge on bell if there are pending password resets
  const pendingPasswordResets = passwordResetRequests.length;

  // Handle click on password reset notification
  const handlePasswordResetClick = (req) => {
    setSelectedResetRequest(req);
    setAdminNewPassword(req.requested_password || '');
    setShowPasswordResetModal(true);
    setPasswordResetError('');
  };
  const closePasswordResetModal = () => {
    setShowPasswordResetModal(false);
    setSelectedResetRequest(null);
    setAdminNewPassword('');
    setPasswordResetError('');
  };
  const handleAdminPasswordChange = (e) => setAdminNewPassword(e.target.value);
  const handleAdminPasswordSave = async () => {
    if (!adminNewPassword.trim()) {
      setPasswordResetError('Password cannot be empty');
      return;
    }
    setPasswordResetLoading(true);
    try {
      const res = await fetch('http://localhost/liveonv2/backend_api/controllers/complete_password_reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: selectedResetRequest.request_id, new_password: adminNewPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        closePasswordResetModal();
        // Refresh requests
        const res2 = await fetch('http://localhost/liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
        const data2 = await res2.json();
        if (data2.success) setPasswordResetRequests(data2.requests);
      } else {
        setPasswordResetError(data.message || 'Failed to update password');
      }
    } catch (e) {
      setPasswordResetError('Network error');
    }
    setPasswordResetLoading(false);
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/liveonv2/backend_api/controllers/admin_dashboard.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admin data');
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setStats(data.stats);
      setRecentUsers(data.recent_users || []);
      setRecentRequests(data.recent_requests || []);
      setAllUsers(data.all_users || []);
      setAllHospitals(data.all_hospitals || []);
      setAllDonors(data.all_donors || []);
      setAllRequests(data.all_requests || []);
      setAllFeedback(data.all_feedback || []);
      setAllSuccessStories(data.all_success_stories || []);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    fetch('http://localhost/liveonv2/backend_api/controllers/logout.php', {
      method: 'POST',
      credentials: 'include',
    })
      .then(() => {
        window.location.href = '/';
      })
      .catch(() => {
        window.location.href = '/';
      });
  };

  // Open edit modal
  const handleEditClick = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      status: user.status || 'active',
      password: ''
    });
    setEditError('');
  };

  // Handle edit form change
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Save edit
  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch('http://localhost/liveonv2/backend_api/controllers/edit_user.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editUser.user_id,
          name: editForm.name,
          phone: editForm.phone,
          status: editForm.status,
          password: editForm.password
        })
      });
      const data = await res.json();
      if (!data.success) {
        setEditError(data.error || data.message || 'Failed to update user');
        setEditLoading(false);
        return;
      }
      setEditUser(null);
      setEditForm({ name: '', phone: '', status: '', password: '' });
      await fetchAdminData();
    } catch (err) {
      setEditError('Failed to update user');
    } finally {
      setEditLoading(false);
    }
  };

  // Hospital edit handlers
  const handleEditHospitalClick = (hospital) => {
    setEditHospital(hospital);
    setEditHospitalForm({
      name: hospital.name || '',
      location: hospital.location || '',
      contact_email: hospital.contact_email || '',
      contact_phone: hospital.contact_phone || ''
    });
  };
  const handleEditHospitalFormChange = (e) => {
    const { name, value } = e.target;
    setEditHospitalForm(prev => ({ ...prev, [name]: value }));
  };
  const handleEditHospitalSave = () => {
    // TODO: Implement backend update
    setEditHospital(null);
  };

  // Donor edit handlers
  const handleEditDonorClick = (donor) => {
    setEditDonor(donor);
    setEditDonorForm({
      name: donor.name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      blood_type: donor.blood_type || '',
      city: donor.city || '',
      status: donor.status || ''
    });
  };
  const handleEditDonorFormChange = (e) => {
    const { name, value } = e.target;
    setEditDonorForm(prev => ({ ...prev, [name]: value }));
  };
  const handleEditDonorSave = () => {
    // TODO: Implement backend update
    setEditDonor(null);
  };

  // Sidebar section definitions
  const sections = [
    { key: 'dashboard', label: 'Dashboard', icon: '🛡️' },
    { key: 'users', label: 'Users', icon: '👥' },
    { key: 'hospitals', label: 'Hospitals', icon: '🏥' },
    { key: 'donors', label: 'Donors', icon: '🩸' },
    { key: 'requests', label: 'Requests', icon: '📨' },
    { key: 'feedback', label: 'Feedback', icon: '💬' },
  ];

  // Responsive sidebar toggle (for mobile)
  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);

  // Add handlers for story modal
  const openEditStoryModal = (story) => {
    setEditStory(story);
    setStoryForm({ title: story.title, message: story.message });
    setIsAddStory(false);
    setStoryError('');
    setStoryModalOpen(true);
  };
  const openAddStoryModal = () => {
    setEditStory(null);
    setStoryForm({ title: '', message: '' });
    setIsAddStory(true);
    setStoryError('');
    setStoryModalOpen(true);
  };
  const closeStoryModal = () => {
    setStoryModalOpen(false);
    setEditStory(null);
    setStoryForm({ title: '', message: '' });
    setStoryError('');
  };
  const handleStoryFormChange = (e) => {
    const { name, value } = e.target;
    setStoryForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleStorySave = async () => {
    setStoryLoading(true);
    setStoryError('');
    // TODO: Implement API call for add/edit
    // Example: POST to /backend_api/edit_story.php or /backend_api/add_story.php
    setTimeout(() => {
      setStoryLoading(false);
      setStoryModalOpen(false);
      fetchAdminData(); // refresh data
    }, 1000);
  };

  // Open profile modal and prefill with current user info (dummy for now)
  const openProfileModal = () => {
    setProfileForm({ name: 'Admin', email: 'admin@email.com', password: '', photo: null, photoPreview: null });
    setProfileError('');
    setProfileModalOpen(true);
  };
  const closeProfileModal = () => setProfileModalOpen(false);

  // Handle profile form changes
  const handleProfileFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo' && files && files[0]) {
      setProfileForm(prev => ({ ...prev, photo: files[0], photoPreview: URL.createObjectURL(files[0]) }));
    } else {
      setProfileForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle profile save (dummy, no backend yet)
  const handleProfileSave = async () => {
    setProfileLoading(true);
    setProfileError('');
    // TODO: Implement backend call for profile update
    setTimeout(() => {
      setProfileLoading(false);
      setProfileModalOpen(false);
    }, 1000);
  };

  // Section content rendering
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            {/* Overview: Quick Stats as square cards */}
            <div className="dashboard-overview-grid">
              {[
                { label: 'Total Users', value: stats.total_users, color: 'stat-blue' },
                { label: 'Hospitals', value: stats.total_hospitals, color: 'stat-blue' },
                { label: 'Donors', value: stats.total_donors, color: 'stat-blue' },
                { label: 'Pending Requests', value: stats.pending_requests, color: 'stat-green' },
              ].map((card, idx) => (
                <div className={`overview-card square-card ${card.color}`} key={card.label}>
                  <div className="stat-label">{card.label}</div>
                  <div className="stat-value">{card.value}</div>
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
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <tr key={user.user_id || user.email}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <span className={`status-chip ${user.status}`}>{user.status}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4">No recent users</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
              <section className="dashboard-card glassy animate-fadein recent-requests-section">
                <h2 className="section-title gradient-text">Recent Emergency Requests</h2>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Hospital</th>
                      <th>Blood Type</th>
                      <th>Units</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRequests.length > 0 ? (
                      recentRequests.map((req) => (
                        <tr key={req.emergency_id || req.hospital_name + req.blood_type + req.required_units}>
                          <td>{req.hospital_name || 'Unknown'}</td>
                          <td>{req.blood_type}</td>
                          <td>{req.required_units}</td>
                          <td>
                            <span className={`status-chip ${req.status ? req.status.toLowerCase() : ''}`}>{req.status || 'N/A'}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4">No recent requests</td></tr>
                    )}
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
                <span className="notification-icon">🔔</span>
                {unreadCount > 0
                  ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`
                  : 'No new notifications'}
              </div>
            </section>
          </>
        );
      case 'users':
        // Filter users based on search and role
        const filteredUsers = allUsers.filter(user => {
          const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
          const matchesRole = roleFilter ? user.role === roleFilter : true;
          return matchesSearch && matchesRole;
        });
        return (
          <div className="dashboard-card glassy animate-fadein">
            <h2 className="section-title gradient-text">All Users</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 180, fontSize: '1rem' }}
              />
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 120, fontSize: '1rem' }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="donor">Donor</option>
                <option value="hospital">Hospital</option>
                <option value="mro">MRO</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.user_id || user.email}>
                        <td>{user.user_id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone}</td>
                        <td>{user.role}</td>
                        <td><span className={`status-chip ${user.status}`}>{user.status}</span></td>
                        <td>
                          <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em' }} onClick={() => handleEditClick(user)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Edit User Modal */}
            {editUser && (
              <div className="modal-overlay" onClick={() => setEditUser(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                  <h3>Edit User</h3>
                  <label>
                    Name:
                    <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange} />
                  </label>
                  <label>
                    Phone:
                    <input type="text" name="phone" value={editForm.phone} onChange={handleEditFormChange} />
                  </label>
                  <label>
                    Status:
                    <select name="status" value={editForm.status} onChange={handleEditFormChange}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label>
                    Password:
                    <input type="password" name="password" value={editForm.password} onChange={handleEditFormChange} placeholder="Leave blank to keep unchanged" />
                  </label>
                  {editError && <div className="error-message" style={{ color: 'red', marginTop: 8 }}>{editError}</div>}
                  <div className="modal-actions" style={{ marginTop: 16 }}>
                    <button className="dashboard-btn primary" onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                    <button className="dashboard-btn" onClick={() => setEditUser(null)} disabled={editLoading}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'hospitals':
        // Filter hospitals based on search and location
        const filteredHospitals = allHospitals.filter(hospital => {
          const matchesSearch =
            hospital.name.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
            (hospital.contact_email || '').toLowerCase().includes(hospitalSearch.toLowerCase()) ||
            (hospital.contact_phone || '').toLowerCase().includes(hospitalSearch.toLowerCase());
          const matchesLocation = locationFilter ? (hospital.location || '').toLowerCase() === locationFilter.toLowerCase() : true;
          return matchesSearch && matchesLocation;
        });
        // Get unique locations for filter dropdown
        const uniqueLocations = Array.from(new Set(allHospitals.map(h => h.location).filter(Boolean)));
        return (
          <div className="dashboard-card glassy animate-fadein">
            <h2 className="section-title gradient-text">All Hospitals</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <button className={`hospital-tab-btn${hospitalTab === 'staffs' ? ' active' : ''}`} onClick={() => setHospitalTab('staffs')}>Hospital Staffs</button>
              <button className={`hospital-tab-btn${hospitalTab === 'mros' ? ' active' : ''}`} onClick={() => setHospitalTab('mros')}>MROs</button>
            </div>
            {hospitalTab === 'staffs' ? (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Hospital ID</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.length > 0 ? (
                        filteredHospitals.map((hospital) => (
                          <tr key={hospital.hospital_id || hospital.name}>
                            <td>{hospital.hospital_id}</td>
                            <td>{hospital.name}</td>
                            <td>{hospital.location}</td>
                            <td>{hospital.contact_email}</td>
                            <td>{hospital.contact_phone}</td>
                            <td>
                              <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em' }} onClick={() => handleEditHospitalClick(hospital)}>
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6">No hospitals found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Edit Hospital Modal (existing) */}
                {editHospital && (
                  <div className="modal-overlay" onClick={() => setEditHospital(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                      <h3>Edit Hospital</h3>
                      <label>Name:<input type="text" name="name" value={editHospitalForm.name} onChange={handleEditHospitalFormChange} /></label>
                      <label>Location:<input type="text" name="location" value={editHospitalForm.location} onChange={handleEditHospitalFormChange} /></label>
                      <label>Email:<input type="email" name="contact_email" value={editHospitalForm.contact_email} onChange={handleEditHospitalFormChange} /></label>
                      <label>Phone:<input type="text" name="contact_phone" value={editHospitalForm.contact_phone} onChange={handleEditHospitalFormChange} /></label>
                      <div className="modal-actions" style={{ marginTop: 16 }}>
                        <button className="dashboard-btn primary" onClick={handleEditHospitalSave}>Save</button>
                        <button className="dashboard-btn" onClick={() => setEditHospital(null)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>MRO ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Hospital</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMROs.length > 0 ? (
                        allMROs.map((mro) => (
                          <tr key={mro.mro_id}>
                            <td>{mro.mro_id}</td>
                            <td>{mro.name}</td>
                            <td>{mro.email}</td>
                            <td>{mro.phone}</td>
                            <td>{mro.hospital}</td>
                            <td>
                              <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em' }}>Edit</button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="6">No MROs found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      case 'donors':
        // Filter donors based on search and blood type
        const filteredDonors = allDonors.filter(donor => {
          const matchesSearch =
            (donor.name || '').toLowerCase().includes(donorSearch.toLowerCase()) ||
            (donor.email || '').toLowerCase().includes(donorSearch.toLowerCase()) ||
            (donor.phone || '').toLowerCase().includes(donorSearch.toLowerCase()) ||
            (donor.city || '').toLowerCase().includes(donorSearch.toLowerCase());
          const matchesBlood = bloodTypeFilter ? donor.blood_type === bloodTypeFilter : true;
          return matchesSearch && matchesBlood;
        });
        // Get unique blood types for filter dropdown
        const uniqueBloodTypes = Array.from(new Set(allDonors.map(d => d.blood_type).filter(Boolean)));
        return (
          <div className="dashboard-card glassy animate-fadein">
            <h2 className="section-title gradient-text">All Donors</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by name, email, phone, or city..."
                value={donorSearch}
                onChange={e => setDonorSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 180, fontSize: '1rem' }}
              />
              <select
                value={bloodTypeFilter}
                onChange={e => setBloodTypeFilter(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 120, fontSize: '1rem' }}
              >
                <option value="">All Blood Types</option>
                {uniqueBloodTypes.map(bt => (
                  <option key={bt} value={bt}>{bt}</option>
                ))}
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Donor ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Blood Type</th>
                    <th>City</th>
                    <th>Status</th>
                    <th>Last Donation</th>
                    <th>Lives Saved</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.length > 0 ? (
                    filteredDonors.map((donor) => (
                      <tr key={donor.donor_id || donor.email}>
                        <td>{donor.donor_id}</td>
                        <td>{donor.name}</td>
                        <td>{donor.email}</td>
                        <td>{donor.phone}</td>
                        <td>{donor.blood_type}</td>
                        <td>{donor.city}</td>
                        <td><span className={`status-chip ${donor.status}`}>{donor.status}</span></td>
                        <td>{donor.last_donation_date || 'N/A'}</td>
                        <td>{donor.lives_saved}</td>
                        <td>
                          <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em' }} onClick={() => handleEditDonorClick(donor)}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="10">No donors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Edit Donor Modal */}
            {editDonor && (
              <div className="modal-overlay" onClick={() => setEditDonor(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                  <h3>Edit Donor</h3>
                  <label>Name:<input type="text" name="name" value={editDonorForm.name} onChange={handleEditDonorFormChange} /></label>
                  <label>Email:<input type="email" name="email" value={editDonorForm.email} onChange={handleEditDonorFormChange} /></label>
                  <label>Phone:<input type="text" name="phone" value={editDonorForm.phone} onChange={handleEditDonorFormChange} /></label>
                  <label>Blood Type:<input type="text" name="blood_type" value={editDonorForm.blood_type} onChange={handleEditDonorFormChange} /></label>
                  <label>City:<input type="text" name="city" value={editDonorForm.city} onChange={handleEditDonorFormChange} /></label>
                  <label>Status:<input type="text" name="status" value={editDonorForm.status} onChange={handleEditDonorFormChange} /></label>
                  <div className="modal-actions" style={{ marginTop: 16 }}>
                    <button className="dashboard-btn primary" onClick={handleEditDonorSave}>Save</button>
                    <button className="dashboard-btn" onClick={() => setEditDonor(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'requests':
        // Filter requests based on search and status
        const filteredRequests = allRequests.filter(req => {
          const matchesSearch =
            (req.hospital_name || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
            (req.blood_type || '').toLowerCase().includes(requestSearch.toLowerCase());
          const matchesStatus = requestStatusFilter ? req.status === requestStatusFilter : true;
          return matchesSearch && matchesStatus;
        });
        // Get unique statuses for filter dropdown
        const uniqueStatuses = Array.from(new Set(allRequests.map(r => r.status).filter(Boolean)));
        return (
          <div className="dashboard-card glassy animate-fadein">
            <h2 className="section-title gradient-text">All Requests</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by hospital or blood type..."
                value={requestSearch}
                onChange={e => setRequestSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 180, fontSize: '1rem' }}
              />
              <select
                value={requestStatusFilter}
                onChange={e => setRequestStatusFilter(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 120, fontSize: '1rem' }}
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Blood Type</th>
                    <th>Units</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr key={req.request_id}>
                        <td>{req.hospital_name || 'Unknown'}</td>
                        <td>{req.blood_type}</td>
                        <td>{req.units || 'N/A'}</td>
                        <td>{req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="4">No requests found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'feedback':
        return (
          <div className="dashboard-card glassy animate-fadein" style={{ background: 'none', boxShadow: 'none', padding: 0 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }}>
              {/* Feedback Card */}
              <div className="dashboard-card glassy animate-fadein" style={{ flex: 1, minWidth: 320, maxWidth: 500, maxHeight: 420, overflowY: 'auto' }}>
                <h2 className="section-title gradient-text">User Feedback</h2>
                {allFeedback.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {allFeedback.slice(0, 10).map(fb => (
                      <li key={fb.id || fb.user_email + fb.created_at} style={{ marginBottom: 18, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
                        <div style={{ fontWeight: 600, color: '#2563eb', marginBottom: 2 }}>
                          <span style={{ fontWeight: 400, color: '#64748b', marginRight: 6 }}>
                            From {fb.role === 'donor' ? 'Donor' : fb.role === 'hospital' ? 'Hospital' : fb.role === 'mro' ? 'MRO' : 'User'}:
                          </span>
                          {fb.role === 'donor' && (
                            <>
                              {fb.donor_name}
                              {fb.donor_hospital_name && (
                                <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.98em', marginLeft: 4 }}>
                                  ({fb.donor_hospital_name})
                                </span>
                              )}
                            </>
                          )}
                          {fb.role === 'hospital' && fb.hospital_name}
                          {fb.role === 'mro' && (
                            <>
                              {fb.hospital_name}
                              <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.98em', marginLeft: 4 }}>
                                (MRO)
                              </span>
                            </>
                          )}
                          <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.98em', marginLeft: 4 }}>
                            ({fb.user_email})
                          </span>
                        </div>
                        <div style={{ margin: '6px 0', color: '#1e293b' }}>{fb.message}</div>
                        <div style={{ fontSize: '0.92em', color: '#64748b' }}>{fb.created_at ? new Date(fb.created_at).toLocaleString() : ''}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '1.5rem', color: '#64748b' }}>No feedback found.</div>
                )}
              </div>
              {/* Success Stories Card */}
              <div className="dashboard-card glassy animate-fadein" style={{ flex: 1, minWidth: 320, maxWidth: 500, maxHeight: 420, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="section-title gradient-text">Success Stories</h2>
                  <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em' }} onClick={openAddStoryModal}>+ Add</button>
                </div>
                {allSuccessStories.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {allSuccessStories.slice(0, 10).map(story => (
                      <li key={story.story_id || story.title + story.created_at} style={{ marginBottom: 18, borderBottom: '1px solid #e5e7eb', paddingBottom: 10, cursor: 'pointer' }} onClick={() => openEditStoryModal(story)}>
                        <div style={{ fontWeight: 600, color: '#10b981' }}>{story.title}</div>
                        <div style={{ margin: '6px 0', color: '#1e293b' }}>{story.message}</div>
                        <div style={{ fontSize: '0.92em', color: '#64748b' }}>{story.created_at ? new Date(story.created_at).toLocaleString() : ''}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '1.5rem', color: '#64748b' }}>No success stories found.</div>
                )}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-root">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-root">
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={fetchAdminData} className="dashboard-btn primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ width: '100%' }}>
          <div className="logo" onClick={() => window.location.href = '/'}>
            <img src={logo} alt="LiveOn Logo" style={{ height: 120, width: 'auto', display: 'block' }} />
          </div>
          <nav>
            <ul>
              {sections.map(section => (
                <li
                  key={section.key}
                  className={activeSection === section.key ? 'active' : ''}
                  onClick={() => setActiveSection(section.key)}
                >
                  <span className="sidebar-label">{section.label}</span>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span style={{ fontSize: 20, display: 'flex', alignItems: 'center' }}>&#9099;</span> Logout
        </button>
      </aside>
      {/* Main Content */}
      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-section dashboard-header">
          <h1>Admin Dashboard</h1>
          <div className="dashboard-user-info">
            {/* Notification Bell */}
            <div className="notification-bell-wrapper" ref={notificationWrapperRef}>
              <button className="notification-bell" onClick={() => { setShowNotifications(v => !v); if (!showNotifications) markNotificationsRead(); }}>
                <FaBell size={22} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                {pendingPasswordResets > 0 && <span className="notification-badge" style={{ right: '-28px', background: '#f59e42' }}>{pendingPasswordResets}</span>}
              </button>
              {showNotifications && (
                <div className="notification-dropdown" ref={notificationWrapperRef} onClick={e => e.stopPropagation()}>
                  <div className="notification-dropdown-header">Notifications</div>
                  {notifications.filter((n, idx, arr) => n.type !== 'password_reset' || arr.findIndex(x => x.type === 'password_reset' && x.message === n.message) === idx).map((n) => (
                    n.type === 'password_reset' ? (
                      <div
                        key={n.notification_id}
                        className="notification-item info"
                        style={{ background: '#fef9c3', color: '#b45309', cursor: 'pointer' }}
                        onClick={async () => {
                          // Find the matching password reset request
                          const req = passwordResetRequests.find(r => n.message.includes(r.email) && n.status === 'unread');
                          if (req) {
                            handlePasswordResetClick(req);
                          } else {
                            setSelectedNotification(n);
                          }
                        }}
                      >
                        <div className="notification-message">{n.message}</div>
                        <div className="notification-timestamp">Click to review</div>
                      </div>
                    ) : (
                      <div
                        key={n.notification_id}
                        className="notification-item"
                        onClick={() => setSelectedNotification(n)}
                      >
                        <div className="notification-message">{n.message}</div>
                        <div className="notification-timestamp">{n.timestamp}</div>
                      </div>
                    )
                  ))}
                  {notifications.length === 0 && (
                    <div className="notification-empty">No notifications</div>
                  )}
                </div>
              )}
            </div>
            <img src={profileForm.photoPreview || userImg} alt="User" className="dashboard-user-avatar" style={{ cursor: 'pointer' }} onClick={openProfileModal} />
            <span className="dashboard-user-name" style={{ cursor: 'pointer' }} onClick={openProfileModal}>Welcome, Admin</span>
          </div>
        </div>
        {/* Content Grid */}
        <div className="dashboard-content-grid">
          {renderSection()}
        </div>
      </main>
      {/* Modals (edit user, story, etc.) */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3>Edit User</h3>
            <label>
              Name:
              <input type="text" name="name" value={editForm.name} onChange={handleEditFormChange} />
            </label>
            <label>
              Phone:
              <input type="text" name="phone" value={editForm.phone} onChange={handleEditFormChange} />
            </label>
            <label>
              Status:
              <select name="status" value={editForm.status} onChange={handleEditFormChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label>
              Password:
              <input type="password" name="password" value={editForm.password} onChange={handleEditFormChange} placeholder="Leave blank to keep unchanged" />
            </label>
            {editError && <div className="error-message" style={{ color: 'red', marginTop: 8 }}>{editError}</div>}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn primary" onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
              <button className="dashboard-btn" onClick={() => setEditUser(null)} disabled={editLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {storyModalOpen && (
        <div className="modal-overlay" onClick={closeStoryModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3>{isAddStory ? 'Add Success Story' : 'Edit Success Story'}</h3>
            <label>
              Title:
              <input type="text" name="title" value={storyForm.title} onChange={handleStoryFormChange} />
            </label>
            <label>
              Message:
              <textarea name="message" value={storyForm.message} onChange={handleStoryFormChange} rows={5} />
            </label>
            {storyError && <div className="error-message" style={{ color: 'red', marginTop: 8 }}>{storyError}</div>}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn primary" onClick={handleStorySave} disabled={storyLoading}>{storyLoading ? 'Saving...' : 'Save'}</button>
              <button className="dashboard-btn cancel" onClick={closeStoryModal} disabled={storyLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {profileModalOpen && (
        <div className="modal-overlay profile-edit-modal" onClick={closeProfileModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3>Edit Profile</h3>
            <label>
              Name:
              <input type="text" name="name" value={profileForm.name} onChange={handleProfileFormChange} />
            </label>
            <label>
              Email:
              <input type="email" name="email" value={profileForm.email} onChange={handleProfileFormChange} />
            </label>
            <label>
              Password:
              <input type="password" name="password" value={profileForm.password} onChange={handleProfileFormChange} placeholder="Leave blank to keep unchanged" />
            </label>
            <label>
              Profile Photo:
              <input type="file" name="photo" accept="image/*" onChange={handleProfileFormChange} />
            </label>
            {profileForm.photoPreview && (
              <img src={profileForm.photoPreview} alt="Preview" className="avatar-preview" />
            )}
            {profileError && <div className="error-message" style={{ color: 'red', marginTop: 8 }}>{profileError}</div>}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn primary" onClick={handleProfileSave} disabled={profileLoading}>{profileLoading ? 'Saving...' : 'Save'}</button>
              <button className="dashboard-btn" onClick={closeProfileModal} disabled={profileLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {showPasswordResetModal && selectedResetRequest && (
        <div className="modal-overlay" onClick={closePasswordResetModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3>Password Reset Request</h3>
            <div style={{ marginBottom: 10 }}><b>User:</b> {selectedResetRequest.name} ({selectedResetRequest.email})</div>
            <div style={{ marginBottom: 10, color: '#64748b', fontSize: '0.98em' }}>
              Wants to change their password to: <b>{selectedResetRequest.requested_password}</b>
            </div>
            <label>
              New Password:
              <input
                type="text"
                value={adminNewPassword}
                onChange={handleAdminPasswordChange}
                placeholder="Enter new password"
              />
            </label>
            {passwordResetError && <div className="error-message" style={{ color: 'red', marginTop: 8 }}>{passwordResetError}</div>}
            <div className="modal-actions" style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button className="dashboard-btn primary" onClick={handleAdminPasswordSave} disabled={passwordResetLoading}>{passwordResetLoading ? 'Saving...' : 'Accept'}</button>
              <button className="dashboard-btn" onClick={async () => {
                setPasswordResetLoading(true);
                setPasswordResetError('');
                try {
                  const res = await fetch('http://localhost/liveonv2/backend_api/controllers/complete_password_reset.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ request_id: selectedResetRequest.request_id, reject: true }),
                    credentials: 'include'
                  });
                  const data = await res.json();
                  if (data.success) {
                    closePasswordResetModal();
                    // Refresh requests
                    const res2 = await fetch('http://localhost/liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
                    const data2 = await res2.json();
                    if (data2.success) setPasswordResetRequests(data2.requests);
                  } else {
                    setPasswordResetError(data.message || 'Failed to reject request');
                  }
                } catch (e) {
                  setPasswordResetError('Network error');
                }
                setPasswordResetLoading(false);
              }} disabled={passwordResetLoading}>Reject</button>
              <button className="dashboard-btn" onClick={closePasswordResetModal} disabled={passwordResetLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {/* Notification Details Modal */}
      {selectedNotification && (() => {
        if (selectedNotification.type === 'password_reset') {
          const req = passwordResetRequests.find(r => selectedNotification.message.includes(r.email) && r.status === 'pending');
          if (req) {
            // Show only User ID, User Role, and new password
            return (
              <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                  <h3>Password Reset Request</h3>
                  <div style={{ marginBottom: 10 }}><b>User ID:</b> {req.user_id}</div>
                  <div style={{ marginBottom: 10 }}><b>User Role:</b> {req.role || 'N/A'}</div>
                  <div style={{ marginBottom: 10 }}><b>New Password:</b> {req.requested_password}</div>
                  <div className="modal-actions" style={{ marginTop: 16 }}>
                    <button className="dashboard-btn" onClick={() => setSelectedNotification(null)}>Close</button>
                  </div>
                </div>
              </div>
            );
          }
        }
        return (
          <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <h3>Notification Details</h3>
              <div style={{ marginBottom: 10 }}><strong>Message:</strong> {selectedNotification.message}</div>
              <div style={{ marginBottom: 10 }}><strong>Type:</strong> {selectedNotification.type || ''}</div>
              <div style={{ marginBottom: 10 }}><strong>Status:</strong> {selectedNotification.status || ''}</div>
              <div style={{ marginBottom: 10 }}><strong>User ID:</strong> {selectedNotification.user_id || ''}</div>
              <div style={{ marginBottom: 10 }}><strong>Timestamp:</strong> {selectedNotification.timestamp || ''}</div>
              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button className="dashboard-btn" onClick={() => setSelectedNotification(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default AdminDashboard; 