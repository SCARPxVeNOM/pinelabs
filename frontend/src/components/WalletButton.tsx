/**
 * WalletButton Component
 * 
 * A button for connecting/disconnecting the Linera wallet.
 * Shows connection status, chain info, and opens ChainPanel.
 */

import { useState } from 'react';
import { Wallet, ChevronDown, LogOut, RefreshCw, Copy, Check, Link2, Layers } from 'lucide-react';
import { useLinera } from '@/hooks/useLinera';
import { useChains } from '@/hooks/useChains';
import { truncateAddress, formatBalance } from '@/lib/linera';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ChainPanel from './ChainPanel';

export function WalletButton() {
    const {
        isConnected,
        isConnecting,
        chainId,
        balance,
        connect,
        disconnect,
        refreshBalance,
    } = useLinera();

    const { chains } = useChains();

    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showChainPanel, setShowChainPanel] = useState(false);

    const handleConnect = async () => {
        await connect();
    };

    const handleCopyChainId = async () => {
        if (chainId) {
            await navigator.clipboard.writeText(chainId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshBalance();
        setIsRefreshing(false);
    };

    // Not connected state
    if (!isConnected) {
        return (
            <Button
                onClick={handleConnect}
                disabled={isConnecting}
                variant="outline"
                className="gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-500/50"
            >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
        );
    }

    // Connected state with dropdown
    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20"
                    >
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-mono text-sm">
                            {truncateAddress(chainId || '', 6, 4)}
                        </span>
                        {chains.length > 1 && (
                            <span className="text-xs bg-emerald-500/30 px-1.5 py-0.5 rounded-full">
                                {chains.length}
                            </span>
                        )}
                        {balance && (
                            <span className="text-emerald-400/80 text-xs hidden sm:inline">
                                {formatBalance(balance, 2)} LINERA
                            </span>
                        )}
                        <ChevronDown className="h-4 w-4 opacity-60" />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-72 bg-slate-900 border-slate-700">
                    <DropdownMenuLabel className="text-slate-400 flex items-center gap-2">
                        <Link2 className="h-3 w-3" />
                        Testnet Conway
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-700" />

                    {/* Chain Info */}
                    <div className="px-2 py-2">
                        <div className="text-xs text-slate-500 mb-1">Active Chain</div>
                        <div className="font-mono text-xs text-slate-300 break-all bg-slate-800/50 p-2 rounded-lg">
                            {chainId}
                        </div>
                    </div>

                    {/* Balance & Stats */}
                    <div className="px-2 py-2 grid grid-cols-2 gap-2">
                        {balance && (
                            <div className="bg-emerald-500/10 p-2 rounded-lg">
                                <div className="text-xs text-emerald-400/70 mb-0.5">Balance</div>
                                <div className="text-sm text-emerald-400 font-semibold">
                                    {formatBalance(balance)} LINERA
                                </div>
                            </div>
                        )}
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <div className="text-xs text-blue-400/70 mb-0.5">Chains</div>
                            <div className="text-sm text-blue-400 font-semibold">
                                {chains.length} available
                            </div>
                        </div>
                    </div>

                    <DropdownMenuSeparator className="bg-slate-700" />

                    {/* View Chains - Opens ChainPanel */}
                    <DropdownMenuItem
                        onClick={() => setShowChainPanel(true)}
                        className="cursor-pointer text-slate-300 hover:bg-slate-800"
                    >
                        <Layers className="mr-2 h-4 w-4 text-purple-400" />
                        View All Chains
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleCopyChainId}
                        className="cursor-pointer text-slate-300 hover:bg-slate-800"
                    >
                        {copied ? (
                            <Check className="mr-2 h-4 w-4 text-emerald-400" />
                        ) : (
                            <Copy className="mr-2 h-4 w-4" />
                        )}
                        {copied ? 'Copied!' : 'Copy Chain ID'}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="cursor-pointer text-slate-300 hover:bg-slate-800"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh Balance
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="bg-slate-700" />

                    <DropdownMenuItem
                        onClick={disconnect}
                        className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Disconnect
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Chain Panel Slide-out */}
            <ChainPanel
                isOpen={showChainPanel}
                onClose={() => setShowChainPanel(false)}
            />
        </>
    );
}

export default WalletButton;
