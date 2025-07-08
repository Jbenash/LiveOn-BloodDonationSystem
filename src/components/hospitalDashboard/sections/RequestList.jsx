import React, { useEffect, useState } from 'react';
import './RequestList.css';

const statusColor = (status) => {
  if (status === 'Pending') return { color: '#ff9900' };
  if (status === 'Fulfilled') return { color: '#13b02d' };
  if (status === 'Rejected') return { color: '#ff2d2d' };
  return {};
};

const badgeClass = (priority) =>
  priority === 'URGENT' ? 'request-badge urgent' : 'request-badge normal';

const RequestList = () => {
  const [requests, setRequests] = useState([]);

  // Replace this with your real fetch logic
  useEffect(() => {
    // Example data, replace with fetch from your backend
    setRequests([
      {
        id: 1,
        bloodType: 'A+',
        quantity: 2,
        status: 'Pending',
        requestedOn: '2023-10-26',
        priority: 'URGENT',
      },
      {
        id: 2,
        bloodType: 'O-',
        quantity: 5,
        status: 'Fulfilled',
        requestedOn: '2023-10-25',
        priority: 'NORMAL',
      },
      {
        id: 3,
        bloodType: 'B+',
        quantity: 1,
        status: 'Rejected',
        requestedOn: '2023-10-24',
        priority: 'NORMAL',
      },
    ]);
  }, []);

  return (
    <div className="requests-section">
      <div className="requests-header">
        <h2>Blood Requests</h2>
        <button className="create-request-btn">
          + Create New Request
        </button>
      </div>
      <div className="requests-list">
        {requests.map((req) => (
          <div className="request-card" key={req.id}>
            <div className="request-card-header">
              <div className="request-title">
                Request for {req.bloodType} Blood
              </div>
              <span className={badgeClass(req.priority)}>
                {req.priority}
              </span>
            </div>
            <div className="request-details">
              <div>
                <b>Quantity:</b> {req.quantity} Unit{req.quantity > 1 ? 's' : ''}
              </div>
              <div>
                <b>Status:</b>{' '}
                <span style={statusColor(req.status)}>{req.status}</span>
              </div>
              <div>
                <b>Requested On:</b> {req.requestedOn}
              </div>
            </div>
            <button className="view-details-btn">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestList;