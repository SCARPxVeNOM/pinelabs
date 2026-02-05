/**
 * Chain Panel Component
 * 
 * Displays all available microchains with health status,
 * block height, and chain management actions.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChains } from '@/hooks/useChains';
import { useLinera } from '@/hooks/useLinera';
import { truncateAddress, LINERA_CONFIG } from '@/lib/linera';

interface ChainPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChainPanel({ isOpen, onClose }: ChainPanelProps) {
    const { chains, loading, error, refreshChains, getChainHealth } = useChains();
    useLinera(); // Context connection
    const [selectedChain, setSelectedChain] = useState<string | null>(null);
    const [chainHealthData, setChainHealthData] = useState<Record<string, any>>({});

    // Fetch health for all chains
    useEffect(() => {
        if (isOpen && chains.length > 0) {
            chains.forEach(async (chain) => {
                const health = await getChainHealth(chain.chainId);
                if (health) {
                    setChainHealthData(prev => ({
                        ...prev,
                        [chain.chainId]: health,
                    }));
                }
            });
        }
    }, [isOpen, chains, getChainHealth]);

    const getSyncStatusColor = (status?: string) => {
        switch (status) {
            case 'synced': return 'var(--success)';
            case 'syncing': return 'var(--warning)';
            case 'offline': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    const getSyncStatusIcon = (status?: string) => {
        switch (status) {
            case 'synced': return '●';
            case 'syncing': return '◐';
            case 'offline': return '○';
            default: return '?';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="chain-panel-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="chain-panel"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="chain-panel-header">
                        <h2>⛓️ Microchains</h2>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>

                    {/* Network Info */}
                    <div className="network-info">
                        <span className="network-badge">{LINERA_CONFIG.NETWORK}</span>
                        <span className="protocol-version">{LINERA_CONFIG.PROTOCOL_VERSION}</span>
                    </div>

                    {/* Chain List */}
                    <div className="chain-list">
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Loading chains...</p>
                            </div>
                        ) : error ? (
                            <div className="error-state">
                                <p>⚠️ {error}</p>
                                <button onClick={refreshChains}>Retry</button>
                            </div>
                        ) : chains.length === 0 ? (
                            <div className="empty-state">
                                <p>No chains found</p>
                                <p className="hint">Run: linera wallet show</p>
                            </div>
                        ) : (
                            chains.map((chain) => (
                                <motion.div
                                    key={chain.chainId}
                                    className={`chain-card ${chain.isActive ? 'active' : ''} ${selectedChain === chain.chainId ? 'selected' : ''}`}
                                    onClick={() => setSelectedChain(chain.chainId === selectedChain ? null : chain.chainId)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="chain-header">
                                        <span
                                            className="sync-indicator"
                                            style={{ color: getSyncStatusColor(chainHealthData[chain.chainId]?.syncStatus || chain.syncStatus) }}
                                        >
                                            {getSyncStatusIcon(chainHealthData[chain.chainId]?.syncStatus || chain.syncStatus)}
                                        </span>
                                        <span className="chain-id">{truncateAddress(chain.chainId, 8, 6)}</span>
                                        {chain.isActive && <span className="active-badge">Active</span>}
                                    </div>

                                    <AnimatePresence>
                                        {selectedChain === chain.chainId && (
                                            <motion.div
                                                className="chain-details"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <div className="detail-row">
                                                    <span>Block Height</span>
                                                    <span>{chainHealthData[chain.chainId]?.blockHeight || '—'}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Status</span>
                                                    <span style={{ color: getSyncStatusColor(chainHealthData[chain.chainId]?.syncStatus) }}>
                                                        {chainHealthData[chain.chainId]?.syncStatus || 'Unknown'}
                                                    </span>
                                                </div>
                                                <div className="detail-row full-id">
                                                    <code>{chain.chainId}</code>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Actions */}
                    <div className="chain-actions">
                        <button className="action-btn secondary" onClick={refreshChains}>
                            🔄 Refresh
                        </button>
                        <button
                            className="action-btn primary"
                            onClick={() => {
                                navigator.clipboard.writeText(`linera wallet request-chain --faucet ${LINERA_CONFIG.FAUCET_URL}`);
                                alert('Command copied! Run in your terminal to request a new chain.');
                            }}
                        >
                            ➕ New Chain
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="chain-help">
                        <p>Chains are Linera microchains in your wallet.</p>
                        <p>Each chain can run independent applications.</p>
                    </div>
                </motion.div>
            </motion.div>

            <style>{`
                .chain-panel-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                }

                .chain-panel {
                    position: fixed;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 380px;
                    max-width: 100vw;
                    background: var(--card-bg);
                    border-left: 1px solid var(--border-color);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .chain-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .chain-panel-header h2 {
                    margin: 0;
                    font-size: 1.25rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--text-muted);
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                }

                .close-btn:hover {
                    background: var(--hover-bg);
                    color: var(--text-primary);
                }

                .network-info {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    background: var(--bg-secondary);
                }

                .network-badge {
                    background: var(--primary);
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .protocol-version {
                    color: var(--text-muted);
                    font-size: 0.75rem;
                    display: flex;
                    align-items: center;
                }

                .chain-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .chain-card {
                    background: var(--bg-secondary);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .chain-card:hover {
                    border-color: var(--primary);
                }

                .chain-card.active {
                    border-color: var(--success);
                    background: rgba(16, 185, 129, 0.1);
                }

                .chain-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .sync-indicator {
                    font-size: 0.875rem;
                }

                .chain-id {
                    font-family: var(--font-mono);
                    font-size: 0.875rem;
                    flex: 1;
                }

                .active-badge {
                    background: var(--success);
                    color: white;
                    padding: 0.125rem 0.5rem;
                    border-radius: 999px;
                    font-size: 0.625rem;
                    font-weight: 600;
                    text-transform: uppercase;
                }

                .chain-details {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px solid var(--border-color);
                    overflow: hidden;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 0.375rem 0;
                    font-size: 0.8125rem;
                }

                .detail-row span:first-child {
                    color: var(--text-muted);
                }

                .detail-row.full-id {
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .detail-row.full-id code {
                    font-size: 0.625rem;
                    word-break: break-all;
                    background: var(--bg-primary);
                    padding: 0.5rem;
                    border-radius: 6px;
                }

                .chain-actions {
                    display: flex;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid var(--border-color);
                }

                .action-btn {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .action-btn.primary {
                    background: var(--primary);
                    color: white;
                    border: none;
                }

                .action-btn.primary:hover {
                    background: var(--primary-hover);
                }

                .action-btn.secondary {
                    background: transparent;
                    border: 1px solid var(--border-color);
                    color: var(--text-primary);
                }

                .action-btn.secondary:hover {
                    background: var(--hover-bg);
                }

                .chain-help {
                    padding: 1rem 1.5rem;
                    background: var(--bg-secondary);
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }

                .chain-help p {
                    margin: 0.25rem 0;
                }

                .loading-state, .error-state, .empty-state {
                    text-align: center;
                    padding: 3rem 1rem;
                    color: var(--text-muted);
                }

                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid var(--border-color);
                    border-top-color: var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </AnimatePresence>
    );
}

export default ChainPanel;
