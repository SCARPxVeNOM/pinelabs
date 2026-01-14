import { useQuery } from '@apollo/client';
import { EVENTS_QUERY } from '../graphql/queries';

interface UseEventsOptions {
  pollInterval?: number;
}

export function useEvents(filters?: any, pagination?: any, options?: UseEventsOptions) {
  const { data, loading, error, fetchMore } = useQuery(EVENTS_QUERY, {
    variables: { filters, pagination },
    pollInterval: options?.pollInterval ?? 0,
  });
  
  const loadMore = () => {
    if (data?.events?.hasMore) {
      fetchMore({
        variables: {
          pagination: {
            offset: data.events.events.length,
            limit: pagination?.limit || 100,
          },
        },
      });
    }
  };
  
  return {
    events: data?.events?.events || [],
    totalCount: data?.events?.totalCount || 0,
    hasMore: data?.events?.hasMore || false,
    loading,
    error,
    loadMore,
  };
}
