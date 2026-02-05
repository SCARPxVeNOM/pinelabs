/**
 * Linera Context Provider
 * 
 * Provides wallet state and connection methods throughout the app.
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    WalletState,
    DeploymentInfo,
    DEFAULT_WALLET_STATE,
    STORAGE_KEYS,
    buildGraphQLEndpoint,
} from '@/lib/linera';

// =============================================================================
// Context Types
// =============================================================================

interface LineraContextValue extends WalletState {
    /** Deployment information from deployment-testnet.json */
    deployment: DeploymentInfo | null;

    /** Connect to the wallet (loads from localStorage or deployment info) */
    connect: () => Promise<void>;

    /** Disconnect and clear state */
    disconnect: () => void;

    /** Refresh the balance from the GraphQL endpoint */
    refreshBalance: () => Promise<void>;

    /** Check if the GraphQL service is healthy */
    checkHealth: () => Promise<boolean>;

    /** Get the GraphQL endpoint URL */
    graphqlEndpoint: string | null;
}

// =============================================================================
// Context
// =============================================================================

const LineraContext = createContext<LineraContextValue | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface LineraProviderProps {
    children: ReactNode;
}

export function LineraProvider({ children }: LineraProviderProps) {
    const [walletState, setWalletState] = useState<WalletState>(DEFAULT_WALLET_STATE);
    const [deployment, setDeployment] = useState<DeploymentInfo | null>(null);

    // Load deployment info on mount
    useEffect(() => {
        loadDeploymentInfo();
        loadSavedState();
    }, []);

    // Load deployment info from JSON file
    const loadDeploymentInfo = async () => {
        try {
            // Try to load from public folder
            const response = await fetch('/deployment-testnet.json');
            if (response.ok) {
                const data: DeploymentInfo = await response.json();
                setDeployment(data);
                localStorage.setItem(STORAGE_KEYS.DEPLOYMENT_INFO, JSON.stringify(data));
            }
        } catch (error) {
            // Try to load from localStorage if file not found
            const saved = localStorage.getItem(STORAGE_KEYS.DEPLOYMENT_INFO);
            if (saved) {
                try {
                    setDeployment(JSON.parse(saved));
                } catch {
                    console.warn('Failed to parse saved deployment info');
                }
            }
        }
    };

    // Load saved wallet state from localStorage
    const loadSavedState = () => {
        const saved = localStorage.getItem(STORAGE_KEYS.WALLET_STATE);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWalletState(prev => ({
                    ...prev,
                    ...parsed,
                    isConnecting: false, // Reset connecting state
                }));
            } catch {
                console.warn('Failed to parse saved wallet state');
            }
        }
    };

    // Save wallet state to localStorage
    const saveState = useCallback((state: WalletState) => {
        localStorage.setItem(STORAGE_KEYS.WALLET_STATE, JSON.stringify({
            isConnected: state.isConnected,
            chainId: state.chainId,
            owner: state.owner,
            balance: state.balance,
        }));
    }, []);

    // Connect to wallet
    const connect = useCallback(async () => {
        setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            // If we have deployment info, use it
            if (deployment) {
                const newState: WalletState = {
                    isConnected: true,
                    isConnecting: false,
                    chainId: deployment.chain_id,
                    owner: deployment.admin_owner,
                    balance: null, // Will be fetched
                    error: null,
                };
                setWalletState(newState);
                saveState(newState);

                // Try to fetch balance
                await refreshBalanceInternal(deployment);
            } else {
                throw new Error('No deployment info available. Please deploy the application first.');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
            setWalletState(prev => ({
                ...prev,
                isConnecting: false,
                error: errorMessage,
            }));
        }
    }, [deployment, saveState]);

    // Disconnect wallet
    const disconnect = useCallback(() => {
        const newState = DEFAULT_WALLET_STATE;
        setWalletState(newState);
        localStorage.removeItem(STORAGE_KEYS.WALLET_STATE);
    }, []);

    // Internal refresh balance function
    const refreshBalanceInternal = async (deploymentInfo: DeploymentInfo) => {
        try {
            const endpoint = buildGraphQLEndpoint(
                deploymentInfo.chain_id,
                deploymentInfo.application_id,
                deploymentInfo.port
            );

            // Query balance via GraphQL
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query { balance }`,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.data?.balance !== undefined) {
                    setWalletState(prev => {
                        const newState = { ...prev, balance: data.data.balance };
                        saveState(newState);
                        return newState;
                    });
                }
            }
        } catch (error) {
            console.warn('Failed to fetch balance:', error);
        }
    };

    // Public refresh balance function
    const refreshBalance = useCallback(async () => {
        if (deployment) {
            await refreshBalanceInternal(deployment);
        }
    }, [deployment]);

    // Check GraphQL service health
    const checkHealth = useCallback(async (): Promise<boolean> => {
        if (!deployment) return false;

        try {
            const endpoint = `http://localhost:${deployment.port}/health`;
            const response = await fetch(endpoint);
            return response.ok;
        } catch {
            return false;
        }
    }, [deployment]);

    // Compute GraphQL endpoint
    const graphqlEndpoint = deployment
        ? buildGraphQLEndpoint(deployment.chain_id, deployment.application_id, deployment.port)
        : null;

    // Context value
    const value: LineraContextValue = {
        ...walletState,
        deployment,
        connect,
        disconnect,
        refreshBalance,
        checkHealth,
        graphqlEndpoint,
    };

    return (
        <LineraContext.Provider value={value}>
            {children}
        </LineraContext.Provider>
    );
}

// =============================================================================
// Hook
// =============================================================================

export function useLineraContext(): LineraContextValue {
    const context = useContext(LineraContext);
    if (context === undefined) {
        throw new Error('useLineraContext must be used within a LineraProvider');
    }
    return context;
}

export default LineraContext;
