import { format } from 'date-fns';
import { formatRelativeTime } from '../utils/formatters';

interface EventStreamProps {
  events: Event[];
  loading: boolean;
  error?: any;
  totalCount: number;
  onLoadMore?: () => void;
}

interface Event {
  id: number;
  sourceApp: string;
  sourceChain: string;
  timestamp: number;
  eventType: string;
  data: any;
  transactionHash: string;
}

export default function EventStream({ events, loading, error, totalCount, onLoadMore }: EventStreamProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Event Stream</h3>
          <p className="text-xs text-slate-400">{totalCount.toLocaleString()} events</p>
        </div>
        {onLoadMore && (
          <button
            onClick={onLoadMore}
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-200 hover:border-emerald-500/50 hover:text-emerald-100 transition"
          >
            Load more
          </button>
        )}
      </div>

      <div className="mt-4 max-h-[380px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Time</th>
              <th className="px-4 py-3 text-left font-medium">Event Type</th>
              <th className="px-4 py-3 text-left font-medium">App</th>
              <th className="px-4 py-3 text-left font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-slate-500">
                  Loading events…
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={4} className="px-4 py-4 text-center text-red-400">
                  Failed to load events
                </td>
              </tr>
            )}

            {!loading && !error && events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No events in the selected window.
                </td>
              </tr>
            )}

            {events.map((event) => (
              <tr key={event.id} className="border-t border-slate-800/60 hover:bg-slate-900/60 transition">
                <td className="px-4 py-3 text-slate-300">
                  <div>{format(new Date(event.timestamp), 'HH:mm:ss')}</div>
                  <div className="text-xs text-slate-500">{formatRelativeTime(event.timestamp)}</div>
                </td>
                <td className="px-4 py-3 text-emerald-200 font-semibold">{event.eventType}</td>
                <td className="px-4 py-3 text-slate-300">{event.sourceApp || '—'}</td>
                <td className="px-4 py-3 text-slate-400 truncate max-w-xs">
                  {typeof event.data === 'object' ? JSON.stringify(event.data) : String(event.data)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}