use thiserror::Error;

use crate::rate_limit::RateLimitError;
use crate::rbac::RBACError;

#[derive(Debug, Error)]
pub enum AnalyticsError {
    #[error("Application not found: {0}")]
    ApplicationNotFound(String),

    #[error("Invalid GraphQL endpoint: {0}")]
    InvalidEndpoint(String),

    #[error("Event processing failed: {0}")]
    EventProcessingError(String),

    #[error("Query execution failed: {0}")]
    QueryError(String),

    #[error("Unauthorized operation")]
    Unauthorized,

    #[error("Invalid metric definition: {0}")]
    InvalidMetric(String),

    #[error("Storage error: {0}")]
    StorageError(String),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    // === New Error Types ===

    #[error("RBAC error: {0}")]
    RBACError(#[from] RBACError),

    #[error("Rate limit error: {0}")]
    RateLimitError(#[from] RateLimitError),

    #[error("Duplicate event with transaction hash: {0}")]
    DuplicateEvent(String),

    #[error("Merkle proof verification failed")]
    MerkleProofFailed,

    #[error("Event not found: {0}")]
    EventNotFound(u64),

    #[error("Invalid operation: {0}")]
    InvalidOperation(String),

    #[error("Batch operation failed: processed {processed}/{total} events")]
    BatchOperationFailed { processed: usize, total: usize },

    #[error("Cross-chain communication error: {0}")]
    CrossChainError(String),

    #[error("Configuration error: {0}")]
    ConfigError(String),
}

pub type Result<T> = std::result::Result<T, AnalyticsError>;

