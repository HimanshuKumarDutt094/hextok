import LikeButton from './like-button';
import lynxLinking from 'lynx-js-linking';
import { useState } from 'react';
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
  const [result, setResult] = useState<string | null>(null);

  const handle = async (name: string, fn: () => Promise<unknown>) => {
    setResult(`${name}: running...`);
    try {
      const res = await fn();
      const out = res === undefined ? 'ok' : JSON.stringify(res);
      setResult(`${name}: ${out}`);
      console.log(`${name} success`, res);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setResult(`${name}: error - ${message}`);
      console.error(`${name} error`, e);
    }
  };

  const testOpenURL = () =>
    handle('openURL', () => lynxLinking.openURL('https://example.com'));

  const testOpenSettings = () =>
    handle('openSettings', () => lynxLinking.openSettings());

  const testSendIntent = () =>
    handle('sendIntent', () =>
      lynxLinking.sendIntent('android.intent.action.VIEW', [
        { key: 'exampleKey', value: 'exampleValue' },
      ]),
    );

  const testShare = () =>
    handle('share', () =>
      lynxLinking.share('Check out hextok!', { dialogTitle: 'Share hextok' }),
    );
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
      <view>
        <text
          bindtap={() =>
            lynxLinking.share(`https://github.com/HimanshuKumarDutt094`, {
              dialogTitle: 'Hello from lynxLinking!',
            })
          }
        >
          Share this
        </text>
      </view>

      <view style={{ marginTop: '2px', alignItems: 'center' }}>
        <text
          bindtap={testOpenURL}
          style={{ color: invertHex(hexValue), marginTop: '6px' }}
        >
          Test openURL
        </text>

        <text
          bindtap={testOpenSettings}
          style={{ color: invertHex(hexValue), marginTop: '6px' }}
        >
          Test openSettings
        </text>

        <text
          bindtap={testSendIntent}
          style={{ color: invertHex(hexValue), marginTop: '6px' }}
        >
          Test sendIntent
        </text>

        <text
          bindtap={testShare}
          style={{ color: invertHex(hexValue), marginTop: '6px' }}
        >
          Test share
        </text>

        <text style={{ color: invertHex(hexValue), marginTop: '2px' }}>
          {result ?? 'No test run yet'}
        </text>
      </view>
    </view>
  );
};

export default HexCard;
