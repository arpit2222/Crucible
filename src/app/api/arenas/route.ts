import { NextRequest, NextResponse } from 'next/server';
import { getArenas, saveArena } from '@/lib/db';

export async function GET() {
  try {
    const arenas = getArenas();
    return NextResponse.json({ success: true, arenas });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch arenas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const newArena = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description,
      ticks: body.ticks,
      createdAt: new Date().toISOString()
    };
    
    saveArena(newArena);
    return NextResponse.json({ success: true, arenaId: newArena.id });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save arena' }, { status: 500 });
  }
}
