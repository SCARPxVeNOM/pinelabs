import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

interface ApplicationsPanelProps {
  selectedApp: string | null;
  onSelect: (appId: string | null) => void;
}

export default function ApplicationsPanel({ selectedApp, onSelect }: ApplicationsPanelProps) {
  // Mock data for UI purposes since we don't have the real list here yet
  const recentApps = [
    { id: 'app_1', name: 'Uniswap V3', transactions: 124500, growth: 12.5 },
    { id: 'app_2', name: 'Aave Protocol', transactions: 85200, growth: 8.2 },
    { id: 'app_3', name: 'Curve Finance', transactions: 64100, growth: -2.4 },
    { id: 'app_4', name: 'Lido Staking', transactions: 42800, growth: 15.3 },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Your Applications</h3>
        <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">View All</button>
      </div>

      <div className="space-y-3">
        {recentApps.map((app) => (
          <button
            key={app.id}
            onClick={() => onSelect(app.id)}
            className={`w-full group p-3 rounded-xl border transition-all flex items-center justify-between ${selectedApp === app.id
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
              }`}
          >
            <div>
              <p className={`font-medium text-sm mb-1 ${selectedApp === app.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                {app.name}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                {formatNumber(app.transactions)} txs
              </p>
            </div>

            <div className={`flex items-center gap-1 text-xs font-semibold ${app.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <TrendingUp className="w-3 h-3" />
              {app.growth >= 0 ? '+' : ''}{app.growth}%
            </div>
          </button>
        ))}
      </div>

      <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 transition-all flex items-center justify-center gap-2 text-sm font-medium group">
        <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black group-hover:border-transparent transition-all">
          +
        </div>
        Deploy New Contract
      </button>
    </div>
  );
}
