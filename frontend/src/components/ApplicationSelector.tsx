import { ApolloError, useQuery } from '@apollo/client';
import { ChevronDown, RefreshCw } from 'lucide-react';
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

  if (isLoading)
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-1">
        Loading apps…
      </div>
    );

  if (isError)
    return (
      <button
        onClick={() => {
          if (onRefresh) onRefresh();
          if (!providedApps) refetch();
        }}
        className="flex items-center gap-2 rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2 text-xs text-red-200"
      >
        Failed to load apps
        <RefreshCw className="h-3 w-3" />
      </button>
    );

  return (
    <div className="relative">
      <select
        value={selectedApp || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="appearance-none rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 pr-8 text-sm text-slate-100 outline-none transition hover:border-emerald-500/50 focus:border-emerald-500"
      >
        <option className="bg-slate-900" value="">
          All Apps
        </option>
        {mergedApps.map((app: any) => (
          <option className="bg-slate-900" key={app.applicationId} value={app.applicationId}>
            {app.applicationId}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}