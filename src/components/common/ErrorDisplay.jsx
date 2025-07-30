import React from 'react';
import './ErrorDisplay.css';

const ErrorDisplay = ({ error, onRetry, title = "Error", buttonText = "Retry" }) => {
  return (
    <div className="error-display-container">
      <div className="error-display-content">
        <div className="error-icon">⚠️</div>
        <h2 className="error-title">{title}</h2>
        <p className="error-message">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="error-retry-button">
            {buttonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay; 