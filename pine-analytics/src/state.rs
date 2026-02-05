//! Enhanced State Module for Pine Analytics
//!
//! Provides comprehensive state management with RBAC, rate limiting, and Merkle indexing.

use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};

use crate::merkle::MerkleIndex;
use crate::rate_limit::RateLimiterState;
use crate::rbac::RBACState;

// Use Linera SDK types
pub type ApplicationId = linera_sdk::linera_base_types::ApplicationId;
pub type ChainId = linera_sdk::linera_base_types::ChainId;
pub type Owner = linera_sdk::linera_base_types::AccountOwner;

// Type aliases
pub type EventId = u64;
pub type MetricKey = String;
pub type Timestamp = u64;

/// Enhanced Analytics State with all advanced features
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsState {
    // === Core Data ===
    /// Monitored applications configuration
    pub monitored_applications: BTreeMap<ApplicationId, AppConfig>,
    /// Primary admin owner
    pub admin_owner: Owner,
    /// All captured events
    pub events: Vec<CapturedEvent>,
    /// Aggregated metrics
    pub aggregated_metrics: BTreeMap<MetricKey, MetricValue>,
    /// Event index by timestamp
    pub event_index: BTreeMap<Timestamp, Vec<EventId>>,
    /// Event index by application
    pub app_index: BTreeMap<ApplicationId, Vec<EventId>>,
    /// Next event ID (auto-increment)
    pub next_event_id: EventId,

    // === Deduplication ===
    /// Transaction hash set for deduplication
    pub tx_hash_index: BTreeSet<String>,

    // === RBAC ===
    /// Role-based access control state
    pub rbac: RBACState,

    // === Rate Limiting ===
    /// Rate limiter state
    pub rate_limiter: RateLimiterState,

    // === Merkle Indexing ===
    /// Merkle tree for verifiable queries
    pub merkle_index: MerkleIndex,

    // === Metric Definitions ===
    /// Custom metric definitions
    pub metric_definitions: BTreeMap<String, MetricDefinition>,

    // === Statistics ===
    /// Total events ever captured (including cleared)
    pub total_events_captured: u64,
    /// Current block height (for rate limiting)
    pub current_block: u64,
}

impl Default for AnalyticsState {
    fn default() -> Self {
        // Create a default owner using Address20 variant with zero bytes
        let admin_owner = Owner::Address20([0u8; 20]);

        Self {
            monitored_applications: BTreeMap::new(),
            admin_owner: admin_owner.clone(),
            events: Vec::new(),
            aggregated_metrics: BTreeMap::new(),
            event_index: BTreeMap::new(),
            app_index: BTreeMap::new(),
            next_event_id: 0,
            tx_hash_index: BTreeSet::new(),
            rbac: RBACState::new(admin_owner),
            rate_limiter: RateLimiterState::default(),
            merkle_index: MerkleIndex::new(16),
            metric_definitions: BTreeMap::new(),
            total_events_captured: 0,
            current_block: 0,
        }
    }
}

impl AnalyticsState {
    /// Create new state with admin owner
    pub fn new(admin_owner: Owner) -> Self {
        Self {
            admin_owner: admin_owner.clone(),
            rbac: RBACState::new(admin_owner),
            ..Default::default()
        }
    }

    /// Check if a transaction hash is duplicate
    pub fn is_duplicate_tx(&self, tx_hash: &str) -> bool {
        self.tx_hash_index.contains(tx_hash)
    }

    /// Get event by ID
    pub fn get_event(&self, event_id: EventId) -> Option<&CapturedEvent> {
        self.events.iter().find(|e| e.id == event_id)
    }

    /// Get events for an application
    pub fn get_app_events(&self, app_id: &ApplicationId) -> Vec<&CapturedEvent> {
        self.app_index
            .get(app_id)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.get_event(*id))
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Get events in a time range
    pub fn get_events_in_range(&self, start: Timestamp, end: Timestamp) -> Vec<&CapturedEvent> {
        self.event_index
            .range(start..=end)
            .flat_map(|(_, ids)| ids.iter().filter_map(|id| self.get_event(*id)))
            .collect()
    }

    /// Update block height (call at start of each block)
    pub fn set_block_height(&mut self, block: u64) {
        self.current_block = block;
    }
}

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub application_id: ApplicationId,
    pub chain_id: ChainId,
    pub graphql_endpoint: String,
    pub enabled: bool,
    pub custom_metrics: Vec<MetricDefinition>,
    /// Priority level for rate limiting (higher = more leniency)
    pub priority: u8,
    /// Tags for categorization
    pub tags: Vec<String>,
}

impl AppConfig {
    /// Create new app config with defaults
    pub fn new(application_id: ApplicationId, chain_id: ChainId, graphql_endpoint: String) -> Self {
        Self {
            application_id,
            chain_id,
            graphql_endpoint,
            enabled: true,
            custom_metrics: vec![],
            priority: 0,
            tags: vec![],
        }
    }
}

/// Captured event from monitored applications
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturedEvent {
    pub id: EventId,
    pub source_app: ApplicationId,
    pub source_chain: ChainId,
    pub timestamp: Timestamp,
    pub event_type: String,
    pub data: serde_json::Value,
    pub transaction_hash: String,
    /// Block height when captured
    pub block_height: Option<u64>,
    /// Event severity/priority
    pub severity: EventSeverity,
}

impl CapturedEvent {
    /// Create new event with defaults
    pub fn new(
        source_app: ApplicationId,
        source_chain: ChainId,
        timestamp: Timestamp,
        event_type: String,
        data: serde_json::Value,
        transaction_hash: String,
    ) -> Self {
        Self {
            id: 0, // Will be assigned by contract
            source_app,
            source_chain,
            timestamp,
            event_type,
            data,
            transaction_hash,
            block_height: None,
            severity: EventSeverity::Info,
        }
    }

    /// Get hash of event data for Merkle tree
    pub fn data_hash(&self) -> [u8; 32] {
        let json = serde_json::to_string(self).unwrap_or_default();
        let mut hash = [0u8; 32];
        for (i, byte) in json.bytes().enumerate() {
            hash[i % 32] ^= byte;
        }
        hash
    }
}

/// Event severity levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
pub enum EventSeverity {
    Debug,
    #[default]
    Info,
    Warning,
    Error,
    Critical,
}

/// Transaction record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRecord {
    pub hash: String,
    pub chain_id: ChainId,
    pub timestamp: Timestamp,
    pub block_height: Option<u64>,
    pub gas_used: Option<u64>,
}

/// Metric value types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MetricValue {
    Counter(u64),
    Gauge(f64),
    Histogram(Vec<f64>),
    Summary { sum: f64, count: u64, avg: f64 },
}

impl MetricValue {
    /// Get numeric value for aggregation
    pub fn as_f64(&self) -> f64 {
        match self {
            MetricValue::Counter(v) => *v as f64,
            MetricValue::Gauge(v) => *v,
            MetricValue::Histogram(v) => {
                if v.is_empty() {
                    0.0
                } else {
                    v.iter().sum::<f64>() / v.len() as f64
                }
            }
            MetricValue::Summary { avg, .. } => *avg,
        }
    }
}

/// Metric definition for custom metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricDefinition {
    pub name: String,
    pub description: String,
    pub metric_type: MetricType,
    pub extraction_path: String,
    /// Aggregation method for time series
    pub aggregation: AggregationMethod,
}

/// Metric types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricType {
    Counter,
    Gauge,
    Histogram,
    Summary,
}

/// Aggregation methods for metrics
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub enum AggregationMethod {
    #[default]
    Sum,
    Average,
    Min,
    Max,
    Last,
}

/// Event filters for queries
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EventFilters {
    pub application_ids: Option<Vec<ApplicationId>>,
    pub event_types: Option<Vec<String>>,
    pub time_range: Option<TimeRange>,
    pub severity: Option<EventSeverity>,
    pub search_text: Option<String>,
}

/// Time range for queries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: Timestamp,
    pub end: Timestamp,
}

impl TimeRange {
    pub fn new(start: Timestamp, end: Timestamp) -> Self {
        Self { start, end }
    }

    pub fn contains(&self, timestamp: Timestamp) -> bool {
        timestamp >= self.start && timestamp <= self.end
    }
}

/// Pagination for list queries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pagination {
    pub offset: usize,
    pub limit: usize,
}

impl Default for Pagination {
    fn default() -> Self {
        Self {
            offset: 0,
            limit: 100,
        }
    }
}

/// Time series data point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesPoint {
    pub timestamp: Timestamp,
    pub value: MetricValue,
}

/// Subscription for real-time updates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub subscriber_chain: ChainId,
    pub application_filter: Option<Vec<ApplicationId>>,
    pub event_type_filter: Option<Vec<String>>,
    pub active: bool,
}

