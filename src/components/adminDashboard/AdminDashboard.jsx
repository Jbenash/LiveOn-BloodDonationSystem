import React, { useState, useEffect, useRef } from "react";
import { toast } from 'sonner';
import "./AdminDashboard.css";
import logo from "../../assets/logo.svg";
import userImg from "../../assets/user.png";
import { FaBell, FaEnvelope } from 'react-icons/fa';
import { Avatar } from 'flowbite-react';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorDisplay from '../common/ErrorDisplay';
import ConfirmDialog from '../common/ConfirmDialog';
import DonorReminders from './DonorReminders';

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
  const [editForm, setEditForm] = useState({ name: '', phone: '', status: '' });
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
  const [showMailMessages, setShowMailMessages] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mailUnreadCount, setMailUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notificationWrapperRef = useRef(null);
  const mailWrapperRef = useRef(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', password: '', photo: null, photoPreview: null });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [editHospital, setEditHospital] = useState(null);
  const [editHospitalForm, setEditHospitalForm] = useState({ name: '', location: '', contact_email: '', contact_phone: '' });
  const [editHospitalLoading, setEditHospitalLoading] = useState(false);
  const [editHospitalError, setEditHospitalError] = useState('');
  const [editDonor, setEditDonor] = useState(null);
  const [editDonorForm, setEditDonorForm] = useState({ name: '', email: '', phone: '', blood_type: '', city: '', status: '' });
  const [editDonorLoading, setEditDonorLoading] = useState(false);
  const [editDonorError, setEditDonorError] = useState('');
  const [hospitalTab, setHospitalTab] = useState('staffs'); // 'staffs' or 'mros'
  const [donorTab, setDonorTab] = useState('donors'); // 'donors' or 'reminders'
  const [passwordResetRequests, setPasswordResetRequests] = useState([]);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [selectedResetRequest, setSelectedResetRequest] = useState(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [passwordResetError, setPasswordResetError] = useState('');
  const [allMROs, setAllMROs] = useState([]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [isLogoutTriggered, setIsLogoutTriggered] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [donorToRemove, setDonorToRemove] = useState(null);
  const [showRemoveDonorDialog, setShowRemoveDonorDialog] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [showRemoveUserDialog, setShowRemoveUserDialog] = useState(false);
  const [hospitalToRemove, setHospitalToRemove] = useState(null);
  const [showRemoveHospitalDialog, setShowRemoveHospitalDialog] = useState(false);
  const [mroToRemove, setMroToRemove] = useState(null);
  const [showRemoveMroDialog, setShowRemoveMroDialog] = useState(false);

  // MRO Edit Modal States
  const [editMro, setEditMro] = useState(null);
  const [editMroForm, setEditMroForm] = useState({ name: '', email: '', phone: '', hospital_id: '' });
  const [editMroLoading, setEditMroLoading] = useState(false);
  const [editMroError, setEditMroError] = useState('');

  const [feedbackToAction, setFeedbackToAction] = useState(null);
  const [showFeedbackActionDialog, setShowFeedbackActionDialog] = useState(false);
  const [feedbackActionType, setFeedbackActionType] = useState(''); // 'approve' or 'reject'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [adminMessages, setAdminMessages] = useState([]);

  // Confirmation dialog states for save operations
  const [showUserSaveConfirm, setShowUserSaveConfirm] = useState(false);
  const [showMroSaveConfirm, setShowMroSaveConfirm] = useState(false);
  const [showHospitalSaveConfirm, setShowHospitalSaveConfirm] = useState(false);
  const [showDonorSaveConfirm, setShowDonorSaveConfirm] = useState(false);
  const [showStorySaveConfirm, setShowStorySaveConfirm] = useState(false);
  const [showPasswordResetRejectConfirm, setShowPasswordResetRejectConfirm] = useState(false);
  const [pendingPasswordResetAction, setPendingPasswordResetAction] = useState(null);

  // Requests section tab state
  const [requestsTab, setRequestsTab] = useState('blood-requests'); // 'blood-requests' or 'password-resets'

  // Detail modal states
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);
  const [selectedHospitalDetail, setSelectedHospitalDetail] = useState(null);
  const [selectedDonorDetail, setSelectedDonorDetail] = useState(null);
  const [selectedMroDetail, setSelectedMroDetail] = useState(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);

  // Browser back button handling
  useEffect(() => {
    const handlePopState = (e) => {
      // Prevent browser back button from working normally
      e.preventDefault();
      // Only show logout dialog if not already showing and not triggered by button click
      if (!showLogoutDialog && !isLogoutTriggered) {
        setShowLogoutDialog(true);
      }
      // Push the current state back to prevent navigation
      window.history.pushState(null, null, window.location.pathname);
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState);

    // Push current state to prevent immediate back navigation
    window.history.pushState(null, null, window.location.pathname);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [showLogoutDialog]);

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
  };



  // Mark message as read
  const markMessageAsRead = async (messageId) => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/mark_message_read.php', {
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

        // Update the unread count locally
        setMailUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('Failed to mark message as read:', data.message);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Mark all messages as read
  const markAllMessagesAsRead = async () => {
    try {
      // Get all unread message IDs
      const unreadMessageIds = adminMessages
        .filter(msg => msg.status === 'unread')
        .map(msg => msg.id);

      if (unreadMessageIds.length === 0) return;

      // Mark all unread messages as read in the database
      const promises = unreadMessageIds.map(messageId =>
        fetch('http://localhost/Liveonv2/backend_api/controllers/mark_message_read.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message_id: messageId })
        })
      );

      await Promise.all(promises);

      // Update all messages to read status locally
      setAdminMessages(prev => prev.map(msg => ({ ...msg, status: 'read' })));

      // Reset unread count to 0
      setMailUnreadCount(0);
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };

  // Mark all as read (backward compatibility)
  const markNotificationsRead = async () => {
    // Old notification system - now replaced by system activities
  };

  // Mark a single notification as read (backward compatibility)
  const markNotificationRead = async (notification_id) => {
    // Old notification system - now replaced by system activities
  };

  // Fetch password reset requests
  useEffect(() => {
    const fetchPasswordResets = async () => {
      try {
        const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
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
      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/complete_password_reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: selectedResetRequest.request_id, new_password: adminNewPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        closePasswordResetModal();
        // Refresh requests
        const res2 = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
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

  // Handle password reset approval (direct action without modal)
  const handlePasswordReset = async (requestId, requestedPassword) => {
    setPasswordResetLoading(true);
    try {
      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/complete_password_reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, new_password: requestedPassword }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset approved successfully');
        // Refresh requests
        const res2 = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
        const data2 = await res2.json();
        if (data2.success) setPasswordResetRequests(data2.requests);
      } else {
        toast.error(data.message || 'Failed to approve password reset');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  // Handle password reset rejection (direct action)
  const handleRejectPasswordReset = async (requestId) => {
    setPasswordResetLoading(true);
    try {
      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/complete_password_reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, reject: true }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset request rejected');
        // Refresh requests
        const res2 = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_password_reset_requests.php', { credentials: 'include' });
        const data2 = await res2.json();
        if (data2.success) setPasswordResetRequests(data2.requests);
      } else {
        toast.error(data.message || 'Failed to reject password reset');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setPasswordResetLoading(false);
    }
  };

  // Fetch system activities
  const fetchSystemActivities = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_system_activities.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or user not logged in - redirect to login
          throw new Error('SESSION_EXPIRED');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setSystemActivities(data.activities);
        setSystemActivitiesUnreadCount(data.unread_count);
      } else {
        console.error('Failed to fetch system activities:', data.error);
      }
    } catch (error) {
      console.error('Error fetching system activities:', error);

      if (error.message === 'SESSION_EXPIRED') {
        // Redirect to home page to show login modal
        window.location.href = '/';
        return;
      }
    }
  };

  const fetchAdminMessages = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_admin_messages.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or user not logged in - redirect to login
          throw new Error('SESSION_EXPIRED');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setAdminMessages(data.messages || []);
        setMailUnreadCount(data.unread_count || 0);
      } else {
        console.error('Failed to fetch admin messages:', data.error);
      }
    } catch (error) {
      console.error('Error fetching admin messages:', error);

      if (error.message === 'SESSION_EXPIRED') {
        // Redirect to home page to show login modal
        window.location.href = '/';
        return;
      }
    }
  };

  // Fetch notifications from notifications table
  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_notifications.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or user not logged in - redirect to login
          throw new Error('SESSION_EXPIRED');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } else {
        console.error('Failed to fetch notifications:', data.error);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);

      if (error.message === 'SESSION_EXPIRED') {
        // Redirect to home page to show login modal
        window.location.href = '/';
        return;
      }
    }
  };

  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/mark_notification_read.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notification_id: notificationId })
      });
      const data = await response.json();

      if (data.success) {
        // Update the notification status locally
        setNotifications(prev => prev.map(notif =>
          notif.notification_id == notificationId ? { ...notif, status: 'read' } : notif
        ));

        // Update the unread count locally
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error('Failed to mark notification as read:', data.message);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      // Get all unread notification IDs
      const unreadNotificationIds = notifications
        .filter(notif => notif.status === 'unread')
        .map(notif => notif.notification_id);

      if (unreadNotificationIds.length === 0) return;

      // Mark all unread notifications as read in the database
      const promises = unreadNotificationIds.map(notificationId =>
        fetch('http://localhost/Liveonv2/backend_api/controllers/mark_notification_read.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ notification_id: notificationId })
        })
      );

      await Promise.all(promises);

      // Update all notifications to read status locally
      setNotifications(prev => prev.map(notif => ({ ...notif, status: 'read' })));

      // Reset unread count to 0
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in before fetching data
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if we have a valid session
        const sessionResponse = await fetch('http://localhost/Liveonv2/backend_api/controllers/check_session.php', {
          credentials: 'include'
        });

        if (!sessionResponse.ok) {
          // Session check failed - redirect to login
          window.location.href = '/?login=true';
          return;
        }

        const sessionData = await sessionResponse.json();

        // Check if user is logged in and is admin
        if (!sessionData.session_status.session_started ||
          !sessionData.session_status.is_admin ||
          sessionData.session_status.user_id === 'NOT_SET') {
          // Not logged in or not admin - redirect to login
          window.location.href = '/?login=true';
          return;
        }

        // User is logged in and is admin - fetch data
        await fetchAdminData();
        await fetchMROs();
        await fetchAdminMessages();
        await fetchSystemActivities();
        await fetchNotifications();

        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setError('Authentication check failed. Please log in.');
        setLoading(false);
        // Redirect to login on error
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
      }
    };

    checkAuthAndFetchData();

    // Set up periodic refresh for admin messages and system activities
    const messageInterval = setInterval(fetchAdminMessages, 30000); // Refresh every 30 seconds
    const activitiesInterval = setInterval(fetchSystemActivities, 30000); // Refresh every 30 seconds
    const notificationsInterval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds

    // Add a timeout to prevent loading spinner from getting stuck
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached - forcing loading to false');
      setLoading(false);
    }, 10000); // 10 seconds timeout

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(messageInterval);
      clearInterval(activitiesInterval);
      clearInterval(notificationsInterval);
      clearTimeout(loadingTimeout);
    };
  }, []);

  const fetchMROs = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/get_all_mros.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or user not logged in - redirect to login
          throw new Error('SESSION_EXPIRED');
        }
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

      if (error.message === 'SESSION_EXPIRED') {
        // Redirect to home page to show login modal
        window.location.href = '/';
        return;
      }
    }
  };

  const fetchAdminData = async () => {
    try {
      setError(null);

      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/admin_dashboard.php', {
        credentials: 'include'
      });

      // Check if response is ok
      if (!response.ok) {
        if (response.status === 401) {
          // Session expired or user not logged in - redirect to login
          throw new Error('SESSION_EXPIRED');
        }

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

      if (err.message === 'SESSION_EXPIRED') {
        // Redirect to home page to show login modal
        window.location.href = '/';
        return;
      }

      let errorMessage = 'Failed to load dashboard data';

      if (err.message.includes('403')) {
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
  const handleLogout = (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Set flag to prevent browser back button handler from triggering
    setIsLogoutTriggered(true);
    // Only show dialog if not already showing
    if (!showLogoutDialog) {
      setShowLogoutDialog(true);
    }
    // Reset flag after a short delay
    setTimeout(() => setIsLogoutTriggered(false), 100);
  };
  const confirmLogout = () => {
    console.log('confirmLogout called');
    setShowLogoutDialog(false);
    setIsLoggingOut(true); // Set logout flag to prevent API calls
    setIsLogoutTriggered(true); // Prevent back button handler from triggering
    setError(null); // Clear any error state during logout
    setLoading(false); // Clear loading state

    // Add a timeout to prevent logout spinner from getting stuck
    const logoutTimeout = setTimeout(() => {
      console.log('Logout timeout reached - forcing navigation');
      setIsLoggingOut(false);
      setIsLogoutTriggered(false);
      window.location.href = '/';
    }, 5000); // 5 seconds timeout

    // Call logout API first
    fetch("http://localhost/Liveonv2/backend_api/controllers/logout.php", {
      method: 'POST',
      credentials: 'include'
    })
      .then((response) => {
        // Check if logout was successful
        if (response.ok) {
          console.log('Logout successful');
        } else {
          console.log('Logout API returned error, but continuing with navigation');
        }
      })
      .catch((error) => {
        console.log('Logout API error, but continuing with navigation:', error);
      })
      .finally(() => {
        console.log('Logout finally block - clearing state');
        clearTimeout(logoutTimeout); // Clear the timeout since we're handling it manually

        // Clear all state immediately
        setStats({});
        setAllUsers([]);
        setAllHospitals([]);
        setAllDonors([]);
        setAllMROs([]);
        setNotifications([]);
        setSystemActivities([]);
        setAdminMessages([]);
        setPasswordResetRequests([]);
        setError(null);
        setLoading(false);

        // Add a longer delay to ensure session is properly destroyed and prevent race conditions
        setTimeout(() => {
          try {
            console.log('Logout timeout - resetting flags and navigating');
            // Reset logout flags before navigation
            setIsLoggingOut(false);
            setIsLogoutTriggered(false);

            // Navigate to home page
            window.location.href = '/';
          } catch (navError) {
            console.log('Navigation error, using window.location:', navError);
            // Fallback to window.location if navigate fails
            window.location.href = '/';
          }
        }, 300); // Increased delay to 300ms to prevent race conditions
      });
  };
  const cancelLogout = () => setShowLogoutDialog(false);

  // Use custom dialog for logo click
  const handleLogoClick = () => {
    setShowLogoDialog(true);
  };
  const confirmLogo = async () => {
    console.log('confirmLogo called');
    setShowLogoDialog(false);

    // Actually logout the user instead of just navigating
    setIsLoggingOut(true);
    setLoading(false); // Clear loading state

    // Add a timeout to prevent logout spinner from getting stuck
    const logoutTimeout = setTimeout(() => {
      console.log('confirmLogo timeout reached - forcing navigation');
      setIsLoggingOut(false);
      setIsLogoutTriggered(false);
      window.location.href = '/';
    }, 5000); // 5 seconds timeout

    try {
      // Call logout API
      const response = await fetch("http://localhost/Liveonv2/backend_api/controllers/logout.php", {
        method: 'POST',
        credentials: 'include',
      });

      console.log('Logout successful from home button');
    } catch (error) {
      console.log('Logout API error from home button:', error);
    } finally {
      console.log('confirmLogo finally block - clearing state');
      clearTimeout(logoutTimeout); // Clear the timeout since we're handling it manually

      // Clear all state immediately
      setStats({});
      setAllUsers([]);
      setAllHospitals([]);
      setAllDonors([]);
      setAllMROs([]);
      setNotifications([]);
      setSystemActivities([]);
      setAdminMessages([]);
      setPasswordResetRequests([]);
      setError(null);
      setLoading(false);

      // Reset logout flags and navigate
      setTimeout(() => {
        try {
          console.log('confirmLogo timeout - resetting flags and navigating');
          setIsLoggingOut(false);
          setIsLogoutTriggered(false);
          window.location.href = '/';
        } catch (navError) {
          console.log('Navigation error:', navError);
          window.location.href = '/';
        }
      }, 200);
    }
  };
  const cancelLogo = () => setShowLogoDialog(false);

  // Function to verify session before admin operations
  const verifyAdminSession = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/check_session.php', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Session check failed');
      }

      const data = await response.json();

      if (!data.session_status.session_started ||
        !data.session_status.is_admin ||
        data.session_status.user_id === 'NOT_SET') {
        throw new Error('Invalid admin session');
      }

      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      return false;
    }
  };

  // Open edit modal
  const handleEditClick = (user) => {
    console.log('Edit button clicked for user:', user);
    setEditUser(user);
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      status: user.status || 'active'
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
    setShowUserSaveConfirm(true);
  };

  // Confirm user save
  const confirmUserSave = async () => {
    setShowUserSaveConfirm(false);
    setEditLoading(true);
    setEditError('');

    try {
      // First verify the session is still valid
      const sessionValid = await verifyAdminSession();
      if (!sessionValid) {
        setEditError('Session expired. Please log in again.');
        setEditLoading(false);
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/edit_user.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: editUser.user_id,
          name: editForm.name,
          phone: editForm.phone,
          status: editForm.status
        })
      });

      // Check if response is unauthorized
      if (res.status === 401) {
        setEditError('Session expired. Please log in again.');
        setEditLoading(false);
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      if (!res.ok) {
        setEditError(`Server error: ${res.status} ${res.statusText}`);
        setEditLoading(false);
        return;
      }

      const data = await res.json();
      if (!data.success) {
        setEditError(data.error || data.message || 'Failed to update user');
        setEditLoading(false);
        return;
      }
      setEditUser(null);
      setEditForm({ name: '', phone: '', status: '' });
      await fetchAdminData();
    } catch (err) {
      console.error('Edit user error:', err);
      setEditError('Failed to update user: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Cancel user save
  const cancelUserSave = () => {
    setShowUserSaveConfirm(false);
  };

  // MRO edit handlers
  const handleEditMroClick = (mro) => {
    setEditMro(mro);
    setEditMroForm({
      name: mro.name || '',
      email: mro.email || '',
      phone: mro.phone || '',
      hospital_id: mro.hospital_id || ''
    });
    setEditMroError('');
  };

  const handleEditMroFormChange = (e) => {
    const { name, value } = e.target;
    setEditMroForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditMroSave = async () => {
    setShowMroSaveConfirm(true);
  };

  // Confirm MRO save
  const confirmMroSave = async () => {
    setShowMroSaveConfirm(false);
    setEditMroLoading(true);
    setEditMroError('');
    try {
      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/edit_mro.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mro_id: editMro.mro_id,
          name: editMroForm.name,
          email: editMroForm.email,
          phone: editMroForm.phone,
          hospital_id: editMroForm.hospital_id
        })
      });
      const data = await res.json();
      if (!data.success) {
        setEditMroError(data.error || data.message || 'Failed to update MRO');
        setEditMroLoading(false);
        return;
      }
      setEditMro(null);
      setEditMroForm({ name: '', email: '', phone: '', hospital_id: '' });
      await fetchAdminData();
    } catch (err) {
      setEditMroError('Failed to update MRO');
    } finally {
      setEditMroLoading(false);
    }
  };

  // Cancel MRO save
  const cancelMroSave = () => {
    setShowMroSaveConfirm(false);
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
    setEditHospitalError(''); // Reset error state
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
  const handleEditHospitalSave = async () => {
    setShowHospitalSaveConfirm(true);
  };

  // Confirm hospital save
  const confirmHospitalSave = async () => {
    setShowHospitalSaveConfirm(false);
    setEditHospitalLoading(true);
    setEditHospitalError('');

    try {
      // First verify the session is still valid
      const sessionValid = await verifyAdminSession();
      if (!sessionValid) {
        setEditHospitalError('Session expired. Please log in again.');
        setEditHospitalLoading(false);
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      const res = await fetch('http://localhost/Liveonv2/backend_api/controllers/edit_hospital.php', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital_id: editHospital.hospital_id,
          name: editHospitalForm.name,
          location: editHospitalForm.location,
          contact_email: editHospitalForm.contact_email,
          contact_phone: editHospitalForm.contact_phone
        })
      });

      // Check if response is unauthorized
      if (res.status === 401) {
        setEditHospitalError('Session expired. Please log in again.');
        setEditHospitalLoading(false);
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      if (!res.ok) {
        setEditHospitalError(`Server error: ${res.status} ${res.statusText}`);
        setEditHospitalLoading(false);
        return;
      }

      const data = await res.json();
      if (!data.success) {
        setEditHospitalError(data.error || data.message || 'Failed to update hospital');
        setEditHospitalLoading(false);
        return;
      }

      // Success - close modal and refresh data
      setEditHospital(null);
      setEditHospitalForm({ name: '', location: '', contact_email: '', contact_phone: '' });
      await fetchAdminData(); // Refresh hospital data
      toast.success('Hospital updated successfully');
    } catch (err) {
      console.error('Edit hospital error:', err);
      setEditHospitalError('Failed to update hospital: ' + err.message);
    } finally {
      setEditHospitalLoading(false);
    }
  };

  // Cancel hospital save
  const cancelHospitalSave = () => {
    setShowHospitalSaveConfirm(false);
  };

  // Donor edit handlers
  const handleEditDonorClick = (donor) => {
    console.log('Edit donor clicked:', donor);
    setEditDonor(donor);
    setEditDonorForm({
      name: donor.name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      blood_type: donor.blood_type || '',
      city: donor.city || '',
      status: donor.status || 'available'
    });
    setEditDonorError(''); // Reset error state
    console.log('Edit form initialized with:', {
      name: donor.name || '',
      email: donor.email || '',
      phone: donor.phone || '',
      blood_type: donor.blood_type || '',
      city: donor.city || '',
      status: donor.status || 'available'
    });
  };

  const closeEditDonorModal = () => {
    console.log('=== CLOSING DONOR EDIT MODAL ===');
    console.log('Before close - editDonor:', editDonor);
    setEditDonor(null);
    setEditDonorForm({ name: '', email: '', phone: '', blood_type: '', city: '', status: '' });
    setEditDonorError('');
    setEditDonorLoading(false);
    console.log('Modal closed - editDonor set to null');
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
    console.log('=== DONOR SAVE STARTED ===');
    console.log('editDonor:', editDonor);
    console.log('editDonorForm:', editDonorForm);

    if (!editDonor) {
      console.log('No editDonor found, returning');
      return;
    }

    // Show confirmation dialog
    setShowDonorSaveConfirm(true);
  };

  // Confirm donor save
  const confirmDonorSave = async () => {
    setShowDonorSaveConfirm(false);
    console.log('User confirmed save');

    setEditDonorLoading(true);
    setEditDonorError('');
    console.log('Loading state set to true');

    try {
      // First verify the session is still valid
      console.log('Verifying admin session...');
      const sessionValid = await verifyAdminSession();
      if (!sessionValid) {
        console.log('Session invalid');
        setEditDonorError('Session expired. Please log in again.');
        setEditDonorLoading(false);
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }
      console.log('Session valid');

      const requestData = {
        donorId: editDonor.donor_id,
        name: editDonorForm.name,
        email: editDonorForm.email,
        phone: editDonorForm.phone,
        blood_type: editDonorForm.blood_type,
        city: editDonorForm.city,
        status: editDonorForm.status
      };

      console.log('Sending request data:', requestData);

      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/admin_update_donor.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      // Check if response is unauthorized
      if (response.status === 401) {
        console.log('401 Unauthorized response');
        setEditDonorError('Session expired. Please log in again.');
        setEditDonorLoading(false);
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      if (!response.ok) {
        console.log('Response not ok:', response.status, response.statusText);
        setEditDonorError(`Server error: ${response.status} ${response.statusText}`);
        setEditDonorLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        console.log('=== SUCCESS: Donor update successful ===');

        // Update the local donor data immediately
        setAllDonors(prev => prev.map(donor =>
          donor.donor_id === editDonor.donor_id
            ? {
              ...donor,
              name: editDonorForm.name,
              email: editDonorForm.email,
              phone: editDonorForm.phone,
              blood_type: editDonorForm.blood_type,
              city: editDonorForm.city,
              status: editDonorForm.status
            }
            : donor
        ));

        // Reset all edit states
        setEditDonor(null);
        setEditDonorForm({ name: '', email: '', phone: '', blood_type: '', city: '', status: '' });
        setEditDonorError('');
        setEditDonorLoading(false);

        toast.success('Donor information updated successfully');

        // Refresh admin data in background (don't wait for it)
        console.log('Refreshing admin data in background...');
        fetchAdminData().catch(refreshError => {
          console.error('Background refresh error:', refreshError);
        });

        console.log('=== DONOR SAVE COMPLETED SUCCESSFULLY ===');
      } else {
        console.log('=== ERROR: Donor update failed ===');
        console.log('Error message:', data.message);
        setEditDonorError(data.message || 'Failed to update donor information');
        return; // Don't close modal on error
      }
    } catch (error) {
      console.error('=== CATCH ERROR ===');
      console.error('Error updating donor:', error);
      setEditDonorError('Error updating donor information: ' + error.message);
    } finally {
      console.log('Setting editDonorLoading to false');
      setEditDonorLoading(false);
    }
  };

  // Cancel donor save
  const cancelDonorSave = () => {
    setShowDonorSaveConfirm(false);
    console.log('User cancelled save');
  };

  const handleRemoveDonorClick = (donor) => {
    setDonorToRemove(donor);
    setShowRemoveDonorDialog(true);
  };

  const confirmRemoveDonor = async () => {
    if (!donorToRemove) return;

    try {
      // First verify the session is still valid
      const sessionValid = await verifyAdminSession();
      if (!sessionValid) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      console.log('Removing donor:', donorToRemove);
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/remove_donor.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: donorToRemove.donor_id,
          userId: donorToRemove.user_id
        }),
        credentials: 'include'
      });

      // Check if response is unauthorized
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      if (!response.ok) {
        toast.error(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('Remove donor response:', data);

      if (data.success) {
        toast.success('Donor deactivated successfully');
        // Update the donor status in the local state instead of removing it
        setAllDonors(prev => prev.map(d =>
          d.donor_id === donorToRemove.donor_id
            ? { ...d, status: 'not available' }
            : d
        ));
        setShowRemoveDonorDialog(false);
        setDonorToRemove(null);

        // Refresh data in background
        fetchAdminData().catch(error => {
          console.error('Background refresh error after donor removal:', error);
        });
      } else {
        console.error('Remove donor failed:', data.message);
        toast.error(data.message || 'Failed to deactivate donor');
      }
    } catch (error) {
      console.error('Error removing donor:', error);
      toast.error('Error removing donor: ' + error.message);
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
      // First verify the session is still valid
      const sessionValid = await verifyAdminSession();
      if (!sessionValid) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/remove_user.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userToRemove.user_id
        }),
        credentials: 'include'
      });

      // Check if response is unauthorized
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      if (!response.ok) {
        toast.error(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('User deactivated successfully');
        // Update the user status in the local state instead of removing them
        setAllUsers(prev => prev.map(u =>
          u.user_id === userToRemove.user_id
            ? { ...u, status: 'rejected' }
            : u
        ));
        setShowRemoveUserDialog(false);
        setUserToRemove(null);
      } else {
        toast.error(data.message || 'Failed to deactivate user');
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
      // First verify the session is still valid
      const sessionValid = await verifyAdminSession();
      if (!sessionValid) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/remove_hospital.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospitalId: hospitalToRemove.hospital_id
        }),
        credentials: 'include'
      });

      // Check if response is unauthorized
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      if (!response.ok) {
        toast.error(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('Hospital deactivated successfully');
        // Update the hospital status in the local state instead of removing it
        setAllHospitals(prev => prev.map(h =>
          h.hospital_id === hospitalToRemove.hospital_id
            ? { ...h, status: 'rejected' }
            : h
        ));
        setShowRemoveHospitalDialog(false);
        setHospitalToRemove(null);
      } else {
        toast.error(data.message || 'Failed to deactivate hospital');
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
      // First verify the session is still valid
      const sessionValid = await verifyAdminSession();
      if (!sessionValid) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/remove_mro.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mroId: mroToRemove.mro_id
        }),
        credentials: 'include'
      });

      // Check if response is unauthorized
      if (response.status === 401) {
        toast.error('Session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/?login=true';
        }, 2000);
        return;
      }

      if (!response.ok) {
        toast.error(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast.success('MRO officer deactivated successfully');
        // Update the MRO status in the local state instead of removing it
        setAllMROs(prev => prev.map(m =>
          m.mro_id === mroToRemove.mro_id
            ? { ...m, status: 'rejected' }
            : m
        ));
        setShowRemoveMroDialog(false);
        setMroToRemove(null);
        // Refresh MRO data to ensure consistency
        fetchMROs();
      } else {
        toast.error(data.message || 'Failed to deactivate MRO officer');
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

  // Detail modal click handlers
  const handleUserRowClick = (user) => {
    setSelectedUserDetail(user);
  };

  const handleHospitalRowClick = (hospital) => {
    setSelectedHospitalDetail(hospital);
  };

  const handleDonorRowClick = (donor) => {
    setSelectedDonorDetail(donor);
  };

  const handleMroRowClick = (mro) => {
    setSelectedMroDetail(mro);
  };

  const handleRequestRowClick = (request) => {
    setSelectedRequestDetail(request);
  };

  const closeDetailModal = () => {
    setSelectedUserDetail(null);
    setSelectedHospitalDetail(null);
    setSelectedDonorDetail(null);
    setSelectedMroDetail(null);
    setSelectedRequestDetail(null);
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
    setShowStorySaveConfirm(true);
  };

  // Confirm story save
  const confirmStorySave = async () => {
    setShowStorySaveConfirm(false);
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

  // Cancel story save
  const cancelStorySave = () => {
    setShowStorySaveConfirm(false);
  };

  // Handle password reset reject
  const handlePasswordResetReject = (request) => {
    setPendingPasswordResetAction(request);
    setShowPasswordResetRejectConfirm(true);
  };

  // Confirm password reset reject
  const confirmPasswordResetReject = async () => {
    setShowPasswordResetRejectConfirm(false);
    setPasswordResetLoading(true);
    setPasswordResetError('');
    try {
      const res = await fetch('http://localhost/liveonv2/backend_api/controllers/complete_password_reset.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: pendingPasswordResetAction.request_id, reject: true }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password reset request rejected');
        await fetchAdminData();
        setShowPasswordResetModal(false);
        setSelectedResetRequest(null);
      } else {
        setPasswordResetError(data.message || 'Failed to reject request');
      }
    } catch (error) {
      setPasswordResetError('Error rejecting request: ' + error.message);
    } finally {
      setPasswordResetLoading(false);
      setPendingPasswordResetAction(null);
    }
  };

  // Cancel password reset reject
  const cancelPasswordResetReject = () => {
    setShowPasswordResetRejectConfirm(false);
    setPendingPasswordResetAction(null);
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
              <div className="system-health-grid">
                {/* Main Health Status */}
                <div className="health-status-card">
                  <div className="health-indicator-wrapper">
                    <span className="health-indicator healthy"></span>
                    <div className="health-text">
                      <div className="health-title">System Status</div>
                      <div className="health-value">All Systems Operational</div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="health-metrics-grid">
                  <div className="metric-card">
                    <div className="metric-icon">📊</div>
                    <div className="metric-content">
                      <div className="metric-label">Response Time</div>
                      <div className="metric-value">~120ms</div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">💾</div>
                    <div className="metric-content">
                      <div className="metric-label">Database</div>
                      <div className="metric-value">Connected</div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">🔐</div>
                    <div className="metric-content">
                      <div className="metric-label">Security</div>
                      <div className="metric-value">Active</div>
                    </div>
                  </div>

                  <div className="metric-card">
                    <div className="metric-icon">🌐</div>
                    <div className="metric-content">
                      <div className="metric-label">API Status</div>
                      <div className="metric-value">Online</div>
                    </div>
                  </div>
                </div>

                {/* Notifications Summary */}
                <div className="notifications-summary">
                  <div className="notification-header">
                    <span className="notification-icon">🔔</span>
                    <span className="notification-title">Recent Activity</span>
                  </div>
                  <div className="notification-stats">
                    <div className="stat-item">
                      <span className="stat-number">{unreadCount}</span>
                      <span className="stat-label">New Notifications</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{systemActivities.length}</span>
                      <span className="stat-label">System Activities</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{mailUnreadCount}</span>
                      <span className="stat-label">Unread Messages</span>
                    </div>
                  </div>
                </div>
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
          <div className="dashboard-card" style={{
            position: 'relative',
            zIndex: 1,
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)',
            border: '1px solid rgba(59, 130, 246, 0.08)',
            marginBottom: '24px',
            overflow: 'hidden',
            maxWidth: '100%'
          }}>
            <h2 className="section-title gradient-text" style={{
              position: 'relative',
              zIndex: 2,
              marginBottom: '18px'
            }}>All Users</h2>
            <div style={{
              display: 'flex',
              gap: 16,
              marginBottom: 18,
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 2
            }}>
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
            <div style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              position: 'relative',
              zIndex: 1,
              maxWidth: '100%',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#ffffff'
            }}>
              <table className="admin-table" style={{
                width: '100%',
                borderCollapse: 'collapse',
                margin: 0,
                tableLayout: 'fixed'
              }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 3,
                  backgroundColor: '#f8fafc'
                }}>
                  <tr>
                    <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '80px' }}>User ID</th>
                    <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Name</th>
                    <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '150px' }}>Email</th>
                    <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '80px' }}>Role</th>
                    <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '100px' }}>Status</th>
                    <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.user_id || user.email}
                        onClick={() => handleUserRowClick(user)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: '#ffffff',
                          borderBottom: '1px solid #e5e7eb'
                        }}
                        className="clickable-row"
                      >
                        <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.user_id}</td>
                        <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</td>
                        <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</td>
                        <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.role}</td>
                        <td style={{ padding: '8px', fontSize: '12px' }}><span className={`status-chip ${user.status}`}>{user.status}</span></td>
                        <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px', fontSize: '12px' }}>
                          <button className="dashboard-btn primary" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '4px' }} onClick={() => handleEditClick(user)}>
                            Edit
                          </button>
                          <button
                            className="dashboard-btn danger"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleRemoveUserClick(user)}
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No users found</td></tr>
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
          <div className="dashboard-card" style={{
            position: 'relative',
            zIndex: 1,
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)',
            border: '1px solid rgba(59, 130, 246, 0.08)',
            marginBottom: '24px',
            overflow: 'hidden',
            maxWidth: '100%'
          }}>
            <h2 className="section-title gradient-text" style={{
              position: 'relative',
              zIndex: 2,
              marginBottom: '18px'
            }}>All Hospitals</h2>
            <div style={{
              display: 'flex',
              gap: 16,
              marginBottom: 18,
              flexWrap: 'wrap',
              position: 'relative',
              zIndex: 2
            }}>
              <button className={`hospital-tab-btn${hospitalTab === 'staffs' ? ' active' : ''}`} onClick={() => setHospitalTab('staffs')}>Hospital Staffs</button>
              <button className={`hospital-tab-btn${hospitalTab === 'mros' ? ' active' : ''}`} onClick={() => setHospitalTab('mros')}>MROs</button>
            </div>
            {hospitalTab === 'staffs' ? (
              <>
                <div style={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: '100%',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <table className="admin-table" style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    margin: 0,
                    tableLayout: 'fixed'
                  }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 3,
                      backgroundColor: '#f8fafc'
                    }}>
                      <tr>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '80px' }}>Hospital ID</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Name</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '100px' }}>Location</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '150px' }}>Email</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.length > 0 ? (
                        filteredHospitals.map((hospital) => (
                          <tr
                            key={hospital.hospital_id || hospital.name}
                            onClick={() => handleHospitalRowClick(hospital)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: '#ffffff',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                            className="clickable-row"
                          >
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.hospital_id}</td>
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.name}</td>
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.location}</td>
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hospital.contact_email}</td>
                            <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px', fontSize: '12px' }}>
                              <button className="dashboard-btn primary" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '4px' }} onClick={() => handleEditHospitalClick(hospital)}>
                                Edit
                              </button>
                              <button
                                className="dashboard-btn danger"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => handleRemoveHospitalClick(hospital)}
                              >
                                Deactivate
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No hospitals found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: '100%',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff'
                }}>
                  <table className="admin-table" style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    margin: 0,
                    tableLayout: 'fixed'
                  }}>
                    <thead style={{
                      position: 'sticky',
                      top: 0,
                      zIndex: 3,
                      backgroundColor: '#f8fafc'
                    }}>
                      <tr>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '80px' }}>MRO ID</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Name</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '150px' }}>Email</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Hospital</th>
                        <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allMROs.length > 0 ? (
                        allMROs.map((mro) => (
                          <tr
                            key={mro.mro_id}
                            onClick={() => handleMroRowClick(mro)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: '#ffffff',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                            className="clickable-row"
                          >
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mro.mro_id}</td>
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mro.name}</td>
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mro.email}</td>
                            <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mro.hospital_name || 'N/A'}</td>
                            <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px', fontSize: '12px' }}>
                              <button className="dashboard-btn primary" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '4px' }} onClick={() => handleEditMroClick(mro)}>Edit</button>
                              <button
                                className="dashboard-btn danger"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => handleRemoveMroClick(mro)}
                              >
                                Deactivate
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No MROs found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        );
      case 'donors':
        return (
          <div className="dashboard-card" style={{
            position: 'relative',
            zIndex: 1,
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)',
            border: '1px solid rgba(59, 130, 246, 0.08)',
            marginBottom: '24px',
            overflow: 'hidden',
            maxWidth: '100%'
          }}>
            <h2 className="section-title gradient-text" style={{
              position: 'relative',
              zIndex: 2,
              marginBottom: '18px'
            }}>Donor Management</h2>

            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              marginBottom: '18px',
              position: 'relative',
              zIndex: 2
            }}>
              <button
                className={`hospital-tab-btn${donorTab === 'donors' ? ' active' : ''}`}
                onClick={() => setDonorTab('donors')}
              >
                🩸 All Donors ({allDonors.length})
              </button>
              <button
                className={`hospital-tab-btn${donorTab === 'reminders' ? ' active' : ''}`}
                onClick={() => setDonorTab('reminders')}
              >
                📱 SMS Reminders
              </button>
            </div>

            {/* All Donors Tab */}
            {donorTab === 'donors' && (() => {
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
                <>
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 18,
                    flexWrap: 'wrap',
                    position: 'relative',
                    zIndex: 2
                  }}>
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
                  <div style={{
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    position: 'relative',
                    zIndex: 1,
                    maxWidth: '100%',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff'
                  }}>
                    <table className="admin-table" style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      margin: 0,
                      tableLayout: 'fixed'
                    }}>
                      <thead style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 3,
                        backgroundColor: '#f8fafc'
                      }}>
                        <tr>
                          <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '80px' }}>Donor ID</th>
                          <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Name</th>
                          <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '150px' }}>Email</th>
                          <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '80px' }}>Blood Type</th>
                          <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '100px' }}>Status</th>
                          <th style={{ padding: '12px 8px', fontSize: '12px', minWidth: '120px' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDonors.length > 0 ? (
                          filteredDonors.map((donor) => (
                            <tr
                              key={donor.donor_id || donor.email}
                              onClick={() => handleDonorRowClick(donor)}
                              style={{
                                cursor: 'pointer',
                                backgroundColor: '#ffffff',
                                borderBottom: '1px solid #e5e7eb'
                              }}
                              className="clickable-row"
                            >
                              <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{donor.donor_id}</td>
                              <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{donor.name}</td>
                              <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{donor.email}</td>
                              <td style={{ padding: '8px', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{donor.blood_type}</td>
                              <td style={{ padding: '8px', fontSize: '12px' }}><span className={`status-chip ${donor.status}`}>{donor.status}</span></td>
                              <td onClick={(e) => e.stopPropagation()} style={{ padding: '8px', fontSize: '12px' }}>
                                <button className="dashboard-btn primary" style={{ padding: '4px 8px', fontSize: '11px', marginRight: '4px' }} onClick={() => handleEditDonorClick(donor)}>
                                  Edit
                                </button>
                                <button className="dashboard-btn danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleRemoveDonorClick(donor)}>
                                  Deactivate
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No donors found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            {/* SMS Reminders Tab */}
            {donorTab === 'reminders' && (
              <div style={{ position: 'relative', zIndex: 1 }}>
                <DonorReminders />
              </div>
            )}
          </div>
        );
      case 'requests':
        return (
          <div className="dashboard-card glassy animate-fadein">
            <h2 className="section-title gradient-text">All Requests</h2>

            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              marginBottom: '18px',
              position: 'relative',
              zIndex: 2
            }}>
              <button className={`hospital-tab-btn${requestsTab === 'blood-requests' ? ' active' : ''}`} onClick={() => setRequestsTab('blood-requests')}>
                📨 Blood Requests ({allRequests.length})
              </button>
              <button className={`hospital-tab-btn${requestsTab === 'password-resets' ? ' active' : ''}`} onClick={() => setRequestsTab('password-resets')}>
                🔐 Password Resets ({passwordResetRequests.length})
              </button>
            </div>

            {/* Blood Requests Tab */}
            {requestsTab === 'blood-requests' && (
              <>
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
                    {Array.from(new Set(allRequests.map(r => r.status).filter(Boolean))).map(st => (
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
                      {allRequests.filter(req => {
                        const matchesSearch =
                          (req.hospital_name || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
                          (req.blood_type || '').toLowerCase().includes(requestSearch.toLowerCase());
                        const matchesStatus = requestStatusFilter ? req.status === requestStatusFilter : true;
                        return matchesSearch && matchesStatus;
                      }).length > 0 ? (
                        allRequests.filter(req => {
                          const matchesSearch =
                            (req.hospital_name || '').toLowerCase().includes(requestSearch.toLowerCase()) ||
                            (req.blood_type || '').toLowerCase().includes(requestSearch.toLowerCase());
                          const matchesStatus = requestStatusFilter ? req.status === requestStatusFilter : true;
                          return matchesSearch && matchesStatus;
                        }).map((req) => (
                          <tr
                            key={req.request_id}
                            onClick={() => handleRequestRowClick(req)}
                            style={{ cursor: 'pointer' }}
                            className="clickable-row"
                          >
                            <td>{req.hospital_name || 'Unknown'}</td>
                            <td>{req.blood_type}</td>
                            <td>{req.units || 'N/A'}</td>
                            <td>{req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4">No blood requests found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Password Reset Requests Tab */}
            {requestsTab === 'password-resets' && (
              <>
                {passwordResetRequests.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>User</th>
                          <th>Email</th>
                          <th>Requested Password</th>
                          <th>Status</th>
                          <th>Created At</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {passwordResetRequests.map((req) => (
                          <tr key={req.request_id}>
                            <td>{req.request_id}</td>
                            <td>{req.name}</td>
                            <td>{req.email}</td>
                            <td style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                              {req.requested_password}
                            </td>
                            <td>
                              <span className={`status-chip ${req.status}`}>{req.status}</span>
                            </td>
                            <td>{new Date(req.created_at).toLocaleString()}</td>
                            <td>
                              {req.status === 'pending' && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    className="btn-approve"
                                    onClick={() => handlePasswordReset(req.request_id, req.requested_password)}
                                    disabled={passwordResetLoading}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      background: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {passwordResetLoading ? 'Processing...' : 'Approve'}
                                  </button>
                                  <button
                                    className="btn-reject"
                                    onClick={() => handleRejectPasswordReset(req.request_id)}
                                    disabled={passwordResetLoading}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      background: '#ef4444',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#64748b',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px dashed #cbd5e1'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>No Password Reset Requests</h3>
                    <p style={{ margin: 0 }}>All password reset requests have been processed.</p>
                  </div>
                )}
              </>
            )}
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
                              // Pending feedback - show action buttons
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
                              // Approved feedback - show approved status
                              <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8em' }}>✓ Approved</span>
                            )}
                            {fb.approved === -1 && (
                              // Rejected feedback - show rejected status
                              <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.8em' }}>✗ Rejected</span>
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

  // Don't show error if we're logging out or if it's a session expiration
  if (error && !isLoggingOut) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={fetchAdminData}
        title="Failed to load dashboard data"
        buttonText="Retry"
      />
    );
  }

  // Show loading spinner if no stats data and not logging out (initial load)
  if (!stats && !isLoggingOut && !loading) {
    return (
      <div className="admin-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#2563eb"
          text="Initializing dashboard..."
          className="full-page"
        />
      </div>
    );
  }

  // Show loading spinner if logging out
  if (isLoggingOut) {
    return (
      <div className="admin-dashboard-root">
        <LoadingSpinner
          size="60"
          stroke="4"
          speed="1"
          color="#2563eb"
          text="Logging out..."
          className="full-page"
        />
      </div>
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
            <div className="notification-bell-wrapper" ref={notificationWrapperRef}>
              <button className="notification-bell" onClick={() => { setShowNotifications(v => !v); }}>
                <FaBell size={22} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notification-dropdown" ref={notificationWrapperRef} onClick={e => e.stopPropagation()}>
                  <div className="notification-dropdown-header">
                    Notifications
                    {unreadCount > 0 && (
                      <button
                        onClick={() => {
                          // Mark all notifications as read
                          markAllNotificationsAsRead();
                        }}
                        style={{
                          float: 'right',
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.notification_id}
                        className="notification-item"
                        style={{
                          backgroundColor: notification.status === 'unread' ? '#f0f9ff' : 'transparent',
                          borderLeft: notification.status === 'unread' ? '3px solid #3b82f6' : '3px solid transparent'
                        }}
                        onClick={() => {
                          setSelectedNotification(notification);
                          // Mark notification as read via API
                          markNotificationAsRead(notification.notification_id);
                        }}
                      >
                        <div className="notification-message">
                          {notification.message}
                          {notification.status === 'unread' && <span style={{ marginLeft: '5px', fontSize: '0.7rem', color: '#3b82f6' }}>●</span>}
                        </div>
                        <div className="notification-timestamp">{notification.timestamp ? new Date(notification.timestamp).toLocaleString() : ''}</div>
                      </div>
                    ))
                  ) : (
                    <div className="notification-empty">No notifications</div>
                  )}
                </div>
              )}
            </div>
            {/* Mail Messages */}
            <div className="mail-messages-wrapper" ref={mailWrapperRef}>
              <button className="mail-messages-bell" onClick={() => { setShowMailMessages(v => !v); }}>
                <FaEnvelope size={22} />
                {mailUnreadCount > 0 && <span className="mail-badge">{mailUnreadCount}</span>}
              </button>
              {showMailMessages && (
                <div className="mail-messages-dropdown" ref={mailWrapperRef} onClick={e => e.stopPropagation()}>
                  <div className="mail-messages-dropdown-header">
                    Messages & Requests
                    {mailUnreadCount > 0 && (
                      <button
                        onClick={() => {
                          // Mark all unread messages as read
                          markAllMessagesAsRead();
                        }}
                        style={{
                          float: 'right',
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>

                  {adminMessages.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {adminMessages.map(msg => (
                        <li
                          key={msg.id}
                          style={{
                            marginBottom: 10,
                            padding: '10px 15px',
                            borderBottom: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            backgroundColor: msg.status === 'unread' ? '#f0f9ff' : 'transparent',
                            borderLeft: msg.status === 'unread' ? '3px solid #3b82f6' : '3px solid transparent'
                          }}
                          onClick={() => { setSelectedMessage(msg); markMessageAsRead(msg.id); }}
                        >
                          <div style={{ fontWeight: 600, color: '#2563eb' }}>
                            {msg.name || 'Anonymous'}
                            {msg.status === 'unread' && <span style={{ marginLeft: '5px', fontSize: '0.7rem', color: '#3b82f6' }}>●</span>}
                          </div>
                          <div style={{ margin: '2px 0', fontSize: '0.85em', color: '#64748b' }}>{msg.email || 'No email'}</div>
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

      {/* Edit MRO Modal */}
      {editMro && (
        <div className="modal-overlay" onClick={() => setEditMro(null)}>
          <div className="mro-edit-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <span style={{ fontSize: '24px' }}>🩺</span>
                </div>
                <div className="modal-title-section">
                  <h2 className="modal-title">Edit MRO Profile</h2>
                  <p className="modal-subtitle">Update Medical Review Officer information and hospital assignment</p>
                </div>
              </div>
              <button
                onClick={() => setEditMro(null)}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleEditMroSave(); }}>
                {/* Personal Information Section */}
                <div className="form-section">
                  <div className="section-header">
                    <span className="section-icon">👤</span>
                    <h4 className="section-title">Personal Information</h4>
                  </div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={editMroForm.name}
                        onChange={handleEditMroFormChange}
                        placeholder="Enter MRO full name"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={editMroForm.email}
                        onChange={handleEditMroFormChange}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={editMroForm.phone}
                        onChange={handleEditMroFormChange}
                        placeholder="Enter phone number"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Hospital Assignment Section */}
                <div className="form-section">
                  <div className="section-header">
                    <span className="section-icon">🏥</span>
                    <h4 className="section-title">Hospital Assignment</h4>
                  </div>
                  <div className="form-grid">
                    <div className="form-field">
                      <label>Assigned Hospital</label>
                      <select
                        name="hospital_id"
                        value={editMroForm.hospital_id}
                        onChange={handleEditMroFormChange}
                        required
                      >
                        <option value="">Select Hospital</option>
                        {allHospitals.map(hospital => (
                          <option key={hospital.hospital_id} value={hospital.hospital_id}>
                            {hospital.name} - {hospital.location}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {editMroError && (
                  <div className="form-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{editMroError}</span>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setEditMro(null)}
                    disabled={editMroLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={editMroLoading}
                  >
                    {editMroLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Donor Modal */}
      {editDonor && (
        <div className="modal-overlay" onClick={closeEditDonorModal}>
          <div className="donor-edit-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <span style={{ fontSize: '24px' }}>🩸</span>
                </div>
                <div className="modal-title-section">
                  <h2 className="modal-title">Edit Donor Profile</h2>
                  <p className="modal-subtitle">Update donor information and availability status</p>
                </div>
              </div>
              <button
                onClick={closeEditDonorModal}
                className="modal-close-btn"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Personal Information Section */}
              <div className="form-section">
                <div className="section-header">
                  <span className="section-icon">👤</span>
                  <h4 className="section-title">Personal Information</h4>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={editDonorForm.name}
                      onChange={handleEditDonorFormChange}
                      placeholder="Enter donor full name"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={editDonorForm.email}
                      onChange={handleEditDonorFormChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={editDonorForm.phone}
                      onChange={handleEditDonorFormChange}
                      placeholder="Enter phone number"
                      maxLength="10"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={editDonorForm.city}
                      onChange={handleEditDonorFormChange}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="form-section">
                <div className="section-header">
                  <span className="section-icon">🩺</span>
                  <h4 className="section-title">Medical Information</h4>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Blood Type</label>
                    <select
                      name="blood_type"
                      value={editDonorForm.blood_type}
                      onChange={handleEditDonorFormChange}
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
                    <label>Availability Status</label>
                    <select
                      name="status"
                      value={editDonorForm.status}
                      onChange={handleEditDonorFormChange}
                      required
                    >
                      <option value="">Select Status</option>
                      <option value="available">Available</option>
                      <option value="not available">Not Available</option>
                    </select>
                  </div>
                </div>
              </div>

              {editDonorError && (
                <div className="form-error">
                  <span className="error-icon">⚠️</span>
                  <span className="error-text">{editDonorError}</span>
                </div>
              )}

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeEditDonorModal}
                  disabled={editDonorLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleEditDonorSave}
                  disabled={editDonorLoading}
                >
                  {editDonorLoading ? (
                    <>
                      <LoadingSpinner
                        size="16"
                        stroke="2"
                        color="#ffffff"
                        text=""
                        className="button"
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced User Edit Modal */}
      {editUser && (
        <div className="modal-overlay" onClick={() => setEditUser(null)}>
          <div className="user-edit-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <span style={{ fontSize: '24px' }}>👤</span>
                </div>
                <div className="modal-title-section">
                  <h2 className="modal-title">Edit User Profile</h2>
                  <p className="modal-subtitle">Update user information and account settings</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setEditUser(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <form className="user-form">
                {/* User Basic Information */}
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">👥</span>
                    Basic Information
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Full Name</span>
                        <span className="label-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        className="form-input"
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Phone Number</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleEditFormChange}
                        className="form-input"
                        placeholder="Enter phone number"
                      />
                      <span className="form-help">Include country code if international</span>
                    </div>
                  </div>
                </div>

                {/* Account Settings */}
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">⚙️</span>
                    Account Settings
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Account Status</span>
                        <span className="label-required">*</span>
                      </label>
                      <select
                        name="status"
                        value={editForm.status}
                        onChange={handleEditFormChange}
                        className="form-input"
                        required
                      >
                        <option value="active">🟢 Active</option>
                        <option value="inactive">🔴 Inactive</option>
                      </select>
                      <span className="form-help">Active users can log in and access the system</span>
                    </div>
                  </div>
                </div>

                {editError && (
                  <div className="form-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{editError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <div className="footer-actions">
                <button
                  className="dashboard-btn secondary"
                  onClick={() => setEditUser(null)}
                  type="button"
                  disabled={editLoading}
                >
                  <span className="btn-icon">↶</span>
                  Cancel
                </button>
                <button
                  className="dashboard-btn primary"
                  onClick={handleEditSave}
                  type="submit"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <LoadingSpinner
                        size="16"
                        stroke="2"
                        color="#ffffff"
                        text=""
                        className="button"
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
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

      {/* Hospital Edit Modal - Enhanced Structure */}
      {editHospital && (
        <div className="modal-overlay" onClick={() => setEditHospital(null)}>
          <div className="hospital-edit-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <span style={{ fontSize: '24px' }}>🏥</span>
                </div>
                <div className="modal-title-section">
                  <h2 className="modal-title">Edit Hospital Information</h2>
                  <p className="modal-subtitle">Update hospital details and contact information</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setEditHospital(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              <form className="hospital-form">
                {/* Hospital Basic Information */}
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">🏢</span>
                    Hospital Information
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Hospital Name</span>
                        <span className="label-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editHospitalForm.name}
                        onChange={handleEditHospitalFormChange}
                        className="form-input"
                        placeholder="Enter hospital name"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Location</span>
                        <span className="label-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={editHospitalForm.location}
                        onChange={handleEditHospitalFormChange}
                        className="form-input"
                        placeholder="Enter hospital location"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="form-section">
                  <h3 className="section-title">
                    <span className="section-icon">📞</span>
                    Contact Information
                  </h3>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Email Address</span>
                        <span className="label-required">*</span>
                      </label>
                      <input
                        type="email"
                        name="contact_email"
                        value={editHospitalForm.contact_email}
                        onChange={handleEditHospitalFormChange}
                        className="form-input"
                        placeholder="Enter email address"
                        required
                      />
                      <span className="form-help">This email will be used for official communications</span>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <span className="label-text">Phone Number</span>
                        <span className="label-required">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_phone"
                        value={editHospitalForm.contact_phone}
                        onChange={handleEditHospitalFormChange}
                        className="form-input"
                        placeholder="Enter phone number"
                        required
                      />
                      <span className="form-help">Include country code if international</span>
                    </div>
                  </div>
                </div>

                {editHospitalError && (
                  <div className="form-error">
                    <span className="error-icon">⚠️</span>
                    <span className="error-text">{editHospitalError}</span>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <div className="footer-actions">
                <button
                  className="dashboard-btn secondary"
                  onClick={() => setEditHospital(null)}
                  type="button"
                  disabled={editHospitalLoading}
                >
                  <span className="btn-icon">↶</span>
                  Cancel
                </button>
                <button
                  className="dashboard-btn primary"
                  onClick={handleEditHospitalSave}
                  type="submit"
                  disabled={editHospitalLoading}
                >
                  {editHospitalLoading ? (
                    <>
                      <LoadingSpinner
                        size="16"
                        stroke="2"
                        color="#ffffff"
                        text=""
                        className="button"
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {profileModalOpen && (
        <div className="modal-overlay profile-edit-modal" onClick={closeProfileModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            maxWidth: 500,
            padding: '32px',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            {/* Header */}
            <div style={{
              marginBottom: '24px',
              textAlign: 'center',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '16px'
            }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#1f2937',
                margin: '0 0 8px 0'
              }}>
                Edit Profile
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0
              }}>
                Update your account information and settings
              </p>
            </div>

            {/* Form Fields */}
            <div style={{ marginBottom: '24px' }}>
              {/* Name Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileFormChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your full name"
                />
              </div>

              {/* Email Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Email Address <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileFormChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter your email address"
                />
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Password <span style={{ color: '#6b7280', fontSize: '12px' }}>(Optional)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={profileForm.password}
                  onChange={handleProfileFormChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Leave blank to keep current password"
                />
                <p style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  margin: '4px 0 0 0'
                }}>
                  Leave blank if you don't want to change your password
                </p>
              </div>

              {/* Profile Photo Field */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Profile Photo
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s ease'
                }}>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    onChange={handleProfileFormChange}
                    id="profile-photo-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="profile-photo-input" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#3b82f6',
                    fontWeight: '500'
                  }}>
                    <span style={{ fontSize: '18px' }}>📷</span>
                    Choose Photo
                  </label>
                  <span style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    marginLeft: 'auto'
                  }}>
                    {profileForm.photo ? profileForm.photo.name : 'No file chosen'}
                  </span>
                </div>
              </div>

              {/* Photo Preview */}
              {profileForm.photoPreview && (
                <div style={{
                  marginBottom: '20px',
                  textAlign: 'center'
                }}>
                  <img
                    src={profileForm.photoPreview}
                    alt="Profile Preview"
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #e5e7eb'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {profileError && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc2626',
                  fontSize: '14px'
                }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  {profileError}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #e5e7eb',
              paddingTop: '20px'
            }}>
              <button
                onClick={closeProfileModal}
                disabled={profileLoading}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6b7280',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleProfileSave}
                disabled={profileLoading}
                style={{
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#ffffff',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {profileLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
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
              <button className="dashboard-btn" onClick={() => handlePasswordResetReject(selectedResetRequest)} disabled={passwordResetLoading}>Reject</button>
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
            // Show User ID, User Role, new password and action buttons
            return (
              <div className="modal-overlay" onClick={() => setSelectedNotification(null)}>
                <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
                  <h3>Password Reset Request</h3>
                  <div style={{ marginBottom: 10 }}><b>Request ID:</b> {req.request_id}</div>
                  <div style={{ marginBottom: 10 }}><b>User:</b> {req.name} ({req.email})</div>
                  <div style={{ marginBottom: 10 }}><b>User ID:</b> {req.user_id}</div>
                  <div style={{ marginBottom: 10 }}><b>Requested Password:</b>
                    <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 6px', borderRadius: '3px', marginLeft: '8px' }}>
                      {req.requested_password}
                    </span>
                  </div>
                  <div className="modal-actions" style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      className="dashboard-btn primary"
                      onClick={() => {
                        setSelectedNotification(null);
                        handlePasswordResetClick(req);
                      }}
                    >
                      Accept & Set Password
                    </button>
                    <button
                      className="dashboard-btn danger"
                      onClick={() => {
                        setSelectedNotification(null);
                        handlePasswordResetReject(req);
                      }}
                    >
                      Reject Request
                    </button>
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
        title="Deactivate Donor"
        message={`Are you sure you want to deactivate donor ${donorToRemove?.name} (${donorToRemove?.donor_id})? This will set the donor status to 'not available' and user status to 'rejected', but will preserve all records.`}
        onConfirm={confirmRemoveDonor}
        onCancel={cancelRemoveDonor}
        confirmText="Deactivate"
        cancelText="Cancel"
      />
      <ConfirmDialog
        open={showRemoveUserDialog}
        title="Deactivate User"
        message={`Are you sure you want to deactivate user ${userToRemove?.name} (${userToRemove?.user_id})? This will change their status to 'rejected' and prevent them from logging in. Their data will be preserved for audit purposes.`}
        onConfirm={confirmRemoveUser}
        onCancel={cancelRemoveUser}
        confirmText="Deactivate"
        cancelText="Cancel"
      />
      <ConfirmDialog
        open={showRemoveHospitalDialog}
        title="Deactivate Hospital"
        message={`Are you sure you want to deactivate hospital ${hospitalToRemove?.name} (${hospitalToRemove?.hospital_id})? This will set the associated user account status to 'rejected', but will preserve all hospital records.`}
        onConfirm={confirmRemoveHospital}
        onCancel={cancelRemoveHospital}
        confirmText="Deactivate"
        cancelText="Cancel"
      />
      <ConfirmDialog
        open={showRemoveMroDialog}
        title="Deactivate MRO Officer"
        message={`Are you sure you want to deactivate MRO officer ${mroToRemove?.name} (${mroToRemove?.mro_id})? This will set the associated user account status to 'rejected', but will preserve all MRO records.`}
        onConfirm={confirmRemoveMro}
        onCancel={cancelRemoveMro}
        confirmText="Deactivate"
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

      {/* Detail Modals */}
      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ background: '#3b82f6', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>👤</span>
              </div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>User Details</h3>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🆔</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>User ID</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedUserDetail.user_id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>👨‍💼</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Name</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedUserDetail.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📧</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Email</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedUserDetail.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📞</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Phone</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedUserDetail.phone || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🎭</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Role</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600', textTransform: 'capitalize' }}>{selectedUserDetail.role}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🔵</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Status</strong>
                  <div><span className={`status-chip ${selectedUserDetail.status}`}>{selectedUserDetail.status}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Detail Modal */}
      {selectedHospitalDetail && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ background: '#10b981', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>🏥</span>
              </div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Hospital Details</h3>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🆔</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Hospital ID</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedHospitalDetail.hospital_id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🏢</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Name</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedHospitalDetail.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📍</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Location</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedHospitalDetail.location}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📧</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Email</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedHospitalDetail.contact_email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📞</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Phone</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedHospitalDetail.contact_phone}</div>
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Donor Detail Modal */}
      {selectedDonorDetail && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ background: '#ef4444', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>🩸</span>
              </div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Donor Details</h3>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🆔</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Donor ID</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.donor_id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>👨‍⚕️</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Name</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📧</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Email</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📞</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Phone</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🩸</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Blood Type</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.blood_type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🏙️</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>City</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.city}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🔵</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Status</strong>
                  <div><span className={`status-chip ${selectedDonorDetail.status}`}>{selectedDonorDetail.status}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📅</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Last Donation</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.last_donation_date || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>💝</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Lives Saved</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedDonorDetail.lives_saved || 0}</div>
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MRO Detail Modal */}
      {selectedMroDetail && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ background: '#8b5cf6', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>🔬</span>
              </div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>MRO Details</h3>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🆔</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>MRO ID</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedMroDetail.mro_id}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>👨‍🔬</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Name</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedMroDetail.name}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📧</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Email</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedMroDetail.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📞</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Phone</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedMroDetail.phone}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🏥</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Hospital</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedMroDetail.hospital_name || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequestDetail && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem' }}>
              <div style={{ background: '#f59e0b', borderRadius: '50%', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem' }}>
                <span style={{ color: 'white', fontSize: '1.5rem' }}>🚨</span>
              </div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Request Details</h3>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🆔</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Request ID</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedRequestDetail.request_id || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🏥</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Hospital</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedRequestDetail.hospital_name || 'Unknown'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>🩸</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Blood Type</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedRequestDetail.blood_type}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📦</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Units Required</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedRequestDetail.units || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📊</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Status</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedRequestDetail.status || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
                <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>📅</span>
                <div>
                  <strong style={{ color: '#64748b', fontSize: '0.9rem' }}>Created At</strong>
                  <div style={{ color: '#1e293b', fontWeight: '600' }}>{selectedRequestDetail.created_at ? new Date(selectedRequestDetail.created_at).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="dashboard-btn" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* User Save Confirmation Dialog */}
      <ConfirmDialog
        open={showUserSaveConfirm}
        title="Save User Changes"
        message="Are you sure you want to save the changes to this user?"
        onConfirm={confirmUserSave}
        onCancel={cancelUserSave}
        confirmText="Save"
        cancelText="Cancel"
      />
    </div>
  );
}

export default AdminDashboard; 