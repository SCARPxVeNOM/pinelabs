import { gql } from '@apollo/client';

// =============================================================================
// Application Management
// =============================================================================

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

// =============================================================================
// Event Capture (Cross-Chain)
// =============================================================================

export const CAPTURE_EVENT = gql`
  mutation CaptureEvent($event: CapturedEventInput!) {
    captureEvent(event: $event) {
      id
      sourceApp
      sourceChain
      timestamp
      eventType
    }
  }
`;

// =============================================================================
// Cross-Chain Operations
// =============================================================================

export const SEND_CROSS_CHAIN_SYNC = gql`
  mutation SendCrossChainSync($targetChain: String!, $fromEventId: Int!) {
    sendCrossChainSync(targetChain: $targetChain, fromEventId: $fromEventId) {
      success
      messageId
    }
  }
`;

export const REQUEST_AGGREGATION = gql`
  mutation RequestCrossChainAggregation(
    $targetChains: [String!]!
    $metrics: [String!]!
    $timeRange: TimeRangeInput!
  ) {
    requestAggregation(
      targetChains: $targetChains
      metrics: $metrics
      timeRange: $timeRange
    ) {
      requestId
      status
    }
  }
`;

// =============================================================================
// Admin Operations
// =============================================================================

export const PAUSE_INGESTION = gql`
  mutation PauseIngestion {
    pauseIngestion {
      success
      message
    }
  }
`;

export const RESUME_INGESTION = gql`
  mutation ResumeIngestion {
    resumeIngestion {
      success
      message
    }
  }
`;

export const UPDATE_RATE_LIMIT = gql`
  mutation UpdateRateLimit($config: RateLimitConfigInput!) {
    updateRateLimit(config: $config) {
      maxEventsPerAppPerBlock
      maxTotalEventsPerBlock
      enabled
    }
  }
`;
