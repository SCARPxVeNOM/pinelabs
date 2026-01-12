use thiserror::Error;

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
}

pub type Result<T> = std::result::Result<T, AnalyticsError>;
