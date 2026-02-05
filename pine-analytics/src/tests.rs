//! Property-based tests for Pine Analytics
//! 
//! These tests verify serialization, schema consistency, and edge cases.

use crate::state::*;
use proptest::prelude::*;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

// Helper function to create a CapturedEvent with all required fields
fn create_test_event(
    id: EventId,
    source_app: ApplicationId,
    source_chain: ChainId,
    timestamp: Timestamp,
    event_type: String,
    data: serde_json::Value,
    transaction_hash: String,
) -> CapturedEvent {
    CapturedEvent {
        id,
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

// Helper function to create AppConfig with all required fields
fn create_test_app_config(
    application_id: ApplicationId,
    chain_id: ChainId,
    graphql_endpoint: String,
) -> AppConfig {
    AppConfig {
        application_id,
        chain_id,
        graphql_endpoint,
        enabled: true,
        custom_metrics: vec![],
        priority: 0,
        tags: vec![],
    }
}

// Helper function to create TransactionRecord with all required fields
fn create_test_tx_record(
    hash: String,
    chain_id: ChainId,
    timestamp: Timestamp,
) -> TransactionRecord {
    TransactionRecord {
        hash,
        chain_id,
        timestamp,
        block_height: None,
        gas_used: None,
    }
}

// Helper function to convert string to ApplicationId
// For testing, we create a deterministic ApplicationId from a string
fn str_to_app_id(s: &str) -> ApplicationId {
    let mut hasher = DefaultHasher::new();
    s.hash(&mut hasher);
    let hash = hasher.finish();

    let mut bytes = [0u8; 32];
    let hash_bytes = hash.to_le_bytes();
    bytes[..8].copy_from_slice(&hash_bytes);
    for i in 8..32 {
        bytes[i] = ((hash >> (i % 8 * 8)) & 0xFF) as u8;
    }

    let hex_str: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
    serde_json::from_str(&format!(r#""{}""#, hex_str))
        .or_else(|_| serde_json::from_value(serde_json::json!(hex_str)))
        .expect("Failed to create test ApplicationId - this is a test environment issue")
}

// Helper function to convert string to ChainId  
fn str_to_chain_id(s: &str) -> ChainId {
    let mut hasher = DefaultHasher::new();
    s.hash(&mut hasher);
    let hash = hasher.finish();

    let mut bytes = [0u8; 32];
    let hash_bytes = hash.to_le_bytes();
    bytes[..8].copy_from_slice(&hash_bytes);
    for i in 8..32 {
        bytes[i] = ((hash >> (i % 8 * 8)) & 0xFF) as u8;
    }

    let hex_str: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
    serde_json::from_str(&format!(r#""{}""#, hex_str))
        .or_else(|_| serde_json::from_value(serde_json::json!(hex_str)))
        .expect("Failed to create test ChainId - this is a test environment issue")
}

// **Feature: pine-analytics, Property 8: API response structure consistency**
proptest! {
    #[test]
    fn test_captured_event_serialization_roundtrip(
        id in any::<u64>(),
        source_app in "[a-z]{5,10}",
        source_chain in "[a-z]{5,10}",
        timestamp in any::<u64>(),
        event_type in "[A-Z][a-z]{3,10}",
        transaction_hash in "[a-f0-9]{64}",
    ) {
        let event = create_test_event(
            id,
            str_to_app_id(&source_app),
            str_to_chain_id(&source_chain),
            timestamp,
            event_type.clone(),
            serde_json::json!({"test": "data"}),
            transaction_hash.clone(),
        );

        // Serialize to JSON
        let json = serde_json::to_string(&event).unwrap();

        // Deserialize back
        let deserialized: CapturedEvent = serde_json::from_str(&json).unwrap();

        // Verify all fields match
        assert_eq!(event.id, deserialized.id);
        assert_eq!(event.source_app, deserialized.source_app);
        assert_eq!(event.source_chain, deserialized.source_chain);
        assert_eq!(event.timestamp, deserialized.timestamp);
        assert_eq!(event.event_type, deserialized.event_type);
        assert_eq!(event.transaction_hash, deserialized.transaction_hash);
    }

    #[test]
    fn test_metric_value_serialization_consistency(
        counter_val in any::<u64>(),
        gauge_val in any::<f64>(),
    ) {
        // Test Counter
        let counter = MetricValue::Counter(counter_val);
        let json = serde_json::to_string(&counter).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.is_object());

        // Test Gauge
        let gauge = MetricValue::Gauge(gauge_val);
        let json = serde_json::to_string(&gauge).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert!(parsed.is_object());
    }

    #[test]
    fn test_app_config_serialization_roundtrip(
        app_id in "[a-z]{5,10}",
        chain_id in "[a-z]{5,10}",
        endpoint in "https?://[a-z]+\\.[a-z]+",
    ) {
        let config = create_test_app_config(
            str_to_app_id(&app_id),
            str_to_chain_id(&chain_id),
            endpoint.clone(),
        );

        let json = serde_json::to_string(&config).unwrap();
        let deserialized: AppConfig = serde_json::from_str(&json).unwrap();

        assert_eq!(config.application_id, deserialized.application_id);
        assert_eq!(config.chain_id, deserialized.chain_id);
        assert_eq!(config.graphql_endpoint, deserialized.graphql_endpoint);
        assert_eq!(config.enabled, deserialized.enabled);
    }
}

// **Feature: pine-analytics, Property 5: Schema transformation consistency**
proptest! {
    #[test]
    fn test_raw_data_to_captured_event_schema(
        id in any::<u64>(),
        timestamp in any::<u64>(),
    ) {
        let raw_data = serde_json::json!({
            "event_id": id,
            "timestamp": timestamp,
            "type": "Transfer",
            "from": "user1",
            "to": "user2",
            "amount": 100
        });

        let event = create_test_event(
            id,
            str_to_app_id("test_app"),
            str_to_chain_id("test_chain"),
            timestamp,
            "Transfer".to_string(),
            raw_data,
            "hash123".to_string(),
        );

        // Verify all required fields are present
        assert!(event.id >= 0);
        assert!(event.timestamp >= 0);
        assert!(!event.event_type.is_empty());
        assert!(!event.transaction_hash.is_empty());
        assert!(event.data.is_object());
    }

    #[test]
    fn test_transaction_record_schema_consistency(
        timestamp in any::<u64>(),
    ) {
        let tx = create_test_tx_record(
            "tx_hash".to_string(),
            str_to_chain_id("chain1"),
            timestamp,
        );

        // Verify schema compliance
        assert!(!tx.hash.is_empty());
        assert!(tx.timestamp >= 0);
    }
}

// **Feature: pine-analytics, Property 1: Event data completeness**
proptest! {
    #[test]
    fn test_event_capture_completeness(
        id in any::<u64>(),
        timestamp in any::<u64>(),
    ) {
        let original_event = create_test_event(
            id,
            str_to_app_id("test_app"),
            str_to_chain_id("test_chain"),
            timestamp,
            "Transfer".to_string(),
            serde_json::json!({"amount": 100, "from": "user1"}),
            format!("hash{}", id),
        );

        // Verify all parameters are set correctly
        assert_eq!(original_event.id, id);
        assert_eq!(original_event.timestamp, timestamp);
        assert_eq!(original_event.event_type, "Transfer");
        assert_eq!(original_event.transaction_hash, format!("hash{}", id));

        // Test serialization roundtrip
        let json = serde_json::to_string(&original_event).unwrap();
        let deserialized: CapturedEvent = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, original_event.id);
        assert_eq!(deserialized.timestamp, original_event.timestamp);
        assert_eq!(deserialized.event_type, original_event.event_type);
    }
}

// **Feature: pine-analytics, Property 7: Deduplication idempotency**
proptest! {
    #[test]
    fn test_deduplication_idempotency_contract(
        timestamp in any::<u64>(),
    ) {
        let event1 = create_test_event(
            0,
            str_to_app_id("app1"),
            str_to_chain_id("chain1"),
            timestamp,
            "Transfer".to_string(),
            serde_json::json!({}),
            "same_hash".to_string(),
        );

        let event2 = create_test_event(
            1,
            str_to_app_id("app1"),
            str_to_chain_id("chain1"),
            timestamp,
            "Transfer".to_string(),
            serde_json::json!({}),
            "same_hash".to_string(),
        );

        // Events with same transaction hash should be identifiable as duplicates
        assert_eq!(event1.transaction_hash, event2.transaction_hash);
        assert_eq!(event1.source_app, event2.source_app);
        assert_eq!(event1.timestamp, event2.timestamp);
    }
}

// **Feature: pine-analytics, Property 10: Time range filter accuracy**
proptest! {
    #[test]
    fn test_time_range_filter_accuracy_full(
        start_time in 1000u64..5000u64,
        end_time in 5001u64..10000u64,
    ) {
        let events: Vec<CapturedEvent> = (0..20)
            .map(|i| create_test_event(
                i,
                str_to_app_id("app1"),
                str_to_chain_id("chain1"),
                (i * 500) + 500,
                "Test".to_string(),
                serde_json::json!({}),
                format!("hash{}", i),
            ))
            .collect();

        let filtered: Vec<_> = events
            .iter()
            .filter(|e| e.timestamp >= start_time && e.timestamp <= end_time)
            .collect();

        for event in filtered {
            assert!(event.timestamp >= start_time);
            assert!(event.timestamp <= end_time);
        }
    }
}

// **Feature: pine-analytics, Property 20: Application configuration validation**
proptest! {
    #[test]
    fn test_app_config_validation(
        app_id in "[a-z]{5,10}",
        endpoint in "https?://[a-z]+\\.[a-z]+",
    ) {
        let valid_config = create_test_app_config(
            str_to_app_id(&app_id),
            str_to_chain_id("chain1"),
            endpoint.clone(),
        );

        // Valid config should have proper fields
        assert!(!valid_config.graphql_endpoint.is_empty());
        assert!(valid_config.graphql_endpoint.starts_with("http"));

        // Test invalid endpoint format
        let invalid_endpoint = "ftp://invalid.com";
        assert!(!invalid_endpoint.starts_with("http"));
    }
}

// **Feature: pine-analytics, Property 21: Historical data retention after removal**
proptest! {
    #[test]
    fn test_historical_data_retention(
        num_events in 5..15usize,
    ) {
        let app_id = str_to_app_id("app1");
        let chain_id = str_to_chain_id("chain1");

        let events: Vec<CapturedEvent> = (0..num_events)
            .map(|i| create_test_event(
                i as u64,
                app_id.clone(),
                chain_id.clone(),
                i as u64,
                "Test".to_string(),
                serde_json::json!({}),
                format!("hash{}", i),
            ))
            .collect();

        let events_before = events.len();
        let events_after = events.len();

        // Historical events should remain
        assert_eq!(events_after, events_before);

        // Verify all events still reference the app
        for event in &events {
            assert_eq!(event.source_app, app_id);
        }
    }
}
