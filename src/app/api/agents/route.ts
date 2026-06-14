import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/db';

export async function GET() {
  try {
    const agents = getAgents();
    return NextResponse.json({ success: true, agents });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch agents' }, { status: 500 });
  }
}
