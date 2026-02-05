/**
 * useChains Hook
 * 
 * Provides multi-chain management for Linera microchains.
 * Handles chain listing, switching, health monitoring, and cross-chain queries.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLinera } from './useLinera';
import { LINERA_CONFIG, ChainInfo, buildGraphQLEndpoint } from '@/lib/linera';

export interface MicrochainInfo extends ChainInfo {
    isActive: boolean;
    blockHeight?: number;
    syncStatus?: 'synced' | 'syncing' | 'offline';
    applicationCount?: number;
}

export interface CrossChainResult {
    chainId: string;
    success: boolean;
    data?: any;
    error?: string;
}

export function useChains() {
    const { deployment, isConnected, chainId: activeChainId } = useLinera();
    const [chains, setChains] = useState<MicrochainInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch available chains from wallet
    const refreshChains = useCallback(async () => {
        if (!deployment) return;

        setLoading(true);
        setError(null);

        try {
            // Query the main chains endpoint
            const endpoint = `http://localhost:${deployment.port}/`;
            const response = await fetch(endpoint);

            if (response.ok) {
                const html = await response.text();
                // Parse chain IDs from the service response
                const chainMatches = html.match(/chains\/([a-f0-9]{64})/gi) || [];
                const uniqueChains = [...new Set(chainMatches.map(m => m.replace('chains/', '')))];

                const chainInfos: MicrochainInfo[] = uniqueChains.map(cid => ({
                    chainId: cid,
                    owner: '',
                    balance: '0',
                    isActive: cid === activeChainId,
                    syncStatus: 'synced' as const,
                }));

                // Ensure current chain is included
                if (activeChainId && !chainInfos.find(c => c.chainId === activeChainId)) {
                    chainInfos.unshift({
                        chainId: activeChainId,
                        owner: deployment.admin_owner,
                        balance: '0',
                        isActive: true,
                        syncStatus: 'synced',
                    });
                }

                setChains(chainInfos);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch chains');
        } finally {
            setLoading(false);
        }
    }, [deployment, activeChainId]);

    // Get chain health status
    const getChainHealth = useCallback(async (chainId: string): Promise<{
        blockHeight: number;
        syncStatus: 'synced' | 'syncing' | 'offline';
    } | null> => {
        if (!deployment) return null;

        try {
            const endpoint = buildGraphQLEndpoint(chainId, deployment.application_id, deployment.port);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query { health { status totalEvents } }`,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    blockHeight: data.data?.health?.totalEvents || 0,
                    syncStatus: 'synced',
                };
            }
        } catch {
            return { blockHeight: 0, syncStatus: 'offline' };
        }
        return null;
    }, [deployment]);

    // Execute cross-chain query
    const crossChainQuery = useCallback(async (
        targetChains: string[],
        query: string,
        variables?: Record<string, any>
    ): Promise<CrossChainResult[]> => {
        if (!deployment) return [];

        const results: CrossChainResult[] = [];

        for (const chainId of targetChains) {
            try {
                const endpoint = buildGraphQLEndpoint(chainId, deployment.application_id, deployment.port);
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query, variables }),
                });

                if (response.ok) {
                    const data = await response.json();
                    results.push({
                        chainId,
                        success: !data.errors,
                        data: data.data,
                        error: data.errors?.[0]?.message,
                    });
                } else {
                    results.push({
                        chainId,
                        success: false,
                        error: `HTTP ${response.status}`,
                    });
                }
            } catch (err) {
                results.push({
                    chainId,
                    success: false,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
            }
        }

        return results;
    }, [deployment]);

    // Request new chain from faucet (UI callback - actual request happens via CLI)
    const requestNewChain = useCallback(async (): Promise<string | null> => {
        // This is a placeholder - actual chain creation requires CLI
        // The UI can show instructions or trigger a backend endpoint
        console.log('To request a new chain, run: linera wallet request-chain --faucet', LINERA_CONFIG.FAUCET_URL);
        return null;
    }, []);

    // Load chains on mount
    useEffect(() => {
        if (isConnected) {
            refreshChains();
        }
    }, [isConnected, refreshChains]);

    return {
        chains,
        activeChain: chains.find(c => c.isActive),
        loading,
        error,
        refreshChains,
        getChainHealth,
        crossChainQuery,
        requestNewChain,
    };
}

export default useChains;
