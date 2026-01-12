import { useQuery } from '@apollo/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  });
  
  if (loading) return <div className="bg-white p-6 rounded-lg shadow">Loading chart...</div>;
  
  const chartData = (data?.timeSeries || []).map((point: any) => ({
    timestamp: format(new Date(point.timestamp), 'HH:mm'),
    value: typeof point.value === 'object' ? point.value.value || 0 : point.value || 0,
  }));
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Event Activity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}



