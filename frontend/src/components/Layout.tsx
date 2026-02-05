import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Activity,
    Settings,
    ChevronLeft,
    Wallet,
    Menu,
    X,
    Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Layout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex min-h-screen bg-slate-950 text-white overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={{ width: 280 }}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden md:flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl z-50 h-screen sticky top-0"
            >
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="font-bold text-xl tracking-tight"
                            >
                                Pine<span className="text-emerald-400">Analytics</span>
                            </motion.span>
                        )}
                    </div>
                    <button
                        onClick={() => setSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className={`w-5 h-5 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <div className="flex-1 px-4 py-6 space-y-2">
                    <NavItem icon={<LayoutDashboard />} label="Dashboard" isActive={true} isOpen={isSidebarOpen} />
                    <NavItem icon={<Activity />} label="Transactions" isOpen={isSidebarOpen} />
                    <NavItem icon={<Wallet />} label="Wallets" isOpen={isSidebarOpen} />
                    <NavItem icon={<Settings />} label="Settings" isOpen={isSidebarOpen} />
                </div>

                <div className="p-4 border-t border-slate-800/50">
                    <div className={`flex items-center gap-3 ${!isSidebarOpen ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 shrink-0" />
                        {isSidebarOpen && (
                            <div className="overflow-hidden">
                                <p className="font-medium text-sm">Vitalik Buterin</p>
                                <p className="text-xs text-slate-400 truncate">vitalik.eth</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/30 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button className="md:hidden p-2 text-slate-400">
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-lg font-medium text-slate-200">Dashboard Overview</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 relative text-slate-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

function NavItem({ icon, label, isActive, isOpen }: { icon: any, label: string, isActive?: boolean, isOpen: boolean }) {
    return (
        <button
            className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                ${isActive
                    ? 'bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/5 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }
                ${!isOpen ? 'justify-center' : ''}
            `}
        >
            <span className={`${isActive ? 'text-emerald-400' : 'group-hover:text-white'}`}>
                {icon}
            </span>
            {isOpen && (
                <span className="font-medium text-sm whitespace-nowrap">
                    {label}
                </span>
            )}
        </button>
    );
}
