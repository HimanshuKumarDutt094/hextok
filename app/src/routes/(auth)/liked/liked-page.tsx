import { useState } from '@lynx-js/react';
import { openFilePicker } from '../../../native-elements/file-picker';

const LikedPage = () => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  return (
    <view className="flex-1 px-2    justify-center items-center">
      <text className="text-4xl">domains.Liked Page</text>
      <text>hii</text>
      <view bindtap={() => openFilePicker({})}>
        <text>open file picker</text>
      </view>
    </view>
  );
};

export default LikedPage;
