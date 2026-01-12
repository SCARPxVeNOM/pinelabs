pub mod error;
pub mod state;

#[cfg(test)]
mod tests;

use linera_sdk::abi::{ContractAbi, ServiceAbi};
use serde::{Deserialize, Serialize};

pub use error::{AnalyticsError, Result};
pub use state::*;

/// Application Binary Interface
#[derive(Debug, Clone)]
pub struct AnalyticsAbi;

impl ContractAbi for AnalyticsAbi {
    type Operation = Operation;
    type Response = ();
}

impl ServiceAbi for AnalyticsAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Operations that modify contract state
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Operation {
    AddMonitoredApp {
        application_id: ApplicationId,
        chain_id: ChainId,
        graphql_endpoint: String,
    },
    RemoveMonitoredApp {
        application_id: ApplicationId,
    },
    UpdateAppConfig {
        application_id: ApplicationId,
        config: AppConfig,
    },
    CaptureEvent {
        event: CapturedEvent,
    },
    CaptureTransaction {
        transaction: TransactionRecord,
    },
    UpdateMetric {
        key: MetricKey,
        value: MetricValue,
    },
}

/// Cross-chain messages
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Message {
    EventNotification { event: CapturedEvent },
    TransactionNotification { transaction: TransactionRecord },
    Subscribe { application_id: ApplicationId },
    Unsubscribe { application_id: ApplicationId },
}

/// Service query requests
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Request {
    GetMonitoredApplications,
    GetApplicationMetrics {
        application_id: String,
        time_range: Option<TimeRange>,
    },
    GetEvents {
        filters: EventFilters,
        pagination: Pagination,
    },
    GetTimeSeries {
        metric: String,
        time_range: TimeRange,
        granularity_ms: u64,
    },
}

/// Service query responses
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Response {
    MonitoredApplications(Vec<AppConfig>),
    ApplicationMetrics(Vec<(String, MetricValue)>),
    Events(Vec<CapturedEvent>),
    TimeSeries(Vec<TimeSeriesPoint>),
}
