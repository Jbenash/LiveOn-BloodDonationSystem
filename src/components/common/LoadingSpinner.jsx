import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = "40", 
  stroke = "3", 
  speed = "1", 
  color = "black",
  className = "",
  text = "Loading..."
}) => {
  return (
    <div className={`loading-spinner-container ${className}`}>
      <div className="spinner"></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner; 