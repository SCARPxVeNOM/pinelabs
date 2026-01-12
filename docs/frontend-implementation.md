# Frontend Implementation - Complete Guide

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Header.tsx
│   │   ├── ApplicationSelector.tsx
│   │   ├── MetricsOverview.tsx
│   │   ├── TimeSeriesChart.tsx
│   │   ├── EventStream.tsx
│   │   ├── ComparisonView.tsx
│   │   └── ConfigurationPanel.tsx
│   ├── graphql/
│   │   ├── queries.ts
│   │   ├── mutations.ts
│   │   └── subscriptions.ts
│   ├── hooks/
│   │   ├── useEvents.ts
│   │   ├── useMetrics.ts
│   │   └── useApplications.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── exporters.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Setup Files

### package.json
```json
{
  "name": "pine-analytics-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@apollo/client": "^3.8.0",
    "graphql": "^16.8.0",
    "recharts": "^2.5.0",
    "lucide-react": "^0.263.1",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "tailwindcss": "^3.4.19",
    "autoprefixer": "^10.4.22",
    "postcss": "^8.5.6"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```


## Core Components

### 1. Main Entry Point (main.tsx)

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import App from './App';
import './index.css';

// Configure Apollo Client
const client = new ApolloClient({
  uri: 'http://localhost:8080/graphql',
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>,
);
```

### 2. App Component (App.tsx)

```typescript
import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';

function App() {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Dashboard 
          selectedApp={selectedApp}
          onSelectApp={setSelectedApp}
        />
      </main>
    </div>
  );
}

export default App;
```

### 3. Dashboard Component

```typescript
import { useState } from 'react';
import ApplicationSelector from './ApplicationSelector';
import MetricsOverview from './MetricsOverview';
import TimeSeriesChart from './TimeSeriesChart';
import EventStream from './EventStream';
import ComparisonView from './ComparisonView';

interface DashboardProps {
  selectedApp: string | null;
  onSelectApp: (appId: string) => void;
}

export default function Dashboard({ selectedApp, onSelectApp }: DashboardProps) {
  const [view, setView] = useState<'overview' | 'comparison'>('overview');
  const [timeRange, setTimeRange] = useState({ start: Date.now() - 86400000, end: Date.now() });
  
  return (
    <div className="space-y-6">
      {/* Header with app selector and view toggle */}
      <div className="flex justify-between items-center">
        <ApplicationSelector 
          selectedApp={selectedApp}
          onSelect={onSelectApp}
        />
        
        <div className="flex gap-2">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded ${view === 'overview' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('comparison')}
            className={`px-4 py-2 rounded ${view === 'comparison' ? 'bg-blue-600 text-white' : 'bg-white'}`}
          >
            Comparison
          </button>
        </div>
      </div>
      
      {/* Time range selector */}
      <div className="flex gap-2">
        <button onClick={() => setTimeRange({ start: Date.now() - 3600000, end: Date.now() })}>
          1H
        </button>
        <button onClick={() => setTimeRange({ start: Date.now() - 86400000, end: Date.now() })}>
          24H
        </button>
        <button onClick={() => setTimeRange({ start: Date.now() - 604800000, end: Date.now() })}>
          7D
        </button>
      </div>
      
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
```

### 4. Application Selector

```typescript
import { useQuery } from '@apollo/client';
import { MONITORED_APPS_QUERY } from '../graphql/queries';

interface ApplicationSelectorProps {
  selectedApp: string | null;
  onSelect: (appId: string) => void;
}

export default function ApplicationSelector({ selectedApp, onSelect }: ApplicationSelectorProps) {
  const { data, loading, error } = useQuery(MONITORED_APPS_QUERY);
  
  if (loading) return <div>Loading applications...</div>;
  if (error) return <div>Error loading applications</div>;
  
  const apps = data?.monitoredApplications || [];
  
  return (
    <select
      value={selectedApp || ''}
      onChange={(e) => onSelect(e.target.value)}
      className="px-4 py-2 border rounded-lg"
    >
      <option value="">Select Application</option>
      {apps.map((app: any) => (
        <option key={app.applicationId} value={app.applicationId}>
          {app.applicationId}
        </option>
      ))}
    </select>
  );
}
```

### 5. Metrics Overview

```typescript
import { useQuery } from '@apollo/client';
import { APPLICATION_METRICS_QUERY } from '../graphql/queries';
import { TrendingUp, Activity, Users } from 'lucide-react';

interface MetricsOverviewProps {
  applicationId: string;
}

export default function MetricsOverview({ applicationId }: MetricsOverviewProps) {
  const { data, loading } = useQuery(APPLICATION_METRICS_QUERY, {
    variables: { applicationId },
  });
  
  if (loading) return <div>Loading metrics...</div>;
  
  const metrics = data?.applicationMetrics || [];
  
  // Extract key metrics
  const eventCount = metrics.find((m: any) => m.key.includes('event_count'))?.value || 0;
  const activeUsers = metrics.find((m: any) => m.key.includes('active_users'))?.value || 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Events"
        value={eventCount}
        icon={<Activity className="w-6 h-6" />}
        trend="+12%"
      />
      <MetricCard
        title="Active Users"
        value={activeUsers}
        icon={<Users className="w-6 h-6" />}
        trend="+5%"
      />
      <MetricCard
        title="Avg Response Time"
        value="45ms"
        icon={<TrendingUp className="w-6 h-6" />}
        trend="-8%"
      />
    </div>
  );
}

function MetricCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-green-600 text-sm mt-1">{trend}</p>
        </div>
        <div className="text-blue-600">{icon}</div>
      </div>
    </div>
  );
}
```

### 6. Time Series Chart

```typescript
import { useQuery } from '@apollo/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TIME_SERIES_QUERY } from '../graphql/queries';
import { format } from 'date-fns';

interface TimeSeriesChartProps {
  applicationId: string;
  metric: string;
  timeRange: { start: number; end: number };
}

export default function TimeSeriesChart({ applicationId, metric, timeRange }: TimeSeriesChartProps) {
  const { data, loading } = useQuery(TIME_SERIES_QUERY, {
    variables: {
      metric: `${applicationId}_${metric}`,
      timeRange,
      granularity: 'HOUR',
    },
  });
  
  if (loading) return <div>Loading chart...</div>;
  
  const chartData = (data?.timeSeries || []).map((point: any) => ({
    timestamp: format(new Date(point.timestamp), 'HH:mm'),
    value: point.value,
  }));
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Event Activity</h3>
      <LineChart width={800} height={300} data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" />
      </LineChart>
    </div>
  );
}
```

### 7. Event Stream

```typescript
import { useSubscription } from '@apollo/client';
import { EVENT_STREAM_SUBSCRIPTION } from '../graphql/subscriptions';
import { format } from 'date-fns';

interface EventStreamProps {
  applicationId: string;
}

export default function EventStream({ applicationId }: EventStreamProps) {
  const { data } = useSubscription(EVENT_STREAM_SUBSCRIPTION, {
    variables: {
      filters: {
        applicationIds: [applicationId],
      },
    },
  });
  
  const events = data?.eventStream || [];
  
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Live Event Stream</h3>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.map((event: any) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: any) {
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="flex justify-between">
        <span className="font-semibold">{event.eventType}</span>
        <span className="text-gray-500 text-sm">
          {format(new Date(event.timestamp), 'HH:mm:ss')}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {JSON.stringify(event.data)}
      </p>
    </div>
  );
}
```

### 8. Comparison View

```typescript
import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { COMPARE_APPS_QUERY, MONITORED_APPS_QUERY } from '../graphql/queries';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ComparisonView() {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['event_count']);
  
  const { data: appsData } = useQuery(MONITORED_APPS_QUERY);
  const { data: comparisonData } = useQuery(COMPARE_APPS_QUERY, {
    variables: {
      applicationIds: selectedApps,
      metrics: selectedMetrics,
    },
    skip: selectedApps.length === 0,
  });
  
  const apps = appsData?.monitoredApplications || [];
  
  // Transform data for chart
  const chartData = selectedApps.map(appId => ({
    name: appId,
    ...Object.fromEntries(
      selectedMetrics.map(metric => [
        metric,
        comparisonData?.compareApplications?.relativePerformance?.[appId] || 0
      ])
    ),
  }));
  
  return (
    <div className="space-y-6">
      {/* App selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Select Applications to Compare</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {apps.map((app: any) => (
            <label key={app.applicationId} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedApps.includes(app.applicationId)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedApps([...selectedApps, app.applicationId]);
                  } else {
                    setSelectedApps(selectedApps.filter(id => id !== app.applicationId));
                  }
                }}
              />
              <span>{app.applicationId}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Comparison chart */}
      {selectedApps.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
          <BarChart width={800} height={400} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedMetrics.map((metric, idx) => (
              <Bar key={metric} dataKey={metric} fill={`hsl(${idx * 60}, 70%, 50%)`} />
            ))}
          </BarChart>
        </div>
      )}
    </div>
  );
}
```


## GraphQL Definitions

### queries.ts

```typescript
import { gql } from '@apollo/client';

export const MONITORED_APPS_QUERY = gql`
  query MonitoredApplications {
    monitoredApplications {
      applicationId
      chainId
      graphqlEndpoint
      enabled
    }
  }
`;

export const APPLICATION_METRICS_QUERY = gql`
  query ApplicationMetrics($applicationId: String!) {
    applicationMetrics(applicationId: $applicationId) {
      key
      value
    }
  }
`;

export const EVENTS_QUERY = gql`
  query Events($filters: EventFilters, $pagination: Pagination) {
    events(filters: $filters, pagination: $pagination) {
      events {
        id
        sourceApp
        sourceChain
        timestamp
        eventType
        data
        transactionHash
      }
      totalCount
      hasMore
    }
  }
`;

export const TIME_SERIES_QUERY = gql`
  query TimeSeries($metric: String!, $timeRange: TimeRange!, $granularity: TimeGranularity!) {
    timeSeries(metric: $metric, timeRange: $timeRange, granularity: $granularity) {
      timestamp
      value
    }
  }
`;

export const COMPARE_APPS_QUERY = gql`
  query CompareApplications($applicationIds: [String!]!, $metrics: [String!]!) {
    compareApplications(applicationIds: $applicationIds, metrics: $metrics) {
      applications
      metrics
      relativePerformance
    }
  }
`;

export const HEALTH_QUERY = gql`
  query Health {
    health {
      status
      totalEvents
      monitoredApps
      lastEventTimestamp
    }
  }
`;
```

### mutations.ts

```typescript
import { gql } from '@apollo/client';

export const ADD_MONITORED_APP = gql`
  mutation AddMonitoredApplication(
    $applicationId: String!
    $chainId: String!
    $graphqlEndpoint: String!
  ) {
    addMonitoredApplication(
      applicationId: $applicationId
      chainId: $chainId
      graphqlEndpoint: $graphqlEndpoint
    ) {
      applicationId
      chainId
      graphqlEndpoint
      enabled
    }
  }
`;

export const REMOVE_MONITORED_APP = gql`
  mutation RemoveMonitoredApplication($applicationId: String!) {
    removeMonitoredApplication(applicationId: $applicationId)
  }
`;

export const DEFINE_CUSTOM_METRIC = gql`
  mutation DefineCustomMetric($applicationId: String!, $metric: MetricDefinitionInput!) {
    defineCustomMetric(applicationId: $applicationId, metric: $metric) {
      name
      description
      metricType
      extractionPath
      aggregation
    }
  }
`;
```

### subscriptions.ts

```typescript
import { gql } from '@apollo/client';

export const EVENT_STREAM_SUBSCRIPTION = gql`
  subscription EventStream($filters: EventFilters) {
    eventStream(filters: $filters) {
      id
      sourceApp
      sourceChain
      timestamp
      eventType
      data
      transactionHash
    }
  }
`;

export const METRIC_UPDATES_SUBSCRIPTION = gql`
  subscription MetricUpdates($metric: String!) {
    metricUpdates(metric: $metric)
  }
`;
```

## Custom Hooks

### useEvents.ts

```typescript
import { useQuery } from '@apollo/client';
import { EVENTS_QUERY } from '../graphql/queries';

export function useEvents(filters?: any, pagination?: any) {
  const { data, loading, error, fetchMore } = useQuery(EVENTS_QUERY, {
    variables: { filters, pagination },
  });
  
  const loadMore = () => {
    if (data?.events?.hasMore) {
      fetchMore({
        variables: {
          pagination: {
            offset: data.events.events.length,
            limit: pagination?.limit || 100,
          },
        },
      });
    }
  };
  
  return {
    events: data?.events?.events || [],
    totalCount: data?.events?.totalCount || 0,
    hasMore: data?.events?.hasMore || false,
    loading,
    error,
    loadMore,
  };
}
```

### useMetrics.ts

```typescript
import { useQuery } from '@apollo/client';
import { APPLICATION_METRICS_QUERY } from '../graphql/queries';

export function useMetrics(applicationId: string) {
  const { data, loading, error, refetch } = useQuery(APPLICATION_METRICS_QUERY, {
    variables: { applicationId },
    pollInterval: 5000, // Refresh every 5 seconds
  });
  
  return {
    metrics: data?.applicationMetrics || [],
    loading,
    error,
    refetch,
  };
}
```

### useApplications.ts

```typescript
import { useQuery, useMutation } from '@apollo/client';
import { MONITORED_APPS_QUERY } from '../graphql/queries';
import { ADD_MONITORED_APP, REMOVE_MONITORED_APP } from '../graphql/mutations';

export function useApplications() {
  const { data, loading, error, refetch } = useQuery(MONITORED_APPS_QUERY);
  
  const [addApp] = useMutation(ADD_MONITORED_APP, {
    refetchQueries: [{ query: MONITORED_APPS_QUERY }],
  });
  
  const [removeApp] = useMutation(REMOVE_MONITORED_APP, {
    refetchQueries: [{ query: MONITORED_APPS_QUERY }],
  });
  
  return {
    applications: data?.monitoredApplications || [],
    loading,
    error,
    addApp,
    removeApp,
    refetch,
  };
}
```

## Utility Functions

### formatters.ts

```typescript
import { format, formatDistance } from 'date-fns';

export function formatTimestamp(timestamp: number): string {
  return format(new Date(timestamp), 'MMM dd, yyyy HH:mm:ss');
}

export function formatRelativeTime(timestamp: number): string {
  return formatDistance(new Date(timestamp), new Date(), { addSuffix: true });
}

export function formatMetricValue(value: any): string {
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
```

### exporters.ts

```typescript
export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => row[h]).join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

## Styling (index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
}

body {
  margin: 0;
  min-height: 100vh;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Loading animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
```

## Implementation Checklist

### Phase 1: Setup
- [ ] Create Vite project
- [ ] Install all dependencies
- [ ] Configure Tailwind CSS
- [ ] Set up Apollo Client
- [ ] Create project structure

### Phase 2: Core Components
- [ ] Implement main.tsx
- [ ] Implement App.tsx
- [ ] Implement Dashboard.tsx
- [ ] Implement Header.tsx
- [ ] Implement ApplicationSelector.tsx

### Phase 3: Data Visualization
- [ ] Implement MetricsOverview.tsx
- [ ] Implement TimeSeriesChart.tsx
- [ ] Implement EventStream.tsx
- [ ] Implement ComparisonView.tsx

### Phase 4: GraphQL Integration
- [ ] Define all queries
- [ ] Define all mutations
- [ ] Define all subscriptions
- [ ] Create custom hooks

### Phase 5: Utilities
- [ ] Implement formatters
- [ ] Implement exporters
- [ ] Add error boundaries
- [ ] Add loading states

### Phase 6: Testing & Polish
- [ ] Test all components
- [ ] Add responsive design
- [ ] Optimize performance
- [ ] Add accessibility features

## Running the Frontend

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create `.env` file:

```
VITE_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
VITE_WS_ENDPOINT=ws://localhost:8080/graphql
```

Use in code:

```typescript
const client = new ApolloClient({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});
```
