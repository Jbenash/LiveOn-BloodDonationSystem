import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './LoadingSpinnerExample.css';

const LoadingSpinnerExample = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFullPageLoading, setIsFullPageLoading] = useState(false);

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const simulateFullPageLoading = () => {
    setIsFullPageLoading(true);
    setTimeout(() => setIsFullPageLoading(false), 3000);
  };

  return (
    <div className="loading-example-container">
      <h2>LoadingSpinner Examples</h2>
      
      {/* Full Page Loading Example */}
      {isFullPageLoading && (
        <LoadingSpinner 
          size="60"
          stroke="5"
          speed="1"
          color="#ef4444"
          text="Loading full page..."
          className="full-page"
        />
      )}

      {/* Basic Loading Spinner */}
      <div className="example-section">
        <h3>Basic Loading Spinner</h3>
        <LoadingSpinner 
          size="40"
          stroke="3"
          speed="1"
          color="black"
          text="Loading..."
        />
      </div>

      {/* Custom Styled Loading Spinner */}
      <div className="example-section">
        <h3>Custom Styled Loading Spinner</h3>
        <LoadingSpinner 
          size="50"
          stroke="4"
          speed="1.5"
          color="#3b82f6"
          text="Processing data..."
        />
      </div>

      {/* Dark Theme Loading Spinner */}
      <div className="example-section dark-theme">
        <h3>Dark Theme Loading Spinner</h3>
        <LoadingSpinner 
          size="45"
          stroke="3"
          speed="1"
          color="#ffffff"
          text="Loading in dark mode..."
          className="dark"
        />
      </div>

      {/* Inline Loading Spinner */}
      <div className="example-section">
        <h3>Inline Loading Spinner</h3>
        <div className="inline-example">
          <span>Processing...</span>
          <LoadingSpinner 
            size="20"
            stroke="2"
            speed="1"
            color="#10b981"
            className="inline"
          />
        </div>
      </div>

      {/* Interactive Examples */}
      <div className="example-section">
        <h3>Interactive Examples</h3>
        <div className="button-group">
          <button onClick={simulateLoading} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Show Loading (3s)'}
          </button>
          <button onClick={simulateFullPageLoading} disabled={isFullPageLoading}>
            {isFullPageLoading ? 'Loading...' : 'Full Page Loading (3s)'}
          </button>
        </div>
        
        {isLoading && (
          <div className="interactive-loading">
            <LoadingSpinner 
              size="30"
              stroke="3"
              speed="1"
              color="#8b5cf6"
              text="Processing request..."
            />
          </div>
        )}
      </div>

      {/* Different Sizes */}
      <div className="example-section">
        <h3>Different Sizes</h3>
        <div className="size-examples">
          <LoadingSpinner size="20" stroke="2" color="#f59e0b" />
          <LoadingSpinner size="30" stroke="3" color="#10b981" />
          <LoadingSpinner size="40" stroke="4" color="#3b82f6" />
          <LoadingSpinner size="50" stroke="5" color="#ef4444" />
        </div>
      </div>

      {/* Different Speeds */}
      <div className="example-section">
        <h3>Different Speeds</h3>
        <div className="speed-examples">
          <div>
            <p>Slow (0.5)</p>
            <LoadingSpinner size="30" speed="0.5" color="#8b5cf6" />
          </div>
          <div>
            <p>Normal (1)</p>
            <LoadingSpinner size="30" speed="1" color="#3b82f6" />
          </div>
          <div>
            <p>Fast (2)</p>
            <LoadingSpinner size="30" speed="2" color="#10b981" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinnerExample; 