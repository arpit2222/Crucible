'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { crucibleAbi, CRUCIBLE_CONTRACT_ADDRESS } from '@/lib/contracts';

interface TickInput {
  tick: number;
  event: string;
  price: number;
}

export default function ArenaBuilderPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ticks, setTicks] = useState<TickInput[]>([
    { tick: 1, event: '', price: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash, isPending: isTxPending } = useWriteContract();
  
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleAddTick = () => {
    setTicks([...ticks, { tick: ticks.length + 1, event: '', price: 0 }]);
  };

  const handleTickChange = (index: number, field: keyof TickInput, value: string | number) => {
    const newTicks = [...ticks];
    newTicks[index] = { ...newTicks[index], [field]: value };
    setTicks(newTicks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/arenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, ticks })
      });
      
      const data = await res.json();
      
      if (data.success) {
        const tempArena = {
          id: data.arenaId,
          name,
          description,
          ticks
        };
        localStorage.setItem('temp_arena', JSON.stringify(tempArena));

        writeContract({
          address: CRUCIBLE_CONTRACT_ADDRESS as `0x${string}`,
          abi: crucibleAbi,
          functionName: 'publishArena',
          args: [`ipfs://mock-arena-uri/${data.arenaId}`],
        }, {
          onSuccess: () => {
            router.push('/');
          }
        });
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6">
      <div className="mb-10 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-sans font-bold text-white tracking-tight mb-2">Build Arena</h1>
        <p className="text-slate-400 font-sans text-lg font-light">Design a custom test environment to evaluate DeFi agents.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-xl">
        
        {/* Arena Metadata */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Arena Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. USDC Depeg Event"
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-sans focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-sans font-medium text-slate-300 mb-2">Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario context..."
              className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white font-sans h-32 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all leading-relaxed"
            />
          </div>
        </div>

        {/* Ticks Builder */}
        <div className="space-y-6 pt-8 border-t border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-sans font-bold text-white flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
              Market Ticks (Timeline)
            </h2>
            <button 
              type="button"
              onClick={handleAddTick}
              className="text-sm font-sans font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors border border-white/5"
            >
              + Add Tick
            </button>
          </div>

          <div className="space-y-4">
            {ticks.map((tick, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-6 items-start sm:items-center bg-black/40 p-6 rounded-xl border border-white/5 transition-all hover:border-white/10">
                <div className="w-20 flex-shrink-0 text-slate-400 font-mono text-sm bg-white/5 px-3 py-1 rounded text-center">
                  TICK {tick.tick}
                </div>
                <div className="flex-grow space-y-4 w-full">
                  <input 
                    type="text" 
                    required
                    value={tick.event}
                    onChange={(e) => handleTickChange(index, 'event', e.target.value)}
                    placeholder="e.g. Market stable. USDC trading at $1.00."
                    className="w-full bg-transparent border-b border-white/10 pb-2 text-white font-sans focus:border-blue-500 outline-none transition-all text-base"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-sans">Target Asset Price: <span className="text-white">$</span></span>
                    <input 
                      type="number" 
                      required
                      value={tick.price}
                      onChange={(e) => handleTickChange(index, 'price', parseFloat(e.target.value))}
                      className="bg-black/50 border border-white/10 rounded px-3 py-1 text-white font-mono focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-sm w-32"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="pt-8 flex flex-col sm:flex-row justify-end items-center gap-6 border-t border-white/10 mt-8">
          <button 
            type="button" 
            onClick={() => {
              const tempId = `arena_bypass_${Date.now()}`;
              const tempArena = { id: tempId, name, description, ticks };
              localStorage.setItem('temp_arena', JSON.stringify(tempArena));
              router.push('/');
            }}
            className="w-full sm:w-auto bg-transparent text-slate-400 hover:text-white font-sans font-medium py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            Bypass Tx (Demo Mode)
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || isTxPending || isTxConfirming}
            className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-sans font-bold py-4 px-10 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex justify-center items-center gap-2"
          >
            {isTxConfirming ? (
              <>Publishing on-chain...</>
            ) : isTxPending ? (
              <>Sign Transaction...</>
            ) : (
              <>Stake & Publish Arena &rarr;</>
            )}
          </button>
        </div>
          
        {isTxSuccess && (
          <div className="mt-6 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl font-mono text-sm text-center">
            Arena published successfully! Redirecting...
          </div>
        )}
      </form>
    </div>
  );
}
