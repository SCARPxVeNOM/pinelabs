import { useState, useMemo, useEffect } from 'react';
import { Activity, Flame, Radio, Users, Cpu, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Analytics Overview</h1>
          <p className="text-slate-400">Monitoring real-time application metrics and events</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'overview' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('comparison')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'comparison' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'}`}
          >
            Comparisons
          </button>
        </div>
      </div>

      {/* App Selector */}
      <ApplicationSelector
        selectedApp={selectedApp}
        onSelect={onSelectApp}
        apps={applications}
        loading={loading}
        error={error}
        onRefresh={refetch}
      />

      {view === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Custom Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Events"
              value={getMetric(metrics, ['transactions', 'event_count'], 0)}
              trend="+12.5%"
              isPositive={true}
              icon={<Activity className="text-emerald-400" />}
              color="emerald"
            />
            <StatCard
              title="Active Users"
              value={getMetric(metrics, ['active_users'], 0)}
              trend="+5.2%"
              isPositive={true}
              icon={<Users className="text-blue-400" />}
              color="blue"
            />
            <StatCard
              title="Volume (USD)"
              value={getMetric(metrics, ['volume', 'usd'], 0)}
              trend="-2.1%"
              isPositive={false}
              isCurrency={true}
              icon={<TrendingUp className="text-purple-400" />}
              color="purple"
            />
            <StatCard
              title="Gas Used"
              value={getMetric(metrics, ['gas'], 0)}
              trend="+8.4%"
              isPositive={true}
              icon={<Flame className="text-orange-400" />}
              color="orange"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 glass-card rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Activity className="w-32 h-32 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full" />
                Event Traffic
              </h3>
              <div className="h-[300px]">
                <TimeSeriesChart
                  applicationId={selectedApp || ''}
                  metric="event_count"
                  timeRange={timeRange}
                />
              </div>
            </div>

            <div className="space-y-6">
              <TopContractsPanel topContracts={topContracts} loading={eventsLoading} />
              <SystemHealthPanel />
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <EventStream
                events={events}
                loading={eventsLoading}
                error={eventsError}
                totalCount={totalCount}
                onLoadMore={loadMore}
              />
            </div>
            <ApplicationsPanel selectedApp={selectedApp} onSelect={onSelectApp} />
          </div>
        </motion.div>
      )}

      {view === 'comparison' && <ComparisonView />}
    </div>
  );
}

function StatCard({ title, value, trend, isPositive, icon, color, isCurrency }: any) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    orange: "from-orange-500/20 to-orange-500/5 border-orange-500/20",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors[color]} border backdrop-blur-sm p-6 group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/5 rounded-xl backdrop-blur-md border border-white/5 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-white tracking-tight">
          {isCurrency ? '$' : ''}{formatNumber(value)}
        </h3>
      </div>
    </div>
  );
}

function TopContractsPanel({ topContracts, loading }: any) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-400" />
        Top Contracts
      </h3>
      <div className="space-y-3">
        {topContracts.map((c: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                {i + 1}
              </span>
              <span className="font-medium text-slate-200 text-sm">{c.name}</span>
            </div>
            <span className="text-sm font-mono text-emerald-400">{formatNumber(c.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemHealthPanel() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-blue-400" />
        System Health
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
          <p className="text-xs text-emerald-400 font-medium uppercase mb-1">Status</p>
          <p className="text-lg font-bold text-white">Optimal</p>
        </div>
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
          <p className="text-xs text-blue-400 font-medium uppercase mb-1">Latency</p>
          <p className="text-lg font-bold text-white">24ms</p>
        </div>
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
