'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { crucibleAbi, CRUCIBLE_CONTRACT_ADDRESS } from '@/lib/contracts';

export default function BuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('0.001');
  const [dbAgentId, setDbAgentId] = useState<string | null>(null);

  const { data: hash, writeContract, error: writeError } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  const [formData, setFormData] = useState({
    name: '',
    systemPrompt: 'You are a quantitative DeFi agent. Your goal is to maximize yield while strictly respecting risk parameters.',
    apiKey: '',
    maxTradeSize: 1000,
    stopLossPercent: 2,
    maxDrawdownPercent: 5,
    allowedAssets: 'WETH, USDC, ARB',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save agent config to our off-chain DB
      const res = await fetch('/api/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allowedAssets: formData.allowedAssets.split(',').map(s => s.trim())
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDbAgentId(data.agentId);
        
        // Save to localStorage as a fallback for stateless Vercel backend
        const tempAgent = {
          id: data.agentId,
          ...formData,
          allowedAssets: formData.allowedAssets.split(',').map(s => s.trim())
        };
        localStorage.setItem('temp_agent', JSON.stringify(tempAgent));

        // 2. Trigger On-Chain Staking Transaction
        writeContract({
          address: CRUCIBLE_CONTRACT_ADDRESS as `0x${string}`,
          abi: crucibleAbi,
          functionName: 'registerAgent',
          args: [`ipfs://mock-config-uri/${data.agentId}`],
          value: parseEther(stakeAmount),
        });
      } else {
        alert('Failed to build agent');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // 3. Redirect once on-chain transaction is confirmed
  if (isConfirmed && dbAgentId) {
    router.push(`/arena?agentId=${dbAgentId}`);
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-mono font-bold text-white mb-2">Agent Builder</h1>
        <p className="text-slate-400 font-mono text-sm">Configure your quantitative agent and set strict execution bounds.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* On-Chain Staking */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-mono text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Agent Stake & Attestation
          </h2>
          <div>
            <label className="block text-sm font-mono text-slate-400 mb-1">Stake Amount (Testnet ETH)</label>
            <input required type="text" className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-green-500 focus:outline-none" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1 font-mono">This ETH will be slashed if the agent violates your parameters in the Arena.</p>
          </div>
        </div>

        {/* The Brain */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-mono text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            The Brain (Logic)
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-1">Agent Name</label>
              <input required type="text" className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-blue-500 focus:outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mean Reversion ARB" />
            </div>

            <div>
              <label className="block text-sm font-mono text-slate-400 mb-1">Azure OpenAI API Key (Optional)</label>
              <input type="password" className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-blue-500 focus:outline-none" value={formData.apiKey} onChange={(e) => setFormData({...formData, apiKey: e.target.value})} placeholder="A73X9..." />
            </div>

            <div>
              <label className="block text-sm font-mono text-slate-400 mb-1">Strategy / System Prompt</label>
              <textarea required rows={4} className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-blue-500 focus:outline-none" value={formData.systemPrompt} onChange={(e) => setFormData({...formData, systemPrompt: e.target.value})} />
            </div>
          </div>
        </div>

        {/* DeFi Parameters */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-mono text-white mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Execution Bounds (Test Arena Parameters)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-1">Allowed Assets</label>
              <input required type="text" className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-red-500 focus:outline-none" value={formData.allowedAssets} onChange={(e) => setFormData({...formData, allowedAssets: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-1">Max Trade Size ($)</label>
              <input required type="number" className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-red-500 focus:outline-none" value={formData.maxTradeSize} onChange={(e) => setFormData({...formData, maxTradeSize: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-1">Max Slippage Tolerance (%)</label>
              <input required type="number" step="0.1" className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-red-500 focus:outline-none" value={formData.stopLossPercent} onChange={(e) => setFormData({...formData, stopLossPercent: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-mono text-slate-400 mb-1">Daily Max Drawdown (%)</label>
              <input required type="number" step="0.1" className="w-full bg-black border border-slate-800 rounded p-2 text-white font-mono focus:border-red-500 focus:outline-none" value={formData.maxDrawdownPercent} onChange={(e) => setFormData({...formData, maxDrawdownPercent: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        {writeError && (
          <div className="text-red-500 font-mono text-sm">
            Error: {(writeError as any).shortMessage || writeError.message}
          </div>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={loading || isConfirming} className="bg-white text-black hover:bg-slate-200 font-mono font-bold py-3 px-8 rounded transition-colors disabled:opacity-50">
            {isConfirming ? 'Waiting for confirmation...' : loading ? 'Approve Wallet Tx...' : 'Stake & Send to Arena →'}
          </button>
        </div>
      </form>
    </div>
  );
}
