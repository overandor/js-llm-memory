use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use hex;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MemoryEntry {
    pub key: String,
    pub value: String,
    pub timestamp: u64,
    pub hash: String,
}

#[derive(Serialize, Deserialize)]
pub struct ZKProof {
    pub commitment: String,
    pub proof: String,
    pub public_input: String,
    pub timestamp: u64,
}

#[wasm_bindgen]
pub struct ZKMemorySystem {
    entries: Vec<MemoryEntry>,
    salt: Vec<u8>,
}

#[wasm_bindgen]
impl ZKMemorySystem {
    #[wasm_bindgen(constructor)]
    pub fn new() -> ZKMemorySystem {
        let salt = vec![
            0x1a, 0x2b, 0x3c, 0x4d, 0x5e, 0x6f, 0x70, 0x81,
            0x92, 0xa3, 0xb4, 0xc5, 0xd6, 0xe7, 0xf8, 0x09,
        ];
        ZKMemorySystem {
            entries: Vec::new(),
            salt,
        }
    }

    pub fn add_entry(&mut self, key: &str, value: &str) -> String {
        let timestamp = Self::get_timestamp();
        let hash = Self::compute_hash(key, value, &self.salt, timestamp);
        
        let entry = MemoryEntry {
            key: key.to_string(),
            value: value.to_string(),
            timestamp,
            hash: hash.clone(),
        };
        
        self.entries.push(entry);
        hash
    }

    pub fn get_entry(&self, key: &str) -> Option<String> {
        for entry in &self.entries {
            if entry.key == key {
                return Some(entry.value.clone());
            }
        }
        None
    }

    pub fn verify_entry(&self, key: &str, hash: &str) -> bool {
        for entry in &self.entries {
            if entry.key == key && entry.hash == hash {
                return true;
            }
        }
        false
    }

    pub fn generate_commitment(&self, key: &str) -> String {
        let timestamp = Self::get_timestamp();
        let commitment_data = format!("{}:{}:{:?}", key, timestamp, self.salt);
        let mut hasher = Sha256::new();
        hasher.update(commitment_data.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }

    pub fn create_zk_proof(&self, key: &str, value: &str) -> JsValue {
        let timestamp = Self::get_timestamp();
        let commitment = self.generate_commitment(key);
        
        // Simplified ZK proof (in production, use actual ZK-SNARKs like bellman)
        let proof_data = format!("{}:{}:{}", key, value, timestamp);
        let mut hasher = Sha256::new();
        hasher.update(proof_data.as_bytes());
        hasher.update(&self.salt);
        let proof_hash = hasher.finalize();
        
        let proof = ZKProof {
            commitment,
            proof: hex::encode(proof_hash),
            public_input: key.to_string(),
            timestamp,
        };
        
        serde_wasm_bindgen::to_value(&proof).unwrap()
    }

    pub fn verify_zk_proof(&self, proof_json: JsValue) -> bool {
        let proof: ZKProof = serde_wasm_bindgen::from_value(proof_json).unwrap();
        
        // Verify commitment matches
        let expected_commitment = self.generate_commitment(&proof.public_input);
        if proof.commitment != expected_commitment {
            return false;
        }
        
        // Verify entry exists
        for entry in &self.entries {
            if entry.key == proof.public_input {
                return true;
            }
        }
        
        false
    }

    pub fn get_merkle_root(&self) -> String {
        if self.entries.is_empty() {
            return String::from("empty");
        }
        
        let mut hashes: Vec<String> = self.entries.iter().map(|e| e.hash.clone()).collect();
        
        while hashes.len() > 1 {
            let mut new_hashes = Vec::new();
            for i in (0..hashes.len()).step_by(2) {
                if i + 1 < hashes.len() {
                    let combined = format!("{}{}", hashes[i], hashes[i + 1]);
                    let mut hasher = Sha256::new();
                    hasher.update(combined.as_bytes());
                    let result = hasher.finalize();
                    new_hashes.push(hex::encode(result));
                } else {
                    new_hashes.push(hashes[i].clone());
                }
            }
            hashes = new_hashes;
        }
        
        hashes[0].clone()
    }

    pub fn get_all_hashes(&self) -> JsValue {
        let hashes: Vec<String> = self.entries.iter().map(|e| e.hash.clone()).collect();
        serde_wasm_bindgen::to_value(&hashes).unwrap()
    }

    pub fn entry_count(&self) -> usize {
        self.entries.len()
    }

    pub fn clear(&mut self) {
        self.entries.clear();
    }

    fn compute_hash(key: &str, value: &str, salt: &[u8], timestamp: u64) -> String {
        let data = format!("{}:{}:{:?}:{}", key, value, salt, timestamp);
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }

    fn get_timestamp() -> u64 {
        let timestamp = js_sys::Date::now();
        timestamp as u64
    }
}

#[wasm_bindgen]
pub fn generate_salt() -> JsValue {
    let mut salt = [0u8; 16];
    for i in 0..16 {
        salt[i] = (js_sys::Math::random() * 256.0) as u8;
    }
    serde_wasm_bindgen::to_value(&salt.to_vec()).unwrap()
}

#[wasm_bindgen]
pub fn hash_data(data: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(data.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}
