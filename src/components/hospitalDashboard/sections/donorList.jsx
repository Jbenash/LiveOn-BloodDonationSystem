import React, { useEffect, useState } from 'react';

const DonorList = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost/liveonv2/backend_api/hospital_dashboard.php', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setDonors(data.donors || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading donors...</div>;

  return (
    <div className="donor-availability-section">
      <h2>All Donors</h2>
      <table className="donor-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Blood Type</th>
            <th>Contact</th>
            <th>Location</th>
            <th>Last Donation</th>
            <th>Status</th>
            <th>Lives Saved</th>
          </tr>
        </thead>
        <tbody>
          {donors.map((donor) => (
            <tr key={donor.donorId}>
              <td>{donor.name}</td>
              <td>{donor.bloodType}</td>
              <td>{donor.contact}</td>
              <td>{donor.location}</td>
              <td>{donor.lastDonation}</td>
              <td>
                {donor.status === "Available" ? (
                  <span className="status available">Available</span>
                ) : (
                  <span className="status unavailable">Unavailable</span>
                )}
              </td>
              <td>{donor.livesSaved}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DonorList;