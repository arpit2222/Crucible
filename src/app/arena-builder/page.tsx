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
    
    // First save the arena configuration off-chain
    try {
      const res = await fetch('/api/arenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, ticks })
      });
      
      const data = await res.json();
      
      if (data.success) {
        // Save to localStorage as a fallback for Vercel statelessness
        const tempArena = {
          id: data.arenaId,
          name,
          description,
          ticks
        };
        localStorage.setItem('temp_arena', JSON.stringify(tempArena));

        // Then publish on-chain with the generated URI
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
    <div className="max-w-4xl mx-auto py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold font-mono tracking-tighter mb-2">Build Arena</h1>
          <p className="text-slate-400">Design a custom test environment to evaluate DeFi agents.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-slate-900/50 p-8 rounded-xl border border-slate-800">
        
        {/* Arena Metadata */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Arena Name</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. USDC Depeg Event"
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
            <textarea 
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the scenario context..."
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-white h-24 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Ticks Builder */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold font-mono">Market Ticks (Timeline)</h2>
            <button 
              type="button"
              onClick={handleAddTick}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded transition-colors"
            >
              + Add Tick
            </button>
          </div>

          {ticks.map((tick, index) => (
            <div key={index} className="flex gap-4 items-start bg-slate-950 p-4 rounded border border-slate-800">
              <div className="w-16 flex-shrink-0 pt-2 text-slate-500 font-mono text-sm">
                Tick {tick.tick}
              </div>
              <div className="flex-grow space-y-3">
                <input 
                  type="text" 
                  required
                  value={tick.event}
                  onChange={(e) => handleTickChange(index, 'event', e.target.value)}
                  placeholder="e.g. Market stable. USDC trading at $1.00."
                  className="w-full bg-transparent border-b border-slate-800 pb-2 text-white focus:border-blue-500 outline-none transition-all text-sm"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Target Asset Price: $</span>
                  <input 
                    type="number" 
                    required
                    value={tick.price}
                    onChange={(e) => handleTickChange(index, 'price', parseFloat(e.target.value))}
                    className="bg-transparent border-b border-slate-800 w-32 pb-1 text-white focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="pt-6 flex justify-between items-center">
          <button 
            type="button" 
            onClick={() => {
              // Bypass completely for demo
              const tempId = `arena_bypass_${Date.now()}`;
              const tempArena = { id: tempId, name, description, ticks };
              localStorage.setItem('temp_arena', JSON.stringify(tempArena));
              router.push('/');
            }}
            className="bg-transparent border border-slate-700 text-slate-400 hover:text-white font-mono font-bold py-3 px-4 rounded transition-colors text-xs"
          >
            Bypass Tx (Demo Mode)
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || isTxPending || isTxConfirming}
            className="w-2/3 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded transition-all flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isTxConfirming ? (
              <>Publishing on-chain...</>
            ) : isTxPending ? (
              <>Sign Transaction...</>
            ) : (
              <>Stake & Publish Arena</>
            )}
          </button>
        </div>
          
          {isTxSuccess && (
            <p className="mt-4 text-green-400 text-center text-sm">
              Arena published successfully! Redirecting...
            </p>
          )}
      </form>
    </div>
  );
}
