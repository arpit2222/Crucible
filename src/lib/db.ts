import fs from 'fs';
import path from 'path';

export interface AgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  apiKey?: string; // Optional custom key
  allowedAssets: string[];
  maxTradeSize: number;
  stopLossPercent: number;
  maxDrawdownPercent: number;
  targetProtocols: string[];
  createdAt: string;
}

const dbPath = path.join(process.cwd(), 'agents.json');

export function getAgents(): AgentConfig[] {
  if (!fs.existsSync(dbPath)) {
    return [];
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
