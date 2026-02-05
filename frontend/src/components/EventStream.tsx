import { ArrowRight, Box } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EventStreamProps {
  events: any[];
  loading: boolean;
  error: any;
  totalCount: number;
  onLoadMore: () => void;
}

export default function EventStream({
  events,
  loading,
  error,
  totalCount,
  onLoadMore,
}: EventStreamProps) {
  return (
    <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Event Stream
        </h3>
        <span className="px-2 py-1 bg-slate-800 rounded-md text-xs text-slate-400 font-mono">
          {totalCount} events
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {events.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <Box className="w-8 h-8 opacity-50" />
            <p className="text-sm">No events captured yet</p>
          </div>
        )}

        {events.map((event) => (
          <div
            key={event.id}
            className="group p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {event.action || 'TRANSFER'}
                </span>
                <span className="text-xs text-slate-500 font-mono">#{event.id}</span>
              </div>
              <span className="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">
                {formatDistanceToNow(new Date(), { addSuffix: true })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300 font-mono">
              <span className="truncate max-w-[100px] opacity-70">{event.source || '0x4f...2a1'}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="truncate max-w-[100px] opacity-70">{event.dest || '0x9b...c4e'}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <button
          onClick={onLoadMore}
          className="w-full py-2 text-xs font-medium text-slate-500 hover:text-emerald-400 hover:bg-slate-800/50 rounded-lg transition-colors"
        >
          Load Older Events
        </button>
      </div>
    </div>
  );
}
