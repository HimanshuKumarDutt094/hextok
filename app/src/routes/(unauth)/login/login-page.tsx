import { useNavigate } from 'react-router';
const LoginPage = () => {
  const nav = useNavigate();
  return (
    <view className="flex-1 flex h-screen bg-gray-400  justify-center items-center">
      <text className="text-white  text-4xl">Login Page</text>
      <view bindtap={() => nav('/home')}>Go to Home</view>
    </view>
  );
};

export default LoginPage;
