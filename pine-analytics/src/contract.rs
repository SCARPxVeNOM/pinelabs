#![cfg_attr(target_arch = "wasm32", no_main)]

//! Enhanced Analytics Contract with RBAC, Rate Limiting, and Merkle Indexing

use hex::decode;
use linera_sdk::abi::WithContractAbi;
use linera_sdk::linera_base_types::CryptoHash;
use linera_sdk::{Contract, ContractRuntime};
use pine_analytics::{
    AdminOperation, AggregatedResult, AggregationQuery, AnalyticsAbi, AnalyticsState, AppConfig,
    ApplicationId, CapturedEvent, ChainId, Message, MetricDefinition, MetricKey,
    MetricValue, MerkleProof, Operation, OperationResponse, Owner, Permission, RateLimitConfig,
    Result, Role, TransactionRecord,
};
use serde::{Deserialize, Serialize};

/// Analytics contract with advanced features
pub struct AnalyticsContract {
    state: AnalyticsState,
    #[allow(dead_code)]
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(AnalyticsContract);

impl WithContractAbi for AnalyticsContract {
    type Abi = AnalyticsAbi;
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct InstantiateArgs {
    #[serde(default)]
    pub admin_owner: Option<String>,
    #[serde(default)]
    pub rate_limit_config: Option<RateLimitConfig>,
}

impl Contract for AnalyticsContract {
    type Message = Message;
    type InstantiationArgument = InstantiateArgs;
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = AnalyticsState::default();
        Self { state, runtime }
    }

    async fn instantiate(&mut self, args: InstantiateArgs) {
        if let Some(owner_hex) = args.admin_owner {
            match Self::parse_owner_from_hex(&owner_hex) {
                Ok(owner) => {
                    self.state = AnalyticsState::new(owner);
                    log::info!("Initialized with admin owner");
                }
                Err(err) => {
                    panic!("Invalid admin_owner value '{owner_hex}': {err}");
                }
            }
        } else {
            log::warn!("No admin_owner provided; using default placeholder owner");
        }

        // Apply custom rate limit config if provided
        if let Some(config) = args.rate_limit_config {
            self.state.rate_limiter.update_config(config);
        }
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        // Get caller for permission checks
        let caller = self.get_caller();

        // Helper macro-like closure to check permission and return early on error
        let check_perm = |rbac: &pine_analytics::RBACState, owner: &Owner, perm: &Permission| -> Option<OperationResponse> {
            if !rbac.has_permission(owner, perm) {
                Some(OperationResponse {
                    success: false,
                    event_id: None,
                    error: Some("Unauthorized".to_string()),
                })
            } else {
                None
            }
        };

        // Check permission first, then execute operation
        match operation {
            // === Application Management ===
            Operation::AddMonitoredApp {
                application_id,
                chain_id,
                graphql_endpoint,
            } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::AddApplication) {
                    return err;
                }
                match self.add_monitored_app(application_id, chain_id, graphql_endpoint).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }
            Operation::RemoveMonitoredApp { application_id } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::RemoveApplication) {
                    return err;
                }
                match self.remove_monitored_app(application_id).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }
            Operation::UpdateAppConfig {
                application_id,
                config,
            } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::AddApplication) {
                    return err;
                }
                match self.update_app_config(application_id, config).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }

            // === Event Capture ===
            Operation::CaptureEvent { event } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::CaptureEvents) {
                    return err;
                }
                match self.capture_event_with_checks(event).await {
                    Ok(id) => OperationResponse { success: true, event_id: id, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }
            Operation::CaptureTransaction { transaction } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::CaptureEvents) {
                    return err;
                }
                match self.capture_transaction(transaction).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }
            Operation::CaptureEventBatch { events } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::CaptureEvents) {
                    return err;
                }
                match self.capture_event_batch(events).await {
                    Ok(id) => OperationResponse { success: true, event_id: id, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }

            // === Metric Management ===
            Operation::UpdateMetric { key, value } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ModifyMetrics) {
                    return err;
                }
                match self.update_metric(key, value).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }
            Operation::DefineMetric { definition } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ModifyMetrics) {
                    return err;
                }
                match self.define_metric(definition).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }

            // === Admin Operations ===
            Operation::AdminAction { action } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ConfigureSystem) {
                    return err;
                }
                match self.execute_admin_action(action).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }

            // === RBAC Operations ===
            Operation::AssignRole { target, role } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ManageRoles) {
                    return err;
                }
                match self.assign_role(&caller, target, role).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }
            Operation::RemoveRole { target } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ManageRoles) {
                    return err;
                }
                match self.remove_role(&caller, &target).await {
                    Ok(_) => OperationResponse { success: true, event_id: None, error: None },
                    Err(e) => OperationResponse { success: false, event_id: None, error: Some(e.to_string()) },
                }
            }

            // === Rate Limit Control ===
            Operation::UpdateRateLimitConfig { config } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ControlIngestion) {
                    return err;
                }
                self.state.rate_limiter.update_config(config);
                OperationResponse { success: true, event_id: None, error: None }
            }
            Operation::PauseIngestion => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ControlIngestion) {
                    return err;
                }
                self.state.rate_limiter.pause();
                log::info!("Ingestion paused by {:?}", caller);
                OperationResponse { success: true, event_id: None, error: None }
            }
            Operation::ResumeIngestion => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ControlIngestion) {
                    return err;
                }
                self.state.rate_limiter.resume();
                log::info!("Ingestion resumed by {:?}", caller);
                OperationResponse { success: true, event_id: None, error: None }
            }
            Operation::UnblockApp { application_id } => {
                if let Some(err) = check_perm(&self.state.rbac, &caller, &Permission::ControlIngestion) {
                    return err;
                }
                self.state.rate_limiter.unblock_app(&application_id);
                OperationResponse { success: true, event_id: None, error: None }
            }
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            // === Basic Notifications ===
            Message::EventNotification { event } => {
                let _ = self.capture_event_internal(event).await;
            }
            Message::TransactionNotification { transaction } => {
                let _ = self.capture_transaction(transaction).await;
            }
            Message::Subscribe { application_id } => {
                log::info!("Subscription established for app: {:?}", application_id);
            }
            Message::Unsubscribe { application_id } => {
                log::info!("Unsubscribed from app: {:?}", application_id);
            }

            // === Cross-Chain Aggregation ===
            Message::AggregationRequest {
                request_id,
                source_chain,
                metric_queries,
                callback_chain,
            } => {
                let results = self.process_aggregation_queries(&metric_queries).await;
                let proof = self.state.merkle_index.get_root().map(|root| MerkleProof {
                    path: vec![],
                    leaf_hash: root,
                    event_id: 0,
                });

                // Send response back (in production, use runtime.send_message)
                log::info!(
                    "Processed aggregation request {} from {:?}, {} results",
                    request_id,
                    source_chain,
                    results.len()
                );
            }
            Message::AggregationResponse {
                request_id,
                results,
                proof: _,
            } => {
                log::info!(
                    "Received aggregation response {} with {} results",
                    request_id,
                    results.len()
                );
            }

            // === Chain Synchronization ===
            Message::SyncRequest {
                from_event_id,
                to_chain,
            } => {
                let events: Vec<CapturedEvent> = self
                    .state
                    .events
                    .iter()
                    .filter(|e| e.id >= from_event_id)
                    .cloned()
                    .collect();

                log::info!(
                    "Sync request from event {} to {:?}, {} events",
                    from_event_id,
                    to_chain,
                    events.len()
                );
            }
            Message::SyncBatch { events, batch_proof: _ } => {
                for event in events {
                    let _ = self.capture_event_internal(event).await;
                }
                log::info!("Processed sync batch");
            }
        }
    }

    async fn store(self) {
        // In production with views, state would be persisted here
        // For now, state management is handled in-memory
    }
}

// Helper methods
impl AnalyticsContract {
    /// Get the caller's owner address
    fn get_caller(&self) -> Owner {
        // In production, get from runtime
        self.state.admin_owner.clone()
    }

    /// Check if caller has required permission
    #[allow(dead_code)]
    fn require_permission(&self, caller: &Owner, permission: &Permission) -> Result<()> {
        if self.state.rbac.has_permission(caller, permission) {
            Ok(())
        } else {
            Err(pine_analytics::AnalyticsError::Unauthorized)
        }
    }

    fn parse_address20(bytes: &[u8]) -> Owner {
        let mut addr = [0u8; 20];
        addr.copy_from_slice(bytes);
        Owner::Address20(addr)
    }

    fn parse_owner_from_hex(value: &str) -> core::result::Result<Owner, &'static str> {
        let trimmed = value.trim();
        if trimmed.is_empty() {
            return Err("value is empty");
        }

        let hex_str = trimmed.strip_prefix("0x").unwrap_or(trimmed);
        let bytes = decode(hex_str).map_err(|_| "invalid hex string")?;
        if bytes.len() < 20 {
            return Err("admin_owner must be at least 20 bytes");
        }

        let start = bytes.len() - 20;
        let mut owner_bytes = [0u8; 20];
        owner_bytes.copy_from_slice(&bytes[start..]);

        Ok(Self::parse_address20(&owner_bytes))
    }
}

// Application Management
impl AnalyticsContract {
    async fn add_monitored_app(
        &mut self,
        application_id: ApplicationId,
        chain_id: ChainId,
        graphql_endpoint: String,
    ) -> Result<()> {
        let config = AppConfig::new(application_id.clone(), chain_id, graphql_endpoint);
        self.state
            .monitored_applications
            .insert(application_id.clone(), config);
        log::info!("Added monitored application: {:?}", application_id);
        Ok(())
    }

    async fn remove_monitored_app(&mut self, application_id: ApplicationId) -> Result<()> {
        self.state.monitored_applications.remove(&application_id);
        log::info!("Removed monitored application: {:?}", application_id);
        Ok(())
    }

    async fn update_app_config(
        &mut self,
        application_id: ApplicationId,
        config: AppConfig,
    ) -> Result<()> {
        self.state
            .monitored_applications
            .insert(application_id.clone(), config);
        log::info!("Updated config for application: {:?}", application_id);
        Ok(())
    }
}

// Event Capture with Rate Limiting and Deduplication
impl AnalyticsContract {
    async fn capture_event_with_checks(&mut self, event: CapturedEvent) -> Result<Option<u64>> {
        // Check for duplicates
        if self.state.is_duplicate_tx(&event.transaction_hash) {
            return Err(pine_analytics::AnalyticsError::DuplicateEvent(
                event.transaction_hash.clone(),
            ));
        }

        // Check rate limit
        self.state
            .rate_limiter
            .check_and_increment(&event.source_app, self.state.current_block)?;

        // Capture the event
        self.capture_event_internal(event).await
    }

    async fn capture_event_internal(&mut self, mut event: CapturedEvent) -> Result<Option<u64>> {
        // Assign event ID
        event.id = self.state.next_event_id;
        self.state.next_event_id += 1;
        event.block_height = Some(self.state.current_block);

        // Add to deduplication index
        self.state.tx_hash_index.insert(event.transaction_hash.clone());

        // Store event
        self.state.events.push(event.clone());

        // Update indexes
        self.update_event_indexes(&event).await?;

        // Update Merkle tree
        let event_hash = CryptoHash::from(event.data_hash());
        self.state.merkle_index.insert_hash(event.id, event_hash);

        // Update statistics
        self.state.total_events_captured += 1;

        log::info!("Captured event {} from app {:?}", event.id, event.source_app);
        Ok(Some(event.id))
    }

    async fn capture_event_batch(&mut self, events: Vec<CapturedEvent>) -> Result<Option<u64>> {
        let mut last_id = None;
        let mut _processed = 0;

        for event in events {
            match self.capture_event_with_checks(event).await {
                Ok(id) => {
                    last_id = id;
                    _processed += 1;
                }
                Err(e) => {
                    log::warn!("Batch event failed: {}", e);
                    // Continue processing other events
                }
            }
        }

        Ok(last_id)
    }

    async fn capture_transaction(&mut self, transaction: TransactionRecord) -> Result<()> {
        log::info!("Captured transaction {}", transaction.hash);
        Ok(())
    }

    async fn update_event_indexes(&mut self, event: &CapturedEvent) -> Result<()> {
        // Update time index
        self.state
            .event_index
            .entry(event.timestamp)
            .or_insert_with(Vec::new)
            .push(event.id);

        // Update app index
        self.state
            .app_index
            .entry(event.source_app.clone())
            .or_insert_with(Vec::new)
            .push(event.id);

        Ok(())
    }
}

// Metric Management
impl AnalyticsContract {
    async fn update_metric(&mut self, key: MetricKey, value: MetricValue) -> Result<()> {
        self.state.aggregated_metrics.insert(key.clone(), value);
        log::info!("Updated metric: {}", key);
        Ok(())
    }

    async fn define_metric(&mut self, definition: MetricDefinition) -> Result<()> {
        self.state
            .metric_definitions
            .insert(definition.name.clone(), definition.clone());
        log::info!("Defined metric: {}", definition.name);
        Ok(())
    }
}

// Admin Operations
impl AnalyticsContract {
    async fn execute_admin_action(&mut self, action: AdminOperation) -> Result<()> {
        match action {
            AdminOperation::PauseIngestion => {
                self.state.rate_limiter.pause();
                log::info!("Admin: Ingestion paused");
            }
            AdminOperation::ResumeIngestion => {
                self.state.rate_limiter.resume();
                log::info!("Admin: Ingestion resumed");
            }
            AdminOperation::SetRateLimit {
                max_events_per_app_per_block,
                max_total_events_per_block,
            } => {
                let mut config = self.state.rate_limiter.config.clone();
                config.max_events_per_app_per_block = max_events_per_app_per_block;
                config.max_total_events_per_block = max_total_events_per_block;
                self.state.rate_limiter.update_config(config);
                log::info!("Admin: Rate limit updated");
            }
            AdminOperation::ClearEvents => {
                self.state.events.clear();
                self.state.event_index.clear();
                self.state.app_index.clear();
                self.state.tx_hash_index.clear();
                self.state.merkle_index = pine_analytics::MerkleIndex::new(16);
                log::warn!("Admin: All events cleared!");
            }
            AdminOperation::RebuildMerkleIndex => {
                self.state.merkle_index = pine_analytics::MerkleIndex::new(16);
                for event in &self.state.events {
                    let event_hash = CryptoHash::from(event.data_hash());
                    self.state.merkle_index.insert_hash(event.id, event_hash);
                }
                log::info!("Admin: Merkle index rebuilt");
            }
            AdminOperation::TransferSuperAdmin { new_admin } => {
                self.state.admin_owner = new_admin.clone();
                self.state.rbac = pine_analytics::RBACState::new(new_admin);
                log::warn!("Admin: Super admin transferred!");
            }
        }
        Ok(())
    }
}

// RBAC Operations
impl AnalyticsContract {
    async fn assign_role(&mut self, caller: &Owner, target: Owner, role: Role) -> Result<()> {
        if !self.state.rbac.can_manage(caller, &target) {
            return Err(pine_analytics::AnalyticsError::Unauthorized);
        }
        self.state.rbac.assign_role(target, role)?;
        Ok(())
    }

    async fn remove_role(&mut self, caller: &Owner, target: &Owner) -> Result<()> {
        if !self.state.rbac.can_manage(caller, target) {
            return Err(pine_analytics::AnalyticsError::Unauthorized);
        }
        self.state.rbac.remove_role(target)?;
        Ok(())
    }
}

// Cross-Chain Aggregation
impl AnalyticsContract {
    async fn process_aggregation_queries(&self, queries: &[AggregationQuery]) -> Vec<AggregatedResult> {
        use pine_analytics::AggregationEngine;

        queries
            .iter()
            .map(|query| {
                let values: Vec<f64> = self
                    .state
                    .aggregated_metrics
                    .iter()
                    .filter(|(k, _)| k.contains(&query.metric))
                    .map(|(_, v)| v.as_f64())
                    .collect();

                let value = AggregationEngine::aggregate(&values, &query.aggregation);

                AggregatedResult {
                    metric: query.metric.clone(),
                    aggregation: query.aggregation.clone(),
                    value,
                    bucket: None,
                    sample_count: values.len(),
                }
            })
            .collect()
    }
}

