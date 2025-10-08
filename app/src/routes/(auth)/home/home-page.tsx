import { useQuery } from '@tanstack/react-query';
import { authenticatedFetcher, queryKeys } from '../../../query';
import { API_BASE } from '../../../config';
import { type HexResponse } from '../../../schemas/types';
import { useAuth } from '../../../hooks/auth';
import HexCard from './hex-card';
import TiktokFeed from '../../../components/tiktok-feed';

const HomePage = () => {
  const { authToken } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.hexColors,
    queryFn: () => {
      if (!authToken) {
        throw new Error('No auth token available');
      }
      return authenticatedFetcher<HexResponse[]>(
        `${API_BASE}/api/v1/hexes`,
        authToken,
      );
    },
    enabled: !!authToken, // Only run query when we have a token
  });
  if (isLoading)
    return (
      <view>
        <HexCard id="loading" hexValue="#FFFF" isLiked={false} />
      </view>
    );
  if (error || !data)
    return (
      <view className="pt-20">
        <text>Error: {(error as Error).message}</text>
      </view>
    );

  console.log('Fetched hex colors:', data);
  return (
    <view className="flex-1  pb-40 justify-center items-center">
      <TiktokFeed className="w-full h-full">
        {data.map((hex) => (
          <HexCard
            key={hex.id}
            id={hex.id}
            hexValue={hex.hexValue}
            isLiked={hex.isLiked ?? false}
            likeCount={hex.likeCount}
          />
        ))}
      </TiktokFeed>
    </view>
  );
};

export default HomePage;
