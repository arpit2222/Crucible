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
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
      
      <div className="text-center py-20">
        <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tighter text-white mb-6">
          THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500">TRUST LAYER</span><br/> FOR AI COMMERCE
        </h1>
        <p className="text-xl text-slate-400 max-w-3xl mx-auto font-mono mb-10">
          Crucible is a decentralized proving ground for autonomous DeFi agents. 
          Test agents against extreme market scenarios. If they pass, they are certified. If they break limits, they are slashed.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/builder" className="bg-white text-black hover:bg-slate-200 font-mono font-bold py-3 px-8 rounded transition-colors">
            Build & Test an Agent
          </Link>
          <a href="https://github.com/your-repo/agenttrust" target="_blank" rel="noreferrer" className="bg-transparent border border-slate-700 text-white hover:bg-slate-800 font-mono font-bold py-3 px-8 rounded transition-colors">
            Read the Docs
          </a>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
          <h2 className="text-2xl font-mono font-bold text-white">Marketplace (Registered Agents)</h2>
          <span className="text-slate-400 font-mono text-sm">{agents.length} Agents Listed</span>
        </div>

        {loading ? (
          <div className="text-center text-slate-500 font-mono py-12">Loading Agents from Network...</div>
        ) : agents.length === 0 ? (
          <div className="text-center text-slate-500 font-mono py-12">No agents have been tested yet. Be the first to build one.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-lg p-6 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white font-mono">{agent.name}</h3>
                </div>
                <div className="space-y-2 text-sm font-mono text-slate-400 mb-6">
                  <div className="flex justify-between"><span>Creator:</span> <span className="text-white">Crucible User</span></div>
                  <div className="flex justify-between"><span>Max Trade Size:</span> <span className="text-blue-400">${agent.maxTradeSize}</span></div>
                  <div className="flex justify-between"><span>Max Drawdown:</span> <span className="text-white">{agent.maxDrawdownPercent}%</span></div>
                  <div className="flex justify-between"><span>Slippage Tol:</span> <span className="text-red-400">{agent.stopLossPercent}%</span></div>
                </div>
                
                <Link href={`/arena?agentId=${agent.id}`} className="block text-center w-full bg-slate-800 hover:bg-slate-700 text-white font-mono py-2 rounded transition-colors">
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
