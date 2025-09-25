import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import activeHome from '../../../assets/active-home.png';
import inactiveHome from '../../../assets/inactive-home.png';
import activeLiked from '../../../assets/active-liked.png';
import inactiveLiked from '../../../assets/inactive-liked.png';
const BottomTabs = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <page className="flex-1 ">
      {/* main area */}
      <view className="flex-1 h-[90vh] ">
        <Outlet />
      </view>

      {/* bottom bar */}
      <view className="flex flex-row justify-around items-center h-[10vh]">
        <image
          bindtap={() => navigate('/home')}
          src={location.pathname === '/home' ? activeHome : inactiveHome}
          className="size-[50px]"
        />

        <image
          bindtap={() => navigate('/liked')}
          src={location.pathname === '/liked' ? activeLiked : inactiveLiked}
          className="size-[50px]"
        />
      </view>
    </page>
  );
};
export default BottomTabs;
