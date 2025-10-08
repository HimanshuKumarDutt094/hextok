import LikeButton from './like-button';

function invertHex(hex: string): string {
  // Remove the leading '#' if present
  hex = hex.replace('#', '');

  // Convert to decimal numbers
  let r: string | number = 255 - parseInt(hex.substring(0, 2), 16);
  let g: string | number = 255 - parseInt(hex.substring(2, 4), 16);
  let b: string | number = 255 - parseInt(hex.substring(4, 6), 16);

  // Convert back to hex and pad with 0 if needed
  r = r.toString(16).padStart(2, '0');
  g = g.toString(16).padStart(2, '0');
  b = b.toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

const HexCard = ({
  id,
  hexValue,
  isLiked,
  likeCount,
}: {
  id: string;
  hexValue: string;
  isLiked: boolean;
  likeCount?: number;
}) => {
  return (
    <view
      className={`h-[100vh] w-[100vw] bg-[${hexValue}]`}
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: hexValue,
      }}
    >
      <LikeButton isLiked={isLiked} hexId={id} />
      <text style={{ color: invertHex(hexValue), marginTop: '8px' }}>
        {likeCount ?? 0} likes
      </text>
      <text
        style={{
          color: invertHex(hexValue),
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        {id}
      </text>
      <text
        style={{
          color: invertHex(hexValue),
          fontSize: '24px',
          fontWeight: 'bold',
        }}
      >
        {hexValue}
      </text>
    </view>
  );
};

export default HexCard;
