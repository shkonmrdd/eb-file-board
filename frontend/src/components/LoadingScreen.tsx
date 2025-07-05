import React from 'react';

const LoadingScreen: React.FC = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#888',
    }}
  >
    Loading board...
  </div>
);

export default LoadingScreen; 