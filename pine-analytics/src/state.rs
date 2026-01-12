use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

// Use Linera SDK types
pub type ApplicationId = linera_sdk::linera_base_types::ApplicationId;
pub type ChainId = linera_sdk::linera_base_types::ChainId;
pub type Owner = linera_sdk::linera_base_types::AccountOwner;

// Type aliases
pub type EventId = u64;
pub type MetricKey = String;
pub type Timestamp = u64;

// Core state structure (simplified for Linera SDK compatibility)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsState {
    pub monitored_applications: BTreeMap<ApplicationId, AppConfig>,
    pub admin_owner: Owner,
    pub events: Vec<CapturedEvent>,
    pub aggregated_metrics: BTreeMap<MetricKey, MetricValue>,
    pub event_index: BTreeMap<Timestamp, Vec<EventId>>,
    pub app_index: BTreeMap<ApplicationId, Vec<EventId>>,
    pub next_event_id: EventId,
}

impl Default for AnalyticsState {
    fn default() -> Self {
        // Create a default owner using a zero public key
        let public_key = linera_sdk::linera_base_types::crypto::PublicKey::from([0u8; 32]);
        let admin_owner = Owner::from(public_key);
        
        Self {
            monitored_applications: BTreeMap::new(),
            admin_owner,
            events: Vec::new(),
            aggregated_metrics: BTreeMap::new(),
            event_index: BTreeMap::new(),
            app_index: BTreeMap::new(),
            next_event_id: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub application_id: ApplicationId,
    pub chain_id: ChainId,
    pub graphql_endpoint: String,
    pub enabled: bool,
    pub custom_metrics: Vec<MetricDefinition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapturedEvent {
    pub id: EventId,
    pub source_app: ApplicationId,
    pub source_chain: ChainId,
    pub timestamp: Timestamp,
    pub event_type: String,
    pub data: serde_json::Value,
    pub transaction_hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionRecord {
    pub hash: String,
    pub chain_id: ChainId,
    pub timestamp: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MetricValue {
    Counter(u64),
    Gauge(f64),
    Histogram(Vec<f64>),
    Summary { sum: f64, count: u64, avg: f64 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricDefinition {
    pub name: String,
    pub description: String,
    pub metric_type: MetricType,
    pub extraction_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricType {
    Counter,
    Gauge,
    Histogram,
    Summary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventFilters {
    pub application_ids: Option<Vec<ApplicationId>>,
    pub event_types: Option<Vec<String>>,
    pub time_range: Option<TimeRange>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRange {
    pub start: Timestamp,
    pub end: Timestamp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pagination {
    pub offset: usize,
    pub limit: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeSeriesPoint {
    pub timestamp: Timestamp,
    pub value: MetricValue,
}
