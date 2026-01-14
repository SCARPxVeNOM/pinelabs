import { useQuery, useMutation } from '@apollo/client';
import { MONITORED_APPS_QUERY } from '../graphql/queries';
import { ADD_MONITORED_APP, REMOVE_MONITORED_APP } from '../graphql/mutations';

export function useApplications() {
  const { data, loading, error, refetch } = useQuery(MONITORED_APPS_QUERY);
  
  const [addApp] = useMutation(ADD_MONITORED_APP, {
    refetchQueries: [{ query: MONITORED_APPS_QUERY }],
  });
  
  const [removeApp] = useMutation(REMOVE_MONITORED_APP, {
    refetchQueries: [{ query: MONITORED_APPS_QUERY }],
  });
  
  return {
    applications: data?.monitoredApplications || [],
    loading,
    error,
    addApp,
    removeApp,
    refetch,
  };
}




