import { useRef, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TimeSeriesChartProps {
  applicationId: string;
  metric: string;
  timeRange: { start: number; end: number };
}

export default function TimeSeriesChart({ applicationId, metric, timeRange }: TimeSeriesChartProps) {
  // Mock data for UI demo purposes until real backend connected perfectly with new ranges
  const data = generateMockData(20);

  return (
    <div className="w-full h-full min-h-[300px] relative">
      <defs>
        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
        </linearGradient>
      </defs>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="time"
            stroke="#475569"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#475569"
            tick={{ fill: '#64748b', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(2, 6, 23, 0.8)',
              borderColor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              color: '#fff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#10b981' }}
            cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#10b981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorValue)"
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function generateMockData(points: number) {
  const data = [];
  const now = new Date();
  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: `${time.getHours()}:00`,
      value: Math.floor(Math.random() * 50) + 20 + (Math.sin(i * 0.5) * 10)
    });
  }
  return data;
}
