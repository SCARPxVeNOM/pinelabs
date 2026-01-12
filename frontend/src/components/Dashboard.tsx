import { useState } from 'react';
import ApplicationSelector from './ApplicationSelector';
import MetricsOverview from './MetricsOverview';
import TimeSeriesChart from './TimeSeriesChart';
import EventStream from './EventStream';
import ComparisonView from './ComparisonView';
import ApplicationsPanel from './ApplicationsPanel';
import { useEffect } from 'react';
import { useApplications } from '../hooks/useApplications';

interface DashboardProps {
  selectedApp: string | null;
  onSelectApp: (appId: string | null) => void;
}

export default function Dashboard({ selectedApp, onSelectApp }: DashboardProps) {
  const { applications, loading, error, refetch } = useApplications();
  const [view, setView] = useState<'overview' | 'comparison'>('overview');
  const [timeRange, setTimeRange] = useState({ 
    start: Date.now() - 86400000, 
    end: Date.now() 
  });

  // Auto-select first app when available
  useEffect(() => {
    if (!selectedApp && applications.length > 0) {
      onSelectApp(applications[0].applicationId);
    }
  }, [applications, selectedApp, onSelectApp]);
  
  return (
    <div className="space-y-6">
      {/* Header with app selector and view toggle */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <ApplicationSelector 
          selectedApp={selectedApp}
          onSelect={onSelectApp}
          apps={applications}
          loading={loading}
          error={error}
          onRefresh={refetch}
        />
        
        <div className="flex gap-2">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded ${view === 'overview' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('comparison')}
            className={`px-4 py-2 rounded ${view === 'comparison' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
          >
            Comparison
          </button>
        </div>
      </div>
      
      {/* Time range selector */}
      <div className="flex gap-2">
        <button 
          onClick={() => setTimeRange({ start: Date.now() - 3600000, end: Date.now() })}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
        >
          1H
        </button>
        <button 
          onClick={() => setTimeRange({ start: Date.now() - 86400000, end: Date.now() })}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
        >
          24H
        </button>
        <button 
          onClick={() => setTimeRange({ start: Date.now() - 604800000, end: Date.now() })}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50"
        >
          7D
        </button>
      </div>
      
      {/* Applications management */}
      <ApplicationsPanel selectedApp={selectedApp} onSelect={onSelectApp} />

      {/* Main content */}
      {view === 'overview' && selectedApp && (
        <>
          <MetricsOverview applicationId={selectedApp} />
          <TimeSeriesChart 
            applicationId={selectedApp}
            metric="event_count"
            timeRange={timeRange}
          />
          <EventStream applicationId={selectedApp} />
        </>
      )}
      
      {view === 'comparison' && (
        <ComparisonView />
      )}
    </div>
  );
}


