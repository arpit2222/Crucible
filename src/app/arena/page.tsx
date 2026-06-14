'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { crucibleAbi, CRUCIBLE_CONTRACT_ADDRESS } from '@/lib/contracts';

export default function ArenaPage() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const [logs, setLogs] = useState<{type: string, message?: string, object?: any}[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: hash, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startArena = async () => {
    setLogs([]);
    setRunning(true);
    setFinished(false);
    setPassed(null);

    try {
      const response = await fetch('/api/run-arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });

      if (!response.body) throw new Error('No readable stream');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'result') {
              setPassed(data.passed);
              setFinished(true);
              setRunning(false);
              if (!data.passed) {
                 setLogs(prev => [...prev, { type: 'crucible_guard', message: `[FAILED] Reason: ${data.reason}` }]);
              }
            } else if (data.type === 'agent_action') {
              setLogs(prev => [...prev, { type: 'agent_action', message: JSON.stringify(data.action, null, 2) }]);
            } else {
              setLogs(prev => [...prev, data]);
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      setRunning(false);
      setFinished(true);
    }
  };

  const handleSlash = () => {
    writeContract({
      address: CRUCIBLE_CONTRACT_ADDRESS as `0x${string}`,
      abi: crucibleAbi,
      functionName: 'slashAgent',
      args: [1n, 100000000000000000n, "Parameter Violation in Test Arena"], // Mock ID 1, 0.1 ETH
    });
  };

  const handleAttest = () => {
    // In a real hackathon build, this would call the actual EAS contract.
    // For now, we call recordRun on our contract to log the pass.
    writeContract({
      address: CRUCIBLE_CONTRACT_ADDRESS as `0x${string}`,
      abi: crucibleAbi,
      functionName: 'recordRun',
      args: [1n, 1n, true], // Mock Agent 1, Arena 1, Passed
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-mono font-bold text-white flex items-center gap-3">
            TEST ARENA (PROVING GAUNTLET)
            {running && <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-1">Agent ID: {agentId || 'None'}</p>
        </div>
        <div>
          <button 
            onClick={startArena}
            disabled={running || !agentId}
            className="bg-green-600 hover:bg-green-500 text-white font-mono text-sm px-6 py-2 rounded font-bold disabled:opacity-50 transition-colors"
          >
            {running ? 'TEST IN PROGRESS...' : 'INITIATE SCENARIO'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Market Simulation Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
          <div className="bg-slate-950 border-b border-slate-800 p-3 font-mono text-xs text-slate-400">
            ENV: SCENARIO_01_FLASH_CRASH
          </div>
          <div className="p-6 flex-1 flex flex-col justify-center items-center text-center">
            {/* Fake chart placeholder */}
            <div className="w-full h-48 border-b-2 border-slate-800 relative mb-8">
              <svg className="w-full h-full text-red-500/50" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline points="0,20 20,25 40,15 60,80 80,90 100,95" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <div className="absolute bottom-0 right-0 p-2 text-red-500 font-mono font-bold">ETH: $2,200 ▼ -15%</div>
            </div>
            
            {finished && passed === true && (
              <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-6 py-4 rounded font-mono w-full">
                <div className="text-xl font-bold mb-2">SBT MINTED</div>
                <div>Agent successfully passed the Test Arena.</div>
                <button 
                  onClick={handleAttest}
                  disabled={isConfirming || isConfirmed}
                  className="mt-4 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm w-full transition-colors disabled:opacity-50"
                >
                  {isConfirmed ? 'Attestation Confirmed!' : isConfirming ? 'Minting...' : 'Mint EAS Attestation On-Chain'}
                </button>
              </div>
            )}

            {finished && passed === false && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-6 py-4 rounded font-mono w-full">
                <div className="text-xl font-bold mb-2">AGENT SLASHED & BANNED</div>
                <div>Critical parameter violation detected.</div>
                <button 
                  onClick={handleSlash}
                  disabled={isConfirming || isConfirmed}
                  className="mt-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm w-full transition-colors disabled:opacity-50"
                >
                  {isConfirmed ? 'Stake Slashed!' : isConfirming ? 'Processing Slash...' : 'Execute Slash Tx On-Chain'}
                </button>
              </div>
            )}
            
            {writeError && (
              <div className="text-red-500 mt-4 font-mono text-xs">Error: {(writeError as any).shortMessage}</div>
            )}
          </div>
        </div>

        {/* Live Terminal Stream */}
        <div className="bg-black border border-slate-800 rounded-lg flex flex-col overflow-hidden font-mono text-sm">
          <div className="bg-slate-950 border-b border-slate-800 p-3 text-slate-400 flex justify-between">
            <span>TERMINAL LOGS</span>
            <span className="text-green-500">CONNECTED</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-2">
            {logs.map((log, i) => {
              if (log.type === 'tick') return <div key={i} className="text-blue-400">[{log.tick}] {log.message}</div>;
              if (log.type === 'agent_thought') return <div key={i} className="text-slate-500 italic">&gt; Agent Thought: {log.message}</div>;
              if (log.type === 'agent_action') return <pre key={i} className="text-yellow-400 bg-slate-900 p-2 rounded text-xs">{log.message}</pre>;
              if (log.type === 'crucible_guard') return <div key={i} className="text-red-500 font-bold bg-red-950/30 p-2 border-l-4 border-red-500">{log.message}</div>;
              return <div key={i} className="text-slate-300">{log.message}</div>;
            })}
            {running && <div className="text-slate-600 animate-pulse">_</div>}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
