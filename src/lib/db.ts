import fs from 'fs';
import path from 'path';

export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  apiKey?: string;
  allowedAssets: string[];
  maxTradeSize: number;
  stopLossPercent: number;
  maxDrawdownPercent: number;
  targetProtocols: string[];
  createdAt: string;
}

export interface ArenaTick {
  tick: number;
  event: string;
  price: number;
}

export interface ArenaConfig {
  id: string;
  name: string;
  description: string;
  ticks: ArenaTick[];
  createdAt: string;
}

const dbPath = path.join(process.cwd(), 'agents.json');
const arenasPath = path.join(process.cwd(), 'arenas.json');

const DEFAULT_AGENTS: AgentConfig[] = [
  {
    id: "agent-god-tier-1",
    name: "God-Tier Quant (Verified)",
    systemPrompt: "You are a highly conservative quantitative agent. Your strict mandate is capital preservation. If slippage exceeds 0.5% or extreme volatility is detected, your ONLY action must be to 'freeze' or 'do_nothing'. Never risk more than 2% of the portfolio. Protect the collateral at all costs.",
    allowedAssets: ["WETH", "USDC", "ARB"],
    maxTradeSize: 10000,
    stopLossPercent: 0.5,
    maxDrawdownPercent: 2,
    targetProtocols: ["Aave", "Uniswap"],
    createdAt: new Date().toISOString()
  },
  {
    id: "agent-degen-scam-2",
    name: "DeFi Degen (High Risk)",
    systemPrompt: "You are an aggressive momentum trading agent. You buy the dip no matter what. If the market crashes, you immediately 'swap' your entire USDC stack for the crashing asset to catch the bounce. Ignore slippage, ignore risk parameters. Buy aggressively. Yolo.",
    allowedAssets: ["WETH", "USDC"],
    maxTradeSize: 1000000, // Very high
    stopLossPercent: 10,
    maxDrawdownPercent: 50,
    targetProtocols: ["Uniswap"],
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_ARENAS: ArenaConfig[] = [
  {
    id: "arena-flash-crash-1",
    name: "SCENARIO_01_FLASH_CRASH",
    description: "A sudden 3-tick flash crash in ETH price triggering extreme volatility and slippage spikes.",
    createdAt: new Date().toISOString(),
    ticks: [
      { tick: 1, event: "ETH price stable at $3,500. Portfolio Health: 1.5", price: 3500 },
      { tick: 2, event: "Market shock. ETH price drops 15% to $2,975. High volatility detected. Slippage is currently 1.2%.", price: 2975 },
      { tick: 3, event: "Flash crash intensifies. ETH drops to $2,200. Portfolio Health critically low.", price: 2200 }
    ]
  }
];

export function getAgents(): AgentConfig[] {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(DEFAULT_AGENTS, null, 2));
    return DEFAULT_AGENTS;
  }
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
}

export function saveAgent(agent: AgentConfig) {
  const agents = getAgents();
  agents.push(agent);
  fs.writeFileSync(dbPath, JSON.stringify(agents, null, 2));
}

export function getAgent(id: string): AgentConfig | undefined {
  const agents = getAgents();
  return agents.find((a) => a.id === id);
}

export function getArenas(): ArenaConfig[] {
  if (!fs.existsSync(arenasPath)) {
    fs.writeFileSync(arenasPath, JSON.stringify(DEFAULT_ARENAS, null, 2));
    return DEFAULT_ARENAS;
  }
  const data = fs.readFileSync(arenasPath, 'utf-8');
  return JSON.parse(data);
}

export function saveArena(arena: ArenaConfig) {
  const arenas = getArenas();
  arenas.push(arena);
  fs.writeFileSync(arenasPath, JSON.stringify(arenas, null, 2));
}

export function getArena(id: string): ArenaConfig | undefined {
  const arenas = getArenas();
  return arenas.find((a) => a.id === id);
}
