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



