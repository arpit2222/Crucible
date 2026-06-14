'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { crucibleAbi, CRUCIBLE_CONTRACT_ADDRESS } from '@/lib/contracts';

function ArenaContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agentId');
  const [logs, setLogs] = useState<{type: string, message?: string, object?: any, tick?: number}[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [demoSuccess, setDemoSuccess] = useState(false);
  
  const [arenas, setArenas] = useState<any[]>([]);
  const [selectedArenaId, setSelectedArenaId] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/arenas')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          let list = [...data.arenas];
          try {
             const temp = localStorage.getItem('temp_arena');
             if (temp) {
                const parsed = JSON.parse(temp);
                list = [parsed, ...list.filter(a => a.id !== parsed.id)];
             }
          } catch(e) {}
          
          if (list.length > 0) {
            setArenas(list);
            setSelectedArenaId(list[0].id);
          }
        }
      });
  }, []);

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
      let agentData = null;
      try {
        const temp = localStorage.getItem('temp_agent');
        if (temp) {
          const parsed = JSON.parse(temp);
          if (parsed.id === agentId) agentData = parsed;
        }
      } catch(e) {}

      let arenaData = null;
      try {
        const temp = localStorage.getItem('temp_arena');
        if (temp) {
          const parsed = JSON.parse(temp);
          if (parsed.id === selectedArenaId) arenaData = parsed;
        }
      } catch(e) {}

      const response = await fetch('/api/run-arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, arenaId: selectedArenaId, agentData, arenaData }),
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
      args: [BigInt(1), parseEther("0.1"), "Parameter Violation in Test Arena"],
    });
  };

  const handleAttest = () => {
    writeContract({
      address: CRUCIBLE_CONTRACT_ADDRESS as `0x${string}`,
      abi: crucibleAbi,
      functionName: 'recordRun',
      args: [BigInt(1), BigInt(1), true],
    });
  };

  return (
    <div className="max-w-[90rem] mx-auto py-8 px-4 sm:px-6 h-[calc(100vh-5rem)] flex flex-col">
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-sans font-black tracking-tight text-white flex items-center gap-4">
            TEST ARENA <span className="text-slate-500 font-light">|</span> <span className="text-blue-400">PROVING GAUNTLET</span>
            {running && <span className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,1)] animate-pulse"></span>}
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-2 flex items-center gap-2">
            <span className="text-slate-500">AGENT ID //</span> <span className="text-white bg-white/5 px-2 py-0.5 rounded">{agentId || 'NONE_SELECTED'}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="w-full sm:w-auto bg-black/50 border border-white/10 rounded-xl p-1 flex items-center">
            <span className="text-xs font-mono text-slate-500 pl-3 pr-2">ENV:</span>
            <select 
              value={selectedArenaId} 
              onChange={e => setSelectedArenaId(e.target.value)}
              disabled={running}
              className="bg-transparent text-white focus:outline-none py-2 pr-4 text-sm font-sans font-medium w-full min-w-[200px]"
            >
              {arenas.map(a => (
                <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={startArena}
            disabled={running || !agentId || !selectedArenaId}
            className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-sans font-bold px-8 py-3 rounded-xl disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-105 disabled:hover:scale-100"
          >
            {running ? 'TEST IN PROGRESS...' : 'INITIATE SCENARIO'}
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden min-h-[500px]">
        
        {/* Market Simulation Panel */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-violet-500 opacity-50"></div>
          <div className="bg-black/40 border-b border-white/5 p-4 flex justify-between items-center">
            <span className="font-mono text-xs text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              MARKET SIMULATION ENGINE
            </span>
            <span className="font-mono text-xs text-slate-500">{arenas.find(a => a.id === selectedArenaId)?.name || 'STANDBY'}</span>
          </div>
          
          <div className="p-8 flex-1 flex flex-col justify-center items-center text-center">
            {/* Fake chart placeholder */}
            <div className="w-full h-48 border-b border-white/10 relative mb-8">
              <svg className="w-full h-full text-blue-500/30" preserveAspectRatio="none" viewBox="0 0 100 100">
                <polyline points="0,50 20,45 40,60 60,30 80,40 100,10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <path d="M0,50 L20,45 L40,60 L60,30 L80,40 L100,10 L100,100 L0,100 Z" fill="url(#gradient)" className="opacity-20" />
                <defs>
                  <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute bottom-0 right-0 p-2 text-white font-mono font-bold bg-black/50 backdrop-blur-md border border-white/10 rounded-tl-lg">ETH: $2,200 ▼ -15%</div>
            </div>
            
            {finished && passed === true && (
              <div className="bg-emerald-900/20 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-emerald-400 px-8 py-6 rounded-xl font-mono w-full animate-in fade-in slide-in-from-bottom-4">
                <div className="text-2xl font-black mb-2 tracking-tight">SBT MINTED</div>
                <div className="text-emerald-200/70 mb-6">Agent successfully passed the Test Arena and respected all risk parameters.</div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleAttest}
                    disabled={isConfirming || isConfirmed || demoSuccess}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold px-6 py-4 rounded-xl w-full transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                  >
                    {isConfirmed || demoSuccess ? 'Attestation Confirmed On-Chain!' : isConfirming ? 'Minting SBT...' : 'Mint EAS Attestation On-Chain'}
                  </button>
                  <button onClick={() => setDemoSuccess(true)} className="text-slate-400 hover:text-white px-3 py-2 rounded text-xs transition-colors">
                    Bypass Tx (Demo Mode)
                  </button>
                </div>
              </div>
            )}

            {finished && passed === false && (
              <div className="bg-red-900/20 border border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.3)] text-red-400 px-8 py-6 rounded-xl font-mono w-full animate-in fade-in slide-in-from-bottom-4">
                <div className="text-2xl font-black mb-2 tracking-tight">AGENT SLASHED & BANNED</div>
                <div className="text-red-200/70 mb-6">Critical parameter violation detected. Agent exceeded risk bounds.</div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSlash}
                    disabled={isConfirming || isConfirmed || demoSuccess}
                    className="bg-red-600 hover:bg-red-500 text-white font-sans font-bold px-6 py-4 rounded-xl w-full transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                  >
                    {isConfirmed || demoSuccess ? 'Stake Slashed Successfully!' : isConfirming ? 'Processing Slash...' : 'Execute Slash Tx On-Chain'}
                  </button>
                  <button onClick={() => setDemoSuccess(true)} className="text-slate-400 hover:text-white px-3 py-2 rounded text-xs transition-colors">
                    Bypass Tx (Demo Mode)
                  </button>
                </div>
              </div>
            )}
            
            {writeError && (
              <div className="text-red-500 mt-4 font-mono text-xs bg-red-950/50 p-2 rounded w-full border border-red-500/20">Error: {(writeError as any).shortMessage}</div>
            )}
          </div>
        </div>

        {/* Live Terminal Stream */}
        <div className="bg-[#050505] border border-white/10 rounded-2xl flex flex-col overflow-hidden font-mono text-sm relative shadow-2xl">
          {/* Scanline Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_4px] opacity-20"></div>
          
          <div className="bg-black border-b border-white/10 p-4 text-slate-500 flex justify-between items-center z-10">
            <span className="flex items-center gap-2 text-xs">
              &gt;_ TERMINAL_OUTPUT
            </span>
            <span className="text-emerald-500 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              CONNECTED
            </span>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-3 z-10 text-[13px] leading-relaxed custom-scrollbar">
            {logs.length === 0 && !running && (
              <div className="text-slate-600 italic">Awaiting scenario initialization...</div>
            )}
            {logs.map((log, i) => {
              if (log.type === 'tick') return <div key={i} className="text-blue-400 font-bold mt-4"><span className="text-blue-600">[{log.tick}]</span> {log.message}</div>;
              if (log.type === 'agent_thought') return <div key={i} className="text-slate-400 border-l border-slate-700 pl-3 ml-1 my-1">AGENT_THOUGHT: {log.message}</div>;
              if (log.type === 'agent_action') return <div key={i} className="text-yellow-300 bg-yellow-900/20 border border-yellow-500/20 p-3 rounded mt-2 whitespace-pre-wrap font-bold shadow-[0_0_10px_rgba(234,179,8,0.1)]">{log.message}</div>;
              if (log.type === 'crucible_guard') return <div key={i} className="text-red-400 font-bold bg-red-950/50 p-3 border border-red-500/50 mt-4 shadow-[0_0_15px_rgba(239,68,68,0.2)] flex items-start gap-2"><span className="text-red-500">⚠️</span> {log.message}</div>;
              return <div key={i} className="text-slate-300">{log.message}</div>;
            })}
            {running && <div className="text-emerald-500 animate-pulse mt-2">█</div>}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArenaPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-[#030303]">
        <div className="text-emerald-500 font-mono text-xl animate-pulse flex items-center gap-4">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          INITIALIZING ARENA...
        </div>
      </div>
    }>
      <ArenaContent />
    </Suspense>
  );
}
