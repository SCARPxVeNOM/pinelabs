/**
 * Linera Integration Configuration and Types
 * 
 * This module provides types and utilities for connecting to the
 * Linera Conway Testnet.
 */

// =============================================================================
// Configuration
// =============================================================================

export const LINERA_CONFIG = {
    /** Faucet URL for Testnet Conway */
    FAUCET_URL: import.meta.env.VITE_LINERA_FAUCET_URL || 'https://faucet.testnet-conway.linera.net/',

    /** Protocol version required */
    PROTOCOL_VERSION: 'v0.15.8',

    /** Default GraphQL port */
    DEFAULT_PORT: 8080,

    /** Network name */
    NETWORK: 'testnet-conway',
} as const;

// =============================================================================
// Types
// =============================================================================

/** Chain information from the wallet */
export interface ChainInfo {
    chainId: string;
    owner: string;
    balance: string;
    timestamp?: string;
}

/** Wallet connection state */
export interface WalletState {
    isConnected: boolean;
    isConnecting: boolean;
    chainId: string | null;
    owner: string | null;
    balance: string | null;
    error: string | null;
}

/** Deployment information from deployment-testnet.json */
export interface DeploymentInfo {
    network: string;
    bytecode_id: string;
    application_id: string;
    chain_id: string;
    admin_owner: string;
    port: number;
    wallet: number;
    deployed_at: string;
    graphql_endpoint: string;
    faucet_url: string;
}

/** GraphQL query response wrapper */
export interface GraphQLResponse<T> {
    data?: T;
    errors?: Array<{
        message: string;
        locations?: Array<{ line: number; column: number }>;
        path?: string[];
    }>;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Truncates a chain ID or address for display
 * @example truncateAddress("0x1234567890abcdef") => "0x1234...cdef"
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
    if (!address) return '';
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Formats a balance for display with appropriate decimals
 */
export function formatBalance(balance: string | number, decimals = 4): string {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance;
    if (isNaN(num)) return '0';
    return num.toFixed(decimals);
}

/**
 * Builds the GraphQL endpoint URL from chain and application IDs
 */
export function buildGraphQLEndpoint(
    chainId: string,
    applicationId: string,
    port: number = LINERA_CONFIG.DEFAULT_PORT
): string {
    return `http://localhost:${port}/chains/${chainId}/applications/${applicationId}`;
}

/**
 * Validates a chain ID format
 */
export function isValidChainId(chainId: string): boolean {
    return /^[a-f0-9]{64}$/i.test(chainId);
}

/**
 * Validates an owner/address format
 */
export function isValidOwner(owner: string): boolean {
    return /^(0x)?[a-f0-9]{64}$/i.test(owner);
}

// =============================================================================
// Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
    WALLET_STATE: 'linera_wallet_state',
    DEPLOYMENT_INFO: 'linera_deployment_info',
    LAST_CONNECTED_CHAIN: 'linera_last_chain',
} as const;

// =============================================================================
// Default State
// =============================================================================

export const DEFAULT_WALLET_STATE: WalletState = {
    isConnected: false,
    isConnecting: false,
    chainId: null,
    owner: null,
    balance: null,
    error: null,
};
