import React from 'react';
import { LineSpinner } from 'ldrs/react';
import 'ldrs/react/LineSpinner.css';
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
      <LineSpinner
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