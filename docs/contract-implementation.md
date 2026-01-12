# Contract Implementation - Complete Pseudocode

## File: `pine-analytics/src/contract.rs`

### Imports and Setup


```rust
// Required imports
use linera_sdk::{
    base::{ApplicationId, ChainId, Owner, Timestamp},
    Contract, ContractRuntime,
};
use crate::{
    state::*, 
    error::{AnalyticsError, Result},
};

// Main contract structure
pub struct AnalyticsContract {
    state: AnalyticsState,
    runtime: ContractRuntime<Self>,
}

// Contract trait implementation
impl Contract for AnalyticsContract {
    type Message = Message;
    type Parameters = Owner;  // Admin owner passed at initialization
    type InstantiationArgument = ();
    
    // Initialize contract with admin owner
    async fn instantiate(&mut self, admin: Owner) {
        self.state.admin_owner = admin;
        log::info!("Analytics contract initialized with admin: {}", admin);
    }
    
    // Handle operations (state changes)
    async fn execute_operation(&mut self, operation: Operation) -> Result<()> {
        match operation {
            Operation::AddMonitoredApp { application_id, chain_id, graphql_endpoint } => {
                self.add_monitored_app(application_id, chain_id, graphql_endpoint).await
            }
            Operation::RemoveMonitoredApp { application_id } => {
                self.remove_monitored_app(application_id).await
            }
            Operation::UpdateAppConfig { application_id, config } => {
                self.update_app_config(application_id, config).await
            }
            Operation::CaptureEvent { event } => {
                self.capture_event(event).await
            }
            Operation::CaptureTransaction { transaction } => {
                self.capture_transaction(transaction).await
            }
            Operation::UpdateMetric { key, value } => {
                self.update_metric(key, value).await
            }
        }
    }
    
    // Handle cross-chain messages
    async fn execute_message(&mut self, message: Message) -> Result<()> {
        match message {
            Message::EventNotification { event } => {
                self.handle_event_notification(event).await
            }
            Message::TransactionNotification { transaction } => {
                self.handle_transaction_notification(transaction).await
            }
            Message::Subscribe { application_id } => {
                self.handle_subscribe(application_id).await
            }
            Message::Unsubscribe { application_id } => {
                self.handle_unsubscribe(application_id).await
            }
        }
    }
}
```

### Core Implementation Methods

```rust
impl AnalyticsContract {
    // OPERATION HANDLERS
    
    /// Add a new application to monitor
    async fn add_monitored_app(
        &mut self,
        application_id: ApplicationId,
        chain_id: ChainId,
        graphql_endpoint: String,
    ) -> Result<()> {
        // 1. Check admin authorization
        self.check_admin()?;
        
        // 2. Validate inputs
        self.validate_app_config(&AppConfig {
            application_id: application_id.clone(),
            chain_id: chain_id.clone(),
            graphql_endpoint: graphql_endpoint.clone(),
            enabled: true,
            custom_metrics: vec![],
        })?;
        
        // 3. Create config
        let config = AppConfig {
            application_id: application_id.clone(),
            chain_id,
            graphql_endpoint,
            enabled: true,
            custom_metrics: vec![],
        };
        
        // 4. Store in state
        self.state.monitored_applications.insert(application_id.clone(), config);
        
        // 5. Log action
        log::info!("Added monitored application: {}", application_id);
        
        Ok(())
    }
    
    /// Remove application from monitoring
    async fn remove_monitored_app(&mut self, application_id: ApplicationId) -> Result<()> {
        // 1. Check admin authorization
        self.check_admin()?;
        
        // 2. Check if app exists
        if !self.state.monitored_applications.contains_key(&application_id) {
            return Err(AnalyticsError::ApplicationNotFound(application_id));
        }
        
        // 3. Remove from monitored apps (but keep historical data)
        self.state.monitored_applications.remove(&application_id);
        
        // 4. Log action
        log::info!("Removed monitored application: {}", application_id);
        
        Ok(())
    }
    
    /// Update application configuration
    async fn update_app_config(
        &mut self,
        application_id: ApplicationId,
        config: AppConfig,
    ) -> Result<()> {
        // 1. Check admin authorization
        self.check_admin()?;
        
        // 2. Validate config
        self.validate_app_config(&config)?;
        
        // 3. Update in state
        self.state.monitored_applications.insert(application_id.clone(), config);
        
        // 4. Log action
        log::info!("Updated config for application: {}", application_id);
        
        Ok(())
    }
    
    /// Capture an event
    async fn capture_event(&mut self, mut event: CapturedEvent) -> Result<()> {
        // 1. Assign event ID
        event.id = self.state.next_event_id;
        self.state.next_event_id += 1;
        
        // 2. Check for duplicates (by transaction hash + timestamp)
        if self.is_duplicate_event(&event) {
            log::debug!("Duplicate event detected, skipping: {}", event.id);
            return Ok(());
        }
        
        // 3. Store event
        self.state.events.push(event.clone());
        
        // 4. Update indexes
        self.update_event_indexes(&event)?;
        
        // 5. Process for metrics
        self.process_event_for_metrics(&event).await?;
        
        // 6. Log action
        log::info!("Captured event {} from app {}", event.id, event.source_app);
        
        Ok(())
    }
    
    /// Capture a transaction
    async fn capture_transaction(&mut self, transaction: TransactionRecord) -> Result<()> {
        // 1. Store transaction
        self.state.transactions.push(transaction.clone());
        
        // 2. Log action
        log::info!("Captured transaction {}", transaction.hash);
        
        Ok(())
    }
    
    /// Update a metric value
    async fn update_metric(&mut self, key: MetricKey, value: MetricValue) -> Result<()> {
        // 1. Get existing value if any
        let existing = self.state.aggregated_metrics.get(&key);
        
        // 2. Aggregate with existing value
        let new_value = match existing {
            Some(existing_val) => self.aggregate_metrics(existing_val, &value)?,
            None => value,
        };
        
        // 3. Store updated value
        self.state.aggregated_metrics.insert(key.clone(), new_value);
        
        Ok(())
    }
    
    // MESSAGE HANDLERS
    
    /// Handle event notification from monitored app
    async fn handle_event_notification(&mut self, event: CapturedEvent) -> Result<()> {
        // Delegate to capture_event
        self.capture_event(event).await
    }
    
    /// Handle transaction notification
    async fn handle_transaction_notification(&mut self, transaction: TransactionRecord) -> Result<()> {
        // Delegate to capture_transaction
        self.capture_transaction(transaction).await
    }
    
    /// Handle subscription request
    async fn handle_subscribe(&mut self, application_id: ApplicationId) -> Result<()> {
        log::info!("Subscription established for app: {}", application_id);
        // In real implementation, would set up GraphQL subscription
        Ok(())
    }
    
    /// Handle unsubscribe request
    async fn handle_unsubscribe(&mut self, application_id: ApplicationId) -> Result<()> {
        log::info!("Unsubscribed from app: {}", application_id);
        Ok(())
    }
}
```


### Helper Methods

```rust
impl AnalyticsContract {
    /// Check if caller is admin
    fn check_admin(&self) -> Result<()> {
        let caller = self.runtime.authenticated_signer()
            .ok_or(AnalyticsError::Unauthorized)?;
        
        if caller.to_string() != self.state.admin_owner {
            return Err(AnalyticsError::Unauthorized);
        }
        
        Ok(())
    }
    
    /// Validate application configuration
    fn validate_app_config(&self, config: &AppConfig) -> Result<()> {
        // Validate application ID
        if config.application_id.is_empty() {
            return Err(AnalyticsError::InvalidMetric(
                "Application ID cannot be empty".to_string()
            ));
        }
        
        // Validate GraphQL endpoint
        if !config.graphql_endpoint.starts_with("http://") 
            && !config.graphql_endpoint.starts_with("https://") {
            return Err(AnalyticsError::InvalidEndpoint(
                "Endpoint must be HTTP or HTTPS URL".to_string()
            ));
        }
        
        // Validate custom metrics
        for metric in &config.custom_metrics {
            self.validate_metric_definition(metric)?;
        }
        
        Ok(())
    }
    
    /// Validate metric definition
    fn validate_metric_definition(&self, metric: &MetricDefinition) -> Result<()> {
        // Validate metric name (alphanumeric and underscores only)
        if !metric.name.chars().all(|c| c.is_alphanumeric() || c == '_') {
            return Err(AnalyticsError::InvalidMetric(
                "Metric name must be alphanumeric".to_string()
            ));
        }
        
        // Validate extraction path is not empty
        if metric.extraction_path.is_empty() {
            return Err(AnalyticsError::InvalidMetric(
                "Extraction path cannot be empty".to_string()
            ));
        }
        
        Ok(())
    }
    
    /// Check if event is duplicate
    fn is_duplicate_event(&self, event: &CapturedEvent) -> bool {
        self.state.events.iter().any(|e| 
            e.transaction_hash == event.transaction_hash 
            && e.timestamp == event.timestamp
        )
    }
    
    /// Update event indexes
    fn update_event_indexes(&mut self, event: &CapturedEvent) -> Result<()> {
        // Update time index
        self.state.event_index
            .entry(event.timestamp)
            .or_insert_with(Vec::new)
            .push(event.id);
        
        // Update app index
        self.state.app_index
            .entry(event.source_app.clone())
            .or_insert_with(Vec::new)
            .push(event.id);
        
        Ok(())
    }
    
    /// Process event for metrics extraction
    async fn process_event_for_metrics(&mut self, event: &CapturedEvent) -> Result<()> {
        // Get app config for custom metrics
        let config = self.state.monitored_applications
            .get(&event.source_app);
        
        if let Some(config) = config {
            // Extract custom metrics
            for metric_def in &config.custom_metrics {
                if let Ok(value) = self.extract_metric_value(event, metric_def) {
                    let key = format!("{}_{}", event.source_app, metric_def.name);
                    self.update_metric(key, value).await?;
                }
            }
        }
        
        // Extract standard metrics (event count)
        let count_key = format!("{}_event_count", event.source_app);
        self.update_metric(count_key, MetricValue::Counter(1)).await?;
        
        Ok(())
    }
    
    /// Extract metric value from event data
    fn extract_metric_value(
        &self,
        event: &CapturedEvent,
        metric_def: &MetricDefinition,
    ) -> Result<MetricValue> {
        // Simple JSON path extraction
        // In production, use a proper JSON path library
        let value = event.data.get(&metric_def.extraction_path);
        
        match value {
            Some(serde_json::Value::Number(n)) => {
                match metric_def.metric_type {
                    MetricType::Counter => Ok(MetricValue::Counter(n.as_u64().unwrap_or(0))),
                    MetricType::Gauge => Ok(MetricValue::Gauge(n.as_f64().unwrap_or(0.0))),
                    _ => Err(AnalyticsError::InvalidMetric("Unsupported metric type".to_string())),
                }
            }
            _ => Err(AnalyticsError::EventProcessingError("Failed to extract metric".to_string())),
        }
    }
    
    /// Aggregate two metric values
    fn aggregate_metrics(&self, existing: &MetricValue, new: &MetricValue) -> Result<MetricValue> {
        match (existing, new) {
            (MetricValue::Counter(a), MetricValue::Counter(b)) => {
                Ok(MetricValue::Counter(a + b))
            }
            (MetricValue::Gauge(_), MetricValue::Gauge(b)) => {
                // For gauges, take the new value
                Ok(MetricValue::Gauge(*b))
            }
            (MetricValue::Histogram(mut a), MetricValue::Histogram(b)) => {
                a.extend(b);
                Ok(MetricValue::Histogram(a))
            }
            (MetricValue::Summary { sum: s1, count: c1, .. }, MetricValue::Summary { sum: s2, count: c2, .. }) => {
                let new_sum = s1 + s2;
                let new_count = c1 + c2;
                let new_avg = if new_count > 0 { new_sum / new_count as f64 } else { 0.0 };
                Ok(MetricValue::Summary { sum: new_sum, count: new_count, avg: new_avg })
            }
            _ => Err(AnalyticsError::InvalidMetric("Cannot aggregate different metric types".to_string())),
        }
    }
}
```

### Main Function

```rust
#[cfg(not(target_arch = "wasm32"))]
fn main() {
    // Entry point for contract binary
}

#[cfg(target_arch = "wasm32")]
linera_sdk::contract!(AnalyticsContract);
```

## Implementation Steps

1. **Create the file**: `pine-analytics/src/contract.rs`
2. **Add imports**: Copy the imports section
3. **Define struct**: Add AnalyticsContract struct
4. **Implement Contract trait**: Add instantiate, execute_operation, execute_message
5. **Add operation handlers**: Implement each operation method
6. **Add message handlers**: Implement each message method
7. **Add helper methods**: Implement validation and utility functions
8. **Add main function**: Add WASM entry point
9. **Test compilation**: Run `cargo build --target wasm32-unknown-unknown`

## Key Design Decisions

- **Deduplication**: Uses transaction_hash + timestamp to detect duplicates
- **Authorization**: Only admin can modify configuration
- **Indexing**: Maintains time-based and app-based indexes for fast queries
- **Metrics**: Automatically extracts event counts + custom metrics
- **Error Handling**: Returns Result for all operations with detailed errors
