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
      <body className={`${inter.variable} ${mono.variable} font-sans bg-black text-slate-200 min-h-screen flex flex-col`}>
        <Providers>
          <nav className="border-b border-slate-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-4">
                  <div className="text-xl font-mono font-bold tracking-tighter text-white">CRUCIBLE<span className="text-green-500">_</span></div>
                  <div className="hidden md:block">
                    <div className="ml-10 flex items-baseline space-x-8">
                      <a href="/" className="hover:text-white px-3 py-2 rounded-md text-sm font-medium font-mono text-slate-400">Marketplace</a>
                      <a href="/builder" className="hover:text-white px-3 py-2 rounded-md text-sm font-medium font-mono text-slate-400">Build Agent</a>
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
