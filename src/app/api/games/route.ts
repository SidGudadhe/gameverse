import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('category') || undefined;
  const search = searchParams.get('q') || undefined;
  const status = searchParams.get('status') || 'PUBLISHED';

  const games = db.getGames({ categoryId, search, status });
  return NextResponse.json({ success: true, count: games.length, data: games });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newGame = db.createGame(body);
    return NextResponse.json({ success: true, data: newGame }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
