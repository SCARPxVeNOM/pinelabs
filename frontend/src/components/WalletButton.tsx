/**
 * WalletButton Component
 * 
 * A button for connecting/disconnecting the Linera wallet.
 * Shows connection status and truncated chain ID when connected.
 */

import { useState } from 'react';
import { Wallet, ChevronDown, LogOut, RefreshCw, Copy, Check } from 'lucide-react';
import { useLinera } from '@/hooks/useLinera';
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

export function WalletButton() {
    const {
        isConnected,
        isConnecting,
        chainId,
        balance,
        error,
        connect,
        disconnect,
        refreshBalance,
    } = useLinera();

    const [copied, setCopied] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

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
                    {balance && (
                        <span className="text-emerald-400/80 text-xs">
                            {formatBalance(balance, 2)} LINERA
                        </span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 bg-slate-900 border-slate-700">
                <DropdownMenuLabel className="text-slate-400">
                    Connected to Testnet Conway
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-700" />

                <div className="px-2 py-2">
                    <div className="text-xs text-slate-500 mb-1">Chain ID</div>
                    <div className="font-mono text-xs text-slate-300 break-all">
                        {chainId}
                    </div>
                </div>

                {balance && (
                    <div className="px-2 py-2">
                        <div className="text-xs text-slate-500 mb-1">Balance</div>
                        <div className="text-sm text-emerald-400 font-semibold">
                            {formatBalance(balance)} LINERA
                        </div>
                    </div>
                )}

                <DropdownMenuSeparator className="bg-slate-700" />

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
    );
}

export default WalletButton;
