import React, { useEffect, useState } from 'react';
import './InventoryList.css';

const getBarColor = (units) => {
  if (units < 20) return '#ff2d2d';      // Red
  if (units < 60) return '#ff9900';      // Orange
  return '#22c55e';                      // Green
};

const InventoryList = () => {
  const [bloodInventory, setBloodInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost/liveonv2/backend_api/hospital_dashboard.php', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        setBloodInventory(data.bloodInventory || []);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching inventory:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading inventory...</div>;

  return (
    <div className="inventory-section">
      <h2 className="inventory-title">Blood Inventory</h2>
      <div className="inventory-cards-grid">
        {bloodInventory.length > 0 ? (
          bloodInventory.map((item, idx) => (
            <div key={idx} className="inventory-card">
              <div className="inventory-blood-type">{item.type}</div>
              <div className="inventory-bar-bg">
                <div
                  className="inventory-bar-fill"
                  style={{
                    width: `${Math.min(100, (item.units / 100) * 100)}%`,
                    background: getBarColor(item.units)
                  }}
                ></div>
              </div>
              <div className="inventory-units">{item.units} Units Available</div>
              <button className="inventory-select-btn">Select</button>
            </div>
          ))
        ) : (
          <div>No blood inventory data available</div>
        )}
      </div>
    </div>
  );
};

export default InventoryList;
