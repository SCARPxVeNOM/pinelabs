// Type definitions for Pine Analytics

export interface AppConfig {
  applicationId: string;
  chainId: string;
  graphqlEndpoint: string;
  enabled: boolean;
  customMetrics?: any[];
}

export interface CapturedEvent {
  id: number;
  sourceApp: string;
  sourceChain: string;
  timestamp: number;
  eventType: string;
  data: any;
  transactionHash: string;
}

export interface MetricValue {
  Counter?: number;
  Gauge?: number;
  Histogram?: number[];
  Summary?: { count: number; sum: number };
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: MetricValue;
}

export interface EventFilters {
  applicationIds?: string[];
  eventTypes?: string[];
  timeRange?: TimeRange;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface Pagination {
  offset: number;
  limit: number;
}




