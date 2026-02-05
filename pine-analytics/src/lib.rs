pub mod aggregations;
pub mod error;
pub mod merkle;
pub mod rate_limit;
pub mod rbac;
pub mod state;

#[cfg(test)]
mod tests;

use linera_sdk::abi::{ContractAbi, ServiceAbi};
use linera_sdk::linera_base_types::CryptoHash;
use serde::{Deserialize, Serialize};

pub use aggregations::*;
pub use error::{AnalyticsError, Result};
pub use merkle::*;
pub use rate_limit::*;
pub use rbac::*;
pub use state::*;

/// Application Binary Interface
#[derive(Debug, Clone)]
pub struct AnalyticsAbi;

impl ContractAbi for AnalyticsAbi {
    type Operation = Operation;
    type Response = OperationResponse;
}

impl ServiceAbi for AnalyticsAbi {
    type Query = Request;
    type QueryResponse = Response;
}

/// Response from contract operations
#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct OperationResponse {
    /// Whether operation succeeded
    pub success: bool,
    /// Event ID if an event was captured
    pub event_id: Option<u64>,
    /// Error message if operation failed
    pub error: Option<String>,
}

/// Operations that modify contract state
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Operation {
    // === Application Management ===
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

    // === Event Capture ===
    CaptureEvent {
        event: CapturedEvent,
    },
    CaptureTransaction {
        transaction: TransactionRecord,
    },
    CaptureEventBatch {
        events: Vec<CapturedEvent>,
    },

    // === Metric Management ===
    UpdateMetric {
        key: MetricKey,
        value: MetricValue,
    },
    DefineMetric {
        definition: MetricDefinition,
    },

    // === Admin Operations (NEW) ===
    AdminAction {
        action: AdminOperation,
    },

    // === RBAC Operations (NEW) ===
    AssignRole {
        target: Owner,
        role: Role,
    },
    RemoveRole {
        target: Owner,
    },

    // === Rate Limit Control (NEW) ===
    UpdateRateLimitConfig {
        config: RateLimitConfig,
    },
    PauseIngestion,
    ResumeIngestion,
    UnblockApp {
        application_id: ApplicationId,
    },
}

/// Admin operations requiring elevated permissions
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum AdminOperation {
    /// Pause all event ingestion
    PauseIngestion,
    /// Resume event ingestion
    ResumeIngestion,
    /// Set rate limit configuration
    SetRateLimit {
        max_events_per_app_per_block: u64,
        max_total_events_per_block: u64,
    },
    /// Clear all events (dangerous!)
    ClearEvents,
    /// Rebuild Merkle index
    RebuildMerkleIndex,
    /// Transfer super admin
    TransferSuperAdmin {
        new_admin: Owner,
    },
}

/// Cross-chain messages (Enhanced)
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Message {
    // === Basic Notifications ===
    EventNotification {
        event: CapturedEvent,
    },
    TransactionNotification {
        transaction: TransactionRecord,
    },
    Subscribe {
        application_id: ApplicationId,
    },
    Unsubscribe {
        application_id: ApplicationId,
    },

    // === Cross-Chain Aggregation (NEW) ===
    AggregationRequest {
        request_id: u64,
        source_chain: ChainId,
        metric_queries: Vec<AggregationQuery>,
        callback_chain: ChainId,
    },
    AggregationResponse {
        request_id: u64,
        results: Vec<AggregatedResult>,
        proof: Option<MerkleProof>,
    },

    // === Chain Synchronization (NEW) ===
    SyncRequest {
        from_event_id: u64,
        to_chain: ChainId,
    },
    SyncBatch {
        events: Vec<CapturedEvent>,
        batch_proof: Option<BatchProof>,
    },
}

/// Service query requests (Enhanced)
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Request {
    // === Basic Queries ===
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

    // === Advanced Analytics (NEW) ===
    GetMovingAverage {
        metric: String,
        window_size: u64,
        time_range: TimeRange,
    },
    DetectAnomalies {
        metric: String,
        sensitivity: f64,
        time_range: Option<TimeRange>,
    },
    GetAggregation {
        query: AggregationQuery,
    },
    GetCorrelation {
        metrics: Vec<String>,
        time_range: TimeRange,
    },

    // === Merkle Proofs (NEW) ===
    GetEventProof {
        event_id: u64,
    },
    VerifyEventProof {
        proof: MerkleProof,
        expected_root: CryptoHash,
    },
    GetMerkleRoot,

    // === System Status (NEW) ===
    GetRateLimitStats,
    GetRBACInfo {
        owner: Option<Owner>,
    },
    GetSystemHealth,
}

/// Service query responses (Enhanced)
#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum Response {
    // === Basic Responses ===
    MonitoredApplications(Vec<AppConfig>),
    ApplicationMetrics(Vec<(String, MetricValue)>),
    Events(Vec<CapturedEvent>),
    TimeSeries(Vec<TimeSeriesPoint>),

    // === Advanced Analytics Responses (NEW) ===
    MovingAverage(Vec<MovingAveragePoint>),
    Anomalies(Vec<AnomalyEvent>),
    Aggregation(AggregatedResult),
    Correlation(CorrelationMatrix),

    // === Merkle Responses (NEW) ===
    EventProof(Option<MerkleProof>),
    ProofVerification(bool),
    MerkleRoot(Option<CryptoHash>),

    // === System Status Responses (NEW) ===
    RateLimitStats(RateLimitStats),
    RBACInfo(RBACInfoResponse),
    SystemHealth(SystemHealthResponse),

    // === Error Response ===
    Error(String),
}

/// RBAC information response
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct RBACInfoResponse {
    pub role: Role,
    pub permissions: Vec<Permission>,
}

/// System health response
#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SystemHealthResponse {
    pub total_events: u64,
    pub total_applications: usize,
    pub merkle_root: Option<CryptoHash>,
    pub rate_limit_enabled: bool,
    pub ingestion_paused: bool,
}
