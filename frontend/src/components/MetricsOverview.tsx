import { useQuery } from '@apollo/client';
import { APPLICATION_METRICS_QUERY } from '../graphql/queries';
import { TrendingUp, Activity, Users } from 'lucide-react';

interface MetricsOverviewProps {
  applicationId: string;
}

export default function MetricsOverview({ applicationId }: MetricsOverviewProps) {
  const { data, loading } = useQuery(APPLICATION_METRICS_QUERY, {
    variables: { applicationId },
  });
  
  if (loading) return <div>Loading metrics...</div>;
  
  const metrics = data?.applicationMetrics || [];
  
  // Extract key metrics
  const eventCount = metrics.find((m: any) => m.key.includes('event_count'))?.value || 0;
  const activeUsers = metrics.find((m: any) => m.key.includes('active_users'))?.value || 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Events"
        value={eventCount}
        icon={<Activity className="w-6 h-6" />}
        trend="+12%"
      />
      <MetricCard
        title="Active Users"
        value={activeUsers}
        icon={<Users className="w-6 h-6" />}
        trend="+5%"
      />
      <MetricCard
        title="Avg Response Time"
        value="45ms"
        icon={<TrendingUp className="w-6 h-6" />}
        trend="-8%"
      />
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
}

function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-green-600 text-sm mt-1">{trend}</p>
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );
}



