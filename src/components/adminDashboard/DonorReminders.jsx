import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const DonorReminders = () => {
  const [settings, setSettings] = useState({
    reminder_enabled: '1',
    reminder_interval_months: '6',
    reminder_message_template: '',
    reminder_sender_id: 'LiveOnBD'
  });
  const [donorsNeedingReminders, setDonorsNeedingReminders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [selectedDonors, setSelectedDonors] = useState(new Set());

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadSettings(),
      loadDonorsNeedingReminders(),
      loadStats()
    ]);
  };

  const loadSettings = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=settings', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        // Always force interval to 6 months
        setSettings({
          ...data.data,
          reminder_interval_months: '6'
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadDonorsNeedingReminders = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=donors_needing_reminders', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setDonorsNeedingReminders(data.data);
      }
    } catch (error) {
      console.error('Failed to load donors needing reminders:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=stats&days=30', {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSettingsChange = (key, value) => {
    // Prevent changing the reminder interval - it's fixed at 6 months
    if (key === 'reminder_interval_months') {
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      // Ensure interval is always 6 months
      const settingsToSave = {
        ...settings,
        reminder_interval_months: '6'
      };
      
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ settings: settingsToSave })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Settings save error:', error);
    }
    setSettingsLoading(false);
  };

  const sendAllReminders = async () => {
    if (donorsNeedingReminders.length === 0) {
      toast.info('No donors need reminders at this time');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=send_reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await loadInitialData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to send reminders');
      }
    } catch (error) {
      toast.error('Failed to send reminders');
      console.error('Send reminders error:', error);
    }
    setLoading(false);
  };

  const sendSingleReminder = async (donorId) => {
    try {
      const response = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=send_single_reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ donor_id: donorId })
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        await loadInitialData(); // Refresh data
      } else {
        toast.error(data.message || 'Failed to send reminder');
      }
    } catch (error) {
      toast.error('Failed to send reminder');
      console.error('Send single reminder error:', error);
    }
  };

  const toggleDonorSelection = (donorId) => {
    const newSelected = new Set(selectedDonors);
    if (newSelected.has(donorId)) {
      newSelected.delete(donorId);
    } else {
      newSelected.add(donorId);
    }
    setSelectedDonors(newSelected);
  };

  const selectAllDonors = () => {
    if (selectedDonors.size === donorsNeedingReminders.length) {
      setSelectedDonors(new Set());
    } else {
      setSelectedDonors(new Set(donorsNeedingReminders.map(d => d.donor_id)));
    }
  };

  return (
    <div style={{ 
      marginTop: '20px',
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Statistics Section */}
      {stats && (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.total_reminders || 0}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Reminders (30 days)</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.successful_reminders || 0}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Successful</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.failed_reminders || 0}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Failed</div>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              {stats.unique_donors_contacted || 0}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>Unique Donors</div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div style={{
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <h3 style={{ marginBottom: '20px', color: '#2d3748', fontSize: '16px', fontWeight: '600' }}>
          ⚙️ Reminder Settings
        </h3>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
          width: '100%'
        }}>
          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
              Enable Reminders
            </label>
            <select 
              value={settings.reminder_enabled}
              onChange={(e) => handleSettingsChange('reminder_enabled', e.target.value)}
              style={{ 
                width: '100%',
                maxWidth: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </select>
          </div>
          
          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
              Interval (Months)
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value="6"
              readOnly
              disabled
              style={{ 
                width: '100%',
                maxWidth: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                cursor: 'not-allowed'
              }}
            />
            <small style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px', display: 'block' }}>
              Fixed at 6 months for blood donation safety
            </small>
          </div>
          
          <div style={{ minWidth: 0 }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
              SMS Sender ID
            </label>
            <input
              type="text"
              maxLength="11"
              value={settings.reminder_sender_id}
              onChange={(e) => handleSettingsChange('reminder_sender_id', e.target.value)}
              placeholder="LiveOnBD"
              style={{ 
                width: '100%',
                maxWidth: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '20px', width: '100%' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#374151' }}>
            Message Template
          </label>
          <textarea
            rows="4"
            value={settings.reminder_message_template}
            onChange={(e) => handleSettingsChange('reminder_message_template', e.target.value)}
            placeholder="Use {donor_name} for personalization"
            style={{ 
              width: '100%',
              maxWidth: '100%',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
          <small style={{ color: '#6b7280', fontSize: '11px' }}>
            Use {'{donor_name}'} to personalize messages with donor names
          </small>
        </div>
        
        <button 
          className="dashboard-btn primary"
          onClick={saveSettings}
          disabled={settingsLoading}
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          {settingsLoading ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>

      {/* Donors Needing Reminders Section */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: 0, color: '#2d3748', fontSize: '16px', fontWeight: '600' }}>
            📋 Donors Needing Reminders ({donorsNeedingReminders.length})
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="dashboard-btn secondary"
              onClick={() => loadDonorsNeedingReminders()}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              🔄 Refresh
            </button>
            <button 
              className="dashboard-btn primary"
              onClick={sendAllReminders}
              disabled={loading || donorsNeedingReminders.length === 0}
              style={{ padding: '8px 16px', fontSize: '12px' }}
            >
              {loading ? 'Sending...' : `📤 Send All (${donorsNeedingReminders.length})`}
            </button>
          </div>
        </div>

        {donorsNeedingReminders.length > 0 ? (
          <div style={{ overflow: 'auto', width: '100%' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              minWidth: '600px'
            }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <input
                      type="checkbox"
                      checked={selectedDonors.size === donorsNeedingReminders.length && donorsNeedingReminders.length > 0}
                      onChange={selectAllDonors}
                    />
                  </th>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Donor ID</th>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Name</th>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Phone</th>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Email</th>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Last Reminder</th>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Next Due</th>
                  <th style={{ padding: '12px 8px', fontSize: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donorsNeedingReminders.map((donor) => (
                  <tr key={donor.donor_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="checkbox"
                        checked={selectedDonors.has(donor.donor_id)}
                        onChange={() => toggleDonorSelection(donor.donor_id)}
                      />
                    </td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>{donor.donor_id}</td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>{donor.name}</td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>{donor.phone}</td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>{donor.email}</td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>
                      {donor.last_reminder === '2000-01-01' ? 
                        <span style={{ color: '#6b7280' }}>Never</span> : 
                        new Date(donor.last_reminder).toLocaleDateString()
                      }
                    </td>
                    <td style={{ padding: '8px', fontSize: '12px' }}>
                      {new Date(donor.next_reminder_due).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '8px' }}>
                      <button
                        className="dashboard-btn primary"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                        onClick={() => sendSingleReminder(donor.donor_id)}
                      >
                        📤 Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>All caught up!</h4>
            <p style={{ margin: 0, fontSize: '14px' }}>No donors need reminders at this time.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorReminders;
