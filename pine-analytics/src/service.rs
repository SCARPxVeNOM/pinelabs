#![cfg_attr(target_arch = "wasm32", no_main)]

use linera_sdk::abi::WithServiceAbi;
use linera_sdk::{Service, ServiceRuntime};
use pine_analytics::{
    AnalyticsAbi, AnalyticsState, AppConfig, CapturedEvent, EventFilters, MetricValue, Pagination,
    Request, Response, TimeRange, TimeSeriesPoint,
};
use std::sync::Arc;

/// Analytics service
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
        // Create initial empty state - admin_owner is a placeholder
        // In production with views, state would be loaded from persistent storage
        use linera_sdk::linera_base_types::AccountOwner;
        use std::collections::BTreeMap;

        // Create a temporary placeholder Owner using Address20 variant with zero bytes
        let admin_owner = AccountOwner::Address20([0u8; 20]);

        let state = AnalyticsState {
            monitored_applications: BTreeMap::new(),
            admin_owner,
            events: Vec::new(),
            aggregated_metrics: BTreeMap::new(),
            event_index: BTreeMap::new(),
            app_index: BTreeMap::new(),
            next_event_id: 0,
        };
        Self {
            state: Arc::new(state),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        match request {
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
        }
    }
}

// Query implementation methods
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

    async fn get_events(
        &self,
        _filters: EventFilters,
        _pagination: Pagination,
    ) -> Vec<CapturedEvent> {
        self.state.events.clone()
    }

    async fn get_time_series(
        &self,
        _metric: &str,
        time_range: TimeRange,
        granularity_ms: u64,
    ) -> Vec<TimeSeriesPoint> {
        let mut points = Vec::new();
        let mut current = time_range.start;

        while current <= time_range.end {
            points.push(TimeSeriesPoint {
                timestamp: current,
                value: MetricValue::Counter(0),
            });
            current += granularity_ms;
        }

        points
    }
}
