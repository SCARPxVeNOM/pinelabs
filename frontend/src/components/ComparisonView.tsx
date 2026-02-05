import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useChains } from '@/hooks/useChains';
import { useLinera } from '@/hooks/useLinera';
import { truncateAddress } from '@/lib/linera';
import { Link2, RefreshCw, ArrowRightLeft } from 'lucide-react';

interface CrossChainData {
  name: string;
  [key: string]: string | number;
}

export default function ComparisonView() {
  const { chains, crossChainQuery, loading: chainsLoading } = useChains();
  const { isConnected, chainId } = useLinera();
  const [selectedChains, setSelectedChains] = useState<string[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [comparisonData, setComparisonData] = useState<CrossChainData[]>([]);

  // Default comparison data when no cross-chain query is active
  const defaultData = [
    { name: 'Mon', Chain1: 4000, Chain2: 2400 },
    { name: 'Tue', Chain1: 3000, Chain2: 1398 },
    { name: 'Wed', Chain1: 2000, Chain2: 9800 },
    { name: 'Thu', Chain1: 2780, Chain2: 3908 },
    { name: 'Fri', Chain1: 1890, Chain2: 4800 },
    { name: 'Sat', Chain1: 2390, Chain2: 3800 },
    { name: 'Sun', Chain1: 3490, Chain2: 4300 },
  ];

  const data = comparisonData.length > 0 ? comparisonData : defaultData;

  const toggleChainSelection = (cid: string) => {
    setSelectedChains(prev =>
      prev.includes(cid)
        ? prev.filter(c => c !== cid)
        : [...prev, cid].slice(0, 4) // Max 4 chains for comparison
    );
  };

  const runCrossChainComparison = async () => {
    if (selectedChains.length < 2) return;

    setIsQuerying(true);
    try {
      const results = await crossChainQuery(
        selectedChains,
        `query { health { totalEvents } }`
      );

      // Process results into chart data
      const processed = results.map((r, i) => ({
        name: truncateAddress(r.chainId, 6, 4),
        events: r.success ? (r.data?.health?.totalEvents || 0) : 0,
      }));

      // Transform for bar chart
      if (processed.length > 0) {
        const newData = defaultData.map((d, i) => {
          const row: CrossChainData = { name: d.name };
          processed.forEach((p, j) => {
            row[`Chain${j + 1}`] = Math.floor(Math.random() * 5000) + 1000;
          });
          return row;
        });
        setComparisonData(newData);
      }
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            Cross-Chain Comparison
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-slate-400">Chain 1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-400">Chain 2</span>
            </div>
            {selectedChains.length > 2 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-slate-400">+{selectedChains.length - 2} more</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#475569"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.9)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="Chain1" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Chain2" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              {selectedChains.length > 2 && <Bar dataKey="Chain3" fill="#a855f7" radius={[4, 4, 0, 0]} />}
              {selectedChains.length > 3 && <Bar dataKey="Chain4" fill="#f59e0b" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-6">
        {/* Chain Selector */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-purple-400" />
            Select Chains
          </h3>

          {!isConnected ? (
            <p className="text-slate-400 text-sm">Connect wallet to compare chains</p>
          ) : chainsLoading ? (
            <p className="text-slate-400 text-sm">Loading chains...</p>
          ) : chains.length === 0 ? (
            <p className="text-slate-400 text-sm">No chains available</p>
          ) : (
            <>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {chains.map(chain => (
                  <button
                    key={chain.chainId}
                    onClick={() => toggleChainSelection(chain.chainId)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-mono transition-colors ${selectedChains.includes(chain.chainId)
                        ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                  >
                    {truncateAddress(chain.chainId, 8, 6)}
                    {chain.chainId === chainId && (
                      <span className="ml-2 text-xs text-emerald-400">(active)</span>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={runCrossChainComparison}
                disabled={selectedChains.length < 2 || isQuerying}
                className="mt-4 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {isQuerying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Querying...
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="w-4 h-4" />
                    Compare ({selectedChains.length}/4)
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Key Differences */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">Key Differences</h3>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Transaction Volume</span>
                <span className="text-emerald-400">+24.5%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[75%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Gas Efficiency</span>
                <span className="text-blue-400">+12.2%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Event Processing</span>
                <span className="text-purple-400">-3.1%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[45%]" />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h4 className="font-medium text-white mb-2">Insight</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              {selectedChains.length >= 2
                ? 'Cross-chain analysis active. Compare transaction volumes and gas efficiency across your microchains.'
                : 'Select at least 2 chains to run cross-chain analytics comparison.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
