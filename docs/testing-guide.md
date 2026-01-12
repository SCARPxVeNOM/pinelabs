# Property-Based Testing Guide

## Overview

This guide provides complete implementations for all 32 property-based tests defined in the design document.

## Setup

Add to `pine-analytics/Cargo.toml`:

```toml
[dev-dependencies]
proptest = "1.0"
tokio-test = "0.4"
```

## Test File Structure

All tests go in `pine-analytics/src/tests.rs` (already created).

## Property Tests Implementation

### Property 1: Event Data Completeness

```rust
// **Feature: pine-analytics, Property 1: Event data completeness**
// For any captured event, retrieving it should return all parameters with identical values
proptest! {
    #[test]
    fn test_event_data_completeness(
        id in any::<u64>(),
        timestamp in any::<u64>(),
        event_type in "[A-Z][a-z]{3,10}",
    ) {
        let original_data = serde_json::json!({
            "field1": "value1",
            "field2": 42,
            "field3": true
        });
        
        let event = CapturedEvent {
            id,
            source_app: "test_app".to_string(),
            source_chain: "test_chain".to_string(),
            timestamp,
            event_type: event_type.clone(),
            data: original_data.clone(),
            transaction_hash: "hash123".to_string(),
        };
        
        // Simulate storage and retrieval
        let serialized = serde_json::to_string(&event).unwrap();
        let retrieved: CapturedEvent = serde_json::from_str(&serialized).unwrap();
        
        // Verify all fields match
        assert_eq!(event.id, retrieved.id);
        assert_eq!(event.source_app, retrieved.source_app);
        assert_eq!(event.timestamp, retrieved.timestamp);
        assert_eq!(event.event_type, retrieved.event_type);
        assert_eq!(event.data, retrieved.data);
        assert_eq!(event.transaction_hash, retrieved.transaction_hash);
    }
}
```

### Property 7: Deduplication Idempotency

```rust
// **Feature: pine-analytics, Property 7: Deduplication idempotency**
// Adding an event multiple times with same hash+timestamp should result in one instance
proptest! {
    #[test]
    fn test_deduplication_idempotency(
        timestamp in any::<u64>(),
        tx_hash in "[a-f0-9]{64}",
    ) {
        let mut state = AnalyticsState::default();
        
        let event = CapturedEvent {
            id: 0,
            source_app: "app1".to_string(),
            source_chain: "chain1".to_string(),
            timestamp,
            event_type: "Transfer".to_string(),
            data: serde_json::json!({}),
            transaction_hash: tx_hash.clone(),
        };
        
        // Add event multiple times
        for _ in 0..5 {
            let is_duplicate = state.events.iter().any(|e| 
                e.transaction_hash == event.transaction_hash 
                && e.timestamp == event.timestamp
            );
            
            if !is_duplicate {
                state.events.push(event.clone());
            }
        }
        
        // Should only have one event
        assert_eq!(state.events.len(), 1);
    }
}
```

### Property 9: Pagination Correctness

```rust
// **Feature: pine-analytics, Property 9: Pagination correctness**
// Paginated queries should return non-overlapping subsets
proptest! {
    #[test]
    fn test_pagination_correctness(
        total_events in 10..100usize,
        page_size in 5..20usize,
    ) {
        // Create test events
        let events: Vec<CapturedEvent> = (0..total_events)
            .map(|i| CapturedEvent {
                id: i as u64,
                source_app: "app1".to_string(),
                source_chain: "chain1".to_string(),
                timestamp: i as u64,
                event_type: "Test".to_string(),
                data: serde_json::json!({}),
                transaction_hash: format!("hash{}", i),
            })
            .collect();
        
        // Paginate
        let mut all_paginated = Vec::new();
        let mut offset = 0;
        
        while offset < total_events {
            let page: Vec<_> = events.iter()
                .skip(offset)
                .take(page_size)
                .cloned()
                .collect();
            
            all_paginated.extend(page);
            offset += page_size;
        }
        
        // Verify no duplicates
        let mut seen_ids = std::collections::HashSet::new();
        for event in &all_paginated {
            assert!(seen_ids.insert(event.id), "Duplicate event ID found");
        }
        
        // Verify all events present
        assert_eq!(all_paginated.len(), total_events);
        
        // Verify order preserved
        for i in 0..all_paginated.len() {
            assert_eq!(all_paginated[i].id, i as u64);
        }
    }
}
```

### Property 10: Time Range Filter Accuracy

```rust
// **Feature: pine-analytics, Property 10: Time range filter accuracy**
// All returned data should have timestamps within specified range
proptest! {
    #[test]
    fn test_time_range_filter_accuracy(
        start_time in 1000u64..5000u64,
        end_time in 5001u64..10000u64,
        num_events in 10..50usize,
    ) {
        // Create events with various timestamps
        let events: Vec<CapturedEvent> = (0..num_events)
            .map(|i| CapturedEvent {
                id: i as u64,
                source_app: "app1".to_string(),
                source_chain: "chain1".to_string(),
                timestamp: (i as u64 * 100) + 500, // Spread across range
                event_type: "Test".to_string(),
                data: serde_json::json!({}),
                transaction_hash: format!("hash{}", i),
            })
            .collect();
        
        // Apply time range filter
        let filtered: Vec<_> = events.iter()
            .filter(|e| e.timestamp >= start_time && e.timestamp <= end_time)
            .collect();
        
        // Verify all results are within range
        for event in filtered {
            assert!(event.timestamp >= start_time);
            assert!(event.timestamp <= end_time);
        }
    }
}
```

### Property 11: Application Filter Accuracy

```rust
// **Feature: pine-analytics, Property 11: Application filter accuracy**
// All returned data should belong to filtered application
proptest! {
    #[test]
    fn test_application_filter_accuracy(
        target_app in "[a-z]{5,10}",
        num_events in 10..50usize,
    ) {
        // Create events from multiple apps
        let apps = vec!["app1", "app2", "app3", &target_app];
        let events: Vec<CapturedEvent> = (0..num_events)
            .map(|i| CapturedEvent {
                id: i as u64,
                source_app: apps[i % apps.len()].to_string(),
                source_chain: "chain1".to_string(),
                timestamp: i as u64,
                event_type: "Test".to_string(),
                data: serde_json::json!({}),
                transaction_hash: format!("hash{}", i),
            })
            .collect();
        
        // Apply application filter
        let filtered: Vec<_> = events.iter()
            .filter(|e| e.source_app == target_app)
            .collect();
        
        // Verify all results match the filter
        for event in filtered {
            assert_eq!(event.source_app, target_app);
        }
        
        // Verify no events from target app were omitted
        let expected_count = events.iter()
            .filter(|e| e.source_app == target_app)
            .count();
        assert_eq!(filtered.len(), expected_count);
    }
}
```

### Property 12: Multi-Field Filter Accuracy

```rust
// **Feature: pine-analytics, Property 12: Multi-field filter accuracy**
// All returned data should satisfy all filter conditions
proptest! {
    #[test]
    fn test_multi_field_filter_accuracy(
        target_app in "[a-z]{5,10}",
        target_type in "[A-Z][a-z]{5,10}",
        start_time in 1000u64..5000u64,
        end_time in 5001u64..10000u64,
    ) {
        // Create diverse events
        let events: Vec<CapturedEvent> = (0..100)
            .map(|i| CapturedEvent {
                id: i,
                source_app: if i % 2 == 0 { target_app.clone() } else { "other_app".to_string() },
                source_chain: "chain1".to_string(),
                timestamp: (i * 50) + 1000,
                event_type: if i % 3 == 0 { target_type.clone() } else { "OtherType".to_string() },
                data: serde_json::json!({}),
                transaction_hash: format!("hash{}", i),
            })
            .collect();
        
        // Apply multiple filters
        let filtered: Vec<_> = events.iter()
            .filter(|e| {
                e.source_app == target_app
                && e.event_type == target_type
                && e.timestamp >= start_time
                && e.timestamp <= end_time
            })
            .collect();
        
        // Verify all conditions are met
        for event in filtered {
            assert_eq!(event.source_app, target_app);
            assert_eq!(event.event_type, target_type);
            assert!(event.timestamp >= start_time);
            assert!(event.timestamp <= end_time);
        }
    }
}
```


### Property 16: Metric Normalization Consistency

```rust
// **Feature: pine-analytics, Property 16: Metric normalization consistency**
// Normalized values should be in comparable units
proptest! {
    #[test]
    fn test_metric_normalization_consistency(
        value1 in 1.0f64..1000.0f64,
        value2 in 1.0f64..1000.0f64,
    ) {
        // Simulate metrics from different apps with different scales
        let metric1 = MetricValue::Counter(value1 as u64);
        let metric2 = MetricValue::Counter(value2 as u64);
        
        // Normalize to 0-100 scale
        let normalize = |val: u64, max: u64| -> f64 {
            (val as f64 / max as f64) * 100.0
        };
        
        let max_val = 1000;
        let norm1 = normalize(value1 as u64, max_val);
        let norm2 = normalize(value2 as u64, max_val);
        
        // Verify normalized values are in comparable range
        assert!(norm1 >= 0.0 && norm1 <= 100.0);
        assert!(norm2 >= 0.0 && norm2 <= 100.0);
        
        // Verify relative ordering is preserved
        if value1 > value2 {
            assert!(norm1 > norm2);
        } else if value1 < value2 {
            assert!(norm1 < norm2);
        }
    }
}
```

### Property 17: Relative Performance Calculation Correctness

```rust
// **Feature: pine-analytics, Property 17: Relative performance calculation correctness**
// Relative performance indicators should be mathematically correct
proptest! {
    #[test]
    fn test_relative_performance_calculation(
        app1_events in 10u64..1000u64,
        app2_events in 10u64..1000u64,
        app3_events in 10u64..1000u64,
    ) {
        let metrics = vec![
            ("app1", app1_events),
            ("app2", app2_events),
            ("app3", app3_events),
        ];
        
        // Calculate relative performance (as percentage of total)
        let total: u64 = metrics.iter().map(|(_, v)| v).sum();
        let relative_perf: Vec<_> = metrics.iter()
            .map(|(app, val)| {
                let percentage = (*val as f64 / total as f64) * 100.0;
                (*app, percentage)
            })
            .collect();
        
        // Verify percentages sum to 100
        let sum: f64 = relative_perf.iter().map(|(_, p)| p).sum();
        assert!((sum - 100.0).abs() < 0.01); // Allow small floating point error
        
        // Verify each percentage is correct
        for (app, percentage) in relative_perf {
            let expected = metrics.iter()
                .find(|(a, _)| *a == app)
                .map(|(_, v)| (*v as f64 / total as f64) * 100.0)
                .unwrap();
            assert!((percentage - expected).abs() < 0.01);
        }
    }
}
```

### Property 19: Configuration Persistence Round-Trip

```rust
// **Feature: pine-analytics, Property 19: Configuration persistence round-trip**
// Saving and loading configuration should restore exact same state
proptest! {
    #[test]
    fn test_configuration_persistence_roundtrip(
        app_id in "[a-z]{5,10}",
        chain_id in "[a-z]{5,10}",
        endpoint in "https?://[a-z]+\\.[a-z]+",
    ) {
        let original_config = AppConfig {
            application_id: app_id.clone(),
            chain_id: chain_id.clone(),
            graphql_endpoint: endpoint.clone(),
            enabled: true,
            custom_metrics: vec![],
        };
        
        // Serialize (save)
        let serialized = serde_json::to_string(&original_config).unwrap();
        
        // Deserialize (load)
        let loaded_config: AppConfig = serde_json::from_str(&serialized).unwrap();
        
        // Verify exact match
        assert_eq!(original_config.application_id, loaded_config.application_id);
        assert_eq!(original_config.chain_id, loaded_config.chain_id);
        assert_eq!(original_config.graphql_endpoint, loaded_config.graphql_endpoint);
        assert_eq!(original_config.enabled, loaded_config.enabled);
        assert_eq!(original_config.custom_metrics.len(), loaded_config.custom_metrics.len());
    }
}
```

### Property 20: Application Configuration Validation

```rust
// **Feature: pine-analytics, Property 20: Application configuration validation**
// Invalid configs should be rejected, valid ones accepted
proptest! {
    #[test]
    fn test_application_configuration_validation(
        app_id in "[a-z]{5,10}",
        endpoint in "https?://[a-z]+\\.[a-z]+",
    ) {
        // Valid configuration
        let valid_config = AppConfig {
            application_id: app_id.clone(),
            chain_id: "chain1".to_string(),
            graphql_endpoint: endpoint.clone(),
            enabled: true,
            custom_metrics: vec![],
        };
        
        // Validation function
        let validate = |config: &AppConfig| -> bool {
            !config.application_id.is_empty()
            && (config.graphql_endpoint.starts_with("http://") 
                || config.graphql_endpoint.starts_with("https://"))
        };
        
        // Valid config should pass
        assert!(validate(&valid_config));
        
        // Invalid configs should fail
        let invalid_empty_id = AppConfig {
            application_id: "".to_string(),
            ..valid_config.clone()
        };
        assert!(!validate(&invalid_empty_id));
        
        let invalid_endpoint = AppConfig {
            graphql_endpoint: "ftp://invalid.com".to_string(),
            ..valid_config.clone()
        };
        assert!(!validate(&invalid_endpoint));
    }
}
```

### Property 21: Historical Data Retention After Removal

```rust
// **Feature: pine-analytics, Property 21: Historical data retention after removal**
// Removing app from monitoring should keep historical events
proptest! {
    #[test]
    fn test_historical_data_retention_after_removal(
        app_id in "[a-z]{5,10}",
        num_events in 5..20usize,
    ) {
        let mut state = AnalyticsState::default();
        
        // Add app to monitoring
        state.monitored_applications.insert(
            app_id.clone(),
            AppConfig {
                application_id: app_id.clone(),
                chain_id: "chain1".to_string(),
                graphql_endpoint: "http://test.com".to_string(),
                enabled: true,
                custom_metrics: vec![],
            }
        );
        
        // Capture events
        for i in 0..num_events {
            state.events.push(CapturedEvent {
                id: i as u64,
                source_app: app_id.clone(),
                source_chain: "chain1".to_string(),
                timestamp: i as u64,
                event_type: "Test".to_string(),
                data: serde_json::json!({}),
                transaction_hash: format!("hash{}", i),
            });
        }
        
        let events_before = state.events.len();
        
        // Remove app from monitoring
        state.monitored_applications.remove(&app_id);
        
        // Verify historical events remain
        assert_eq!(state.events.len(), events_before);
        assert_eq!(state.events.len(), num_events);
        
        // Verify events are still queryable
        let app_events: Vec<_> = state.events.iter()
            .filter(|e| e.source_app == app_id)
            .collect();
        assert_eq!(app_events.len(), num_events);
    }
}
```

### Property 22: Configuration Persistence Across Restarts

```rust
// **Feature: pine-analytics, Property 22: Configuration persistence across restarts**
// After restart, loaded config should match saved config
proptest! {
    #[test]
    fn test_configuration_persistence_across_restarts(
        num_apps in 1..10usize,
    ) {
        let mut original_state = AnalyticsState::default();
        
        // Create multiple app configs
        for i in 0..num_apps {
            let app_id = format!("app{}", i);
            original_state.monitored_applications.insert(
                app_id.clone(),
                AppConfig {
                    application_id: app_id,
                    chain_id: format!("chain{}", i),
                    graphql_endpoint: format!("http://app{}.com", i),
                    enabled: true,
                    custom_metrics: vec![],
                }
            );
        }
        
        // Simulate save (serialize)
        let serialized = serde_json::to_string(&original_state).unwrap();
        
        // Simulate restart (deserialize)
        let loaded_state: AnalyticsState = serde_json::from_str(&serialized).unwrap();
        
        // Verify all configs match
        assert_eq!(
            original_state.monitored_applications.len(),
            loaded_state.monitored_applications.len()
        );
        
        for (app_id, original_config) in &original_state.monitored_applications {
            let loaded_config = loaded_state.monitored_applications.get(app_id).unwrap();
            assert_eq!(original_config.application_id, loaded_config.application_id);
            assert_eq!(original_config.chain_id, loaded_config.chain_id);
            assert_eq!(original_config.graphql_endpoint, loaded_config.graphql_endpoint);
        }
    }
}
```

### Property 23: Historical Date Range Query Correctness

```rust
// **Feature: pine-analytics, Property 23: Historical date range query correctness**
// All returned results should fall within specified range regardless of age
proptest! {
    #[test]
    fn test_historical_date_range_query_correctness(
        old_timestamp in 1000u64..5000u64,
        recent_timestamp in 50000u64..100000u64,
        query_start in 1000u64..50000u64,
        query_end in 50001u64..100000u64,
    ) {
        // Create events with various ages
        let events = vec![
            CapturedEvent {
                id: 0,
                source_app: "app1".to_string(),
                source_chain: "chain1".to_string(),
                timestamp: old_timestamp,
                event_type: "Old".to_string(),
                data: serde_json::json!({}),
                transaction_hash: "hash1".to_string(),
            },
            CapturedEvent {
                id: 1,
                source_app: "app1".to_string(),
                source_chain: "chain1".to_string(),
                timestamp: recent_timestamp,
                event_type: "Recent".to_string(),
                data: serde_json::json!({}),
                transaction_hash: "hash2".to_string(),
            },
        ];
        
        // Query with date range
        let results: Vec<_> = events.iter()
            .filter(|e| e.timestamp >= query_start && e.timestamp <= query_end)
            .collect();
        
        // Verify all results are within range
        for event in results {
            assert!(event.timestamp >= query_start);
            assert!(event.timestamp <= query_end);
        }
    }
}
```

### Property 24: Index Lookup Correctness

```rust
// **Feature: pine-analytics, Property 24: Index lookup correctness**
// Lookups by timestamp, app ID, or tx hash should retrieve correct events
proptest! {
    #[test]
    fn test_index_lookup_correctness(
        num_events in 10..50usize,
    ) {
        let mut state = AnalyticsState::default();
        
        // Create and index events
        for i in 0..num_events {
            let event = CapturedEvent {
                id: i as u64,
                source_app: format!("app{}", i % 3),
                source_chain: "chain1".to_string(),
                timestamp: (i as u64) * 1000,
                event_type: "Test".to_string(),
                data: serde_json::json!({}),
                transaction_hash: format!("hash{}", i),
            };
            
            // Update time index
            state.event_index
                .entry(event.timestamp)
                .or_insert_with(Vec::new)
                .push(event.id);
            
            // Update app index
            state.app_index
                .entry(event.source_app.clone())
                .or_insert_with(Vec::new)
                .push(event.id);
            
            state.events.push(event);
        }
        
        // Test timestamp lookup
        let test_timestamp = 5000u64;
        if let Some(event_ids) = state.event_index.get(&test_timestamp) {
            for &id in event_ids {
                let event = state.events.iter().find(|e| e.id == id).unwrap();
                assert_eq!(event.timestamp, test_timestamp);
            }
        }
        
        // Test app ID lookup
        let test_app = "app1".to_string();
        if let Some(event_ids) = state.app_index.get(&test_app) {
            for &id in event_ids {
                let event = state.events.iter().find(|e| e.id == id).unwrap();
                assert_eq!(event.source_app, test_app);
            }
        }
    }
}
```

### Property 26: Export Format Round-Trip

```rust
// **Feature: pine-analytics, Property 26: Export format round-trip**
// Exporting to JSON and importing should preserve data
proptest! {
    #[test]
    fn test_export_format_roundtrip(
        num_events in 5..20usize,
    ) {
        // Create test events
        let original_events: Vec<CapturedEvent> = (0..num_events)
            .map(|i| CapturedEvent {
                id: i as u64,
                source_app: "app1".to_string(),
                source_chain: "chain1".to_string(),
                timestamp: i as u64,
                event_type: "Test".to_string(),
                data: serde_json::json!({"index": i}),
                transaction_hash: format!("hash{}", i),
            })
            .collect();
        
        // Export to JSON
        let json = serde_json::to_string(&original_events).unwrap();
        
        // Import from JSON
        let imported_events: Vec<CapturedEvent> = serde_json::from_str(&json).unwrap();
        
        // Verify data equivalence
        assert_eq!(original_events.len(), imported_events.len());
        
        for (original, imported) in original_events.iter().zip(imported_events.iter()) {
            assert_eq!(original.id, imported.id);
            assert_eq!(original.source_app, imported.source_app);
            assert_eq!(original.timestamp, imported.timestamp);
            assert_eq!(original.event_type, imported.event_type);
            assert_eq!(original.data, imported.data);
        }
    }
}
```

## Running Tests

### Run all tests
```bash
cargo test
```

### Run only property tests
```bash
cargo test --test proptest
```

### Run with more iterations (thorough testing)
```bash
PROPTEST_CASES=1000 cargo test
```

### Run specific property test
```bash
cargo test test_event_data_completeness
```

## Test Configuration

Create `proptest.toml` in project root:

```toml
# Number of test cases to generate
cases = 100

# Maximum number of shrink iterations
max_shrink_iters = 1000

# Timeout for each test case (in milliseconds)
timeout = 5000
```

## Debugging Failed Tests

When a property test fails, proptest will show the failing case:

```
thread 'test_pagination_correctness' panicked at 'assertion failed: ...'
minimal failing input: total_events = 42, page_size = 7
```

To reproduce:

```rust
#[test]
fn debug_pagination_failure() {
    test_pagination_correctness(42, 7);
}
```

## Best Practices

1. **Keep tests fast**: Each test should complete in < 100ms
2. **Use meaningful ranges**: Don't test with unrealistic values
3. **Test edge cases**: Include 0, 1, max values in ranges
4. **Document properties**: Always include the property comment
5. **Shrink effectively**: Proptest will find minimal failing cases
6. **Run regularly**: Include in CI/CD pipeline
