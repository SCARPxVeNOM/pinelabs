import { useQuery } from '@apollo/client';
import { APPLICATION_METRICS_QUERY } from '../graphql/queries';

export function useMetrics(applicationId: string) {
  const { data, loading, error, refetch } = useQuery(APPLICATION_METRICS_QUERY, {
    variables: { applicationId },
    pollInterval: 5000,
    skip: !applicationId,
  });
  
  return {
    metrics: data?.applicationMetrics || [],
    loading,
    error,
    refetch,
  };
}
