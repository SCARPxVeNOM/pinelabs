import { gql } from '@apollo/client';

// =============================================================================
// Application Queries
// =============================================================================

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

// =============================================================================
// Event Queries
// =============================================================================

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

// =============================================================================
// Analytics Queries
// =============================================================================

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

// =============================================================================
// Health & Status Queries
// =============================================================================

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

// =============================================================================
// Cross-Chain Queries (Microchain-specific)
// =============================================================================

export const CROSS_CHAIN_AGGREGATION_QUERY = gql`
  query CrossChainAggregation($metric: String!, $timeRange: TimeRange!) {
    aggregation(metric: $metric, timeRange: $timeRange) {
      metric
      value
      sampleCount
    }
  }
`;

export const CHAIN_STATISTICS_QUERY = gql`
  query ChainStatistics {
    statistics {
      totalEvents
      totalApplications
      activeChains
    }
  }
`;

export const ANOMALIES_QUERY = gql`
  query DetectAnomalies($metric: String!, $sensitivity: Float!) {
    anomalies(metric: $metric, sensitivity: $sensitivity) {
      index
      value
      zScore
      timestamp
    }
  }
`;

export const MOVING_AVERAGE_QUERY = gql`
  query MovingAverage($metric: String!, $windowSize: Int!, $timeRange: TimeRange!) {
    movingAverage(metric: $metric, windowSize: $windowSize, timeRange: $timeRange) {
      timestamp
      value
      windowSize
    }
  }
`;
