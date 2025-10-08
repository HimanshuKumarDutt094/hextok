import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/auth';
import { API_BASE } from '../../../config';
import redHeart from '../../../assets/redHeart.png';
import whiteHeart from '../../../assets/whiteHeart.png';
const LikeButton = ({
  isLiked,
  hexId,
}: {
  isLiked: boolean;
  hexId: string;
}) => {
  const { authToken } = useAuth();
  const queryClient = useQueryClient();
  const likeMutation = useMutation({
    mutationKey: ['like-hex', hexId],
    mutationFn: async (hexId: string) => {
      const res = await fetch(`${API_BASE}/api/v1/likes/like/${hexId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        throw new Error('Failed to like hex');
      }
      return res.json();
    },
    onSettled: () => {
      // refresh the home feed and the specific hex detail if used elsewhere
      queryClient.invalidateQueries({ queryKey: ['hexColors'] });
      queryClient.invalidateQueries({ queryKey: ['hexColors', hexId] });
    },
  });
  const onTap = () => {
    likeMutation.mutate(hexId);
  };
  return (
    <view className="like-icon" bindtap={onTap}>
      {isLiked && <view className="circle" />}
      {isLiked && <view className="circle circleAfter" />}
      <image src={isLiked ? redHeart : whiteHeart} className="heart-love" />
    </view>
  );
};

export default LikeButton;
