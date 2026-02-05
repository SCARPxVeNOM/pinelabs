//! Rate Limiting & Backpressure for Pine Analytics
//!
//! Protects against DoS attacks and manages high-throughput scenarios.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::state::ApplicationId;

/// Rate limit configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitConfig {
    /// Maximum events per application per block
    pub max_events_per_app_per_block: u64,
    /// Maximum total events per block (global limit)
    pub max_total_events_per_block: u64,
    /// Burst multiplier for temporary spikes
    pub burst_multiplier: f64,
    /// Cooldown blocks after rate limit is hit
    pub cooldown_blocks: u64,
    /// Whether rate limiting is enabled
    pub enabled: bool,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            max_events_per_app_per_block: 100,
            max_total_events_per_block: 1000,
            burst_multiplier: 1.5,
            cooldown_blocks: 5,
            enabled: true,
        }
    }
}

/// Per-block event counter
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BlockEventCount {
    pub block_height: u64,
    pub count: u64,
}

/// Rate limiter state
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RateLimiterState {
    /// Per-app event counters
    pub app_counters: BTreeMap<ApplicationId, BlockEventCount>,
    /// Global event counter for current block
    pub global_counter: BlockEventCount,
    /// Blocked apps with unblock block height
    pub blocked_apps: BTreeMap<ApplicationId, u64>,
    /// Current configuration
    pub config: RateLimitConfig,
    /// Ingestion paused globally
    pub paused: bool,
}

impl RateLimiterState {
    /// Create new rate limiter with config
    pub fn new(config: RateLimitConfig) -> Self {
        Self {
            config,
            ..Default::default()
        }
    }

    /// Check if an app can submit an event and increment counter
    pub fn check_and_increment(
        &mut self,
        app_id: &ApplicationId,
        current_block: u64,
    ) -> Result<(), RateLimitError> {
        // Check global pause
        if self.paused {
            return Err(RateLimitError::IngestionPaused);
        }

        // Skip if rate limiting is disabled
        if !self.config.enabled {
            return Ok(());
        }

        // Check if app is blocked
        if let Some(&unblock_at) = self.blocked_apps.get(app_id) {
            if current_block < unblock_at {
                return Err(RateLimitError::AppBlocked {
                    unblock_at,
                    current_block,
                });
            } else {
                // Unblock the app
                self.blocked_apps.remove(app_id);
            }
        }

        // Reset counters if new block
        self.reset_if_new_block(current_block);

        // Check global limit
        let max_global = (self.config.max_total_events_per_block as f64
            * self.config.burst_multiplier) as u64;
        if self.global_counter.count >= max_global {
            return Err(RateLimitError::GlobalLimitExceeded {
                limit: max_global,
                current: self.global_counter.count,
            });
        }

        // Check per-app limit
        let app_counter = self.app_counters.entry(app_id.clone()).or_insert(BlockEventCount {
            block_height: current_block,
            count: 0,
        });

        let max_app = (self.config.max_events_per_app_per_block as f64
            * self.config.burst_multiplier) as u64;
        
        if app_counter.count >= max_app {
            // Block the app
            self.blocked_apps
                .insert(app_id.clone(), current_block + self.config.cooldown_blocks);
            return Err(RateLimitError::AppLimitExceeded {
                app_id: app_id.clone(),
                limit: max_app,
                cooldown_blocks: self.config.cooldown_blocks,
            });
        }

        // Increment counters
        app_counter.count += 1;
        self.global_counter.count += 1;

        Ok(())
    }

    /// Reset counters if we're in a new block
    fn reset_if_new_block(&mut self, current_block: u64) {
        if self.global_counter.block_height != current_block {
            self.global_counter = BlockEventCount {
                block_height: current_block,
                count: 0,
            };
            // Reset all app counters
            for counter in self.app_counters.values_mut() {
                if counter.block_height != current_block {
                    counter.block_height = current_block;
                    counter.count = 0;
                }
            }
        }
    }

    /// Pause ingestion globally
    pub fn pause(&mut self) {
        self.paused = true;
    }

    /// Resume ingestion
    pub fn resume(&mut self) {
        self.paused = false;
    }

    /// Update configuration
    pub fn update_config(&mut self, config: RateLimitConfig) {
        self.config = config;
    }

    /// Get current stats
    pub fn get_stats(&self) -> RateLimitStats {
        RateLimitStats {
            global_count: self.global_counter.count,
            global_limit: self.config.max_total_events_per_block,
            blocked_apps_count: self.blocked_apps.len(),
            paused: self.paused,
            enabled: self.config.enabled,
        }
    }

    /// Manually unblock an app
    pub fn unblock_app(&mut self, app_id: &ApplicationId) -> bool {
        self.blocked_apps.remove(app_id).is_some()
    }
}

/// Rate limit statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RateLimitStats {
    pub global_count: u64,
    pub global_limit: u64,
    pub blocked_apps_count: usize,
    pub paused: bool,
    pub enabled: bool,
}

/// Rate limiting errors
#[derive(Debug, Clone, Serialize, Deserialize, thiserror::Error)]
pub enum RateLimitError {
    #[error("App {app_id:?} exceeded limit of {limit} events, blocked for {cooldown_blocks} blocks")]
    AppLimitExceeded {
        app_id: ApplicationId,
        limit: u64,
        cooldown_blocks: u64,
    },
    #[error("Global limit of {limit} exceeded (current: {current})")]
    GlobalLimitExceeded { limit: u64, current: u64 },
    #[error("App is blocked until block {unblock_at} (current: {current_block})")]
    AppBlocked { unblock_at: u64, current_block: u64 },
    #[error("Ingestion is paused globally")]
    IngestionPaused,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    fn test_app_id(id: u8) -> ApplicationId {
        // Create a deterministic ApplicationId from a test ID
        let mut hasher = DefaultHasher::new();
        id.hash(&mut hasher);
        let hash = hasher.finish();

        let mut bytes = [0u8; 32];
        bytes[0] = id;
        let hash_bytes = hash.to_le_bytes();
        bytes[8..16].copy_from_slice(&hash_bytes);

        let hex_str: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
        serde_json::from_str(&format!(r#""{}""#, hex_str))
            .or_else(|_| serde_json::from_value(serde_json::json!(hex_str)))
            .expect("Failed to create test ApplicationId")
    }

    #[test]
    fn test_rate_limit_allows_under_limit() {
        let mut limiter = RateLimiterState::new(RateLimitConfig {
            max_events_per_app_per_block: 10,
            max_total_events_per_block: 100,
            burst_multiplier: 1.0,
            cooldown_blocks: 5,
            enabled: true,
        });

        let app = test_app_id(1);
        for _ in 0..10 {
            assert!(limiter.check_and_increment(&app, 1).is_ok());
        }
    }

    #[test]
    fn test_rate_limit_blocks_over_limit() {
        let mut limiter = RateLimiterState::new(RateLimitConfig {
            max_events_per_app_per_block: 5,
            max_total_events_per_block: 100,
            burst_multiplier: 1.0,
            cooldown_blocks: 5,
            enabled: true,
        });

        let app = test_app_id(1);
        for _ in 0..5 {
            assert!(limiter.check_and_increment(&app, 1).is_ok());
        }
        
        // 6th event should fail
        let result = limiter.check_and_increment(&app, 1);
        assert!(matches!(result, Err(RateLimitError::AppLimitExceeded { .. })));
    }

    #[test]
    fn test_pause_blocks_all() {
        let mut limiter = RateLimiterState::new(RateLimitConfig::default());
        limiter.pause();

        let app = test_app_id(1);
        let result = limiter.check_and_increment(&app, 1);
        assert!(matches!(result, Err(RateLimitError::IngestionPaused)));
    }
}

