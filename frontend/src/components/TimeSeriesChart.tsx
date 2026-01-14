import { useQuery } from '@apollo/client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TIME_SERIES_QUERY } from '../graphql/queries';
import { format } from 'date-fns';

interface TimeSeriesChartProps {
  applicationId: string;
  metric: string;
  timeRange: { start: number; end: number };
}

export default function TimeSeriesChart({ applicationId, metric, timeRange }: TimeSeriesChartProps) {
  const { data, loading } = useQuery(TIME_SERIES_QUERY, {
    variables: {
      metric: `${applicationId}_${metric}`,
      timeRange,
      granularity: 'HOUR',
    },
    skip: !applicationId,
  });

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg text-slate-400">
        Loading chart…
      </div>
    );
  }

  const chartData = (data?.timeSeries || []).map((point: any) => ({
    timestamp: format(new Date(point.timestamp), 'MMM dd HH:mm'),
    value: typeof point.value === 'object' ? point.value.value || 0 : point.value || 0,
  }));

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Transactions Over Time</h3>
        <span className="text-xs text-slate-400">Live</span>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="timestamp" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 1, stroke: '#22c55e', fill: '#0f172a' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
