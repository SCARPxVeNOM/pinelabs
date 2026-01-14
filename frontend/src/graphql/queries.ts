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




