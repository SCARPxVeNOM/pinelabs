//! Advanced Aggregation Functions for Pine Analytics
//!
//! Compute-intensive analytics operations performed in the service layer.

use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::state::{ApplicationId, CapturedEvent, MetricValue, Timestamp};

/// Anomaly detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnomalyEvent {
    /// Index in the time series
    pub index: usize,
    /// The anomalous value
    pub value: f64,
    /// Z-score (standard deviations from mean)
    pub z_score: f64,
    /// Timestamp of the anomaly
    pub timestamp: Timestamp,
    /// Event ID if applicable
    pub event_id: Option<u64>,
}

/// Time bucket for aggregation
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TimeBucket {
    /// Start timestamp of bucket
    pub start: Timestamp,
    /// Bucket duration in milliseconds
    pub duration_ms: u64,
}

impl TimeBucket {
    /// Create bucket from timestamp with given granularity
    pub fn from_timestamp(timestamp: Timestamp, granularity_ms: u64) -> Self {
        let start = (timestamp / granularity_ms) * granularity_ms;
        Self {
            start,
            duration_ms: granularity_ms,
        }
    }

    /// Get end timestamp of bucket
    pub fn end(&self) -> Timestamp {
        self.start + self.duration_ms
    }
}

/// Aggregation type for metrics
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AggregationType {
    Sum,
    Average,
    Min,
    Max,
    Count,
    Percentile(f64), // e.g., 0.95 for 95th percentile
    StandardDeviation,
}

/// Result of cross-chain correlation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrelationMatrix {
    /// Chain IDs in order
    pub chains: Vec<String>,
    /// Correlation coefficients (flattened NxN matrix)
    pub coefficients: Vec<f64>,
    /// Metric used for correlation
    pub metric: String,
}

/// Moving average result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MovingAveragePoint {
    pub timestamp: Timestamp,
    pub value: f64,
    pub window_size: u64,
}

/// Aggregation query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregationQuery {
    /// Metric name to aggregate
    pub metric: String,
    /// Aggregation type
    pub aggregation: AggregationType,
    /// Time range
    pub start_time: Timestamp,
    pub end_time: Timestamp,
    /// Granularity for time bucketing
    pub granularity_ms: u64,
    /// Filter by application IDs
    pub app_filter: Option<Vec<ApplicationId>>,
}

/// Aggregated result for a metric query
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AggregatedResult {
    /// Metric name
    pub metric: String,
    /// Aggregation type used
    pub aggregation: AggregationType,
    /// Result value
    pub value: f64,
    /// Time bucket if applicable
    pub bucket: Option<TimeBucket>,
    /// Number of data points aggregated
    pub sample_count: usize,
}

/// Aggregation engine for computing metrics
pub struct AggregationEngine;

impl AggregationEngine {
    /// Compute statistical mean
    pub fn mean(values: &[f64]) -> f64 {
        if values.is_empty() {
            return 0.0;
        }
        values.iter().sum::<f64>() / values.len() as f64
    }

    /// Compute standard deviation
    pub fn std_dev(values: &[f64]) -> f64 {
        if values.len() < 2 {
            return 0.0;
        }
        let mean = Self::mean(values);
        let variance = values.iter()
            .map(|v| (v - mean).powi(2))
            .sum::<f64>() / (values.len() - 1) as f64;
        variance.sqrt()
    }

    /// Compute moving average
    pub fn moving_average(values: &[(Timestamp, f64)], window_size: usize) -> Vec<MovingAveragePoint> {
        if values.len() < window_size {
            return vec![];
        }

        values.windows(window_size)
            .map(|window| {
                let sum: f64 = window.iter().map(|(_, v)| v).sum();
                let avg = sum / window_size as f64;
                MovingAveragePoint {
                    timestamp: window.last().unwrap().0,
                    value: avg,
                    window_size: window_size as u64,
                }
            })
            .collect()
    }

    /// Detect anomalies using Z-score
    pub fn detect_anomalies(values: &[(Timestamp, f64)], sensitivity: f64) -> Vec<AnomalyEvent> {
        let vals: Vec<f64> = values.iter().map(|(_, v)| *v).collect();
        let mean = Self::mean(&vals);
        let std_dev = Self::std_dev(&vals);

        if std_dev == 0.0 {
            return vec![];
        }

        values.iter()
            .enumerate()
            .filter_map(|(i, (ts, v))| {
                let z_score = (*v - mean) / std_dev;
                if z_score.abs() > sensitivity {
                    Some(AnomalyEvent {
                        index: i,
                        value: *v,
                        z_score,
                        timestamp: *ts,
                        event_id: None,
                    })
                } else {
                    None
                }
            })
            .collect()
    }

    /// Compute percentile
    pub fn percentile(values: &[f64], p: f64) -> f64 {
        if values.is_empty() {
            return 0.0;
        }

        let mut sorted = values.to_vec();
        sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

        let index = (p * (sorted.len() - 1) as f64).round() as usize;
        sorted[index.min(sorted.len() - 1)]
    }

    /// Aggregate values by type
    pub fn aggregate(values: &[f64], agg_type: &AggregationType) -> f64 {
        match agg_type {
            AggregationType::Sum => values.iter().sum(),
            AggregationType::Average => Self::mean(values),
            AggregationType::Min => values.iter().cloned().fold(f64::MAX, f64::min),
            AggregationType::Max => values.iter().cloned().fold(f64::MIN, f64::max),
            AggregationType::Count => values.len() as f64,
            AggregationType::Percentile(p) => Self::percentile(values, *p),
            AggregationType::StandardDeviation => Self::std_dev(values),
        }
    }

    /// Bucket events by time
    pub fn bucket_events(events: &[CapturedEvent], granularity_ms: u64) -> BTreeMap<TimeBucket, Vec<&CapturedEvent>> {
        let mut buckets: BTreeMap<TimeBucket, Vec<&CapturedEvent>> = BTreeMap::new();

        for event in events {
            let bucket = TimeBucket::from_timestamp(event.timestamp, granularity_ms);
            buckets.entry(bucket).or_default().push(event);
        }

        buckets
    }

    /// Compute correlation coefficient between two series
    pub fn correlation(x: &[f64], y: &[f64]) -> f64 {
        if x.len() != y.len() || x.len() < 2 {
            return 0.0;
        }

        let mean_x = Self::mean(x);
        let mean_y = Self::mean(y);
        let std_x = Self::std_dev(x);
        let std_y = Self::std_dev(y);

        if std_x == 0.0 || std_y == 0.0 {
            return 0.0;
        }

        let covariance: f64 = x.iter()
            .zip(y.iter())
            .map(|(xi, yi)| (xi - mean_x) * (yi - mean_y))
            .sum::<f64>() / (x.len() - 1) as f64;

        covariance / (std_x * std_y)
    }

    /// Extract numeric value from metric
    pub fn extract_metric_value(metric: &MetricValue) -> f64 {
        match metric {
            MetricValue::Counter(v) => *v as f64,
            MetricValue::Gauge(v) => *v,
            MetricValue::Histogram(v) => Self::mean(v),
            MetricValue::Summary { avg, .. } => *avg,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mean_and_std_dev() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert!((AggregationEngine::mean(&values) - 3.0).abs() < 0.001);
        assert!((AggregationEngine::std_dev(&values) - 1.5811).abs() < 0.01);
    }

    #[test]
    fn test_moving_average() {
        let values = vec![(0, 1.0), (1, 2.0), (2, 3.0), (3, 4.0), (4, 5.0)];
        let ma = AggregationEngine::moving_average(&values, 3);
        
        assert_eq!(ma.len(), 3);
        assert!((ma[0].value - 2.0).abs() < 0.001); // avg(1,2,3)
        assert!((ma[1].value - 3.0).abs() < 0.001); // avg(2,3,4)
        assert!((ma[2].value - 4.0).abs() < 0.001); // avg(3,4,5)
    }

    #[test]
    fn test_anomaly_detection() {
        let values = vec![
            (0, 10.0), (1, 11.0), (2, 10.5), (3, 9.5), 
            (4, 100.0), // Anomaly!
            (5, 10.2), (6, 10.8)
        ];
        
        let anomalies = AggregationEngine::detect_anomalies(&values, 2.0);
        assert!(!anomalies.is_empty());
        assert_eq!(anomalies[0].index, 4);
    }

    #[test]
    fn test_correlation() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![2.0, 4.0, 6.0, 8.0, 10.0]; // Perfect positive correlation
        
        let corr = AggregationEngine::correlation(&x, &y);
        assert!((corr - 1.0).abs() < 0.001);
    }

    #[test]
    fn test_percentile() {
        let values = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        
        // For 10 values, index = round(0.5 * 9) = round(4.5) = 5, so value is 6.0
        assert!((AggregationEngine::percentile(&values, 0.5) - 6.0).abs() < 0.001); // 50th percentile
        // For 10 values, index = round(0.9 * 9) = round(8.1) = 8, so value is 9.0
        assert!((AggregationEngine::percentile(&values, 0.9) - 9.0).abs() < 0.001); // 90th percentile
    }
}
