import React from 'react';
import { ring } from 'ldrs';
import './LoadingSpinner.css';

// Register the loader
ring.register();

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
      <l-ring
        size={size}
        stroke={stroke}
        speed={speed}
        color={color}
      />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner; 