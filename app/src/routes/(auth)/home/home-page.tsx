import React from 'react';
import { useLocation } from 'react-router';
import { useAuth } from '../../../hooks/auth';

const HomePage = () => {
  const p = useLocation();
  const { session } = useAuth();
  console.log('home page', p);

  return (
    <view className="flex-1 px-2    justify-center items-center">
      <text className="text-4xl">Home</text>
      <text className="text-2xl mt-4">Welcome, {session?.name}</text>
    </view>
  );
};

export default HomePage;
