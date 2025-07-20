import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import logo from "../../assets/logo.svg";
import userImg from "../../assets/user.png";

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

  // Section content rendering
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <>
            {/* Top: Quick Stats */}
            <div className="dashboard-quick-stats">
              <div className="dashboard-card glassy stat-card animate-fadein">
                <div className="stat-label">Total Users</div>
                <div className="stat-value stat-blue">{stats.total_users}</div>
              </div>
              <div className="dashboard-card glassy stat-card animate-fadein">
                <div className="stat-label">Hospitals</div>
                <div className="stat-value stat-blue">{stats.total_hospitals}</div>
              </div>
              <div className="dashboard-card glassy stat-card animate-fadein">
                <div className="stat-label">Donors</div>
                <div className="stat-value stat-blue">{stats.total_donors}</div>
              </div>
              <div className="dashboard-card glassy stat-card animate-fadein">
                <div className="stat-label">Pending Requests</div>
                <div className="stat-value stat-green">{stats.pending_requests}</div>
              </div>
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
                <span className="notification-icon">🔔</span> No new notifications
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
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={hospitalSearch}
                onChange={e => setHospitalSearch(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 180, fontSize: '1rem' }}
              />
              <select
                value={locationFilter}
                onChange={e => setLocationFilter(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', minWidth: 120, fontSize: '1rem' }}
              >
                <option value="">All Locations</option>
                {uniqueLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hospital ID</th>
                    <th>Name</th>
                    <th>Location</th>
                    <th>Email</th>
                    <th>Phone</th>
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
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5">No hospitals found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="9">No donors found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
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
                    <th>Request ID</th>
                    <th>Hospital</th>
                    <th>Location</th>
                    <th>Blood Type</th>
                    <th>Units</th>
                    <th>Status</th>
                    <th>Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length > 0 ? (
                    filteredRequests.map((req) => (
                      <tr key={req.emergency_id || req.hospital_name + req.blood_type + req.required_units}>
                        <td>{req.emergency_id}</td>
                        <td>{req.hospital_name || 'Unknown'}</td>
                        <td>{req.hospital_location || 'N/A'}</td>
                        <td>{req.blood_type}</td>
                        <td>{req.required_units}</td>
                        <td><span className={`status-chip ${req.status ? req.status.toLowerCase() : ''}`}>{req.status || 'N/A'}</span></td>
                        <td>{req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="7">No requests found</td></tr>
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
                        <div style={{ fontWeight: 600, color: '#2563eb' }}>{fb.user_name} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.98em' }}>({fb.user_email})</span></div>
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
        <div className="dashboard-background">
          <div className="dashboard-grid"></div>
          <div className="dashboard-particles"></div>
        </div>
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
        <div className="dashboard-background">
          <div className="dashboard-grid"></div>
          <div className="dashboard-particles"></div>
        </div>
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
    <div className="admin-dashboard-root">
      {/* Animated Background */}
      <div className="dashboard-background">
        <div className="dashboard-grid"></div>
        <div className="dashboard-particles"></div>
      </div>
      {/* Sidebar */}
      <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div>
          <div className="dashboard-logo">
            <img src={logo} alt="LiveOn Logo" className="logo-svg" />
          </div>
          <nav className="sidebar-nav">
            <ul>
              {sections.map(section => (
                <li
                  key={section.key}
                  className={activeSection === section.key ? 'active' : ''}
                  onClick={() => {
                    setActiveSection(section.key);
                    setSidebarOpen(false); // close sidebar on mobile
                  }}
                >
                  <span className="icon">{section.icon}</span> {section.label}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <span className="icon">🚪</span> Logout
        </button>
      </aside>
      {/* Mobile sidebar toggle button */}
      <button className="sidebar-toggle" onClick={handleSidebarToggle} aria-label="Toggle sidebar">
        ☰
      </button>
      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header glassy">
          <div className="dashboard-header-row">
            <span className="dashboard-title gradient-text">
              {sections.find(s => s.key === activeSection)?.label || 'Admin Dashboard'}
            </span>
            <div className="dashboard-user-info">
              <img src={userImg} alt="User" className="dashboard-user-avatar" />
              <span className="dashboard-user-name">Welcome, Admin</span>
            </div>
          </div>
        </header>
        {/* Content Grid */}
        <div className="dashboard-content-grid">
          {renderSection()}
        </div>
      </div>
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
    </div>
  );
};

export default AdminDashboard; 