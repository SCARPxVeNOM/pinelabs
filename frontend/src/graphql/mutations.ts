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



