import React, { useState, useEffect, useRef } from "react";
import { toast } from 'sonner';
import "./AdminDashboard.css";
import logo from "../../assets/logo.svg";
import userImg from "../../assets/user.png";
import { FaBell, FaEnvelope } from 'react-icons/fa';
import { Avatar } from 'flowbite-react';

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
  // System activities state (for notification bell)
  const [systemActivities, setSystemActivities] = useState([]);
  const [showSystemActivities, setShowSystemActivities] = useState(false);
  const [systemActivitiesUnreadCount, setSystemActivitiesUnreadCount] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const systemActivitiesWrapperRef = useRef(null);
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
  const [allMROs, setAllMROs] = useState([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [donorToRemove, setDonorToRemove] = useState(null);
  const [showRemoveDonorDialog, setShowRemoveDonorDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [showRemoveUserDialog, setShowRemoveUserDialog] = useState(false);
  const [hospitalToRemove, setHospitalToRemove] = useState(null);
  const [showRemoveHospitalDialog, setShowRemoveHospitalDialog] = useState(false);
  const [mroToRemove, setMroToRemove] = useState(null);
  const [showRemoveMroDialog, setShowRemoveMroDialog] = useState(false);
  const [feedbackToAction, setFeedbackToAction] = useState(null);
  const [showFeedbackActionDialog, setShowFeedbackActionDialog] = useState(false);
  const [feedbackActionType, setFeedbackActionType] = useState(''); // 'approve' or 'reject'

  // Click outside to close notification popup
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationWrapperRef.current && !notificationWrapperRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (systemActivitiesWrapperRef.current && !systemActivitiesWrapperRef.current.contains(event.target)) {
        setShowSystemActivities(false);
      }
      if (mailWrapperRef.current && !mailWrapperRef.current.contains(event.target)) {
        setShowMailMessages(false);
      }
    }
    // Bind the event listener
    if (showNotifications || showSystemActivities || showMailMessages) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, showSystemActivities, showMailMessages]);

  // Helper to add a notification
  const addNotification = (message, type = 'info') => {
    // This function is kept for backward compatibility but not used in the new system
    console.log('Notification:', message, type);
  };

  // Fetch notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('http://localhost/liveonv2/backend_api/controllers/get_notifications.php', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications);
          // Only count non-password-reset notifications for the general unread count
          setUnreadCount(data.notifications.filter(n => n.status === 'unread' && n.type !== 'password_reset').length);
        }
      } catch (e) { /* ignore */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // Mark all as read
  const markNotificationsRead = async () => {
    // Fetch admin messages
    const fetchAdminMessages = async () => {
      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/get_admin_messages.php', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          setAdminMessages(data.messages);
          setMailUnreadCount(data.unread_count);
        } else {
          console.error('Failed to fetch admin messages:', data.error);
        }
      } catch (error) {
        console.error('Error fetching admin messages:', error);
      }
    };

    // Mark message as read
    const markMessageAsRead = async (messageId) => {
      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/mark_message_read.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message_id: messageId })
        });
        const data = await response.json();

        if (data.success) {
          // Update the message status locally
          setAdminMessages(prev => prev.map(msg =>
            msg.id == messageId ? { ...msg, status: 'read' } : msg
          ));
          setMailUnreadCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    };

    // Fetch notifications from backend (keeping for backward compatibility)
    useEffect(() => {
      // Old notification system - now replaced by system activities
      // Keeping this for any legacy code that might still reference it
    }, []);

    // Mark all as read (keeping for backward compatibility)
    const markNotificationsRead = async () => {
      // Old notification system - now replaced by system activities
      console.log('Mark notifications as read - deprecated');
    };

    // Mark a single notification as read (keeping for backward compatibility)
    const markNotificationRead = async (notification_id) => {
      // Old notification system - now replaced by system activities
      console.log('Mark notification as read - deprecated');
    };

    // Fetch password reset requests
    useEffect(() => {
      const fetchPasswordResets = async () => {
        try {
          const res = await fetch('http://localhost/liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
          const data = await res.json();
          if (data.success) setPasswordResetRequests(data.requests);
        } catch (e) { }
      };
      fetchPasswordResets();
      const interval = setInterval(fetchPasswordResets, 10000);
      return () => clearInterval(interval);
    }, []);

    // Show badge on bell if there are pending password resets
    // Only count password reset requests that are NOT already in the notifications list
    const passwordResetNotifications = notifications.filter(n => n.type === 'password_reset');
    const pendingPasswordResets = Math.max(0, passwordResetRequests.length - passwordResetNotifications.length);

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

    // Fetch system activities
    const fetchSystemActivities = async () => {
      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/get_system_activities.php', {
          credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
          setSystemActivities(data.activities);
          setSystemActivitiesUnreadCount(data.unread_count);
        } else {
          console.error('Failed to fetch system activities:', data.error);
        }
      } catch (error) {
        console.error('Error fetching system activities:', error);
      }
    };

    useEffect(() => {
      fetchAdminData();
      fetchMROs();
      fetchAdminMessages(); // Fetch messages on mount
      fetchSystemActivities(); // Fetch system activities on mount
    }, []);

    const fetchMROs = async () => {
      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/get_all_mros.php', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setAllMROs(data.mros || []);
        } else {
          console.error('Failed to fetch MROs:', data.message);
        }
      } catch (error) {
        console.error('Error fetching MROs:', error);
      }
    };

    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/admin_dashboard.php', {
          credentials: 'include'
        });

        // Check if response is ok
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;

          try {
            errorData = JSON.parse(errorText);
          } catch (parseError) {
            // If it's not JSON, it might be HTML error
            console.error('Non-JSON response:', errorText);
            throw new Error(`Server returned ${response.status}: ${response.statusText}. Response was not valid JSON.`);
          }

          throw new Error(errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          toast.error(data.error);
          return;
        }

        // Check if we have the expected data structure
        if (!data.success && !data.stats) {
          setError('Invalid response format from server');
          toast.error('Invalid response format from server');
          return;
        }

        // Extract data from the response
        const responseData = data.data || data;

        setStats(responseData.stats || {});
        setRecentUsers(responseData.recent_users || []);
        setRecentRequests(responseData.recent_requests || []);
        setAllUsers(responseData.all_users || []);
        setAllHospitals(responseData.all_hospitals || []);
        setAllDonors(responseData.all_donors || []);
        setAllRequests(responseData.all_requests || []);
        setAllFeedback(responseData.all_feedback || []);
        setAllSuccessStories(responseData.all_success_stories || []);

      } catch (err) {
        console.error('Error fetching admin data:', err);

        let errorMessage = 'Failed to load dashboard data';

        if (err.message.includes('401')) {
          errorMessage = 'Please log in as admin to access this dashboard';
          // Redirect to login
          window.location.href = '/?login=true';
        } else if (err.message.includes('403')) {
          errorMessage = 'Access denied. Admin privileges required.';
          // Redirect to home
          window.location.href = '/';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else if (err.message.includes('JSON')) {
          errorMessage = 'Server returned invalid response. Please check your connection.';
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // Use custom dialog for logout
    const handleLogout = () => {
      setShowLogoutDialog(true);
    };
    const confirmLogout = () => {
      setShowLogoutDialog(false);
      fetch("http://localhost/liveonv2/backend_api/controllers/logout.php", {
        method: 'POST',
        credentials: 'include'
      })
        .then(() => {
          window.location.href = '/?login=true';
        })
        .catch(() => {
          window.location.href = '/?login=true';
        });
    };
    const cancelLogout = () => setShowLogoutDialog(false);

    // Use custom dialog for logo click
    const handleLogoClick = () => {
      setShowLogoDialog(true);
    };
    const confirmLogo = () => {
      setShowLogoDialog(false);
      window.location.href = '/';
    };
    const cancelLogo = () => setShowLogoDialog(false);

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
      if (window.confirm('Are you sure you want to save these changes to the user profile?')) {
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

      // Phone validation for hospital contact phone
      if (name === 'contact_phone') {
        const phoneRegex = /^[0-9]*$/;
        if (phoneRegex.test(value)) {
          setEditHospitalForm(prev => ({ ...prev, [name]: value }));
        } else {
          toast.error('Phone number can only contain numbers');
        }
      } else {
        setEditHospitalForm(prev => ({ ...prev, [name]: value }));
      }
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

      // Phone validation for donor phone
      if (name === 'phone') {
        const phoneRegex = /^[0-9]*$/;
        if (phoneRegex.test(value)) {
          setEditDonorForm(prev => ({ ...prev, [name]: value }));
        } else {
          toast.error('Phone number can only contain numbers');
        }
      } else {
        setEditDonorForm(prev => ({ ...prev, [name]: value }));
      }
    };
    const handleEditDonorSave = async () => {
      if (!editDonor) return;

      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/admin_update_donor.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donorId: editDonor.donor_id,
            name: editDonorForm.name,
            email: editDonorForm.email,
            phone: editDonorForm.phone,
            blood_type: editDonorForm.blood_type,
            city: editDonorForm.city,
            status: editDonorForm.status
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Donor information updated successfully');
          setEditDonor(null);
          // Refresh donor data
          fetchAdminData();
        } else {
          toast.error(data.message || 'Failed to update donor information');
        }
      } catch (error) {
        console.error('Error updating donor:', error);
        toast.error('Error updating donor information');
      }
    };

    const handleRemoveDonorClick = (donor) => {
      setDonorToRemove(donor);
      setShowRemoveDonorDialog(true);
    };

    const confirmRemoveDonor = async () => {
      if (!donorToRemove) return;

      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/remove_donor.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            donorId: donorToRemove.donor_id,
            userId: donorToRemove.user_id
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Donor removed successfully');
          // Remove the donor from the local state
          setAllDonors(prev => prev.filter(d => d.donor_id !== donorToRemove.donor_id));
          setShowRemoveDonorDialog(false);
          setDonorToRemove(null);
        } else {
          toast.error(data.message || 'Failed to remove donor');
        }
      } catch (error) {
        console.error('Error removing donor:', error);
        toast.error('Error removing donor');
      }
    };

    const cancelRemoveDonor = () => {
      setShowRemoveDonorDialog(false);
      setDonorToRemove(null);
    };

    const handleRemoveUserClick = (user) => {
      setUserToRemove(user);
      setShowRemoveUserDialog(true);
    };

    const confirmRemoveUser = async () => {
      if (!userToRemove) return;

      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/remove_user.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userToRemove.user_id
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          toast.success('User removed successfully');
          // Remove the user from the local state
          setAllUsers(prev => prev.filter(u => u.user_id !== userToRemove.user_id));
          setShowRemoveUserDialog(false);
          setUserToRemove(null);
        } else {
          toast.error(data.message || 'Failed to remove user');
        }
      } catch (error) {
        console.error('Error removing user:', error);
        toast.error('Error removing user');
      }
    };

    const cancelRemoveUser = () => {
      setShowRemoveUserDialog(false);
      setUserToRemove(null);
    };

    const handleRemoveHospitalClick = (hospital) => {
      setHospitalToRemove(hospital);
      setShowRemoveHospitalDialog(true);
    };

    const confirmRemoveHospital = async () => {
      if (!hospitalToRemove) return;

      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/remove_hospital.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId: hospitalToRemove.hospital_id
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          toast.success('Hospital removed successfully');
          // Remove the hospital from the local state
          setAllHospitals(prev => prev.filter(h => h.hospital_id !== hospitalToRemove.hospital_id));
          setShowRemoveHospitalDialog(false);
          setHospitalToRemove(null);
        } else {
          toast.error(data.message || 'Failed to remove hospital');
        }
      } catch (error) {
        console.error('Error removing hospital:', error);
        toast.error('Error removing hospital');
      }
    };

    const cancelRemoveHospital = () => {
      setShowRemoveHospitalDialog(false);
      setHospitalToRemove(null);
    };

    const handleRemoveMroClick = (mro) => {
      setMroToRemove(mro);
      setShowRemoveMroDialog(true);
    };

    const confirmRemoveMro = async () => {
      if (!mroToRemove) return;

      try {
        const response = await fetch('http://localhost/liveonv2/backend_api/controllers/remove_mro.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mroId: mroToRemove.mro_id
          }),
          credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
          toast.success('MRO officer removed successfully');
          setAllMROs(prev => prev.filter(m => m.mro_id !== mroToRemove.mro_id));
          setShowRemoveMroDialog(false);
          setMroToRemove(null);
          // Refresh MRO data
          fetchMROs();
        } else {
          toast.error(data.message || 'Failed to remove MRO officer');
        }
      } catch (error) {
        console.error('Error removing MRO officer:', error);
        toast.error('Error removing MRO officer');
      }
    };

    const cancelRemoveMro = () => {
      setShowRemoveMroDialog(false);
      setMroToRemove(null);
    };

    const handleFeedbackActionClick = (feedback, action) => {
      setFeedbackToAction(feedback);
      setFeedbackActionType(action);
      setShowFeedbackActionDialog(true);
    };

    const confirmFeedbackAction = async () => {
      if (!feedbackToAction || !feedbackActionType) return;

      try {
        const res = await fetch('http://localhost/liveonv2/backend_api/controllers/approve_feedback.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feedbackId: feedbackToAction.feedback_id,
            action: feedbackActionType
          }),
          credentials: 'include'
        });

        const data = await res.json();
        if (data.success) {
          toast.success(data.message);
          // Refresh feedback data
          fetchAdminData();
        } else {
          toast.error(data.message || 'Failed to ' + feedbackActionType + ' feedback');
        }
      } catch (err) {
        toast.error('Error processing feedback action');
      }

      setShowFeedbackActionDialog(false);
      setFeedbackToAction(null);
      setFeedbackActionType('');
    };

    const cancelFeedbackAction = () => {
      setShowFeedbackActionDialog(false);
      setFeedbackToAction(null);
      setFeedbackActionType('');
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
      if (window.confirm('Are you sure you want to save this success story?')) {
        setStoryLoading(true);
        setStoryError('');
        // TODO: Implement API call for add/edit
        // Example: POST to /backend_api/edit_story.php or /backend_api/add_story.php
        setTimeout(() => {
          setStoryLoading(false);
          setStoryModalOpen(false);
          fetchAdminData(); // refresh data
        }, 1000);
      }
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
                  { label: 'Hospitals', value: stats.total_hospitals, color: 'stat-green' },
                  { label: 'Donors', value: stats.total_donors, color: 'stat-purple' },
                  { label: 'Pending Requests', value: stats.pending_requests, color: 'stat-orange' },
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
                          <td style={{ minWidth: '200px', whiteSpace: 'nowrap', padding: '12px 16px' }}>
                            <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em', marginRight: '8px' }} onClick={() => handleEditClick(user)}>
                              Edit
                            </button>
                            <button
                              className="dashboard-btn danger"
                              onClick={() => handleRemoveUserClick(user)}
                            >
                              Remove
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
                              <td style={{ minWidth: '200px', whiteSpace: 'nowrap', padding: '12px 16px' }}>
                                <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em', marginRight: '8px' }} onClick={() => handleEditHospitalClick(hospital)}>
                                  Edit
                                </button>
                                <button
                                  className="dashboard-btn danger"
                                  onClick={() => handleRemoveHospitalClick(hospital)}
                                >
                                  Remove
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
                              <td>{mro.hospital_name || 'N/A'}</td>
                              <td style={{ minWidth: '200px', whiteSpace: 'nowrap', padding: '12px 16px' }}>
                                <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em', marginRight: '8px' }}>Edit</button>
                                <button
                                  className="dashboard-btn danger"
                                  onClick={() => handleRemoveMroClick(mro)}
                                >
                                  Remove
                                </button>
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
                            <button className="dashboard-btn primary" style={{ padding: '4px 12px', fontSize: '0.95em', marginRight: '8px' }} onClick={() => handleEditDonorClick(donor)}>
                              Edit
                            </button>
                            <button className="dashboard-btn danger" style={{ padding: '4px 12px', fontSize: '0.95em' }} onClick={() => handleRemoveDonorClick(donor)}>
                              Remove
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
                  <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, color: '#1e293b' }}>Edit Donor</h3>
                      <button
                        onClick={() => setEditDonor(null)}
                        style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                      >
                        &times;
                      </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleEditDonorSave(); }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div className="form-field">
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Name</label>
                          <input
                            type="text"
                            name="name"
                            value={editDonorForm.name}
                            onChange={handleEditDonorFormChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '14px' }}
                            placeholder="Enter donor name"
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={editDonorForm.email}
                            onChange={handleEditDonorFormChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '14px' }}
                            placeholder="Enter email address"
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Phone</label>
                          <input
                            type="text"
                            name="phone"
                            value={editDonorForm.phone}
                            onChange={handleEditDonorFormChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '14px' }}
                            placeholder="Enter phone number"
                            maxLength="10"
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Blood Type</label>
                          <select
                            name="blood_type"
                            value={editDonorForm.blood_type}
                            onChange={handleEditDonorFormChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
                            required
                          >
                            <option value="">Select Blood Type</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>

                        <div className="form-field">
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>City</label>
                          <input
                            type="text"
                            name="city"
                            value={editDonorForm.city}
                            onChange={handleEditDonorFormChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '14px' }}
                            placeholder="Enter city"
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151' }}>Status</label>
                          <select
                            name="status"
                            value={editDonorForm.status}
                            onChange={handleEditDonorFormChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: '14px', backgroundColor: '#ffffff' }}
                            required
                          >
                            <option value="">Select Status</option>
                            <option value="available">Available</option>
                            <option value="not available">Not Available</option>
                          </select>
                        </div>
                      </div>

                      <div className="modal-actions" style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="dashboard-btn"
                          onClick={() => setEditDonor(null)}
                          style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#ffffff', color: '#64748b', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="dashboard-btn primary"
                          style={{ padding: '10px 20px', borderRadius: 8, background: '#2563eb', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
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
                        <li key={fb.feedback_id || fb.user_email + fb.created_at} style={{ marginBottom: 18, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                            <div style={{ fontWeight: 600, color: '#2563eb' }}>
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
                            <div style={{ display: 'flex', gap: 8 }}>
                              {fb.approved === 0 && (
                                <>
                                  <button
                                    onClick={() => handleFeedbackActionClick(fb, 'approve')}
                                    style={{
                                      background: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 4,
                                      padding: '4px 8px',
                                      fontSize: '0.8em',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={() => handleFeedbackActionClick(fb, 'reject')}
                                    style={{
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 4,
                                      padding: '4px 8px',
                                      fontSize: '0.8em',
                                      cursor: 'pointer',
                                      fontWeight: 600
                                    }}
                                  >
                                    ✗ Reject
                                  </button>
                                </>
                              )}
                              {fb.approved === 1 && (
                                <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8em' }}>✓ Approved</span>
                              )}
                            </div>
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
          <LoadingSpinner
            size="60"
            stroke="4"
            speed="1"
            color="#2563eb"
            text="Loading dashboard..."
            className="full-page"
          />
        </div>
      );
    }

    if (error) {
      return (
        <ErrorDisplay
          error={error}
          onRetry={fetchAdminData}
          title="Failed to load dashboard data"
          buttonText="Retry"
        />
      );
    }

    return (
      <div className="admin-dashboard-container">
        {/* Sidebar */}
        <aside className="sidebar">
          <div style={{ width: '100%' }}>
            <div className="logo" onClick={handleLogoClick}>
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
              {/* System Activities Bell */}
              <div className="notification-bell-wrapper" ref={systemActivitiesWrapperRef}>
                <button className="notification-bell" onClick={() => { setShowSystemActivities(v => !v); }}>
                  <FaBell size={22} />
                  {systemActivitiesUnreadCount > 0 && <span className="notification-badge">{systemActivitiesUnreadCount}</span>}
                  {pendingPasswordResets > 0 && <span className="notification-badge" style={{ right: '-28px', background: '#f59e42' }}>{pendingPasswordResets}</span>}
                </button>
                {showSystemActivities && (
                  <div className="notification-dropdown" ref={systemActivitiesWrapperRef} onClick={e => e.stopPropagation()}>
                    <div className="notification-dropdown-header">System Activities</div>
                    {systemActivities.length > 0 ? (
                      systemActivities.map((activity) => (
                        <div
                          key={activity.id}
                          className="notification-item"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          <div className="notification-message">{activity.message}</div>
                          <div className="notification-timestamp">{activity.timestamp ? new Date(activity.timestamp).toLocaleString() : ''}</div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-empty">No recent activities</div>
                    )}
                  </div>
                )}
              </div>
              {/* Mail Messages */}
              <div className="mail-messages-wrapper" ref={mailWrapperRef}>
                <button className="mail-messages-bell" onClick={() => { setShowMailMessages(v => !v); }}>
                  <FaEnvelope size={22} />
                  {mailUnreadCount > 0 && <span className="notification-badge">{mailUnreadCount}</span>}
                </button>
                {showMailMessages && (
                  <div className="mail-messages-dropdown" ref={mailWrapperRef} onClick={e => e.stopPropagation()}>
                    <div className="mail-messages-dropdown-header">Messages & Requests</div>
                    {adminMessages.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {adminMessages.map(msg => (
                          <li key={msg.id} style={{ marginBottom: 10, padding: '10px 15px', borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }} onClick={() => { setSelectedMessage(msg); markMessageAsRead(msg.id); }}>
                            <div style={{ fontWeight: 600, color: '#2563eb' }}>{msg.subject}</div>
                            <div style={{ margin: '4px 0', color: '#1e293b' }}>{msg.message}</div>
                            <div style={{ fontSize: '0.92em', color: '#64748b' }}>{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ padding: '1.5rem', color: '#64748b' }}>No messages.</div>
                    )}
                  </div>
                )}
              </div>
              <Avatar
                img={profileForm.photoPreview || null}
                alt="User"
                size="md"
                rounded
                placeholderInitials="AD"
                className="custom-avatar"
                style={{
                  cursor: 'pointer',
                  backgroundColor: '#6b7280',
                  color: '#ffffff',
                  border: '3px solid #6b7280'
                }}
                onClick={openProfileModal}
              />
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
            <div className="modal-content edit-user-modal" onClick={e => e.stopPropagation()}>
              <div className="edit-user-header">
                <h3>Edit User Profile</h3>
                <p className="edit-user-subtitle">Update user information and settings</p>
              </div>

              <div className="edit-user-form">
                <div className="form-section">
                  <h4 className="form-section-title">Basic Information</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Full Name</span>
                        <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="form-input"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Phone Number</span>
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditFormChange}
                        className="form-input"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4 className="form-section-title">Account Settings</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Account Status</span>
                        <span className="required">*</span>
                      </label>
                      <select
                        name="status"
                        value={editForm.status}
                        onChange={handleEditFormChange}
                        className="form-select"
                      >
                        <option value="active">🟢 Active</option>
                        <option value="inactive">🔴 Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">New Password</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={editForm.password}
                        onChange={handleEditFormChange}
                        className="form-input"
                        placeholder="Leave blank to keep current password"
                      />
                      <small className="form-hint">Minimum 6 characters recommended</small>
                    </div>
                  </div>
                </div>

                {editError && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {editError}
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="dashboard-btn secondary"
                  onClick={() => setEditUser(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  className="dashboard-btn primary"
                  onClick={handleEditSave}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <LoadingSpinner
                      size="16"
                      stroke="2"
                      color="#ffffff"
                      text="Saving..."
                      className="button"
                    />
                  ) : (
                    'Save Changes'
                  )}
                </button>
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
                <div className="custom-file-input">
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleProfileFormChange}
                    id="profile-photo-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-photo-input" className="file-input-button">
                    <span className="file-input-icon">📷</span>
                    <span className="file-input-text">Choose Photo</span>
                  </label>
                  <span className="file-input-filename">
                    {profileForm.photo ? profileForm.photo.name : 'No file chosen'}
                  </span>
                </div>
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
                  if (window.confirm('Are you sure you want to reject this password reset request? This action cannot be undone.')) {
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
                  }
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
        <ConfirmDialog
          open={showLogoutDialog}
          title="Confirm Logout"
          message="Are you sure you want to logout?"
          onConfirm={confirmLogout}
          onCancel={cancelLogout}
          confirmText="Logout"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={showLogoDialog}
          title="Confirm Navigation"
          message="Are you sure you want to go to the home page? You will be logged out."
          onConfirm={confirmLogo}
          onCancel={cancelLogo}
          confirmText="Go Home"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={showRemoveDonorDialog}
          title="Remove Donor"
          message={`Are you sure you want to remove donor ${donorToRemove?.name} (${donorToRemove?.donor_id}) from the system? This will delete all donor records but keep the user account with inactive status.`}
          onConfirm={confirmRemoveDonor}
          onCancel={cancelRemoveDonor}
          confirmText="Remove"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={showRemoveUserDialog}
          title="Remove User"
          message={`Are you sure you want to remove user ${userToRemove?.name} (${userToRemove?.user_id}) from the system? This will delete all user-related records and set the user status to inactive.`}
          onConfirm={confirmRemoveUser}
          onCancel={cancelRemoveUser}
          confirmText="Remove"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={showRemoveHospitalDialog}
          title="Remove Hospital"
          message={`Are you sure you want to remove hospital ${hospitalToRemove?.name} (${hospitalToRemove?.hospital_id}) from the system? This will delete all hospital-related records including blood inventory, donations, and requests.`}
          onConfirm={confirmRemoveHospital}
          onCancel={cancelRemoveHospital}
          confirmText="Remove"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={showRemoveMroDialog}
          title="Remove MRO Officer"
          message={`Are you sure you want to remove MRO officer ${mroToRemove?.name} (${mroToRemove?.mro_id}) from the system? This will delete all MRO-related records and set the associated user account to inactive.`}
          onConfirm={confirmRemoveMro}
          onCancel={cancelRemoveMro}
          confirmText="Remove"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={showFeedbackActionDialog}
          title={`${feedbackActionType === 'approve' ? 'Approve' : 'Reject'} Feedback`}
          message={`Are you sure you want to ${feedbackActionType} this feedback from ${feedbackToAction?.donor_name || feedbackToAction?.hospital_name || 'User'}? ${feedbackActionType === 'approve' ? 'This feedback will be visible on the homepage.' : 'This feedback will not be displayed on the homepage.'}`}
          onConfirm={confirmFeedbackAction}
          onCancel={cancelFeedbackAction}
          confirmText={feedbackActionType === 'approve' ? 'Approve' : 'Reject'}
          cancelText="Cancel"
        />
        {/* Mail Message Details Modal */}
        {selectedMessage && (
          <div className="modal-overlay" onClick={() => setSelectedMessage(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <h3>Message Details</h3>
              <div style={{ marginBottom: 10 }}><strong>Subject:</strong> {selectedMessage.subject}</div>
              <div style={{ marginBottom: 10 }}><strong>Message:</strong> {selectedMessage.message}</div>
              <div style={{ marginBottom: 10 }}><strong>From:</strong> {selectedMessage.sender_name} ({selectedMessage.sender_email})</div>
              <div style={{ marginBottom: 10 }}><strong>Sent At:</strong> {selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ''}</div>
              <div style={{ marginBottom: 10 }}><strong>Status:</strong> {selectedMessage.status || 'Unread'}</div>
              <div className="modal-actions" style={{ marginTop: 16 }}>
                <button className="dashboard-btn" onClick={() => setSelectedMessage(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
        {/* System Activity Details Modal */}
        {selectedActivity && (
          <div className="modal-overlay" onClick={() => setSelectedActivity(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
              <h3>System Activity Details</h3>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Type:</strong> {selectedActivity.type.replace('_', ' ').toUpperCase()}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Message:</strong> {selectedActivity.message}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Timestamp:</strong> {selectedActivity.timestamp ? new Date(selectedActivity.timestamp).toLocaleString() : 'N/A'}
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div >
    );
  };

  export default AdminDashboard; 