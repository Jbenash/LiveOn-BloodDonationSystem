import React, { useState, useEffect } from 'react';

const DonorRemindersTest = () => {
  const [testResults, setTestResults] = useState('Testing...');

  useEffect(() => {
    testAPIs();
  }, []);

  const testAPIs = async () => {
    let results = 'API Test Results:\n\n';

    try {
      // Test settings
      results += '1. Testing Settings API...\n';
      const settingsResponse = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=settings', {
        credentials: 'include'
      });
      const settingsData = await settingsResponse.json();

      if (settingsData.success) {
        results += '✅ Settings API working\n';
        results += `Settings loaded: ${Object.keys(settingsData.data).length} items\n\n`;
      } else {
        results += `❌ Settings API failed: ${settingsData.message}\n\n`;
      }

      // Test stats
      results += '2. Testing Stats API...\n';
      const statsResponse = await fetch('http://localhost/Liveonv2/backend_api/controllers/donor_reminders.php?action=stats&days=30', {
        credentials: 'include'
      });
      const statsData = await statsResponse.json();

      if (statsData.success) {
        results += '✅ Stats API working\n';
        results += `Stats loaded: ${Object.keys(statsData.data).length} items\n\n`;
      } else {
        results += `❌ Stats API failed: ${statsData.message}\n\n`;
      }

    } catch (error) {
      results += `❌ Network error: ${error.message}\n`;
    }

    setTestResults(results);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Donor Reminders API Test</h2>
      <pre style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px' }}>
        {testResults}
      </pre>
      <button onClick={testAPIs} style={{ marginTop: '10px', padding: '10px 20px' }}>
        Re-test APIs
      </button>
    </div>
  );
};

export default DonorRemindersTest;
