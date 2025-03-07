import React from 'react';
import { Outlet } from 'react-router';
import Header from '../components/Header';

const WithHeaderLayout: React.FC = () => {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
};

export default WithHeaderLayout;