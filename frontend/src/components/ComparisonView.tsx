import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { COMPARE_APPS_QUERY, MONITORED_APPS_QUERY } from '../graphql/queries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ComparisonView() {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedMetrics] = useState<string[]>(['event_count']);
  
  const { data: appsData } = useQuery(MONITORED_APPS_QUERY);
  const { data: comparisonData } = useQuery(COMPARE_APPS_QUERY, {
    variables: {
      applicationIds: selectedApps,
      metrics: selectedMetrics,
    },
    skip: selectedApps.length === 0,
  });
  
  const apps = appsData?.monitoredApplications || [];
  
  // Transform data for chart
  const chartData = selectedApps.map(appId => ({
    name: appId,
    ...Object.fromEntries(
      selectedMetrics.map(metric => [
        metric,
        comparisonData?.compareApplications?.relativePerformance?.[appId] || 0
      ])
    ),
  }));
  
  return (
    <div className="space-y-6">
      {/* App selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Select Applications to Compare</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {apps.map((app: any) => (
            <label key={app.applicationId} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedApps.includes(app.applicationId)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedApps([...selectedApps, app.applicationId]);
                  } else {
                    setSelectedApps(selectedApps.filter(id => id !== app.applicationId));
                  }
                }}
              />
              <span>{app.applicationId}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Comparison chart */}
      {selectedApps.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedMetrics.map((metric, idx) => (
                <Bar key={metric} dataKey={metric} fill={`hsl(${idx * 60}, 70%, 50%)`} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

