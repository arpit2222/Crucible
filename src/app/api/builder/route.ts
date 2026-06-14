import { NextResponse } from 'next/server';
import { saveAgent, AgentConfig } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Generate a simple ID
    const id = `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const agent: AgentConfig = {
      id,
      name: body.name || 'Unnamed Agent',
      systemPrompt: body.systemPrompt,
      apiKey: body.apiKey || undefined,
      allowedAssets: body.allowedAssets || [],
      maxTradeSize: Number(body.maxTradeSize) || 0,
      stopLossPercent: Number(body.stopLossPercent) || 0,
      maxDrawdownPercent: Number(body.maxDrawdownPercent) || 0,
      targetProtocols: body.targetProtocols || [],
      createdAt: new Date().toISOString(),
    };

    saveAgent(agent);

    return NextResponse.json({ success: true, agentId: id });
  } catch (error) {
    console.error('Builder API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create agent' }, { status: 500 });
  }
}
