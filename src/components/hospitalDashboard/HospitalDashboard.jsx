import React, { useState, useEffect } from "react";
import "./HospitalDashboard.css";
import userImg from "../../assets/user.png";

const HospitalDashboard = () => {
  const [donors, setDonors] = useState([]);
  const [bloodInventory, setBloodInventory] = useState([]);
  const [hospitalName, setHospitalName] = useState("");

  useEffect(() => {
    fetch("http://localhost/Liveonv2/backend_api/hospital_dashboard.php", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setHospitalName(data.name);
        setDonors(data.donors);
        setBloodInventory(data.bloodInventory);
      });
  }, []);

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
            <span className="user-name">{hospitalName || "Hospital"}</span>
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
              {donors.length > 0 ? (
                donors.map((donor, idx) => (
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
                ))
              ) : (
                <tr><td colSpan="7">No donors available</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
      <aside className="dashboard-right-panel">
        <section className="blood-inventory">
          <h3>Blood Inventory</h3>
          <div className="inventory-list">
            {bloodInventory.length > 0 ? (
              bloodInventory.map((item, idx) => (
                <div className="inventory-item" key={idx}>
                  <span className="blood-type">{item.type}</span>
                  <div className="inventory-bar-container">
                    <div
                      className={`inventory-bar ${item.units < 4 ? "low" : "medium"}`}
                      style={{ width: `${Math.min(100, (item.units / 20) * 100)}%` }}
                    ></div>
                  </div>
                  <span className="inventory-units">{item.units} units</span>
                </div>
              ))
            ) : (
              <div>No blood inventory data</div>
            )}
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
