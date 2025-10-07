import { useQuery } from '@tanstack/react-query';
import { authenticatedFetcher, queryKeys } from '../../../query';
import { API_BASE } from '../../../config';
import { type HexResponse } from '../../../schemas/types';
import { useAuth } from '../../../hooks/auth';
import HexCard from './hex-card';

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
        <HexCard id="loading" hexValue="#FFFF55" />
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
    <view className="flex-1 px-2 pb-40 justify-center items-center">
      <list
        className="h-full w-full"
        scroll-orientation="vertical"
        list-type="single"
        span-count={2}
        style={{
          width: '100%',
          height: '100vh',
        }}
      >
        {data.map((hex) => (
          <list-item
            item-key={`list-item-${hex.id}`}
            key={`list-item-${hex.id}`}
          >
            <HexCard key={hex.id} id={hex.id} hexValue={hex.hexValue} />
          </list-item>
        ))}
      </list>
    </view>
  );
};

export default HomePage;
