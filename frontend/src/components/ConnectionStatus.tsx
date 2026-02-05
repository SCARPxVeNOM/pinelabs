/**
 * ConnectionStatus Component
 * 
 * Displays the current connection status to the Linera network.
 * Shows network name, health status, and GraphQL endpoint.
 */

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, ExternalLink } from 'lucide-react';
import { useLinera } from '@/hooks/useLinera';
import { LINERA_CONFIG } from '@/lib/linera';

interface ConnectionStatusProps {
    /** Show as compact badge or full status card */
    variant?: 'badge' | 'card';
    /** Custom class name */
    className?: string;
}

export function ConnectionStatus({ variant = 'badge', className = '' }: ConnectionStatusProps) {
    const { isConnected, deployment, graphqlEndpoint, checkHealth } = useLinera();
    const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    // Check health periodically when connected
    useEffect(() => {
        if (!isConnected || !deployment) {
            setIsHealthy(null);
            return;
        }

        const check = async () => {
            setIsChecking(true);
            const healthy = await checkHealth();
            setIsHealthy(healthy);
            setIsChecking(false);
        };

        check();
        const interval = setInterval(check, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [isConnected, deployment, checkHealth]);

    // Badge variant - compact status indicator
    if (variant === 'badge') {
        return (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${className}`}>
                {isConnected ? (
                    <>
                        <div className={`h-2 w-2 rounded-full ${isHealthy ? 'bg-emerald-400' : isHealthy === false ? 'bg-red-400' : 'bg-yellow-400'} ${isChecking ? 'animate-pulse' : ''}`} />
                        <span className="text-slate-300">
                            {LINERA_CONFIG.NETWORK}
                        </span>
                    </>
                ) : (
                    <>
                        <WifiOff className="h-3 w-3 text-slate-500" />
                        <span className="text-slate-500">Disconnected</span>
                    </>
                )}
            </div>
        );
    }

    // Card variant - full status display
    return (
        <div className={`bg-slate-900/50 border border-slate-800 rounded-lg p-4 ${className}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Network Status
                </h3>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${isConnected
                        ? isHealthy
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isHealthy === false
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                    {isConnected ? (
                        isHealthy ? (
                            <>
                                <Wifi className="h-3 w-3" />
                                Online
                            </>
                        ) : isHealthy === false ? (
                            <>
                                <WifiOff className="h-3 w-3" />
                                Offline
                            </>
                        ) : (
                            'Checking...'
                        )
                    ) : (
                        <>
                            <WifiOff className="h-3 w-3" />
                            Disconnected
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                    <span className="text-slate-500">Network</span>
                    <span className="text-slate-300 font-medium">{LINERA_CONFIG.NETWORK}</span>
                </div>

                <div className="flex justify-between">
                    <span className="text-slate-500">Protocol</span>
                    <span className="text-slate-300 font-mono">{LINERA_CONFIG.PROTOCOL_VERSION}</span>
                </div>

                {graphqlEndpoint && (
                    <div className="pt-2 border-t border-slate-800">
                        <div className="text-slate-500 mb-1">GraphQL Endpoint</div>
                        <a
                            href={graphqlEndpoint}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 break-all"
                        >
                            <span className="truncate">{graphqlEndpoint}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                    </div>
                )}

                {!isConnected && (
                    <div className="pt-2 border-t border-slate-800">
                        <div className="text-slate-500 mb-1">Faucet</div>
                        <a
                            href={LINERA_CONFIG.FAUCET_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                        >
                            <span className="truncate">{LINERA_CONFIG.FAUCET_URL}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ConnectionStatus;
