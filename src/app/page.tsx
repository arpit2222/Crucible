'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AgentConfig } from '@/lib/db';

export default function Home() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAgents(data.agents);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6">
      
      {/* Hero Section */}
      <div className="text-center py-24 relative">
        <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <h1 className="text-5xl md:text-8xl font-sans font-black tracking-tighter text-white mb-6 drop-shadow-2xl">
          THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 animate-pulse">TRUST LAYER</span><br/> FOR AI AGENTS
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto font-sans font-light mb-12 leading-relaxed">
          Crucible is a decentralized proving ground for autonomous DeFi agents. 
          Test agents against extreme market scenarios. If they pass, they receive on-chain attestations. If they violate risk bounds, they are slashed.
        </p>
        <div className="flex justify-center gap-6">
          <Link href="/builder" className="group relative bg-white text-black font-sans font-bold py-4 px-10 rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            <span className="relative z-10">Build & Test an Agent</span>
          </Link>
          <Link href="/arena-builder" className="group bg-white/5 border border-white/10 backdrop-blur-md text-white font-sans font-bold py-4 px-10 rounded-xl transition-all hover:bg-white/10 hover:border-white/20 hover:scale-105">
            Build Custom Arena
          </Link>
        </div>
      </div>

      {/* Marketplace Section */}
      <div className="mt-20">
        <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6">
          <h2 className="text-3xl font-sans font-bold text-white tracking-tight">Marketplace <span className="text-slate-500 font-light ml-2">Registered Agents</span></h2>
          <span className="bg-white/10 text-slate-300 font-mono text-xs px-3 py-1 rounded-full border border-white/5">{agents.length} AGENTS LISTED</span>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 font-mono py-20 animate-pulse">Scanning Network for Agents...</div>
        ) : agents.length === 0 ? (
          <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-16">
            <div className="text-slate-400 font-sans text-lg mb-4">No agents have been tested yet.</div>
            <Link href="/builder" className="text-blue-400 hover:text-blue-300 transition-colors">Be the first to build one &rarr;</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 relative overflow-hidden group transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-violet-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-2xl font-bold text-white font-sans tracking-tight">{agent.name}</h3>
                  <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-xs font-mono">ACTIVE</span>
                </div>
                <div className="space-y-3 text-sm font-sans text-slate-400 mb-8">
                  <div className="flex justify-between items-center"><span className="text-slate-500">Max Trade Size</span> <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">${agent.maxTradeSize}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Max Drawdown</span> <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">{agent.maxDrawdownPercent}%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-500">Slippage Tol</span> <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">{agent.stopLossPercent}%</span></div>
                </div>
                
                <Link href={`/arena?agentId=${agent.id}`} className="block text-center w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 font-sans font-medium py-3 rounded-lg transition-all group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                  View Track Record
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
