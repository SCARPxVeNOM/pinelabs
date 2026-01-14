import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { COMPARE_APPS_QUERY, MONITORED_APPS_QUERY } from '../graphql/queries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ComparisonView() {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedMetrics] = useState<string[]>(['event_count']);

  const { data: appsData } = useQuery(MONITORED_APPS_QUERY);
  const { data: comparisonData, loading } = useQuery(COMPARE_APPS_QUERY, {
    variables: {
      applicationIds: selectedApps,
      metrics: selectedMetrics,
    },
    skip: selectedApps.length === 0,
  });

  const apps = appsData?.monitoredApplications || [];

  const chartData = selectedApps.map((appId) => ({
    name: appId,
    ...Object.fromEntries(
      selectedMetrics.map((metric) => [
        metric,
        comparisonData?.compareApplications?.relativePerformance?.[appId] || 0,
      ]),
    ),
  }));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">App Comparison</h3>
        <p className="text-xs text-slate-500">Compare relative performance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {apps.map((app: any) => (
          <label
            key={app.applicationId}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
              selectedApps.includes(app.applicationId)
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                : 'border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-700'
            }`}
          >
            <input
              type="checkbox"
              className="accent-emerald-500"
              checked={selectedApps.includes(app.applicationId)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedApps([...selectedApps, app.applicationId]);
                } else {
                  setSelectedApps(selectedApps.filter((id) => id !== app.applicationId));
                }
              }}
            />
            <span className="truncate">{app.applicationId}</span>
          </label>
        ))}
      </div>

      {selectedApps.length === 0 && (
        <p className="text-sm text-slate-500">Select apps to view comparison.</p>
      )}

      {selectedApps.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading comparison…</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                {selectedMetrics.map((metric, idx) => (
                  <Bar
                    key={metric}
                    dataKey={metric}
                    fill={`hsl(${idx * 60}, 70%, 60%)`}
                    radius={[6, 6, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
}