import React from "react";
import "./HospitalDashboard.css";
import userImg from "../../assets/user.png";

const donors = [
  {
    name: "John Doe",
    bloodType: "A+",
    contact: "+1 (555) 123-4567",
    location: "New York, NY",
    lastDonation: "2023-10-15",
    status: "Available",
  },
  {
    name: "Jane Smith",
    bloodType: "O-",
    contact: "+1 (555) 987-6543",
    location: "Los Angeles, CA",
    lastDonation: "2023-11-01",
    status: "Available",
  },
  {
    name: "Robert Johnson",
    bloodType: "B+",
    contact: "+1 (555) 234-5678",
    location: "Chicago, IL",
    lastDonation: "2023-09-20",
    status: "Unavailable",
  },
  {
    name: "Maria Garcia",
    bloodType: "AB-",
    contact: "+1 (555) 345-6789",
    location: "Houston, TX",
    lastDonation: "2023-10-25",
    status: "Available",
  },
  {
    name: "David Lee",
    bloodType: "O+",
    contact: "+1 (555) 456-7890",
    location: "Phoenix, AZ",
    lastDonation: "2023-11-10",
    status: "Available",
  },
];

const bloodInventory = [
  { type: "A+", percent: 75 },
  { type: "A-", percent: 20 },
  { type: "B+", percent: 60 },
  { type: "B-", percent: 45 },
  { type: "AB+", percent: 15 },
  { type: "AB-", percent: 80 },
  { type: "O+", percent: 50 },
  { type: "O-", percent: 25 },
];

const HospitalDashboard = () => {
  return (
    <div className="hospital-dashboard-container">
      <aside className="sidebar">
        <div className="logo">LiveOn</div>
        <nav className="sidebar-nav">
          <ul>
            <li className="active"><span className="icon">🏠</span> Dashboard</li>
            <li><span className="icon">🧑‍💼</span> Donors</li>
            <li><span className="icon">📦</span> Inventory</li>
            <li><span className="icon">✉️</span> Requests</li>
          </ul>
        </nav>
      </aside>
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h1>Hospital Dashboard</h1>
          <div className="user-profile">
            <img src={userImg} alt="User" className="user-img" />
            <span className="user-name">Dr. Emily White</span>
          </div>
        </header>
        <section className="donor-availability-section">
          <h2>Donor Availability</h2>
          <table className="donor-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Blood Type</th>
                <th>Contact Info</th>
                <th>Location</th>
                <th>Last Donation</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((donor, idx) => (
                <tr key={idx}>
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
                  <td>
                    <button className="request-btn">Request Donation</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
      <aside className="dashboard-right-panel">
        <section className="blood-inventory">
          <h3>Blood Inventory</h3>
          <div className="inventory-list">
            {bloodInventory.map((item, idx) => (
              <div className="inventory-item" key={idx}>
                <span className="blood-type">{item.type}</span>
                <div className="inventory-bar-container">
                  <div
                    className={`inventory-bar ${item.percent < 20 ? "low" : "medium"}`}
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
                <span className="inventory-percent">{item.percent}%</span>
              </div>
            ))}
          </div>
        </section>
        <section className="emergency-requests">
          <h3>Emergency Requests</h3>
          <button className="emergency-btn">SEND EMERGENCY REQUEST</button>
          <div className="emergency-warning">
            <span className="warning-icon">⚠️</span> Low blood volume detected for O- and AB+
          </div>
        </section>
      </aside>
    </div>
  );
};

export default HospitalDashboard;
