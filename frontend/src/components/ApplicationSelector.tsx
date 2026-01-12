import { ApolloError, useQuery } from '@apollo/client';
import { MONITORED_APPS_QUERY } from '../graphql/queries';

interface ApplicationSelectorProps {
  selectedApp: string | null;
  onSelect: (appId: string | null) => void;
  apps?: any[];
  loading?: boolean;
  error?: ApolloError;
  onRefresh?: () => void;
}

export default function ApplicationSelector({
  selectedApp,
  onSelect,
  apps: providedApps,
  loading: providedLoading,
  error: providedError,
  onRefresh,
}: ApplicationSelectorProps) {
  const { data, loading, error, refetch } = useQuery(MONITORED_APPS_QUERY, {
    skip: !!providedApps,
  });

  const mergedApps = providedApps ?? data?.monitoredApplications ?? [];
  const isLoading = providedLoading ?? loading;
  const isError = providedError ?? error;

  if (isLoading) return <div className="px-4 py-2">Loading applications...</div>;
  if (isError)
    return (
      <div className="px-4 py-2 text-red-600 flex items-center gap-2">
        Error loading applications
        <button
          onClick={() => {
            if (onRefresh) onRefresh();
            if (!providedApps) refetch();
          }}
          className="text-blue-600 underline"
        >
          Retry
        </button>
      </div>
    );
  
  return (
    <select
      value={selectedApp || ''}
      onChange={(e) => onSelect(e.target.value || null)}
      className="px-4 py-2 border rounded-lg bg-white"
    >
      <option value="">Select Application</option>
      {mergedApps.map((app: any) => (
        <option key={app.applicationId} value={app.applicationId}>
          {app.applicationId}
        </option>
      ))}
    </select>
  );
}


