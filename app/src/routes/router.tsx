import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { useAuth } from '../hooks/auth';
import LoginPage from './(unauth)/login/login-page';
import HomePage from './(auth)/home/home-page';
import LikedPage from './(auth)/liked/liked-page';
import ProfilePage from './(auth)/profile/profile-page';
import BottomTabs from './(auth)/home/bottom-tabs';

const Router = () => {
  console.log('router called');

  const { isLoading, isError, session } = useAuth();
  return (
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        {isLoading ? (
          <Route
            path="*"
            element={
              <view className="flex flex-1 justify-center items-center h-screen bg-gray-400">
                <text className="flex-1 text-4xl animate-spin">...</text>
              </view>
            }
          />
        ) : isError || !session ? (
          <Route path="*" element={<LoginPage />} />
        ) : (
          <Route element={<BottomTabs />}>
            <Route path="home" element={<HomePage />} />
            <Route path="liked" element={<LikedPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<HomePage />} />
          </Route>
        )}
      </Routes>
    </MemoryRouter>
  );
};

export default Router;
