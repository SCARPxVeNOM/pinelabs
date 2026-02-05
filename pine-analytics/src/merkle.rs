//! Merkle Tree Indexing for Verifiable Queries
//!
//! Provides cryptographic proofs for event data integrity.

use linera_sdk::linera_base_types::CryptoHash;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

use crate::state::EventId;

/// Sparse Merkle Tree for event indexing
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MerkleIndex {
    /// Current Merkle root
    pub root: Option<CryptoHash>,
    /// Tree depth
    pub depth: u8,
    /// Leaf nodes: EventId -> Hash of event data
    pub leaves: BTreeMap<EventId, CryptoHash>,
    /// Internal nodes for proof generation
    pub internal_nodes: BTreeMap<u64, CryptoHash>,
}

/// Merkle proof for verifying event inclusion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerkleProof {
    /// Path from leaf to root: (sibling_hash, is_left_sibling)
    pub path: Vec<(CryptoHash, bool)>,
    /// Hash of the leaf (event data)
    pub leaf_hash: CryptoHash,
    /// The event ID being proven
    pub event_id: EventId,
}

/// Batch proof for multiple events
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProof {
    /// Root at time of batch
    pub batch_root: CryptoHash,
    /// Individual proofs
    pub proofs: Vec<MerkleProof>,
    /// Batch metadata
    pub batch_id: u64,
    pub event_count: usize,
}

impl MerkleIndex {
    /// Create new empty Merkle index
    pub fn new(depth: u8) -> Self {
        Self {
            root: None,
            depth,
            leaves: BTreeMap::new(),
            internal_nodes: BTreeMap::new(),
        }
    }

    /// Hash data to create a CryptoHash
    fn hash_data(data: &[u8]) -> CryptoHash {
        // Simple hash using the data bytes
        // In production, use a proper cryptographic hash
        let mut hash_bytes = [0u8; 32];
        for (i, byte) in data.iter().enumerate() {
            hash_bytes[i % 32] ^= byte;
        }
        CryptoHash::from(hash_bytes)
    }

    /// Combine two hashes for internal node
    fn combine_hashes(left: &CryptoHash, right: &CryptoHash) -> CryptoHash {
        let left_bytes: [u8; 32] = (*left).into();
        let right_bytes: [u8; 32] = (*right).into();
        let mut combined = [0u8; 32];
        for i in 0..32 {
            combined[i] = left_bytes[i] ^ right_bytes[i];
        }
        CryptoHash::from(combined)
    }

    /// Insert an event into the Merkle tree
    pub fn insert(&mut self, event_id: EventId, event_data: &[u8]) {
        let event_hash = Self::hash_data(event_data);
        self.leaves.insert(event_id, event_hash);
        self.recompute_root();
    }

    /// Insert with pre-computed hash
    pub fn insert_hash(&mut self, event_id: EventId, event_hash: CryptoHash) {
        self.leaves.insert(event_id, event_hash);
        self.recompute_root();
    }

    /// Recompute the Merkle root from leaves
    fn recompute_root(&mut self) {
        if self.leaves.is_empty() {
            self.root = None;
            return;
        }

        // Simple binary tree construction
        let mut current_level: Vec<CryptoHash> = self.leaves.values().cloned().collect();
        
        // Pad to power of 2
        let next_pow2 = current_level.len().next_power_of_two();
        let zero_hash = CryptoHash::from([0u8; 32]);
        current_level.resize(next_pow2, zero_hash);

        while current_level.len() > 1 {
            let mut next_level = Vec::new();
            for chunk in current_level.chunks(2) {
                let left = &chunk[0];
                let right = chunk.get(1).unwrap_or(&zero_hash);
                next_level.push(Self::combine_hashes(left, right));
            }
            current_level = next_level;
        }

        self.root = current_level.into_iter().next();
    }

    /// Generate a Merkle proof for an event
    pub fn generate_proof(&self, event_id: EventId) -> Option<MerkleProof> {
        let leaf_hash = self.leaves.get(&event_id)?;
        
        // Build proof path
        let leaves_vec: Vec<(EventId, CryptoHash)> = self.leaves.iter()
            .map(|(k, v)| (*k, *v))
            .collect();
        
        let leaf_index = leaves_vec.iter().position(|(id, _)| *id == event_id)?;
        
        let mut hashes: Vec<CryptoHash> = leaves_vec.iter().map(|(_, h)| *h).collect();
        let next_pow2 = hashes.len().next_power_of_two();
        let zero_hash = CryptoHash::from([0u8; 32]);
        hashes.resize(next_pow2, zero_hash);

        let mut path = Vec::new();
        let mut index = leaf_index;

        while hashes.len() > 1 {
            let sibling_index = if index % 2 == 0 { index + 1 } else { index - 1 };
            let sibling_hash = hashes.get(sibling_index).cloned().unwrap_or(zero_hash);
            let is_left = index % 2 == 1; // Sibling is on the left if we're odd
            path.push((sibling_hash, is_left));

            // Move to next level
            let mut next_level = Vec::new();
            for chunk in hashes.chunks(2) {
                let left = &chunk[0];
                let right = chunk.get(1).unwrap_or(&zero_hash);
                next_level.push(Self::combine_hashes(left, right));
            }
            hashes = next_level;
            index /= 2;
        }

        Some(MerkleProof {
            path,
            leaf_hash: *leaf_hash,
            event_id,
        })
    }

    /// Verify a Merkle proof
    pub fn verify_proof(root: &CryptoHash, proof: &MerkleProof) -> bool {
        let mut current_hash = proof.leaf_hash;

        for (sibling_hash, is_left) in &proof.path {
            if *is_left {
                current_hash = Self::combine_hashes(sibling_hash, &current_hash);
            } else {
                current_hash = Self::combine_hashes(&current_hash, sibling_hash);
            }
        }

        current_hash == *root
    }

    /// Get current root
    pub fn get_root(&self) -> Option<CryptoHash> {
        self.root
    }

    /// Get number of events indexed
    pub fn event_count(&self) -> usize {
        self.leaves.len()
    }

    /// Generate batch proof for multiple events
    pub fn generate_batch_proof(&self, event_ids: &[EventId], batch_id: u64) -> Option<BatchProof> {
        let root = self.root?;
        let mut proofs = Vec::new();

        for event_id in event_ids {
            if let Some(proof) = self.generate_proof(*event_id) {
                proofs.push(proof);
            }
        }

        if proofs.is_empty() {
            return None;
        }

        Some(BatchProof {
            batch_root: root,
            proofs,
            batch_id,
            event_count: event_ids.len(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_insert_and_root() {
        let mut index = MerkleIndex::new(8);
        
        index.insert(1, b"event1");
        assert!(index.root.is_some());
        
        let root1 = index.root.unwrap();
        
        index.insert(2, b"event2");
        let root2 = index.root.unwrap();
        
        // Root should change after insert
        assert_ne!(root1, root2);
    }

    #[test]
    fn test_merkle_proof_verification() {
        let mut index = MerkleIndex::new(8);
        
        index.insert(1, b"event1");
        index.insert(2, b"event2");
        index.insert(3, b"event3");
        index.insert(4, b"event4");
        
        let root = index.get_root().unwrap();
        let proof = index.generate_proof(2).unwrap();
        
        assert!(MerkleIndex::verify_proof(&root, &proof));
    }

    #[test]
    fn test_invalid_proof_fails() {
        let mut index = MerkleIndex::new(8);
        
        index.insert(1, b"event1");
        index.insert(2, b"event2");
        
        let root = index.get_root().unwrap();
        let mut proof = index.generate_proof(1).unwrap();
        
        // Tamper with proof
        proof.leaf_hash = CryptoHash::from([99u8; 32]);
        
        assert!(!MerkleIndex::verify_proof(&root, &proof));
    }
}
