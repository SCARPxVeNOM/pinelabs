import { useMemo, useState } from 'react';
import {
  ActivitySquare,
  Bell,
  LayoutDashboard,
  Search,
  Settings,
  TreePine,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import ApplicationSelector from './components/ApplicationSelector';

type TimeRangeKey = '1h' | '24h' | '7d' | '30d';

function App() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [timeRangeKey, setTimeRangeKey] = useState<TimeRangeKey>('7d');
  const [eventType, setEventType] = useState<string>('all');

  const timeRange = useMemo(() => {
    const now = Date.now();
    const ranges: Record<TimeRangeKey, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return { start: now - ranges[timeRangeKey], end: now };
  }, [timeRangeKey]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-slate-900/70 backdrop-blur">
          <div className="px-5 py-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <TreePine className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">Pine Analytics</p>
              <p className="text-xs text-slate-400">Realtime Insights</p>
            </div>
          </div>
          <nav className="px-3 space-y-1">
            {['Dashboard', 'Transactions', 'Events', 'Apps', 'Settings'].map((item) => (
              <button
                key={item}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  item === 'Dashboard'
                    ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                    : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                {item === 'Dashboard' && <LayoutDashboard className="h-4 w-4" />}
                {item === 'Transactions' && <ActivitySquare className="h-4 w-4" />}
                {item === 'Events' && <ActivitySquare className="h-4 w-4" />}
                {item === 'Apps' && <LayoutDashboard className="h-4 w-4" />}
                {item === 'Settings' && <Settings className="h-4 w-4" />}
                <span>{item}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 px-6 py-4">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-300 flex-1 min-w-[240px]">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  placeholder="Search across apps, events, contracts..."
                />
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-200 transition">
                  Refresh
                </button>
                <button className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-slate-200 hover:border-emerald-500/50 hover:text-emerald-200 transition">
                  <Bell className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 px-6 pb-4">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                <span className="text-slate-400">Select Apps:</span>
                <ApplicationSelector
                  selectedApp={selectedApp}
                  onSelect={setSelectedApp}
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                <span className="text-slate-400">Timeframe:</span>
                {(['1h', '24h', '7d', '30d'] as TimeRangeKey[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setTimeRangeKey(key)}
                    className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                      timeRangeKey === key
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {key.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200">
                <span className="text-slate-400">Event Type:</span>
                {['all', 'transfers', 'swaps', 'mints'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setEventType(type)}
                    className={`rounded-md px-2 py-1 text-xs font-semibold capitalize transition ${
                      eventType === type
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-6 py-6">
            <Dashboard
              selectedApp={selectedApp}
              onSelectApp={setSelectedApp}
              timeRange={timeRange}
              eventType={eventType}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;