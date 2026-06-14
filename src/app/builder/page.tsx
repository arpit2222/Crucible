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
        
        const tempAgent = {
          id: data.agentId,
          ...formData,
          allowedAssets: formData.allowedAssets.split(',').map(s => s.trim())
        };
        localStorage.setItem('temp_agent', JSON.stringify(tempAgent));

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

  const handleBypass = async () => {
    setLoading(true);
    try {
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
        const tempAgent = {
          id: data.agentId,
          ...formData,
          allowedAssets: formData.allowedAssets.split(',').map(s => s.trim())
        };
        localStorage.setItem('temp_agent', JSON.stringify(tempAgent));
        router.push(`/arena?agentId=${data.agentId}`);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (isConfirmed && dbAgentId) {
    router.push(`/arena?agentId=${dbAgentId}`);
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6">
      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-sans font-bold text-white tracking-tight mb-2">Build Agent</h1>
        <p className="text-slate-400 font-sans text-lg font-light">Configure your quantitative agent and set strict execution bounds.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* On-Chain Staking */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-sans font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
            Agent Stake & Attestation
          </h2>
          <div>
            <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Stake Amount (Testnet ETH)</label>
            <input required type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
            <p className="text-sm text-slate-500 mt-2 font-sans font-light">This ETH will be slashed if the agent violates your parameters in the Arena.</p>
          </div>
        </div>

        {/* The Brain */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-sans font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
            The Brain (Logic)
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Agent Name</label>
              <input required type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-sans focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Mean Reversion ARB" />
            </div>

            <div>
              <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Azure OpenAI API Key (Optional)</label>
              <input type="password" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all" value={formData.apiKey} onChange={(e) => setFormData({...formData, apiKey: e.target.value})} placeholder="A73X9..." />
            </div>

            <div>
              <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Strategy / System Prompt</label>
              <textarea required rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all leading-relaxed" value={formData.systemPrompt} onChange={(e) => setFormData({...formData, systemPrompt: e.target.value})} />
            </div>
          </div>
        </div>

        {/* DeFi Parameters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl">
          <h2 className="text-2xl font-sans font-bold text-white mb-6 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]"></div>
            Execution Bounds (Test Arena Parameters)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Allowed Assets</label>
              <input required type="text" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all" value={formData.allowedAssets} onChange={(e) => setFormData({...formData, allowedAssets: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Max Trade Size ($)</label>
              <input required type="number" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all" value={formData.maxTradeSize} onChange={(e) => setFormData({...formData, maxTradeSize: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Max Slippage Tolerance (%)</label>
              <input required type="number" step="0.1" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all" value={formData.stopLossPercent} onChange={(e) => setFormData({...formData, stopLossPercent: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Daily Max Drawdown (%)</label>
              <input required type="number" step="0.1" className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-mono focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 outline-none transition-all" value={formData.maxDrawdownPercent} onChange={(e) => setFormData({...formData, maxDrawdownPercent: Number(e.target.value)})} />
            </div>
          </div>
        </div>

        {writeError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl font-mono text-sm">
            Error: {(writeError as any).shortMessage || writeError.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-end items-center gap-6 pt-4">
          <button 
            type="button" 
            onClick={handleBypass}
            disabled={loading || isConfirming}
            className="w-full sm:w-auto bg-transparent text-slate-400 hover:text-white font-sans font-medium py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            Bypass Staking (Demo Mode)
          </button>
          <button type="submit" disabled={loading || isConfirming} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-sans font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100">
            {isConfirming ? 'Waiting for confirmation...' : loading ? 'Approve Wallet Tx...' : 'Stake & Send to Arena →'}
          </button>
        </div>
      </form>
    </div>
  );
}
