import React from 'react';
import { openFilePicker } from './file-picker';
import type { FileDescriptor } from './file-picker';

// Lightweight typed wrappers for custom Lynx elements so they behave nicely in JSX/TSX.
// These are thin components that forward props to the underlying intrinsic element.

type ExplorerInputProps = {
  id?: string;
  value?: string;
  placeholder?: string;
  maxLength?: number;
  type?: 'text' | 'password' | 'email' | 'number';
  disabled?: boolean;
  onInput?: (e: { detail: { value: string; cursor: number } }) => void;
  onFocus?: (e: { detail?: Record<string, unknown> }) => void;
  onBlur?: (e: { detail?: Record<string, unknown> }) => void;
  onChange?: (e: { detail?: Record<string, unknown> }) => void;
  style?: Record<string, unknown>;
  className?: string;
};

export const ExplorerInput: React.FC<ExplorerInputProps> = (props) => {
  const { onInput, onFocus, onBlur, onChange, ...rest } = props;
  return (
    <explorer-input
      {...(rest as unknown as Record<string, unknown>)}
      bindinput={onInput}
      bindfocus={onFocus}
      bindblur={onBlur}
      bindchange={onChange}
    />
  );
};

type MediaPlayerProps = {
  id?: string;
  src?: string;
  autoplay?: boolean;
  onPrepared?: (e: { detail?: Record<string, unknown> }) => void;
  onEnded?: (e: { detail?: Record<string, unknown> }) => void;
  onError?: (e: { detail?: Record<string, unknown> }) => void;
  style?: Record<string, unknown>;
};

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  onPrepared,
  onEnded,
  onError,
  ...rest
}) => {
  return (
    <media-player
      {...(rest as unknown as Record<string, unknown>)}
      bindprepared={onPrepared}
      bindended={onEnded}
      binderror={onError}
    />
  );
};

type ChartViewProps = {
  id?: string;
  data?: Array<Record<string, unknown>>;
  animate?: boolean;
  onPointSelect?: (e: { detail?: Record<string, unknown> }) => void;
  style?: Record<string, unknown>;
};

export const ChartView: React.FC<ChartViewProps> = ({
  onPointSelect,
  ...rest
}) => {
  return (
    <chart-view
      {...(rest as unknown as Record<string, unknown>)}
      bindpointSelect={onPointSelect}
    />
  );
};

export default { ExplorerInput, MediaPlayer, ChartView };

export const FilePickerButton: React.FC<{
  children?: React.ReactNode;
  multiple?: boolean;
  accepts?: string;
  includeBase64?: boolean;
  onSelect?: (files: FileDescriptor[]) => void;
}> = ({ children, multiple, accepts, includeBase64, onSelect }) => {
  const handleTap = async () => {
    const res = await openFilePicker({ multiple, accepts, includeBase64 });
    if (res && onSelect) onSelect(res);
  };

  return (
    <view bindtap={handleTap} style={{ padding: 8 }}>
      {children}
    </view>
  );
};
