import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'CRUCIBLE | Protocol',
  description: 'Proving Ground for Autonomous DeFi Agents',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-[#030303] text-slate-200 min-h-screen flex flex-col relative overflow-x-hidden`}>
        {/* Animated Background */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-900/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>
        <Providers>
          <nav className="border-b border-white/5 bg-[#030303]/60 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-20">
                <div className="flex items-center gap-6">
                  <a href="/" className="text-2xl font-mono font-bold tracking-tighter text-white flex items-center group">
                    CRUCIBLE<span className="text-blue-500 group-hover:animate-pulse">_</span>
                  </a>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-8">
                      <a href="/" className="hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg text-sm font-medium font-mono text-slate-400 transition-all">Marketplace</a>
                      <a href="/builder" className="hover:text-white hover:bg-white/5 px-4 py-2 rounded-lg text-sm font-medium font-mono text-slate-400 transition-all">Build Agent</a>
                    </div>
                  </div>
                </div>
                <div>
                  <ConnectButton />
                </div>
              </div>
            </div>
          </nav>
          <main className="flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
