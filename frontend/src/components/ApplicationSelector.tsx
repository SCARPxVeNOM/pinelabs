import { ChevronDown, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ApplicationSelectorProps {
  selectedApp: string | null;
  onSelect: (appId: string | null) => void;
  apps: any[];
  loading: boolean;
  error: any;
  onRefresh: () => void;
}

export default function ApplicationSelector({
  selectedApp,
  onSelect,
  apps,
  loading,
  error,
  onRefresh,
}: ApplicationSelectorProps) {
  return (
    <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-emerald-400">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
            Active Application
          </label>
          <div className="relative group">
            <select
              value={selectedApp || ''}
              onChange={(e) => onSelect(e.target.value || null)}
              className="appearance-none bg-transparent text-xl font-bold text-white pr-8 outline-none cursor-pointer hover:text-emerald-400 transition-colors"
              disabled={loading}
            >
              <option value="" className="bg-slate-900 text-slate-400">Select Application...</option>
              {apps.map((app) => (
                <option key={app.applicationId} value={app.applicationId} className="bg-slate-900">
                  {app.applicationId.substring(0, 8)}...{app.applicationId.substring(app.applicationId.length - 8)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none group-hover:text-emerald-400 transition-colors" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 border-l border-slate-700/50 pl-4">
        <div className="text-right hidden md:block">
          <p className="text-xs text-slate-400">Chain Status</p>
          <div className="flex items-center gap-1.5 justify-end mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-emerald-400">Synced</span>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <p className="text-xs text-red-400 absolute bottom-1 right-4">Connection Error: {error.message}</p>}
    </div>
  );
}
