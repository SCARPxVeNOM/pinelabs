import { useQuery } from '@apollo/client';
import { EVENTS_QUERY } from '../graphql/queries';

export function useEvents(filters?: any, pagination?: any) {
  const { data, loading, error, fetchMore } = useQuery(EVENTS_QUERY, {
    variables: { filters, pagination },
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



