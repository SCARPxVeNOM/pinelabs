#![cfg_attr(target_arch = "wasm32", no_main)]

//! Enhanced Analytics Service with Advanced Query Support

use linera_sdk::abi::WithServiceAbi;
use linera_sdk::linera_base_types::CryptoHash;
use linera_sdk::{Service, ServiceRuntime};
use pine_analytics::{
    AggregatedResult, AggregationEngine, AggregationQuery, AnalyticsAbi, AnalyticsState,
    AnomalyEvent, AppConfig, CapturedEvent, CorrelationMatrix, EventFilters, MerkleIndex,
    MerkleProof, MetricValue, MovingAveragePoint, Owner, Pagination, Permission,
    RBACInfoResponse, Request, Response, SystemHealthResponse, TimeRange, TimeSeriesPoint,
};
use std::sync::Arc;

/// Analytics service with enhanced query capabilities
pub struct AnalyticsService {
    state: Arc<AnalyticsState>,
}

linera_sdk::service!(AnalyticsService);

impl WithServiceAbi for AnalyticsService {
    type Abi = AnalyticsAbi;
}

impl Service for AnalyticsService {
    type Parameters = ();

    async fn new(_runtime: ServiceRuntime<Self>) -> Self {
        let state = AnalyticsState::default();
        Self {
            state: Arc::new(state),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        match request {
            // === Basic Queries ===
            Request::GetMonitoredApplications => {
                let apps = self.get_monitored_applications().await;
                Response::MonitoredApplications(apps)
            }
            Request::GetApplicationMetrics {
                application_id,
                time_range,
            } => {
                let metrics = self
                    .get_application_metrics(&application_id, time_range)
                    .await;
                Response::ApplicationMetrics(metrics)
            }
            Request::GetEvents {
                filters,
                pagination,
            } => {
                let events = self.get_events(filters, pagination).await;
                Response::Events(events)
            }
            Request::GetTimeSeries {
                metric,
                time_range,
                granularity_ms,
            } => {
                let series = self
                    .get_time_series(&metric, time_range, granularity_ms)
                    .await;
                Response::TimeSeries(series)
            }

            // === Advanced Analytics ===
            Request::GetMovingAverage {
                metric,
                window_size,
                time_range,
            } => {
                let ma = self
                    .get_moving_average(&metric, window_size, time_range)
                    .await;
                Response::MovingAverage(ma)
            }
            Request::DetectAnomalies {
                metric,
                sensitivity,
                time_range,
            } => {
                let anomalies = self
                    .detect_anomalies(&metric, sensitivity, time_range)
                    .await;
                Response::Anomalies(anomalies)
            }
            Request::GetAggregation { query } => {
                let result = self.get_aggregation(query).await;
                Response::Aggregation(result)
            }
            Request::GetCorrelation {
                metrics,
                time_range,
            } => {
                let correlation = self.get_correlation(metrics, time_range).await;
                Response::Correlation(correlation)
            }

            // === Merkle Proofs ===
            Request::GetEventProof { event_id } => {
                let proof = self.get_event_proof(event_id).await;
                Response::EventProof(proof)
            }
            Request::VerifyEventProof {
                proof,
                expected_root,
            } => {
                let valid = self.verify_event_proof(&proof, &expected_root).await;
                Response::ProofVerification(valid)
            }
            Request::GetMerkleRoot => {
                let root = self.state.merkle_index.get_root();
                Response::MerkleRoot(root)
            }

            // === System Status ===
            Request::GetRateLimitStats => {
                let stats = self.state.rate_limiter.get_stats();
                Response::RateLimitStats(stats)
            }
            Request::GetRBACInfo { owner } => {
                let info = self.get_rbac_info(owner).await;
                Response::RBACInfo(info)
            }
            Request::GetSystemHealth => {
                let health = self.get_system_health().await;
                Response::SystemHealth(health)
            }
        }
    }
}

// Basic Query Methods
impl AnalyticsService {
    async fn get_monitored_applications(&self) -> Vec<AppConfig> {
        self.state
            .monitored_applications
            .values()
            .cloned()
            .collect()
    }

    async fn get_application_metrics(
        &self,
        application_id: &str,
        _time_range: Option<TimeRange>,
    ) -> Vec<(String, MetricValue)> {
        self.state
            .aggregated_metrics
            .iter()
            .filter(|(key, _)| key.starts_with(application_id))
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect()
    }

    async fn get_events(&self, filters: EventFilters, pagination: Pagination) -> Vec<CapturedEvent> {
        let filtered: Vec<CapturedEvent> = self
            .state
            .events
            .iter()
            .filter(|event| {
                // Filter by application IDs
                if let Some(ref app_ids) = filters.application_ids {
                    if !app_ids.contains(&event.source_app) {
                        return false;
                    }
                }
                // Filter by event types
                if let Some(ref event_types) = filters.event_types {
                    if !event_types.contains(&event.event_type) {
                        return false;
                    }
                }
                // Filter by time range
                if let Some(ref range) = filters.time_range {
                    if !range.contains(event.timestamp) {
                        return false;
                    }
                }
                // Filter by severity
                if let Some(ref severity) = filters.severity {
                    if &event.severity != severity {
                        return false;
                    }
                }
                // Filter by search text
                if let Some(ref text) = filters.search_text {
                    let data_str = serde_json::to_string(&event.data).unwrap_or_default();
                    if !data_str.to_lowercase().contains(&text.to_lowercase()) {
                        return false;
                    }
                }
                true
            })
            .cloned()
            .collect();

        // Apply pagination
        filtered
            .into_iter()
            .skip(pagination.offset)
            .take(pagination.limit)
            .collect()
    }

    async fn get_time_series(
        &self,
        metric: &str,
        time_range: TimeRange,
        granularity_ms: u64,
    ) -> Vec<TimeSeriesPoint> {
        // Bucket events by time and compute metric values
        let events: Vec<&CapturedEvent> = self
            .state
            .events
            .iter()
            .filter(|e| time_range.contains(e.timestamp))
            .collect();

        let mut points = Vec::new();
        let mut current = time_range.start;

        while current <= time_range.end {
            let bucket_end = current + granularity_ms;
            let bucket_events: Vec<_> = events
                .iter()
                .filter(|e| e.timestamp >= current && e.timestamp < bucket_end)
                .collect();

            let value = MetricValue::Counter(bucket_events.len() as u64);
            points.push(TimeSeriesPoint {
                timestamp: current,
                value,
            });
            current = bucket_end;
        }

        points
    }
}

// Advanced Analytics Methods
impl AnalyticsService {
    async fn get_moving_average(
        &self,
        metric: &str,
        window_size: u64,
        time_range: TimeRange,
    ) -> Vec<MovingAveragePoint> {
        // Get metric values in time order
        let values: Vec<(u64, f64)> = self
            .state
            .aggregated_metrics
            .iter()
            .filter(|(k, _)| k.contains(metric))
            .map(|(_, v)| (0u64, v.as_f64())) // Use 0 as placeholder timestamp
            .collect();

        AggregationEngine::moving_average(&values, window_size as usize)
    }

    async fn detect_anomalies(
        &self,
        metric: &str,
        sensitivity: f64,
        time_range: Option<TimeRange>,
    ) -> Vec<AnomalyEvent> {
        let values: Vec<(u64, f64)> = self
            .state
            .aggregated_metrics
            .iter()
            .filter(|(k, _)| k.contains(metric))
            .enumerate()
            .map(|(i, (_, v))| (i as u64, v.as_f64()))
            .collect();

        AggregationEngine::detect_anomalies(&values, sensitivity)
    }

    async fn get_aggregation(&self, query: AggregationQuery) -> AggregatedResult {
        let values: Vec<f64> = self
            .state
            .aggregated_metrics
            .iter()
            .filter(|(k, _)| k.contains(&query.metric))
            .map(|(_, v)| v.as_f64())
            .collect();

        let value = AggregationEngine::aggregate(&values, &query.aggregation);

        AggregatedResult {
            metric: query.metric,
            aggregation: query.aggregation,
            value,
            bucket: None,
            sample_count: values.len(),
        }
    }

    async fn get_correlation(&self, metrics: Vec<String>, time_range: TimeRange) -> CorrelationMatrix {
        // Collect values for each metric
        let metric_values: Vec<Vec<f64>> = metrics
            .iter()
            .map(|metric| {
                self.state
                    .aggregated_metrics
                    .iter()
                    .filter(|(k, _)| k.contains(metric))
                    .map(|(_, v)| v.as_f64())
                    .collect()
            })
            .collect();

        // Compute correlation matrix
        let n = metrics.len();
        let mut coefficients = Vec::with_capacity(n * n);

        for i in 0..n {
            for j in 0..n {
                if i == j {
                    coefficients.push(1.0);
                } else if metric_values[i].len() == metric_values[j].len() && !metric_values[i].is_empty() {
                    coefficients.push(AggregationEngine::correlation(
                        &metric_values[i],
                        &metric_values[j],
                    ));
                } else {
                    coefficients.push(0.0);
                }
            }
        }

        CorrelationMatrix {
            chains: metrics,
            coefficients,
            metric: "correlation".to_string(),
        }
    }
}

// Merkle Proof Methods
impl AnalyticsService {
    async fn get_event_proof(&self, event_id: u64) -> Option<MerkleProof> {
        self.state.merkle_index.generate_proof(event_id)
    }

    async fn verify_event_proof(&self, proof: &MerkleProof, expected_root: &CryptoHash) -> bool {
        MerkleIndex::verify_proof(expected_root, proof)
    }
}

// System Status Methods
impl AnalyticsService {
    async fn get_rbac_info(&self, owner: Option<Owner>) -> RBACInfoResponse {
        let target = owner.unwrap_or_else(|| self.state.admin_owner.clone());
        let role = self.state.rbac.get_role(&target);
        
        // Get all permissions for this role
        let all_permissions = vec![
            Permission::AddApplication,
            Permission::RemoveApplication,
            Permission::CaptureEvents,
            Permission::ModifyMetrics,
            Permission::ConfigureSystem,
            Permission::ViewData,
            Permission::ManageRoles,
            Permission::ControlIngestion,
        ];

        let permissions: Vec<Permission> = all_permissions
            .into_iter()
            .filter(|p| pine_analytics::RBACState::role_has_permission(&role, p))
            .collect();

        RBACInfoResponse { role, permissions }
    }

    async fn get_system_health(&self) -> SystemHealthResponse {
        SystemHealthResponse {
            total_events: self.state.total_events_captured,
            total_applications: self.state.monitored_applications.len(),
            merkle_root: self.state.merkle_index.get_root(),
            rate_limit_enabled: self.state.rate_limiter.config.enabled,
            ingestion_paused: self.state.rate_limiter.paused,
        }
    }
}

