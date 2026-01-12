#![cfg_attr(target_arch = "wasm32", no_main)]

use hex::decode;
use linera_sdk::abi::WithContractAbi;
use linera_sdk::{Contract, ContractRuntime};
use pine_analytics::{
    AnalyticsAbi, AnalyticsState, AppConfig, ApplicationId, CapturedEvent, ChainId, Message,
    MetricKey, MetricValue, Operation, Owner, Result, TransactionRecord,
};
use serde::{Deserialize, Serialize};

/// Analytics contract
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
}

impl Contract for AnalyticsContract {
    type Message = Message;
    type InstantiationArgument = InstantiateArgs;
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        // Create initial empty state - admin_owner will be set in instantiate()
        // We use a placeholder Owner (Address20 with zero bytes) that will be replaced during instantiate
        use linera_sdk::linera_base_types::AccountOwner;
        use std::collections::BTreeMap;

        // Create a temporary placeholder Owner using Address20 variant with zero bytes
        // This will be replaced with the actual owner in instantiate()
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
        Self { state, runtime }
    }

    async fn instantiate(&mut self, args: InstantiateArgs) {
        if let Some(owner_hex) = args.admin_owner {
            match Self::parse_owner_from_hex(&owner_hex) {
                Ok(owner) => {
                    self.state.admin_owner = owner;
                }
                Err(err) => {
                    panic!("Invalid admin_owner value '{owner_hex}': {err}");
                }
            }
        } else {
            log::warn!("No admin_owner provided; using default placeholder owner");
        }
    }

    async fn execute_operation(&mut self, operation: Operation) -> Self::Response {
        match operation {
            Operation::AddMonitoredApp {
                application_id,
                chain_id,
                graphql_endpoint,
            } => {
                let _ = self
                    .add_monitored_app(application_id, chain_id, graphql_endpoint)
                    .await;
            }
            Operation::RemoveMonitoredApp { application_id } => {
                let _ = self.remove_monitored_app(application_id).await;
            }
            Operation::UpdateAppConfig {
                application_id,
                config,
            } => {
                let _ = self.update_app_config(application_id, config).await;
            }
            Operation::CaptureEvent { event } => {
                let _ = self.capture_event(event).await;
            }
            Operation::CaptureTransaction { transaction } => {
                let _ = self.capture_transaction(transaction).await;
            }
            Operation::UpdateMetric { key, value } => {
                let _ = self.update_metric(key, value).await;
            }
        }
        // Return empty response (Self::Response is ())
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::EventNotification { event } => {
                let _ = self.capture_event(event).await;
            }
            Message::TransactionNotification { transaction } => {
                let _ = self.capture_transaction(transaction).await;
            }
            Message::Subscribe { application_id } => {
                log::info!("Subscription established for app: {}", application_id);
            }
            Message::Unsubscribe { application_id } => {
                log::info!("Unsubscribed from app: {}", application_id);
            }
        }
    }

    async fn store(self) {
        // Store state - in production, this would persist via runtime
        // For now, state is in-memory only
    }
}

// Implementation methods
impl AnalyticsContract {
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

        // Use the last 20 bytes for any length >= 20 (supports 20, 32, 33+, etc.)
        let start = bytes.len() - 20;
        let mut owner_bytes = [0u8; 20];
        owner_bytes.copy_from_slice(&bytes[start..]);

        Ok(Self::parse_address20(&owner_bytes))
    }

    async fn add_monitored_app(
        &mut self,
        application_id: ApplicationId,
        chain_id: ChainId,
        graphql_endpoint: String,
    ) -> Result<()> {
        let config = AppConfig {
            application_id: application_id.clone(),
            chain_id,
            graphql_endpoint,
            enabled: true,
            custom_metrics: vec![],
        };

        self.state
            .monitored_applications
            .insert(application_id.clone(), config);

        log::info!("Added monitored application: {}", application_id);
        Ok(())
    }

    async fn remove_monitored_app(&mut self, application_id: ApplicationId) -> Result<()> {
        self.state.monitored_applications.remove(&application_id);
        log::info!("Removed monitored application: {}", application_id);
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
        log::info!("Updated config for application: {}", application_id);
        Ok(())
    }

    async fn capture_event(&mut self, mut event: CapturedEvent) -> Result<()> {
        // Assign event ID
        event.id = self.state.next_event_id;
        self.state.next_event_id += 1;

        // Store event
        self.state.events.push(event.clone());

        // Update indexes
        self.update_event_indexes(&event).await?;

        log::info!("Captured event {} from app {}", event.id, event.source_app);
        Ok(())
    }

    async fn capture_transaction(&mut self, transaction: TransactionRecord) -> Result<()> {
        log::info!("Captured transaction {}", transaction.hash);
        Ok(())
    }

    async fn update_metric(&mut self, key: MetricKey, value: MetricValue) -> Result<()> {
        self.state.aggregated_metrics.insert(key, value);
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
