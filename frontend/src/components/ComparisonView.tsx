import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ComparisonView() {
  const data = [
    { name: 'Mon', AppA: 4000, AppB: 2400 },
    { name: 'Tue', AppA: 3000, AppB: 1398 },
    { name: 'Wed', AppA: 2000, AppB: 9800 },
    { name: 'Thu', AppA: 2780, AppB: 3908 },
    { name: 'Fri', AppA: 1890, AppB: 4800 },
    { name: 'Sat', AppA: 2390, AppB: 3800 },
    { name: 'Sun', AppA: 3490, AppB: 4300 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold">Performance Comparison</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-400">Current App</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-400">Baseline</span>
            </div>
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.9)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="AppA" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="AppB" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-6">Key Differences</h3>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Transaction Volume</span>
              <span className="text-emerald-400">+24.5%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-[75%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Gas Efficiency</span>
              <span className="text-blue-400">+12.2%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[60%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">User Retention</span>
              <span className="text-purple-400">-3.1%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 w-[45%]" />
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h4 className="font-medium text-white mb-2">Insight</h4>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your application is outperforming the baseline in transaction volume but lagging slightly in retention metrics. Consider optimizing gas costs for smaller transactions.
          </p>
        </div>
      </div>
    </div>
  );
}
