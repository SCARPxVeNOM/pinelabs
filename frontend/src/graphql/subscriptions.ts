import { gql } from '@apollo/client';

// =============================================================================
// Real-Time Event Subscriptions (Microchain Events)
// =============================================================================

/**
 * Subscribe to real-time events from a specific chain or all chains.
 * Uses GraphQL subscriptions over WebSocket for live updates.
 */
export const EVENT_STREAM_SUBSCRIPTION = gql`
  subscription EventStream($chainId: String, $applicationId: String, $eventTypes: [String!]) {
    eventStream(chainId: $chainId, applicationId: $applicationId, eventTypes: $eventTypes) {
      id
      sourceApp
      sourceChain
      timestamp
      eventType
      data
      transactionHash
      blockHeight
    }
  }
`;

/**
 * Subscribe to metric value changes in real-time.
 */
export const METRIC_UPDATES_SUBSCRIPTION = gql`
  subscription MetricUpdates($metricKeys: [String!]!) {
    metricUpdates(metricKeys: $metricKeys) {
      key
      value
      previousValue
      changePercent
      timestamp
    }
  }
`;

/**
 * Subscribe to chain health and sync status updates.
 */
export const CHAIN_HEALTH_SUBSCRIPTION = gql`
  subscription ChainHealth($chainId: String!) {
    chainHealth(chainId: $chainId) {
      chainId
      blockHeight
      syncStatus
      activeApplications
      lastEventTimestamp
    }
  }
`;

/**
 * Subscribe to cross-chain message events.
 * Notifies when aggregation requests/responses are received.
 */
export const CROSS_CHAIN_MESSAGES_SUBSCRIPTION = gql`
  subscription CrossChainMessages($chainId: String!) {
    crossChainMessages(chainId: $chainId) {
      messageType
      sourceChain
      targetChain
      requestId
      status
      timestamp
    }
  }
`;

/**
 * Subscribe to anomaly detection alerts.
 */
export const ANOMALY_ALERTS_SUBSCRIPTION = gql`
  subscription AnomalyAlerts($metrics: [String!], $sensitivity: Float) {
    anomalyAlerts(metrics: $metrics, sensitivity: $sensitivity) {
      metric
      value
      zScore
      severity
      timestamp
      applicationId
    }
  }
`;
