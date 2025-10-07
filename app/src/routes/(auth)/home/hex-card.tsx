import React from 'react';

const HexCard = ({ id, hexValue }: { id: string; hexValue: string }) => {
  return (
    <view
      className={`h-[100vh] w-[100vw] bg-[${hexValue}]`}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: hexValue,
      }}
    >
      <text>{id}</text>
      <text>{hexValue}</text>
    </view>
  );
};

export default HexCard;
