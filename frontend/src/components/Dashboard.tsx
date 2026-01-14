import { useEffect, useMemo, useState } from 'react';
import { Activity, Flame, Radio, Users } from 'lucide-react';
import ApplicationSelector from './ApplicationSelector';
import TimeSeriesChart from './TimeSeriesChart';
import EventStream from './EventStream';
import ComparisonView from './ComparisonView';
import ApplicationsPanel from './ApplicationsPanel';
import { useApplications } from '../hooks/useApplications';
import { useMetrics } from '../hooks/useMetrics';
import { useEvents } from '../hooks/useEvents';
import { formatNumber } from '../utils/formatters';

interface DashboardProps {
  selectedApp: string | null;
  onSelectApp: (appId: string | null) => void;
  timeRange: { start: number; end: number };
  eventType: string;
}

export default function Dashboard({
  selectedApp,
  onSelectApp,
  timeRange,
  eventType,
}: DashboardProps) {
  const { applications, loading, error, refetch } = useApplications();
  const [view, setView] = useState<'overview' | 'comparison'>('overview');

  const { metrics, loading: metricsLoading } = useMetrics(selectedApp || '');
  const {
    events,
    loading: eventsLoading,
    error: eventsError,
    loadMore,
    totalCount,
  } = useEvents(
    {
      applicationId: selectedApp || undefined,
      eventType: eventType === 'all' ? undefined : eventType,
      start: timeRange.start,
      end: timeRange.end,
    },
    { limit: 100 },
    { pollInterval: 5000 },
  );

  // Auto-select first app when available
  useEffect(() => {
    if (!selectedApp && applications.length > 0) {
      onSelectApp(applications[0].applicationId);
    }
  }, [applications, selectedApp, onSelectApp]);

  const topContracts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((evt: any) => {
      const key = evt.sourceApp || evt.eventType || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <ApplicationSelector
          selectedApp={selectedApp}
          onSelect={onSelectApp}
          apps={applications}
          loading={loading}
          error={error}
          onRefresh={refetch}
        />

        <div className="flex gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-1 text-sm">
          {['overview', 'comparison'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as 'overview' | 'comparison')}
              className={`rounded-md px-4 py-2 font-semibold capitalize transition ${
                view === v
                  ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/50'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'overview' && (
        <div className="space-y-6">
          {/* Stat cards */}
          <StatsRow metrics={metrics} loading={metricsLoading} />

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TimeSeriesChart
                applicationId={selectedApp || ''}
                metric="event_count"
                timeRange={timeRange}
              />
            </div>
            <TopContractsCard topContracts={topContracts} loading={eventsLoading} />
          </div>

          {/* Events + key metrics */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <EventStream
                events={events}
                loading={eventsLoading}
                error={eventsError}
                totalCount={totalCount}
                onLoadMore={loadMore}
              />
            </div>
            <KeyMetricsPanel metrics={metrics} loading={metricsLoading} />
          </div>

          {/* Comparison + Applications management */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <ComparisonView />
            </div>
            <ApplicationsPanel selectedApp={selectedApp} onSelect={onSelectApp} />
          </div>
        </div>
      )}

      {view === 'comparison' && <ComparisonView />}
    </div>
  );
}

function StatsRow({ metrics, loading }: { metrics: any[]; loading: boolean }) {
  const cards = [
    {
      title: 'Total Transactions',
      value: getMetric(metrics, ['transactions', 'event_count'], 0),
      change: '+12.5% This Week',
      color: 'text-emerald-300',
    },
    {
      title: 'Active Users',
      value: getMetric(metrics, ['active_users'], 0),
      change: 'Last 24 Hours',
      color: 'text-sky-300',
    },
    {
      title: 'Volume (USD)',
      value: getMetric(metrics, ['volume', 'usd'], 0),
      change: 'Past 7 Days',
      color: 'text-emerald-300',
      isCurrency: true,
    },
    {
      title: 'Unique Contracts',
      value: getMetric(metrics, ['unique_contracts', 'contracts'], 0),
      change: 'Deployed',
      color: 'text-indigo-300',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950/80 p-4 shadow-lg"
        >
          <p className="text-xs uppercase tracking-wide text-slate-400">{card.title}</p>
          <p className={`mt-2 text-3xl font-bold ${card.color}`}>
            {card.isCurrency ? `$${formatNumber(card.value)}` : formatNumber(card.value)}
          </p>
          <p className="text-xs text-emerald-400 mt-1">{loading ? 'Loading…' : card.change}</p>
        </div>
      ))}
    </div>
  );
}

function TopContractsCard({ topContracts, loading }: { topContracts: any[]; loading: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Top Contracts</h3>
        <Flame className="h-4 w-4 text-amber-400" />
      </div>
      <div className="mt-4 space-y-3">
        {loading && <p className="text-sm text-slate-500">Loading contracts…</p>}
        {!loading && topContracts.length === 0 && (
          <p className="text-sm text-slate-500">No contract activity in this window.</p>
        )}
        {topContracts.map((c, idx) => (
          <div
            key={c.name}
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold flex items-center justify-center">
                {idx + 1}
              </div>
              <span className="text-sm text-slate-200">{c.name}</span>
            </div>
            <span className="text-sm font-semibold text-slate-100">{c.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyMetricsPanel({ metrics, loading }: { metrics: any[]; loading: boolean }) {
  const cards = [
    { title: 'Daily Active Users', icon: <Users className="h-4 w-4" />, key: ['active_users'] },
    { title: 'Transaction Volume', icon: <Activity className="h-4 w-4" />, key: ['volume', 'usd'] },
    { title: 'Gas Fees', icon: <Flame className="h-4 w-4" />, key: ['gas_fee', 'gas'] },
    { title: 'New Users', icon: <Radio className="h-4 w-4" />, key: ['new_users', 'users_new'] },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
      <h3 className="text-lg font-semibold text-white">Key Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{card.title}</span>
              <span className="text-slate-500">{card.icon}</span>
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-100">
              {loading ? '—' : formatNumber(getMetric(metrics, card.key, 0))}
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                style={{ width: `${Math.min(100, getMetric(metrics, card.key, 0))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getMetric(metrics: any[], keys: string[], fallback: number) {
  if (!metrics || metrics.length === 0) return fallback;
  const metric = metrics.find((m: any) => keys.some((k) => m.key?.toLowerCase().includes(k)));
  const val = typeof metric?.value === 'object' ? metric?.value?.value : metric?.value;
  return typeof val === 'number' ? val : fallback;
}
